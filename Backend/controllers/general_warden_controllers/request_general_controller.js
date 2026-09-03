const { getDb } = require("../../config/db");
const { generateQR } = require("../../services/generateQR.service");
const {
  sendParentReachedSMS,
  sendParentApprovalSMS,
} = require("../../services/sendSMS.service");
const crypto = require("crypto");

const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
};

async function fetchPassWarden(req, res) {
  try {
    const db = getDb();
    const wardenCollection = db.collection("warden_database");
    const passCollection = db.collection("pass_details");
    const studentCollection = db.collection("student_database");

    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    const user_id = user.registration_number;
    const usertype = user.type;
    const date = req.body?.date || req.query?.date;
    const warden_id = req.body?.warden_id || req.query?.warden_id;
    const warden_data = await wardenCollection.findOne({ unique_id: user_id });
    if (!warden_data) {
      return res.status(404).json({ error: "Warden not found" });
    }

    let query = {};
    
    if (date) {
      const targetDate = date ? new Date(date) : new Date();

      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

     
      query.request_time = { $gte: startOfDay, $lte: endOfDay };
      query.request_completed=true
      if (usertype === "superior") {
        if (warden_id && warden_id !== "overall") {
          query.authorised_warden_id = warden_id;
        } else {
          query.year = { $in: await studentCollection.distinct("year") };
        }
      } else {
        query.gender = warden_data.gender;
        query.year = {
          $in: warden_data.primary_batch || warden_data.primary_year || [],
        };
      }
     console.log("nian",query);
      const oldPasses = await passCollection.find(query).toArray();
      return res
        .status(200)
        .json({ message: "Old passes fetched successfully", data: oldPasses });
    }

    const target_genders =
      usertype === "superior" ? ["Male", "Female"] : [warden_data.gender];

    query = {
      request_completed: false,
      expiry_status: false,
      gender: { $in: target_genders },
      qrcode_status: false,
      wardern_approval: null,
      superior_wardern_approval: null,
      notify_superior: usertype === "superior",
      parent_approval: { $ne: false },
    };

    if (usertype === "superior") {
      const target_years = await studentCollection.distinct("year");
      query.year = { $in: target_years };
    } else {
      const target_batches =
        warden_data.primary_batch || warden_data.primary_year || [];
      query.year = { $in: target_batches };
    }

    console.log(query);
    const pendingPasses = await passCollection.find(query).toArray();
    if (pendingPasses.length === 0) {
      return res.status(200).json({
        message: "No pending passes found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Pending passes fetched successfully",
      data: pendingPasses,
    });
  } catch (error) {
    console.error("❌ Error fetching old passes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function WardenDecision(req, res) {
  try {
    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    const warden_unique_id = user.registration_number;
    const isSuperior = user?.type === "superior";
    const { pass_id, action, medical_status, comment } = req.body;
    if (!pass_id || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error: "pass_id and valid action (approve/reject) are required",
      });
    }
    const db = getDb();
    const passCollection = db.collection("pass_details");
    const wardenCollection = db.collection("warden_database");
    const studentCollection = db.collection("student_database");

    const warden_data = await wardenCollection.findOne({
      unique_id: warden_unique_id,
    });

    if (!warden_data) {
      return res.status(404).json({ error: "Warden not found" });
    }

    const passData = await passCollection.findOne({ pass_id: pass_id });
    
    if (!passData) {
      return res.status(404).json({ error: "Pass not found" });
    }

    const isIncluded = isSuperior
      ? (await studentCollection.distinct("year")).some(
          (y) => y?.toString() === passData.year?.toString(),
        )
      : (warden_data.primary_batch || warden_data.primary_year || []).some(
          (b) => b?.toString() === passData.year?.toString(),
        );
    if (!isIncluded) {
      return res.status(400).json({
        error: `Warden is accessing a pass outside assigned ${isSuperior ? "year" : "batch"}`,
      });
    }

    const approvalField = isSuperior
      ? "superior_wardern_approval"
      : "wardern_approval";

    if (passData[approvalField] !== null) {
      return res.status(400).json({
        message: `You have already ${
          passData[approvalField] ? "approved" : "rejected"
        } this request.`,
      });
    }

    const updateData = {
      [approvalField]: action === "approve",
      authorised_warden_id: warden_unique_id,
    };

    if (comment && typeof comment === "string") {
      updateData.comment = comment;
    }

    if (action === "approve") {
      // if (passData.parent_approval != "approved") {
      //   return res.status(400).json({ message: "Parents Approval Needed!" });
      // }
      if (passData.parent_approval != "Approved") {
        return res.status(400).json({ message: "Parents Approval Needed!" });
      }
      const qrPath = await generateQR(pass_id, passData.registration_number);

      updateData.qrcode_path = qrPath;
      updateData.qrcode_status = true;

      if (medical_status === true) {
        updateData.reason_type = "medical";
      }
    

      await passCollection.updateOne({ pass_id }, { $set: updateData });

      return res.status(200).json({
        message: "Pass approved successfully",
        qrcode_path: qrPath,
      });
    }

    if (action === "reject") {
      updateData.qrcode_path = null;
      updateData.qrcode_status = false;
      updateData.request_completed=true;
    }

    await passCollection.updateOne({ pass_id }, { $set: updateData });

    return res.status(200).json({
      message: "Pass rejected successfully",
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function sendParentApprovalOTP(req, res) {
  try {
    const { pass_id } = req.body;

    if (!pass_id) {
      return res.status(400).json({
        success: false,
        error: "Pass ID is required",
      });
    }

    const db = getDb();
    const PassCollection = db.collection("pass_details");

    // Find pass
    const pass = await PassCollection.findOne({ pass_id });

    if (!pass) {
      return res.status(404).json({
        success: false,
        error: "Pass not found",
      });
    }

    // Check existing status
    if (
      pass.parent_approval === "approved" ||
      pass.parent_approval === "declined"
    ) {
      return res.status(400).json({
        success: false,
        error: "Parent has already responded",
      });
    }

    // Generate secure OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Save OTP details in pass document
    await PassCollection.updateOne(
      { pass_id },
      {
        $set: {
          parent_otp_hash: otpHash,
          parent_otp_expires_at: expiresAt,
          parent_otp_attempts: 0,
          parent_otp_used: false,
          parent_approval: "pending",
          parent_sms_sent_status: false,
          parent_otp_created_at: new Date(),
        },
      },
    );

    console.log("otp",otp);
    // Send OTP
  //   await sendParentApprovalSMS(
  //     pass.phone_number_parent,
  //     pass.name,
  //     pass.place_to_visit,
  //     pass.reason_for_visit,
  //     pass.from,
  //     pass.to,
  //     otp,
  //  );

    // Update SMS status
    await PassCollection.updateOne(
      { pass_id },
      {
        $set: {
          parent_sms_sent_status: true,
          parent_sms_sent_at: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to parent",
      pass_id,
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to send OTP",
    });
  }
}


async function verifyParentOTP(req, res) {
  try {
    const { pass_id, otp } = req.body;
    // Validation
    if (!pass_id || !otp) {
      return res.status(400).json({
        success: false,
        error: "Pass ID and OTP are required",
      });
    }

    // OTP format validation
    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        error: "OTP must be 6 digits",
      });
    }

    const db = getDb();
    const PassCollection = db.collection("pass_details");

    const pass = await PassCollection.findOne({ pass_id });

    if (!pass) {
      return res.status(404).json({
        success: false,
        error: "Pass not found",
      });
    }

    // OTP not generated
    if (!pass.parent_otp_hash) {
      return res.status(400).json({
        success: false,
        error: "OTP not generated. Please request a new OTP",
      });
    }

    // OTP already used
    if (pass.parent_otp_used) {
      return res.status(400).json({
        success: false,
        error: "OTP already used",
      });
    }

    // OTP expiry check
    if (new Date() > new Date(pass.parent_otp_expires_at)) {
      return res.status(400).json({
        success: false,
        error: "OTP expired. Please request a new OTP",
      });
    }

    // Maximum 5 attempts
    if (pass.parent_otp_attempts >= 5) {
      return res.status(429).json({
        success: false,
        error: "Too many attempts. Please request a new OTP",
      });
    }

    // Hash entered OTP
    const enteredOtpHash = crypto
      .createHash("sha256")
      .update(String(otp))
      .digest("hex");

    // Secure comparison
    const otpValid = crypto.timingSafeEqual(
      Buffer.from(enteredOtpHash, "hex"),
      Buffer.from(pass.parent_otp_hash, "hex"),
    );

    // Wrong OTP
    if (!otpValid) {
      await PassCollection.updateOne(
        { pass_id },
        {
          $inc: {
            parent_otp_attempts: 1,
          },
        },
      );

      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    // Mark OTP as verified and used
    const result = await PassCollection.updateOne(
      {
        pass_id,
        parent_otp_used: false,
      },
      {
        $set: {
          parent_otp_used: true,
          parent_approval:"Approved",
          parent_otp_verified: true,
          parent_otp_verified_at: new Date(),
        },
      },
    );

    // Prevent OTP reuse / race condition
    if (result.modifiedCount !== 1) {
      return res.status(409).json({
        success: false,
        error: "OTP has already been processed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      pass_id,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to verify OTP",
    });
  }
}

module.exports = {
  fetchPassWarden,
  WardenDecision,
  sendParentApprovalOTP,
  verifyParentOTP,
};

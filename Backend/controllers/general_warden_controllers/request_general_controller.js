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


// ============================================================
// FETCH PENDING PASSES FOR WARDEN / SUPERIOR WARDEN
// ============================================================
async function fetchPassWarden(req, res) {
  try {
    const db = getDb();

    const wardenCollection = db.collection("warden_database");
    const passCollection = db.collection("pass_details");
    const studentCollection = db.collection("student_database");

    // ========================================================
    // SESSION CHECK
    // ========================================================
    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    const user_id = user.registration_number;
    const usertype = user.type;

    console.log("==============================================");
    console.log("FETCH PASSES - USER");
    console.log("Registration Number:", user_id);
    console.log("User Type:", usertype);
    console.log("==============================================");

    // ========================================================
    // FIND WARDEN
    // ========================================================
    const warden_data = await wardenCollection.findOne({
      unique_id: user_id,
    });

    if (!warden_data) {
      console.log("WARDEN NOT FOUND:", user_id);

      return res.status(404).json({
        success: false,
        message: "Warden details not found.",
      });
    }

    console.log("WARDEN DATA:");
    console.log(warden_data);

    // ========================================================
    // OPTIONAL DATE FILTER
    // ========================================================
    const date = req.body?.date || req.query?.date;

    // ========================================================
    // OPTIONAL WARDEN ID
    // ========================================================
    const warden_id = req.body?.warden_id || req.query?.warden_id;

    // ========================================================
    // DATE QUERY
    // ========================================================
    let dateQuery = {};

    if (date) {
      const selectedDate = new Date(date);

      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format.",
        });
      }

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      dateQuery = {
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };
    }

    // ========================================================
    // GENDER
    // ========================================================
    let target_genders = [];

    if (usertype === "superior") {
      // Superior warden can see both genders
      target_genders = ["Male", "Female"];
    } else {
      // Normal warden only sees their assigned gender
      if (warden_data.gender) {
        target_genders = [warden_data.gender];
      }
    }

    // ========================================================
    // BASE QUERY
    // ========================================================
    let query = {
      request_completed: false,
      expiry_status: false,

      gender: {
        $in: target_genders,
      },

      qrcode_status: false,

      wardern_approval: null,

      superior_wardern_approval: null,

      notify_superior: usertype === "superior",

      parent_approval: {
        $ne: false,
      },

      ...dateQuery,
    };

    // ========================================================
    // NORMAL WARDEN
    // ========================================================
    if (usertype !== "superior") {
      /*
       * YOUR DATABASE USES:
       *
       * primary_batch: [4]
       *
       * NOT:
       *
       * primary_year
       */

      let target_batches = [];

      // ------------------------------------------------------
      // primary_batch is already an array
      // ------------------------------------------------------
      if (Array.isArray(warden_data.primary_batch)) {
        target_batches = warden_data.primary_batch;
      }

      // ------------------------------------------------------
      // primary_batch is a single value
      // ------------------------------------------------------
      else if (
        warden_data.primary_batch !== undefined &&
        warden_data.primary_batch !== null
      ) {
        target_batches = [warden_data.primary_batch];
      }

      // ------------------------------------------------------
      // Convert numeric strings to numbers
      // Example:
      // ["4"] -> [4]
      // ------------------------------------------------------
      target_batches = target_batches.map((value) => {
        const numberValue = Number(value);

        return Number.isNaN(numberValue)
          ? value
          : numberValue;
      });

      console.log("----------------------------------------------");
      console.log("WARDEN PRIMARY BATCH:");
      console.log(target_batches);
      console.log("----------------------------------------------");

      // ------------------------------------------------------
      // No batch assigned
      // ------------------------------------------------------
      if (target_batches.length === 0) {
        console.log(
          "WARNING: No primary_batch assigned to this warden."
        );

        return res.status(200).json({
          success: true,
          message: "No primary batch assigned to this warden.",
          data: [],
        });
      }

      // ------------------------------------------------------
      // Filter passes according to assigned batch/year
      // ------------------------------------------------------
      query.year = {
        $in: target_batches,
      };
    }

    // ========================================================
    // SUPERIOR WARDEN
    // ========================================================
    else {
      /*
       * Superior warden should receive requests that were
       * notified to the superior warden.
       *
       * We don't restrict the superior warden by primary_batch.
       */

      query.notify_superior = true;

      // Get all available student years.
      const target_years =
        await studentCollection.distinct("year");

      console.log("----------------------------------------------");
      console.log("SUPERIOR WARDEN YEARS:");
      console.log(target_years);
      console.log("----------------------------------------------");

      if (target_years.length > 0) {
        query.year = {
          $in: target_years,
        };
      }
    }

    // ========================================================
    // LOG FINAL QUERY
    // ========================================================
    console.log("==============================================");
    console.log("FINAL MONGO QUERY");
    console.log("==============================================");

    console.log(
      JSON.stringify(query, null, 2)
    );

    console.log("==============================================");

    // ========================================================
    // FETCH PASSES
    // ========================================================
    const pendingPasses = await passCollection
      .find(query)
      .sort({
        createdAt: -1,
      })
      .toArray();

    // ========================================================
    // LOG RESULT
    // ========================================================
    console.log("==============================================");
    console.log(
      "PENDING PASSES FOUND:",
      pendingPasses.length
    );
    console.log("==============================================");

    // ========================================================
    // DEBUG EACH PASS
    // ========================================================
    pendingPasses.forEach((pass, index) => {
      console.log(
        `PASS ${index + 1}:`,
        {
          pass_id: pass.pass_id,
          name: pass.name,
          gender: pass.gender,
          year: pass.year,
          parent_approval: pass.parent_approval,
          wardern_approval: pass.wardern_approval,
          superior_wardern_approval:
            pass.superior_wardern_approval,
          notify_superior: pass.notify_superior,
          request_completed: pass.request_completed,
        }
      );
    });

    // ========================================================
    // RESPONSE
    // ========================================================
    return res.status(200).json({
      success: true,
      message: "Pending passes fetched successfully.",
      count: pendingPasses.length,
      data: pendingPasses,
    });
  } catch (error) {
    console.error(
      "ERROR IN fetchPassWarden:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending passes.",
      error: error.message,
    });
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

    // ========================================================
    // BULLETPROOF YEAR/BATCH CHECKING
    // ========================================================
    // Ensure we always have an array, even if the DB stores it as a single integer (e.g., 2) or string (e.g., "2")
    const getArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

    // Updated to match your database field name: primary_batch
    const assignedYears = [
      ...getArray(warden_data.primary_batch),
      ...getArray(warden_data.secondary_batch),
      ...getArray(warden_data.primary_year),
    ];

    console.log("-----------------------------------------");
    console.log("Warden Allowed Years:", assignedYears);
    console.log("Student Pass Year:", passData.year);
    console.log("-----------------------------------------");

    const isIncluded = isSuperior
      ? (await studentCollection.distinct("year")).some(
          (y) => String(y).trim() === String(passData.year).trim()
        )
      : assignedYears.some(
          (b) => String(b).trim() === String(passData.year).trim()
        );

    if (!isIncluded) {
      return res.status(400).json({
        error: `Warden is accessing a pass outside assigned ${
          isSuperior ? "year" : "batch"
        }`,
      });
    }

    const approvalField = isSuperior
      ? "superior_wardern_approval"
      : "wardern_approval";

    // Prevent double-clicking issues
    if (passData[approvalField] === true || passData[approvalField] === false) {
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
      // Robust parent approval check (case-insensitive, handles true/false strings)
      const parentApprovalStatus = String(passData.parent_approval || "")
        .trim()
        .toLowerCase();

      if (!["approved", "true", "1"].includes(parentApprovalStatus)) {
        return res.status(400).json({ message: "Parents Approval Needed!" });
      }

      const qrPath = await generateQR(pass_id, passData.registration_number);

      updateData.qrcode_path = qrPath;
      updateData.qrcode_status = true;

      // Ensure boolean comparison is strict
      if (
        medical_status === true ||
        String(medical_status).toLowerCase() === "true"
      ) {
        updateData.reason_type = "medical";
      }

      updateData.request_completed = true;

      await passCollection.updateOne({ pass_id }, { $set: updateData });

      return res.status(200).json({
        message: "Pass approved successfully",
        qrcode_path: qrPath,
      });
    }

    if (action === "reject") {
      updateData.qrcode_path = null;
      updateData.qrcode_status = false;
      updateData.request_completed = true;
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

    console.log("otp", otp);
    // Send OTP
    await sendParentApprovalSMS(
      pass.phone_number_parent,
      pass.name,
      pass.place_to_visit,
      pass.reason_type != "Others" ? pass.reason_type : pass.reason_for_visit,
      pass.from,
      pass.to,
      otp,
    );

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
          parent_approval: "Approved",
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

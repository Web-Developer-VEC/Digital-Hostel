const { getDb } = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const { sendParentReachedSMS } = require("../../services/sendSMS.service");
const path = require("path");
const fs = require("fs");
const { error } = require("console");
const uploadToS3 = require("../../middleware/uploadTos3Middleware");
const s3 = require("../../config/aws");

async function submitPass(req, res) {
  try {
    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    const { registration_number } = user;

    const db = getDb();
    const PassCollection = db.collection("pass_details");
    const studentDatabase = db.collection("student_database");
    const DraftsCollection = db.collection("drafts_details");

    const {
      mobile_number,
      name,
      department_name,
      batch,
      year,
      room_no,
      block_name,
      pass_type,
      from,
      to,
      place_to_visit,
      reason_type,
      reason_for_visit,
      mode,
    } = req.body;

    if (!mode || !["parent", "warden", "superior", "draft"].includes(mode)) {
      return res.status(400).json({ error: "Invalid approval flow" });
    }

    if (!mobile_number) {
      return res.status(400).json({ error: "Mobile number is required" });
    }

    if (
      !name ||
      !department_name ||
      !batch ||
      !room_no ||
      !block_name ||
      !year ||
      !pass_type ||
      !from ||
      !to ||
      !place_to_visit ||
      !reason_type
    ) {
      return res.status(400).json({ error: "Fill all the fields" });
    }

    const student = await studentDatabase.findOne({
      phone_number_student: mobile_number,
    });

    if (!student) {
      return res.status(404).json({ error: "Student record not found" });
    }

    const gender = student.gender;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate < new Date()) {
      return res.status(400).json({ error: "From date cannot be in the past" });
    }

    if (toDate < new Date()) {
      return res.status(400).json({ error: "To date cannot be in the past" });
    }

    if (toDate < fromDate) {
      return res
        .status(400)
        .json({ error: "To date cannot be earlier than From date" });
    }

    const toHours = toDate.getUTCHours();
    const toMinutes = toDate.getUTCMinutes();
    const totalToMinutes = toHours * 60 + toMinutes;

    const maleTimeLimit = 21 * 60 + 30;
    const femaleTimeLimit = 18 * 60;

    if (pass_type.toLowerCase() === "outpass") {
      if (gender === "Male" && totalToMinutes > maleTimeLimit) {
        return res
          .status(400)
          .json({
            error:
              "For male students, outpass 'To' time cannot be later than 21:30 (9:30 PM)",
          });
      }

      if (gender === "Female" && totalToMinutes > femaleTimeLimit) {
        return res
          .status(400)
          .json({
            error:
              "For female students, outpass 'To' time cannot be later than 18:00 (6:00 PM)",
          });
      }
    }

    let file_path = null;

    if (req.file) {
      file_path = await uploadToS3(req.file, req.file.fieldname);
    } else if (req.body.existingFilePath) {
      file_path = req.body.existingFilePath;
    }

    const pass_id = uuidv4();
    const yearInt = parseInt(year, 10);

    const PassData = {
      pass_id,
      name,
      mobile_number,
      dept: department_name,
      batch,
      year: yearInt,
      room_no,
      registration_number,
      profile_image: student.profile_photo_path,
      gender,
      late_count: student.late_count,
      blockname: block_name,
      passtype: pass_type,
      from: fromDate,
      to: toDate,
      place_to_visit,
      reason_type,
      reason_for_visit,
      file_path,
      qrcode_path: null,
      parent_approval: null,
      wardern_approval: null,
      superior_wardern_approval: null,
      parent_sms_sent_status: false,
      qrcode_status: false,
      exit_time: null,
      re_entry_time: null,
      delay_status: false,
      request_completed: false,
      request_time: new Date(),
      expiry_status: false,
      request_date_time: new Date(),
      authorised_Security_id: null,
      authorised_warden_id: null,
      notify_superior: mode === "superior" ? true : false,
      comment: null,
    };

    if (mode === "draft") {
      const existingDraft = await DraftsCollection.findOne({
        registration_number,
      });

      if (existingDraft) {
        await DraftsCollection.updateOne(
          { registration_number: registration_number },
          { $set: { ...PassData, pass_id: existingDraft.pass_id } },
        );
        return res.status(200).json({ message: "Draft updated successfully" });
      }

      await DraftsCollection.insertOne(PassData);
      return res.status(201).json({ message: "Pass saved as draft" });
    }

    const activePassCount = await PassCollection.countDocuments({
      mobile_number,
      request_completed: false,
      expiry_status: false,
      request_time: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999),
      },
    });

    if (activePassCount >= 3) {
      return res
        .status(400)
        .json({
          error: "Maximum of 3 active passes allowed per student for today",
        });
    }

    await studentDatabase.updateOne(
      { registration_number: registration_number },
      { $set: { transit_status: false } },
    );

    await PassCollection.insertOne(PassData);

    if (mode === "parent") {
      await sendParentReachedSMS(
        student.phone_number_parent,
        name,
        place_to_visit,
        reason_for_visit,
        from,
        to,
        pass_id,
      );

      await PassCollection.updateOne(
        { pass_id },
        { $set: { parent_sms_sent_status: true } },
      );
    }

    return res.status(201).json({
      message:
        mode === "parent"
          ? "Pass submitted, SMS sent to parent"
          : "Pass submitted and notified warden",
      file_path,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function fetchDraft(req, res) {
  try {
    const db = getDb();
    const DraftsCollection = db.collection("drafts_details");

    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again" });
    }

    const { registration_number } = user;

    const drafts_details = await DraftsCollection.find({
      registration_number,
    }).toArray();

    if (!drafts_details || drafts_details.length === 0) {
      return res
        .status(404)
        .json({ message: "No drafts found for this registration number" });
    }

    return res.status(200).json({ drafts: drafts_details });
  } catch (error) {
    console.error("❌ Error fetching drafts:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getPassDetailsByPassID(req, res) {
  try {
    const { pass_id } = req.body;

    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again" });
    }

    const db = getDb();
    const passCollection = db.collection("pass_details");

    const pass_details = await passCollection.findOne({ pass_id });

    if (!pass_details) {
      return res.status(404).json({ error: "Pass details not found" });
    }

    return res.status(200).json({ pass_details });
  } catch (err) {
    console.error("Error fetching pass details:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
}

async function EditPassDetails(req, res) {
  try {
    const {
      pass_id,
      passtype,
      from,
      to,
      place_to_visit,
      reason_type,
      reason_for_visit,
    } = req.body;

    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again" });
    }

    if (!pass_id) {
      return res.status(400).json({ error: "Pass ID is required" });
    }

    if (!passtype || !from || !to || !place_to_visit || !reason_type) {
      return res
        .status(400)
        .json({ error: "Fill all the field to update the pass details" });
    }

    const db = getDb();
    const passCollection = db.collection("pass_details");

    const pass_details = await passCollection.findOne({ pass_id });

    if (!pass_details) {
      return res.status(404).json({ error: "Pass details not found" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate < new Date()) {
      return res.status(400).json({ error: "From date cannot be in the past" });
    }

    if (toDate < new Date()) {
      return res.status(400).json({ error: "To date cannot be in the past" });
    }

    if (toDate < fromDate) {
      return res
        .status(400)
        .json({ error: "To date cannot be earlier than From date" });
    }

    const toHours = toDate.getUTCHours();
    const toMinutes = toDate.getUTCMinutes();
    const totalToMinutes = toHours * 60 + toMinutes;

    const maleTimeLimit = 21 * 60 + 30;
    const femaleTimeLimit = 18 * 60;

    if (passtype.toLowerCase() === "outpass") {
      if (gender === "Male" && totalToMinutes > maleTimeLimit) {
        return res
          .status(400)
          .json({
            error:
              "For male students, outpass 'To' time cannot be later than 21:30 (9:30 PM)",
          });
      }

      if (gender === "Female" && totalToMinutes > femaleTimeLimit) {
        return res
          .status(400)
          .json({
            error:
              "For female students, outpass 'To' time cannot be later than 18:00 (6:00 PM)",
          });
      }
    }

    let file_path = pass_details.file_path;

    if (req.file) {
      if (file_path) {
        const oldKey = file_path;
        await s3
          .deleteObject({
            Bucket: process.env.AWS_S3_NAME,
            Key: oldKey,
          })
          .promise();
        console.log(`🗑️ Deleted old file from S3: ${oldKey}`);
      }

      file_path = await uploadToS3(req.file, req.file.fieldname);
    }

    await passCollection.updateOne(
      { pass_id },
      {
        $set: {
          file_path,
          passtype,
          from: fromDate,
          to: toDate,
          place_to_visit,
          reason_type,
          reason_for_visit,
        },
      },
    );

    return res
      .status(200)
      .json({ message: "Student pass updated successfully", file_path });
  } catch (err) {
    console.error("Error updating pass details:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
}

async function verifyStudent(req, res) {
  try {
    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again" });
    }

    const { registration_number } = user;

    const db = getDb();
    const usersCollection = db.collection("student_database");
    const { phone_number_student } = req.body;

    const unique_id = registration_number;
    const user_valid = await usersCollection.findOne({
      registration_number: unique_id,
    });
    if (!user_valid) {
      return res.status(401).json({ error: "Couldn't Find the User data" });
    }
    if (user_valid.phone_number_student !== phone_number_student) {
      return res.status(401).json({ error: "Enter Valid Mobile number" });
    }
    const student = await usersCollection.findOne({
      phone_number_student: String(phone_number_student),
    });
    if (!student) {
      return res
        .status(404)
        .json({ message: "No users Found for that Number" });
    }

    return res.status(200).json({
      name: student.name,
      phone_number_student: student.phone_number_student,
      batch: student.batch,
      year: student.year,
      gender: student.gender,
      department: student.department,
      room_number: student.room_number,
      registration_number: student.registration_number,
      block_name: student.block_name,
      vacate_status: student.vacate_status,
    });
  } catch (error) {
    console.error("❌ Error verifying mobile number:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  verifyStudent,
  submitPass,
  fetchDraft,
  getPassDetailsByPassID,
  EditPassDetails,
};

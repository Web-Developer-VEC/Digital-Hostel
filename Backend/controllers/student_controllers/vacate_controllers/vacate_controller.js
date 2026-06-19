const { getDb } = require("../../../config/db");

async function submitVacateForm(req, res) {
  try {
    const db = getDb();

    const studentCollection = db.collection("student_database");

    const vacateCollection = db.collection("vacate_forms");

    const wardenCollection = db.collection("warden_database");

    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    const { registration_number } = user;

    const { Reason, date_time, Address } = req.body;

    if (!Reason || !date_time || !Address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const studentData = await studentCollection.findOne({
      registration_number,
    });

    if (!studentData) {
      return res.status(404).json({ error: "Student not found" });
    }

    const vacateEntry = {
      name: studentData.name,
      registration_number: studentData.registration_number,
      dept: studentData.department,
      batch: studentData.batch,
      gender: studentData.gender,
      room_no: studentData.room_number,
      blockname: studentData.block_name,
      Reason,
      date_time: new Date(),
      Address,
      vacate_date: date_time,
    };

    await vacateCollection.insertOne(vacateEntry);

    await studentCollection.updateOne(
      { registration_number },
      { $set: { vacate_status: false, vacate_form: "submitted" } },
    );
    const warden_data = await wardenCollection.findOne({ category: "head" });

    const count = warden_data.vacated_students + 1;

    await wardenCollection.updateOne(
      { category: "head" },
      { $set: { vacated_students: count } },
    );

    return res.status(200).json({
      message: "Vacate form submitted successfully",
      count: count,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  submitVacateForm,
};

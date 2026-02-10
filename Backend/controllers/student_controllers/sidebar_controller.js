const { getDb } = require("../../config/db");

async function getWardenDetail(req, res) {
  try {
    const db = getDb();
    const wardenCollection = db.collection("warden_database");
    const studentCollection = db.collection("student_database");
    const { user } = req.session;

    if (!user || !user.registration_number) {
        return res.status(401).json({ message: "Session expired. Please login again." });
    }

    const { registration_number } = user;

    const studentData = await studentCollection.findOne({ registration_number });

    const warden_gender = studentData.gender;
    const warden_year = [studentData.year];
    
    const warden_data = await wardenCollection.findOne({ gender: warden_gender, primary_year: { $in: warden_year }});
    return res.status(200).json({
        "name" : warden_data.warden_name,
        "primary year" : warden_data.primary_year,
        "Secondary year": warden_data.secondary_year,
        "Phone number": warden_data.phone_number,
        "image_path" : warden_data.image_path,
        "Active Status": warden_data.active
    })
  } catch (err) {
      console.error("❌ Error:", err);
      return res.status(500).json({ error: "Internal Server error" });
  }
}

module.exports = {
  getWardenDetail,
};

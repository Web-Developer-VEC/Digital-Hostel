const { getDb } = require("../../config/db");

async function getWardenDetail(req, res) {
  try {
    const db = getDb();
    const wardenCollection = db.collection("warden_database");
    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    const { registration_number } = user;

    const studentCollection = db.collection(registration_number);

    const warden_gender = studentCollection.gender;
    const warden_batch = [studentCollection.batch];
    const warden_data = await wardenCollection.findOne({
      gender: warden_gender,
      primary_batch: { $in: warden_batch },
    });
    return res.status(200).json({
      name: warden_data.warden_name,
      "primary batch": warden_data.primary_batch,
      "Secondary batch": warden_data.secondary_batch,
      "Phone number": warden_data.phone_number,
      image_path: warden_data.image_path,
      "Active Status": warden_data.active,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
}

module.exports = {
  getWardenDetail,
};

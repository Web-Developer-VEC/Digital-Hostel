const { getDb } = require("../../config/db");

async function getStudentPass(req, res) {
  try {
    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    const { registration_number } = user;
    const db = getDb();
    const passCollection = db.collection("pass_details");

    const passes = await passCollection
      .find({ registration_number })
      .sort({ request_date_time: -1 })
      .toArray();

    if (passes.length === 0) {
      return res.status(404).json({ message: "No passes found" });
    }
    console.log(passes);
    return res.status(200).json({ passes });
  
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
}

module.exports = {
  getStudentPass,
};

const { getDb } = require("../../config/db");

async function getFoodCount(req, res) {
  try {
    const db = getDb();

    const { user } = req.session;

    if (!user || !user.registration_number) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    const unique_id = user.registration_number;
    const userType = user.type;
    const wardenCollection = db.collection("warden_database");
    const studentCollection = db.collection("student_database");

    const warden_data = await wardenCollection.findOne({ unique_id });

    if (!warden_data) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const target_years =
      userType === "superior"
        ? await studentCollection.distinct("year")
        : (warden_data.primary_batch || warden_data.primary_year);
    console.log(target_years);
    let foodCounts = {};

    if (userType === "superior") {
      const genders = ["Male", "Female"];

      for (const gender of genders) {
        foodCounts[gender] = {};
        let totalVegCount = 0;
        let totalNonVegCount = 0;
        for (const year of target_years) {
          const vegCount = await studentCollection.countDocuments({
            foodtype: "Veg",
            batch:year,
            gender,
          });
          const nonVegCount = await studentCollection.countDocuments({
            foodtype: "Non-Veg",
            batch:year,
            gender,
          });
          foodCounts[gender][year] = {
            veg_count: vegCount,
            non_veg_count: nonVegCount,
          };
          totalVegCount += vegCount;
          totalNonVegCount += nonVegCount;

        }
        foodCounts[gender]["Overall"] = {
          veg_count: totalVegCount,
          non_veg_count: totalNonVegCount,
        };
      }
    } else {
      for (const year of target_years) {
        const vegCount = await studentCollection.countDocuments({
          foodtype: "Veg",
          batch:year,
          gender: warden_data.gender,
        });
        const nonVegCount = await studentCollection.countDocuments({
          foodtype: "Non-Veg",
          batch:year,
          gender: warden_data.gender,
        });
        
        foodCounts[year] = { veg_count: vegCount, non_veg_count: nonVegCount };
        
      }
    }

    return res.status(200).json({ foodCounts });
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
}

module.exports = {
  getFoodCount,
};

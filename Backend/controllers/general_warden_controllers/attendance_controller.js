const { getDb } = require("../../config/db");

async function getFoodCount(req, res) {
  try {
    const db = getDb();

    const { user } = req.session;

    // Check whether user session exists
    if (!user || !user.registration_number) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    const unique_id = user.registration_number;
    const userType = user.type;

    const wardenCollection = db.collection("warden_database");
    const studentCollection = db.collection("student_database");

    // Find the logged-in warden
    const warden_data = await wardenCollection.findOne({
      unique_id,
    });

    if (!warden_data) {
      return res.status(404).json({
        success: false,
        message: "Warden not found",
      });
    }

    let target_years;

    // Superior warden can see all years
    if (userType === "superior") {
      target_years = await studentCollection.distinct("year");
    } else {
      // Normal warden can see only assigned years
      target_years = warden_data.primary_batch || [];
    }

    // Make sure target_years is always an array
    if (!Array.isArray(target_years)) {
      target_years = [target_years];
    }

    console.log("User:", user);
    console.log("Warden ID:", unique_id);
    console.log("User Type:", userType);
    console.log("Warden Data:", warden_data);
    console.log("Target Years:", target_years);

    const foodCounts = {};

    // ==========================================
    // SUPERIOR WARDEN
    // ==========================================

    if (userType === "superior") {
      const genders = ["Male", "Female"];

      for (const gender of genders) {
        foodCounts[gender] = {};

        let totalVegCount = 0;
        let totalNonVegCount = 0;

        for (const year of target_years) {
          const vegCount = await studentCollection.countDocuments({
            foodtype: "Veg",
            year: year,
            gender: gender,
          });

          const nonVegCount = await studentCollection.countDocuments({
            foodtype: "Non-Veg",
            year: year,
            gender: gender,
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
    }

    // ==========================================
    // NORMAL WARDEN
    // ==========================================

    else {
      for (const year of target_years) {
        const vegCount = await studentCollection.countDocuments({
          foodtype: "Veg",
          year: year,
          gender: warden_data.gender,
        });

        const nonVegCount = await studentCollection.countDocuments({
          foodtype: "Non-Veg",
          year: year,
          gender: warden_data.gender,
        });

        foodCounts[year] = {
          veg_count: vegCount,
          non_veg_count: nonVegCount,
        };
      }
    }

    console.log("Food Counts:", foodCounts);

    return res.status(200).json({
      success: true,
      foodCounts,
    });
  } catch (err) {
    console.error("❌ Error in getFoodCount:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

module.exports = {
  getFoodCount,
};
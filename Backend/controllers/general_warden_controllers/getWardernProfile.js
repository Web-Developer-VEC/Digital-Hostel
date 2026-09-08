const { getDb } = require("../../config/db");

// ============================================
// GET WARDEN PROFILE
// ============================================

async function getWardenProfile(req, res) {
  try {
    const { user } = req.session;

    // Check login session
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }
    /*
  Change this based on your session structure.

  Possible values:
  user.unique_id
  user.warden_unique_id
  user.registration_number
*/
    if(!["warden","superior"].includes(user.type)){
      return res.status(401).json({
        success: false,
        message: "Unauthorized Request, Please Login Again!",
      });   
    }
    const unique_id =
      user.unique_id || user.warden_unique_id || user.registration_number;

    if (!unique_id) {
      return res.status(400).json({
        success: false,
        message: "Warden unique ID not found in session",
      });
    }



    const db = getDb();

    // Your MongoDB collection
    const wardenCollection = db.collection("warden_database");

    // Find warden using unique_id
    const warden = await wardenCollection.findOne(
      {
        unique_id: String(unique_id),
      },
      {
        projection: {
          password: 0,
        },
      },
    );

    if (!warden) {
      return res.status(404).json({
        success: false,
        message: "Warden profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Warden profile fetched successfully",

      data: {
        image_path: warden.image_path || null,

        name: warden.warden_name || null,

        warden_id: warden.unique_id || null,

        category: warden.category || null,

        gender: warden.category == "head" ? ["Male","Female"] : warden.gender || null,

        joined_date: warden.joined_date || null,

        handling_year: warden.primary_year || [],

        mobile_number: warden.phone_number ? String(warden.phone_number) : null,

        active: warden.active ?? false,
      },
    });
  } catch (error) {
    console.error("Get Warden Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch warden profile",
      error: error.message,
    });
  }
}

module.exports = {
  getWardenProfile,
};

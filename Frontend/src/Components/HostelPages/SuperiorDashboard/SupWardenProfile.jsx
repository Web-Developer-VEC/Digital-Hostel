import React, { useState, useEffect } from "react";
import "./SupWardenProfile.css";
import axiosInstance from "../../../api/axios";
import Swal from "sweetalert2";

const yearToAlphabet = {
  1: "First Year",
  2: "Second Year",
  3: "Third Year",
  4: "Fourth Year",
  10: "MBA",
  9: "ME",
  overall: "Overall",
};

function WardenProfile() {
  const [wardens, setWardens] = useState([]);
  const [loadingWardens, setLoadingWardens] = useState(true);

 


  const BASE_URL = process.env.REACT_APP_QR_URL;

  // ============================================
  // SUPERIOR WARDEN PROFILE STATE
  // ============================================

  const [warden, setWarden] = useState({
    unique_id: "",
    warden_name: "",
    phone_number: "",
    image_path: "",
    gender: "",
    category: "",
    joined_date: "",
    handling_years: [],
    incharge_of: "",
    email: "",
    address: "",
  });

  // ============================================
  // FORM DATA
  // ============================================

  const [formData, setFormData] = useState({
    warden_name: "",
    phone_number: "",
  });

  // ============================================
  // GET SUPERIOR WARDEN PROFILE
  // ============================================

  useEffect(() => {
    const getWardenProfile = async () => {
      try {
        const response = await axiosInstance.get("api/warden_profile");

        console.log("Superior Warden Profile Response:", response.data);

        // Backend sends profile inside data
        const wardenData = response.data?.data || {};

        const formattedWarden = {
          unique_id: wardenData.warden_id || "",

          warden_name: wardenData.name || "",

          phone_number: wardenData.mobile_number || "",

          image_path: wardenData.image_path
            ? `${BASE_URL}${wardenData.image_path}`
            : "",


          category: wardenData.category || "",

          joined_date: wardenData.joined_date || "",

          handling_years: Array.isArray(wardenData.handling_year)
            ? wardenData.handling_year
            : [],

          incharge_of: wardenData.gender || "",

          email: wardenData.email || "",

          address: wardenData.address || "",
        };

        console.log("Formatted Superior Warden Data:", formattedWarden);

        setWarden(formattedWarden);

        setFormData({
          warden_name: formattedWarden.warden_name,
          phone_number: formattedWarden.phone_number,
        });
      } catch (error) {
        console.error("❌ Failed to fetch superior warden profile");

        console.error("Full Error:", error);

        console.error("Backend Response:", error.response);

        console.error("Backend Data:", error.response?.data);

        console.error("Status:", error.response?.status);
      }
    };

    getWardenProfile();
  }, []);
  useEffect(() => {
    const fetchWardens = async () => {
      try {
        const response = await axiosInstance.get("/api/fetch_warden_details");

        setWardens(response.data.wardens || []);
      } catch (error) {
        console.error("Error fetching wardens:", error);

        Swal.fire({
          title: "Error ❌",
          text: "Failed to fetch warden details.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } finally {
        setLoadingWardens(false);
      }
    };

    fetchWardens();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#f5f6f8] px-4 py-5 md:px-5 lg:ml-64 lg:w-[calc(100%-16rem)]">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        <div className="w-full rounded-[18px] bg-white p-4 shadow-md sm:p-5 lg:p-7">
          <h2 className="student-title">Profile Details</h2>

          <div className="student-profile-section">
            {/* PROFILE PHOTO */}

            <div className="student-photo-section">
              <img
                src={warden.image_path || "https://via.placeholder.com/150"}
                alt={warden.warden_name || "Warden"}
                className="student-profile-photo"
              />
            </div>

            {/* PRIMARY DETAILS */}

            <div className="student-primary-details">
              {/* NAME */}

              <div className="student-form-group">
                <label>Name</label>

                <input
                  type="text"
                  name="warden_name"
                  disabled
                  value={formData.warden_name}
                  className="student-input"
                />
              </div>

              {/* UNIQUE ID */}

              <div className="student-form-group">
                <label>Warden ID</label>

                <input
                  type="text"
                  value={warden.unique_id}
                  disabled
                  className="student-input"
                />
              </div>

              {/* CATEGORY */}

              <div className="student-form-group">
                <label>Category</label>

                <input
                  type="text"
                  value={warden.category}
                  disabled
                  className="student-input"
                />
              </div>
            </div>
          </div>

          {/* SECONDARY DETAILS */}

          <div className="student-secondary-details">
            {/* GENDER */}

            <div className="student-form-group">
              <label>Gender</label>

              <input
                type="text"
                value={warden.gender}
                disabled
                className="student-input"
              />
            </div>

            {/* JOINED DATE */}

            <div className="student-form-group">
              <label>Joined Date</label>

              <input
                type="text"
                value={warden.joined_date}
                disabled
                className="student-input"
              />
            </div>

            {/* HANDLING YEAR */}

            <div className="student-form-group">
              <label>Handling Year</label>

              <input
                type="text"
                value={
                  Array.isArray(warden.handling_years)
                    ? warden.handling_years.join(", ")
                    : ""
                }
                disabled
                className="student-input"
              />
            </div>

            {/* INCHARGE OF */}

            <div className="student-form-group">
              <label>Incharge of</label>

              <input
                type="text"
                value={ Array.isArray(warden.handling_years)
                    ? warden.handling_years.join(", ")
                    : ""}
                disabled
                className="student-input"
              />
            </div>

            {/* MOBILE NUMBER */}

            <div className="student-form-group">
              <label>Mobile Number</label>

              <input
                type="tel"
                name="phone_number"
                disabled
                value={formData.phone_number}
                className="student-input"
              />
            </div>


          </div>
        </div>
        {/* =====================================================
    WARDENS UNDER SUPERIOR WARDEN
===================================================== */}

        <div className="superior-wardens-container">
          <h2 className="superior-wardens-title">Wardens Under You</h2>

          {loadingWardens ? (
            <p className="superior-wardens-loading">Loading wardens...</p>
          ) : wardens.length === 0 ? (
            <p className="superior-wardens-empty">No wardens found.</p>
          ) : (
            <div className="superior-wardens-grid">
              {wardens.map((warden) => (
                <div key={warden.unique_id} className="superior-warden-card">
                  <h3>{warden.warden_name}</h3>

                  <p>
                    <strong>Warden For:</strong>{" "}
                    {warden.primary_batch
                      ?.map((year) => yearToAlphabet[year] || year)
                      .join(", ")}
                  </p>

                  <p>
                    <strong>In Charge:</strong>{" "}
                    {warden.gender === "Male" ? "Boys" : "Girls"}
                  </p>

                  <p>
                    <strong>Joined Date:</strong> {warden.joined_date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WardenProfile;

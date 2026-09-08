import React, { useState, useEffect } from "react";
import "./WardenProfile.css";
import axiosInstance from "../../../api/axios";

const BASE_URL = process.env.REACT_APP_QR_URL;

function WardenProfile() {
  // ============================================
  // WARDEN PROFILE STATE
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
  });

  // ============================================
  // FORM DATA
  // ============================================

  const [formData, setFormData] = useState({
    warden_name: "",
    phone_number: "",
  });

  // ============================================
  // IMAGE URL HELPER
  // ============================================

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    // If image_path is already a complete URL,
    // don't add BASE_URL.
    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    // Otherwise, image_path is assumed to be
    // an S3 file path.
    return `${BASE_URL}${imagePath}`;
  };

  // ============================================
  // GET WARDEN PROFILE
  // ============================================

  useEffect(() => {
    const getWardenProfile = async () => {
      try {
        const response = await axiosInstance.get(
          "api/warden_profile"
        );

        console.log(
          "Warden Profile Response:",
          response.data
        );

        // Backend sends profile inside "data"
        const wardenData =
          response.data?.data || {};

        const formattedWarden = {
          unique_id:
            wardenData.warden_id || "",

          warden_name:
            wardenData.name || "",

          phone_number:
            wardenData.mobile_number || "",

          // FIXED IMAGE URL
          image_path: getImageUrl(
            wardenData.image_path
          ),

          gender:
            wardenData.gender || "",

          category:
            wardenData.category || "",

          joined_date:
            wardenData.joined_date || "",

          handling_years:
            Array.isArray(
              wardenData.handling_year
            )
              ? wardenData.handling_year
              : [],

          incharge_of:
            wardenData.incharge_of || "",

          email:
            wardenData.email || "",
        };

        console.log(
          "Formatted Warden Data:",
          formattedWarden
        );

        setWarden(formattedWarden);

        setFormData({
          warden_name:
            formattedWarden.warden_name,

          phone_number:
            formattedWarden.phone_number,
        });
      } catch (error) {
        console.error(
          "❌ Failed to fetch warden profile"
        );

        console.error(
          "Full Error:",
          error
        );

        console.error(
          "Backend Response:",
          error.response
        );

        console.error(
          "Backend Data:",
          error.response?.data
        );

        console.error(
          "Status:",
          error.response?.status
        );
      }
    };

    getWardenProfile();
  }, []);

  // ============================================
  // UI
  // ============================================

  return (
    <div className="student-container">
      <div className="student-main">
        <div className="student-form-container">

          {/* ============================================
              TITLE
          ============================================ */}

          <h2 className="student-title">
            Profile Details
          </h2>

          {/* ============================================
              PROFILE SECTION
          ============================================ */}

          <div className="student-profile-section">

            {/* ============================================
                PROFILE PHOTO
            ============================================ */}

            <div className="student-photo-section">
              {warden.image_path ? (
                <img
                  src={warden.image_path}
                  alt={
                    warden.warden_name ||
                    "Warden"
                  }
                  className="student-profile-photo"
                  onError={(e) => {
                    console.error(
                      "❌ Failed to load profile image:",
                      warden.image_path
                    );

                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="student-profile-photo">
                  No Image
                </div>
              )}
            </div>

            {/* ============================================
                PRIMARY DETAILS
            ============================================ */}

            <div className="student-primary-details">

              {/* NAME */}

              <div className="student-form-group">
                <label>Name</label>

                <input
                  type="text"
                  name="warden_name"
                  disabled
                  value={
                    formData.warden_name
                  }
                  className="student-input"
                />
              </div>

              {/* WARDEN ID */}

              <div className="student-form-group">
                <label>Warden ID</label>

                <input
                  type="text"
                  value={
                    warden.unique_id
                  }
                  disabled
                  className="student-input"
                />
              </div>

              {/* CATEGORY */}

              <div className="student-form-group">
                <label>Category</label>

                <input
                  type="text"
                  value={
                    warden.category
                  }
                  disabled
                  className="student-input"
                />
              </div>

            </div>
          </div>

          {/* ============================================
              SECONDARY DETAILS
          ============================================ */}

          <div className="student-secondary-details">

            {/* JOINED DATE */}

            <div className="student-form-group">
              <label>
                Joined Date
              </label>

              <input
                type="text"
                value={
                  warden.joined_date
                }
                disabled
                className="student-input"
              />
            </div>

            {/* HANDLING YEAR */}

            <div className="student-form-group">
              <label>
                Handling Year
              </label>

              <input
                type="text"
                value={
                  Array.isArray(
                    warden.handling_years
                  )
                    ? warden.handling_years.join(
                        ", "
                      )
                    : ""
                }
                disabled
                className="student-input"
              />
            </div>

            {/* INCHARGE OF */}

            <div className="student-form-group">
              <label>
                Incharge of
              </label>

              <input
                type="text"
                value={
                  warden.gender
                }
                disabled
                className="student-input"
              />
            </div>

            {/* MOBILE NUMBER */}

            <div className="student-form-group">
              <label>
                Mobile Number
              </label>

              <input
                type="tel"
                name="phone_number"
                disabled
                value={
                  formData.phone_number
                }
                className="student-input"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default WardenProfile;
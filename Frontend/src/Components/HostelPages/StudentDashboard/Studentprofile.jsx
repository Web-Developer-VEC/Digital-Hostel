import React, { useState, useEffect } from 'react';
import { Send, Info, Check, X } from 'lucide-react';
import axiosInstance from '../../../api/axios';
import './Studentprofile.css';

const DUMMY_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'>
      <rect width='100%' height='100%' fill='#e2e8f0'/>
      <circle cx='75' cy='58' r='30' fill='#94a3b8'/>
      <rect x='30' y='95' width='90' height='45' rx='22' fill='#94a3b8'/>
    </svg>
  `);

const DUMMY_PROFILE = {
  name: "John Doe",
  room_number: "B-204",
  department: "Computer Science",
  year: "2nd Year",
  admin_number: "ADM2024001",
  city: "Chennai",
  phone_number_student: "9876543210",
  phone_number_parent: "9123456780",
  foodtype: "Veg",
  profile_photo_path: "",
  changes: []
};

function Studentprofile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isPhoneWaitingApproval, setIsPhoneWaitingApproval] = useState(false);
  const [isProfileWaitingApproval, setIsProfileWaitingApproval] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [formData, setFormData] = useState(null);
  const [initialFormData, setInitialFormData] = useState(formData);
  const [changedFields, setChangedFields] = useState({});
  const [imgError, setImgError] = useState(false);

  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    if (!path) return DUMMY_IMAGE;
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/api/fetch_student_profile');
      const data = response.data.profile;

      setFormData(data);
      setInitialFormData(data);

      const changes = Array.isArray(data.changes) ? data.changes : [];
      setPendingChanges(changes);

      const normalized = changes.map((c) => String(c).toLowerCase());

      const phonePending = normalized.some(
        (c) => c.includes('phone_number_student') || c.includes('phone_number_parent')
      );
      const profilePending = normalized.some(
        (c) => !c.includes('phone_number_student') && !c.includes('phone_number_parent')
      );

      setIsPhoneWaitingApproval(phonePending);
      setIsProfileWaitingApproval(profilePending);
    } catch (error) {
      console.error('Error fetching profile, using dummy data:', error);
      setFormData(DUMMY_PROFILE);
      setInitialFormData(DUMMY_PROFILE);
      setIsPhoneWaitingApproval(false);
      setIsProfileWaitingApproval(false);
      setPendingChanges([]);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setInitialFormData(formData);
    setHasChanges(false);
    setChangedFields({});
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setHasChanges(false);
    setChangedFields({});
  };

  const handleRequestChange = async () => {
    let changes = {};
    let foodTypeChanged = false;
    let profileChanged = false;
    

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== initialFormData[key]) {
        changes[key] = formData[key];

        if (key === "foodtype") {
          foodTypeChanged = true;
        } else if (key !== "phone_number_student" || key !== "phone_number_parent") {
          profileChanged = true;
        }
      }
    });

    setChangedFields(changes);
    setIsEditing(false);
    setFormData(initialFormData);

    try {
      if (foodTypeChanged) {
        try {
          await axiosInstance.post("/api/change_food_type", {
            admissionNumber: formData.admin_number,
            foodtype: formData.foodtype,
          });
        } catch (error) {
          console.error("Food change request failed:", error.response?.data?.message || error.message);
        }
      }

      if (profileChanged) {
        try {
          await axiosInstance.post("/api/request_profile_update", {
            phone_number_student: formData.phone_number_student,
            phone_number_parent: formData.phone_number_parent,
            name: formData.name,
            year: formData.year,
            admin_number: formData.admin_number,
            city: formData.city,
          });
        } catch (error) {
          console.error("Profile update request failed:", error.response?.data?.message || error.message);
        }
      }

      if (foodTypeChanged || profileChanged) {
        await fetchProfile();
      }
    } catch (error) {
      console.error("Error requesting change:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  return (
    <div className="student-container">
      <div className="student-main">
        <div className="student-form-container">
          <h2 className="student-title">Profile Details</h2>

          <div className="student-profile-section">
            <div className="student-photo-section">
              <img
                src={imgError ? DUMMY_IMAGE : UrlParser(formData?.profile_photo_path)}
                alt={formData?.name || "Profile"}
                className="student-profile-photo"
                onError={() => setImgError(true)}
              />
            </div>

            <div className="student-primary-details">
              <div className="student-form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData?.name || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="student-input"
                />
              </div>

              <div className="student-form-group">
                <label>Room Number</label>
                <input
                  type="text"
                  name="room_number"
                  value={formData?.room_number || ""}
                  onChange={handleInputChange}
                  disabled={true}
                  className="student-input"
                />
              </div>

              <div className="student-form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData?.department || ""}
                  onChange={handleInputChange}
                  disabled={true}
                  className="student-input"
                />
              </div>
            </div>
          </div>

          <div className="student-secondary-details">
            <div className="student-form-group">
              <label>Year</label>
              <input
                type="text"
                name="year"
                value={formData?.year || ""}
                disabled
                className="student-input"
              />
            </div>

            <div className="student-form-group">
              <label>Admission Number</label>
              <input
                type="text"
                name="admissionNumber"
                value={formData?.admin_number || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="student-input"
              />
            </div>

            <div className="student-form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData?.city || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="student-input"
              />
            </div>

            <div className="student-mobile-numbers">
              <div className="student-form-group">
                <label>Student Mobile</label>
                <input
                  type="tel"
                  name="phone_number_student"
                  value={formData?.phone_number_student || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing || isPhoneWaitingApproval}
                  className="student-input"
                  maxLength={10}
                />
              </div>

              <div className="student-form-group">
                <label>Parent Mobile</label>
                <input
                  type="tel"
                  name="phone_number_parent"
                  value={formData?.phone_number_parent || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing || isPhoneWaitingApproval}
                  className="student-input"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="student-food-type">
              <label>Food Type</label>
              <select
                name="foodtype"
                value={formData?.foodtype || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="student-input"
              >
                <option value="Veg">Vegetarian</option>
                <option value="Non-Veg">Non-Vegetarian</option>
              </select>
            </div>
          </div>

          {(isPhoneWaitingApproval || isProfileWaitingApproval) &&
            pendingChanges &&
            pendingChanges.length > 0 && (
              <div className="student-pending-changes">
                <h3>Pending Changes</h3>
                <div className="pending-changes-grid">
                  {Object.entries(
                    pendingChanges.reduce((acc, change) => {
                      const [field, value] = String(change).split(/:\s(.+)/);
                      const key = field?.trim() || 'Unknown Field';
                      acc[key] = value || 'No Value';
                      return acc;
                    }, {})
                  ).map(([field, value]) => (
                    <div key={field} className="pending-change-item">
                      <div className="pending-field">{field.replace(/_/g, " ")}</div>
                      <div className="pending-new-value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="student-actions">
            {isEditing ? (
              <>
                <button
                  onClick={handleRequestChange}
                  disabled={!hasChanges}
                  className="student-button-group student-request-button"
                >
                  Request Change <Send />
                </button>
                <button
                  onClick={handleCancel}
                  className="student-button-group student-cancel-button"
                >
                  Cancel <X />
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="student-button-group student-edit-button"
              >
                Edit Profile <Info />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Studentprofile;
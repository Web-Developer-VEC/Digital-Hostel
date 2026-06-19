import React, { useEffect, useState } from "react";
import { X, Edit, Power, Trash2 } from 'lucide-react';
import './WardenProfile.css';
import axiosInstance from "../../../api/axios";
import Swal from "sweetalert2";

const WardenProfile = () => {
  const [wardens, setWardens] = useState([]);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [editedWarden, setEditedWarden] = useState(null); // State for edited warden
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalOpenDelete, setconfirmModalOpenDelete] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState(null);
  const [reallocationWardens, setReallocationWardens] = useState([]);
  const [primaryYears, setPrimaryYears] = useState([]);
  const [selectedReallocations, setSelectedReallocations] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWarden, setNewWarden] = useState({
    name: "",
    phone_number: "",
    inCharge: "",
    primaryWarden: [],
    photo: null,
    password: "",
    joinedDate: "",
  });

  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  // const yearToAlphabet = {
  //   '1': 'First Year',
  //   '2': 'Second Year',
  //   '3': 'Third Year',
  //   '4': 'Fourth Year',
  //   'MBA 1': 'MBA First Year',
  //   'MBA 2': 'MBA Second Year',
  //   'PG1': 'Postgraduate First Year',
  //   'PG2': 'Postgraduate Second Year'
  // };

  const yearToAlphabet = {
    '1': 'First Year',
    '2': 'Second Year',
    '3': 'Third Year',
    '4': 'Fourth Year',
    '10': 'MBA',
    '9': 'ME',
    'overall': 'Overall'
  };

  // Fetch warden details
  useEffect(() => {
    const fetchWardens = async () => {
      try {
        const response = await axiosInstance.get("/api/fetch_warden_details");
        const fetchedWardens = response.data.wardens;

        const formattedWardens = fetchedWardens.map((warden) => {
          const pBatch = warden.primary_batch || warden.primary_year || [];
          return {
            id: warden.unique_id,
            name: warden.warden_name,
            img: warden.image_path,
            wardenFor: pBatch.map((year) => yearToAlphabet[year]).join(", "),
            inCharge: warden.gender === "Male" ? "Boys" : "Girls",
            date: warden.joined_date,
            isActive: warden.active,
            phone_number: warden.phone_number,
            primaryYears: pBatch
          };
        });

        setWardens(formattedWardens);
        console.log("Wardens", formattedWardens);

      } catch (err) {
        console.error("Error fetching warden data", err);
        Swal.fire({
          title: "Error ❌",
          text: "Failed to fetch warden details. Please refresh the page.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    };

    fetchWardens();
  }, []);

  const toggleStatus = async (id) => {

    const warden = wardens.find(w => w.id === id);

    if (!warden) return;

    const newStatus = warden.isActive;

    // Show loading alert
    Swal.fire({
      title: "Processing ⏳",
      text: `${newStatus ? 'Deactivating' : 'Activating'} warden...`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      if (newStatus) {
        for (const year of primaryYears) {
          await axiosInstance.post("/api/warden_inactive_status_handling", {
            warden_name: selectedReallocations[year],
            inactive_warden_id: id,
            batch: parseInt(year),
            year: parseInt(year)
          });
        }
      } else {
        await axiosInstance.post('/api/warden_active_status_handling', {
          warden_id: id
        });
      }

      Swal.fire({
        title: "Success! ✅",
        text: `Warden ${newStatus ? 'deactivated' : 'activated'} successfully.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error updating warden status:", error);
      Swal.fire({
        title: "Error ❌",
        text: "Failed to update warden status. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  // Handle image change
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedWarden(prev => ({
          ...prev,
          img: reader.result, // For preview
          file: file // Store actual file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedWarden(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReallocationChange = (year, wardenName) => {
    setSelectedReallocations(prev => ({
      ...prev,
      [year]: wardenName // Update the selected warden for the specific year
    }));
  };

  const handleNewWardenChange = (e) => {
    const { name, value } = e.target;
    setNewWarden((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewWardenImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewWarden((prev) => ({
          ...prev,
          photo: reader.result, // For preview
          file: file, // Store actual file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWardenSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!newWarden.name || !newWarden.phone_number || !newWarden.password || !newWarden.joinedDate) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill in all required fields.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    if (newWarden.primaryWarden.length === 0) {
      Swal.fire({
        title: "Missing Information",
        text: "Please select at least one year for the warden.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    const primaryYearArray = newWarden.primaryWarden.map(year => parseInt(year, 10));

    const formData = new FormData();
    formData.append("name", newWarden.name);
    formData.append("phone_number", newWarden.phone_number);
    formData.append("gender", newWarden.inCharge === "Boys" ? "Male" : "Female");
    formData.append("primary_batch", JSON.stringify(primaryYearArray));
    formData.append("password", newWarden.password); // Add password
    formData.append("category", "assistant"); // Assuming category is always "assistant"
    formData.append("joined_date", newWarden.joinedDate); // Add joined date

    if (newWarden.file) {
      formData.append("wardenImage", newWarden.file);
    }

    // Show loading alert
    Swal.fire({
      title: "Adding Warden ⏳",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axiosInstance.post("/api/add_warden", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        Swal.fire({
          title: "Success! ✅",
          text: "Warden added successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          setIsAddModalOpen(false);
          setNewWarden({
            name: "",
            phone_number: "",
            inCharge: "",
            primaryWarden: [],
            photo: null,
            password: "",
            joinedDate: "",
          });
          window.location.reload();
        });
      } else {
        Swal.fire({
          title: "Error ❌",
          text: "Failed to add warden. Please try again.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (error) {
      console.error("Error adding warden", error);
      Swal.fire({
        title: "Error ❌",
        text: error.response?.data?.message || "An error occurred while adding the warden.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  // delete a warden
  const handleDelete = async (registration_number) => {
    console.log(pendingToggleId);

    // Show loading alert
    Swal.fire({
      title: "Deleting Warden ⏳",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axiosInstance.post("/api/delete_student", {
        registration_number,
        type: "warden"
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: "Warden data deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("❌ Error deleting warden:", error);
    }
  };

  // Save edited warden details
  const handleSave = async () => {
    if (!editedWarden || !selectedWarden) return;

    const updateFields = {};

    // Compare edited fields with original fields
    if (editedWarden.name !== selectedWarden.name) {
      updateFields.warden_name = editedWarden.name;
    }
    if (editedWarden.phone_number !== selectedWarden.phone_number) {
      updateFields.phone_number = editedWarden.phone_number;
    }
    if (editedWarden.inCharge !== selectedWarden.inCharge) {
      updateFields.gender = editedWarden.inCharge === "Boys" ? "Male" : "Female";
    }
    if (editedWarden.primaryWarden !== selectedWarden.primaryYears) {
      updateFields.primary_batch = editedWarden.primaryWarden.map(year => parseInt(year, 10)); // Send the updated primary batch
    }

    // Handle file upload
    if (editedWarden.file) {
      updateFields.file = editedWarden.file; // Append the file to updateFields
    }

    if (Object.keys(updateFields).length === 0) {
      Swal.fire({
        title: "No Changes",
        text: "No changes detected to save.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }

    // Show loading alert
    Swal.fire({
      title: "Saving Changes ⏳",
      text: "Updating warden profile...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const formData = new FormData();
      formData.append("unique_id", selectedWarden.id);

      // Append updated fields to formData
      Object.keys(updateFields).forEach(key => {
        if (key === "primary_batch" || key === "secondary_batch" || key === "primary_year" || key === "secondary_year") {
          formData.append(key, JSON.stringify(updateFields[key]));
        } else if (key === "file") {
          formData.append("wardenImage", updateFields.file); // Append the file to FormData
        } else {
          formData.append(key, updateFields[key]);
        }
      });

      const response = await axiosInstance.post("/api/update_warden_by_superior", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: "Warden details updated successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          title: "Error ❌",
          text: "Failed to update warden details.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (error) {
      console.error("Error updating warden details", error);
      Swal.fire({
        title: "Error ❌",
        text: error.response?.data?.message || "An error occurred while updating the warden details.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }

    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleToggle = async (wardenId) => {
    try {
      const response = await axiosInstance.post("/api/fetch_warden_details_reallocation", {
        target_warden_id: wardenId
      });
      setReallocationWardens(response.data.warden_names);
      setPrimaryYears(response.data.primary_batchs || response.data.primary_years || []);
    } catch (error) {
      console.error("Error fetching reallocation wardens", error);
      Swal.fire({
        title: "Error ❌",
        text: "Failed to fetch reallocation options. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  }

  // Open modal and set selected warden
  const openModal = (warden, event) => {
    if (!event.target.closest('.toggle-container')) {
      setSelectedWarden(warden);
      setEditedWarden({
        ...warden,
        primaryWarden: warden.primaryYears || [], // Initialize with primary years
      });
      setIsModalOpen(true);
      setIsEditing(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWarden(null);
    setEditedWarden(null); // Reset editedWarden
    setIsEditing(false);
  };


  return (
    <div className="warden-container">
      <div className="add-buttons">
        <button className="add-warden" onClick={() => setIsAddModalOpen(true)}>
          Add New Warden
        </button>
      </div>
      <div className="wardens-grid">
        {wardens?.map(warden => (
          <div
            key={warden.id}
            className={`hos-warden-card ${warden.inCharge.toLowerCase()}`}
            onClick={(e) => { openModal(warden, e); setPendingToggleId(warden.id); }}
          >
            <div className="warden-content">
              <div className="warden-image-wrapper">
                <img src={UrlParser(warden.img)} alt={warden.name} className="warden-image" />
              </div>
              <div className="warden-info">
                <h3 className="warden-name">{warden.name}</h3>
                <p className="warden-detail">
                  <span className="label">Warden For:</span> {warden.wardenFor}
                </p>
                <p className="warden-detail">
                  <span className="label">In Charge:</span> {warden.inCharge}
                </p>
                <p className="warden-detail">
                  <span className="label">Joined Date:</span> {warden.date}
                </p>
              </div>
              <div className="toggle-container" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`toggle-button ${warden.isActive ? 'active' : ''}`}
                  onClick={() => {
                    setPendingToggleId(warden.id);
                    setConfirmModalOpen(true);
                    handleToggle(warden.id)
                  }}
                >
                  <Power className="toggle-icon" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Warden</h2>
            <form onSubmit={handleAddWardenSubmit}>
              {/* Name */}
              <div className="form-row">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={newWarden.name || ""}
                  onChange={handleNewWardenChange}
                  required
                />
              </div>

              {/* Photo */}
              <div className="form-row">
                <label>Photo:</label>
                <input
                  type="file"
                  name="wardenImage"
                  accept="image/*"
                  onChange={handleNewWardenImageChange}
                  className="no-border photo"
                />
              </div>

              {/* Joined Date */}
              <div className="form-row">
                <label>Joined Date:</label>
                <input
                  type="date"
                  name="joinedDate"
                  value={newWarden.joinedDate || ""}
                  onChange={handleNewWardenChange}
                  className="no-border"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="form-row">
                <label>Phone Number:</label>
                <input
                  type="number"
                  name="phone_number"
                  value={newWarden.phone_number || ""}
                  onChange={handleNewWardenChange}
                  required
                />
              </div>

              {/* Warden For */}
              <div className="form-row">
                <label>Warden For:</label>
                <div className="checkbox-container no-border">
                  {["1", "2", "3", "4", "10", "9"].map((option) => (
                    <div key={option} className="checkbox-item">
                      <input
                        type="checkbox"
                        name="primaryWarden"
                        value={option}
                        checked={newWarden.primaryWarden?.map(String).includes(option)}
                        onChange={(e) => {
                          const selectedYear = e.target.value;
                          setNewWarden((prev) => {
                            const stringYears = prev.primaryWarden?.map(String) || [];
                            const updatedYears = stringYears.includes(selectedYear)
                              ? stringYears.filter((y) => y !== selectedYear)
                              : [...stringYears, selectedYear];
                            return {
                              ...prev,
                              primaryWarden: updatedYears,
                            };
                          });
                        }}
                      />
                      <label>{yearToAlphabet[option] || option}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Charge */}
              <div className="form-row">
                <label>In Charge:</label>
                <select
                  name="inCharge"
                  value={newWarden.inCharge || ""}
                  onChange={handleNewWardenChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                </select>
              </div>

              {/* Password */}
              <div className="form-row">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={newWarden.password || ""}
                  onChange={handleNewWardenChange}
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && selectedWarden && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {!isEditing ? (
              <>
                <div className="modal-header">
                  <button className="icon-button edit" onClick={() => setIsEditing(true)}>
                    <Edit size={20} />
                  </button>
                  <button className="icon-button close" onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="warden-profile">
                    <img src={UrlParser(selectedWarden.img)} alt={selectedWarden.name} className="profile-image" />
                    <h2 className="profile-name">{selectedWarden.name}</h2>
                    <div className="profile-">
                      <p className="text-left"><span className="label">Warden For:</span> {selectedWarden.wardenFor}</p>
                      <p className="text-left"><span className="label">In Charge:</span> {selectedWarden.inCharge}</p>
                      <p className="text-left"><span className="label">Joined Date:</span> {selectedWarden.date}</p>
                      <p className="text-left"><span className="label">Status:</span> {selectedWarden.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                    <button className="delete-button" onClick={() => setconfirmModalOpenDelete(true)}>
                      <Trash2 className="superior-icon" /> Remove Warden
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="edit-form">
                <h2>Edit Warden Profile</h2>
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={editedWarden?.name || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number:</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={editedWarden?.phone_number || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-row">
                  <label>Select Primary Years:</label>
                  <div className="checkbox-container no-border">
                    {["1", "2", "3", "4", "10", "9"].map((option) => (
                      <div key={option} className="checkbox-item">
                        <input
                          type="checkbox"
                          name="primaryWarden"
                          value={option}
                          checked={editedWarden?.primaryWarden?.map(String).includes(option)} // Reflect current state
                          onChange={(e) => {
                            const selectedYear = e.target.value;
                            setEditedWarden((prev) => {
                              const stringYears = prev.primaryWarden?.map(String) || [];
                              const updatedYears = stringYears.includes(selectedYear)
                                ? stringYears.filter((y) => y !== selectedYear)
                                : [...stringYears, selectedYear];
                              return { ...prev, primaryWarden: updatedYears };
                            });
                          }}
                        />
                        <label>{yearToAlphabet[option] || option}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Photo:</label>
                  <input
                    type="file"
                    name="wardenImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmModalOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Action</h3>
            <p>Are you sure you want to {wardens.find(w => w.id === pendingToggleId)?.isActive ? 'deactivate' : 'activate'} this warden?</p>
            {wardens.find(w => w.id === pendingToggleId)?.isActive && (
              <>
                {primaryYears?.map((year, index) => (
                  <div key={index} className="status-year-dropdown">
                    <label className="warden-pri-years">{yearToAlphabet[year]}</label>
                    <select
                      value={selectedReallocations[year] || ""}
                      onChange={(e) => handleReallocationChange(year, e.target.value)}
                      className="warden-status-select"
                    >
                      <option value="" className="warden-status-select">Select Warden</option>
                      {reallocationWardens?.map(warden => (
                        <option key={warden} value={warden} className="warden-status-select">{warden}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </>
            )}
            <div className="confirm-actions">
              <button className="confirm-button" onClick={() => toggleStatus(pendingToggleId)}>
                Confirm
              </button>
              <button className="cancel-button" onClick={() => setConfirmModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmModalOpenDelete && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Action</h3>
            <p>Are you sure you want to {wardens.find(w => w.id === pendingToggleId)?.name} ?</p>
            {console.log("IID", pendingToggleId)
            }
            <div className="confirm-actions">
              <button className="confirm-button" onClick={() => handleDelete(pendingToggleId)}>
                Confirm
              </button>
              <button className="cancel-button" onClick={() => setconfirmModalOpenDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardenProfile;
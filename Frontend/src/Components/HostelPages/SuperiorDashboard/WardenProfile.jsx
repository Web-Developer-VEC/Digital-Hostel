import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Edit,
  Power,
  Trash2,
  Upload,
  Camera,
  Plus,
  UserRound,
  CalendarDays,
  Phone,
  LockKeyhole,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import "./WardenProfile.css";
import axiosInstance from "../../../api/axios";
import Swal from "sweetalert2";

/**
 * Renders its children into document.body via a portal.
 *
 * Why this matters: the header/sidebar in this app use their own
 * position + z-index, and a modal nested deep inside the page layout
 * can end up in a lower/unrelated stacking context (e.g. an ancestor
 * with a transform, filter, or its own z-index) — so no matter how
 * high the modal's own z-index is set, the header/sidebar can still
 * paint on top of it. Portalling straight to <body> sidesteps that
 * entirely: the modal always stacks against the document root.
 */
const ModalPortal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

const WardenProfile = () => {
  const [wardens, setWardens] = useState([]);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [editedWarden, setEditedWarden] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalOpenDelete, setconfirmModalOpenDelete] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState(null);
  const [reallocationWardens, setReallocationWardens] = useState([]);
  const [primaryYears, setPrimaryYears] = useState([]);
  const [selectedReallocations, setSelectedReallocations] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isYearsDropdownOpen, setIsYearsDropdownOpen] = useState(false);
  const yearsDropdownRef = useRef(null);
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

  // A freshly-picked file becomes a data: URL for local preview — that
  // must NOT be run through UrlParser (which would prefix it with
  // BASE_URL and break the preview). Server-stored photos still go
  // through UrlParser as before.
  const resolveImgSrc = (path) =>
    path?.startsWith("data:") ? path : UrlParser(path);

  const yearToAlphabet = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
    10: "MBA",
    9: "ME",
    overall: "Overall",
  };

  // Any modal open at all? Used to lock page scroll behind the overlay.
  const anyModalOpen =
    isModalOpen || isAddModalOpen || confirmModalOpen || confirmModalOpenDelete;

  useEffect(() => {
    if (anyModalOpen) {
      document.body.classList.add("warden-modal-open");
    } else {
      document.body.classList.remove("warden-modal-open");
    }
    return () => document.body.classList.remove("warden-modal-open");
  }, [anyModalOpen]);

  useEffect(() => {
    if (!isYearsDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (yearsDropdownRef.current && !yearsDropdownRef.current.contains(e.target)) {
        setIsYearsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isYearsDropdownOpen]);

  useEffect(() => {
    if (!isEditing) setIsYearsDropdownOpen(false);
  }, [isEditing]);

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
            primaryYears: pBatch,
          };
        });

        setWardens(formattedWardens);
      } catch (err) {
        console.error("Error fetching warden data", err);
        Swal.fire({
          title: "Error ❌",
          text: "Failed to fetch warden details. Please refresh the page.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    };

    fetchWardens();
  }, []);

  const toggleStatus = async (id) => {
    const warden = wardens.find((w) => w.id === id);
    if (!warden) return;

    const newStatus = warden.isActive;

    Swal.fire({
      title: "Processing ⏳",
      text: `${newStatus ? "Deactivating" : "Activating"} warden...`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      if (newStatus) {
        for (const year of primaryYears) {
          await axiosInstance.post("/api/warden_inactive_status_handling", {
            warden_name: selectedReallocations[year],
            inactive_warden_id: id,
            batch: parseInt(year),
            year: parseInt(year),
          });
        }
      } else {
        await axiosInstance.post("/api/warden_active_status_handling", {
          warden_id: id,
        });
      }

      Swal.fire({
        title: "Success! ✅",
        text: `Warden ${newStatus ? "deactivated" : "activated"} successfully.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => window.location.reload());
    } catch (error) {
      console.error("Error updating warden status:", error);
      Swal.fire({
        title: "Error ❌",
        text: "Failed to update warden status. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedWarden((prev) => ({
          ...prev,
          img: reader.result,
          file: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedWarden((prev) => ({ ...prev, [name]: value }));
  };

  const handleReallocationChange = (year, wardenName) => {
    setSelectedReallocations((prev) => ({ ...prev, [year]: wardenName }));
  };

  const handleNewWardenChange = (e) => {
    const { name, value } = e.target;
    setNewWarden((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewWardenImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewWarden((prev) => ({
          ...prev,
          photo: reader.result,
          file: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWardenSubmit = async (e) => {
    e.preventDefault();

    if (
      !newWarden.name ||
      !newWarden.phone_number ||
      !newWarden.password ||
      !newWarden.joinedDate
    ) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill in all required fields.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (newWarden.primaryWarden.length === 0) {
      Swal.fire({
        title: "Missing Information",
        text: "Please select at least one year for the warden.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    const primaryYearArray = newWarden.primaryWarden.map((year) =>
      parseInt(year, 10),
    );

    const formData = new FormData();
    formData.append("name", newWarden.name);
    formData.append("phone_number", newWarden.phone_number);
    formData.append(
      "gender",
      newWarden.inCharge === "Boys" ? "Male" : "Female",
    );
    formData.append("primary_batch", JSON.stringify(primaryYearArray));
    formData.append("password", newWarden.password);
    formData.append("category", "assistant");
    formData.append("joined_date", newWarden.joinedDate);

    if (newWarden.file) {
      formData.append("wardenImage", newWarden.file);
    }

    Swal.fire({
      title: "Adding Warden ⏳",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await axiosInstance.post("/api/add_warden", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        Swal.fire({
          title: "Success! ✅",
          text: "Warden added successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
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
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error adding warden", error);
      Swal.fire({
        title: "Error ❌",
        text:
          error.response?.data?.message ||
          "An error occurred while adding the warden.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDelete = async (registration_number) => {
    Swal.fire({
      title: "Deleting Warden ⏳",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await axiosInstance.post("/api/delete_student", {
        registration_number,
        type: "warden",
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: "Warden data deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      }
    } catch (error) {
      console.error("❌ Error deleting warden:", error);
    }
  };

  const handleSave = async () => {
    if (!editedWarden || !selectedWarden) return;

    const updateFields = {};

    if (editedWarden.name !== selectedWarden.name) {
      updateFields.warden_name = editedWarden.name;
    }
    if (editedWarden.phone_number !== selectedWarden.phone_number) {
      updateFields.phone_number = editedWarden.phone_number;
    }
    if (editedWarden.inCharge !== selectedWarden.inCharge) {
      updateFields.gender =
        editedWarden.inCharge === "Boys" ? "Male" : "Female";
    }
    if (editedWarden.primaryWarden !== selectedWarden.primaryYears) {
      updateFields.primary_batch = editedWarden.primaryWarden.map((year) =>
        parseInt(year, 10),
      );
    }

    if (editedWarden.file) {
      updateFields.file = editedWarden.file;
    }

    if (Object.keys(updateFields).length === 0) {
      Swal.fire({
        title: "No Changes",
        text: "No changes detected to save.",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    Swal.fire({
      title: "Saving Changes ⏳",
      text: "Updating warden profile...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const formData = new FormData();
      formData.append("unique_id", selectedWarden.id);

      Object.keys(updateFields).forEach((key) => {
        if (
          key === "primary_batch" ||
          key === "secondary_batch" ||
          key === "primary_year" ||
          key === "secondary_year"
        ) {
          formData.append(key, JSON.stringify(updateFields[key]));
        } else if (key === "file") {
          formData.append("wardenImage", updateFields.file);
        } else {
          formData.append(key, updateFields[key]);
        }
      });

      const response = await axiosInstance.post(
        "/api/update_warden_by_superior",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: "Warden details updated successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          title: "Error ❌",
          text: "Failed to update warden details.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error updating warden details", error);
      Swal.fire({
        title: "Error ❌",
        text:
          error.response?.data?.message ||
          "An error occurred while updating the warden details.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }

    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleToggle = async (wardenId) => {
    try {
      const response = await axiosInstance.post(
        "/api/fetch_warden_details_reallocation",
        { target_warden_id: wardenId },
      );
      setReallocationWardens(response.data.warden_names);
      setPrimaryYears(
        response.data.primary_batchs || response.data.primary_years || [],
      );
    } catch (error) {
      console.error("Error fetching reallocation wardens", error);
      Swal.fire({
        title: "Error ❌",
        text: "Failed to fetch reallocation options. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const openModal = (warden, event) => {
    if (!event.target.closest(".toggle-container")) {
      setSelectedWarden(warden);
      setEditedWarden({
        ...warden,
        primaryWarden: warden.primaryYears || [],
      });
      setIsModalOpen(true);
      setIsEditing(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWarden(null);
    setEditedWarden(null);
    setIsEditing(false);
  };

  const pendingWarden = wardens.find((w) => w.id === pendingToggleId);
  const isDeactivating = !!pendingWarden?.isActive;

  // Confirm is only enabled once every year that needs a replacement
  // warden actually has one selected — avoids submitting a half-filled
  // reallocation.
  const reallocationComplete =
    !isDeactivating ||
    primaryYears.every((year) => !!selectedReallocations[year]);

  return (
    <div className="warden-container">
      <div className="add-buttons">
        <button className="add-warden" onClick={() => setIsAddModalOpen(true)}>
          Add New Warden
        </button>
      </div>

      <div className="wardens-grid">
        {wardens?.map((warden) => (
          <div
            key={warden.id}
            className={`hos-warden-card ${warden.inCharge.toLowerCase()}`}
            onClick={(e) => {
              openModal(warden, e);
              setPendingToggleId(warden.id);
            }}
          >
            <div className="warden-content">
              <div className="warden-image-wrapper">
                <img
                  src={UrlParser(warden.img)}
                  alt={warden.name}
                  className="warden-image"
                />
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
              <div
                className="toggle-container"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`toggle-button ${warden.isActive ? "active" : ""}`}
                  onClick={() => {
                    setPendingToggleId(warden.id);
                    setSelectedReallocations({});
                    setConfirmModalOpen(true);
                    handleToggle(warden.id);
                  }}
                >
                  <Power className="toggle-icon" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== ADD WARDEN MODAL ===================== */}
      {isAddModalOpen && (
        <ModalPortal>
          <div
            className="modal-overlay add-warden-overlay"
            onClick={() => setIsAddModalOpen(false)}
          >
            <div
              className="modal-content add-warden-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="add-warden-modal-header">
                <div className="add-warden-title-area">
                  <div className="add-warden-title-icon">
                    <UserRound size={22} />
                  </div>
                  <div>
                    <h2>Add New Warden</h2>
                    <p>Create and assign a new hostel warden profile</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="add-modal-close"
                  onClick={() => setIsAddModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form className="add-warden-form" onSubmit={handleAddWardenSubmit}>
                {/* Photo Upload — framed square with an explicit upload button */}
                <div className="photo-upload-section">
                  <label className="section-label">Profile Photo</label>

                  <div className="avatar-frame-row">
                    <input
                      id="warden-photo-upload"
                      type="file"
                      name="wardenImage"
                      accept="image/*"
                      onChange={handleNewWardenImageChange}
                      className="hidden-file-input"
                    />

                    <label htmlFor="warden-photo-upload" className="avatar-frame">
                      <span className="avatar-frame-photo">
                        {newWarden.photo ? (
                          <img src={newWarden.photo} alt="Warden preview" />
                        ) : (
                          <UserRound size={28} />
                        )}
                      </span>
                      <span className="avatar-frame-badge">
                        <Camera size={13} />
                      </span>
                    </label>

                    <div className="avatar-frame-meta">
                      <strong>
                        {newWarden.photo ? "Photo selected" : "Profile photo"}
                      </strong>
                      <label htmlFor="warden-photo-upload" className="avatar-frame-button">
                        <Upload size={13} />
                        {newWarden.photo ? "Change photo" : "Upload photo"}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="form-section">
                  <div className="form-section-heading">
                    <span>Basic Information</span>
                    <div className="section-line"></div>
                  </div>

                  <div className="form-grid">
                    <div className="form-row premium-field">
                      <label>
                        <UserRound size={15} />
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter warden name"
                        value={newWarden.name || ""}
                        onChange={handleNewWardenChange}
                        required
                      />
                    </div>

                    <div className="form-row premium-field">
                      <label>
                        <Phone size={15} />
                        Phone Number
                      </label>
                      <input
                        type="number"
                        name="phone_number"
                        placeholder="Enter phone number"
                        value={newWarden.phone_number || ""}
                        onChange={handleNewWardenChange}
                        required
                      />
                    </div>

                    <div className="form-row premium-field">
                      <label>
                        <CalendarDays size={15} />
                        Joined Date
                      </label>
                      <input
                        type="date"
                        name="joinedDate"
                        value={newWarden.joinedDate || ""}
                        onChange={handleNewWardenChange}
                        required
                      />
                    </div>

                    <div className="form-row premium-field">
                      <label>
                        <UserRound size={15} />
                        In Charge
                      </label>
                      <select
                        name="inCharge"
                        value={newWarden.inCharge || ""}
                        onChange={handleNewWardenChange}
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Boys">Boys Hostel</option>
                        <option value="Girls">Girls Hostel</option>
                      </select>
                    </div>

                    <div className="form-row premium-field full-width-field">
                      <label>
                        <LockKeyhole size={15} />
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Create a secure password"
                        value={newWarden.password || ""}
                        onChange={handleNewWardenChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Warden Assignment */}
                <div className="form-section assignment-section">
                  <div className="form-section-heading">
                    <span>Warden Assignment</span>
                    <div className="section-line"></div>
                  </div>

                  <div className="assignment-description">
                    Select the academic years this warden will be responsible for.
                  </div>

                  <div className="premium-checkbox-grid">
                    {["1", "2", "3", "4", "10", "9"].map((option) => {
                      const isChecked = newWarden.primaryWarden
                        ?.map(String)
                        .includes(option);

                      return (
                        <label
                          key={option}
                          className={`premium-year-option ${
                            isChecked ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="primaryWarden"
                            value={option}
                            checked={isChecked}
                            onChange={(e) => {
                              const selectedYear = e.target.value;
                              setNewWarden((prev) => {
                                const stringYears =
                                  prev.primaryWarden?.map(String) || [];
                                const updatedYears = stringYears.includes(
                                  selectedYear,
                                )
                                  ? stringYears.filter((y) => y !== selectedYear)
                                  : [...stringYears, selectedYear];
                                return { ...prev, primaryWarden: updatedYears };
                              });
                            }}
                          />
                          <span className="custom-check"></span>
                          <span className="year-option-text">
                            {yearToAlphabet[option] || option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="add-warden-actions">
                  <button
                    type="button"
                    className="add-cancel-button"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="add-submit-button">
                    <Plus size={18} />
                    Add Warden
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ===================== PROFILE / EDIT MODAL ===================== */}
      {isModalOpen && selectedWarden && (
        <ModalPortal>
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {!isEditing ? (
                <>
                  <div className="modal-header">
                    <button
                      className="icon-button edit"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit size={20} />
                    </button>
                    <button className="icon-button close" onClick={closeModal}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="warden-profile">
                      <img
                        src={UrlParser(selectedWarden.img)}
                        alt={selectedWarden.name}
                        className="profile-image"
                      />
                      <h2 className="profile-name">{selectedWarden.name}</h2>
                      <div className="profile-">
                        <p>
                          <span className="label">Warden For:</span>{" "}
                          {selectedWarden.wardenFor}
                        </p>
                        <p>
                          <span className="label">In Charge:</span>{" "}
                          {selectedWarden.inCharge}
                        </p>
                        <p>
                          <span className="label">Joined Date:</span>{" "}
                          {selectedWarden.date}
                        </p>
                        <p>
                          <span className="label">Status:</span>{" "}
                          {selectedWarden.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <button
                        className="delete-button"
                        onClick={() => setconfirmModalOpenDelete(true)}
                      >
                        <Trash2 size={17} /> Remove Warden
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="edit-form">
                  <div className="edit-form-header">
                    <div className="edit-form-icon">
                      <Edit size={19} />
                    </div>
                    <div>
                      <h2>Edit Warden Profile</h2>
                      <p>Update {selectedWarden.name}'s details</p>
                    </div>
                  </div>

                  <div className="avatar-frame-row">
                    <input
                      id="edit-warden-photo"
                      type="file"
                      name="wardenImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden-file-input"
                    />

                    <label htmlFor="edit-warden-photo" className="avatar-frame">
                      <span className="avatar-frame-photo">
                        {editedWarden?.img ? (
                          <img
                            src={resolveImgSrc(editedWarden.img)}
                            alt={editedWarden?.name}
                          />
                        ) : (
                          <UserRound size={28} />
                        )}
                      </span>
                      <span className="avatar-frame-badge">
                        <Camera size={13} />
                      </span>
                    </label>

                    <div className="avatar-frame-meta">
                      <strong>Profile photo</strong>
                      <label htmlFor="edit-warden-photo" className="avatar-frame-button">
                        <Upload size={13} />
                        Change photo
                      </label>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="form-section-heading">
                      <span>Basic Information</span>
                      <div className="section-line"></div>
                    </div>

                    <div className="form-grid">
                      <div className="form-row premium-field">
                        <label>
                          <UserRound size={15} />
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editedWarden?.name || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-row premium-field">
                        <label>
                          <Phone size={15} />
                          Phone Number
                        </label>
                        <input
                          type="text"
                          name="phone_number"
                          value={editedWarden?.phone_number || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section assignment-section">
                    <div className="form-section-heading">
                      <span>Primary Years</span>
                      <div className="section-line"></div>
                    </div>

                    <div className="assignment-description">
                      Academic years this warden is responsible for.
                    </div>

                    <div className="year-multiselect" ref={yearsDropdownRef}>
                      <button
                        type="button"
                        className={`year-multiselect-trigger ${
                          isYearsDropdownOpen ? "open" : ""
                        }`}
                        onClick={() => setIsYearsDropdownOpen((o) => !o)}
                      >
                        <span
                          className={
                            editedWarden?.primaryWarden?.length
                              ? ""
                              : "placeholder"
                          }
                        >
                          {editedWarden?.primaryWarden?.length
                            ? editedWarden.primaryWarden
                                .map((y) => yearToAlphabet[y] || y)
                                .join(", ")
                            : "Select years"}
                        </span>
                        <ChevronDown size={18} className="year-multiselect-chevron" />
                      </button>

                      {isYearsDropdownOpen && (
                        <div className="year-multiselect-panel">
                          {["1", "2", "3", "4", "10", "9"].map((option) => {
                            const isChecked = editedWarden?.primaryWarden
                              ?.map(String)
                              .includes(option);

                            return (
                              <label
                                key={option}
                                className={`year-multiselect-option ${
                                  isChecked ? "selected" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  name="primaryWarden"
                                  value={option}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const selectedYear = e.target.value;
                                    setEditedWarden((prev) => {
                                      const stringYears =
                                        prev.primaryWarden?.map(String) || [];
                                      const updatedYears = stringYears.includes(
                                        selectedYear,
                                      )
                                        ? stringYears.filter(
                                            (y) => y !== selectedYear,
                                          )
                                        : [...stringYears, selectedYear];
                                      return {
                                        ...prev,
                                        primaryWarden: updatedYears,
                                      };
                                    });
                                  }}
                                />
                                <span className="custom-check"></span>
                                <span className="label-text">
                                  {yearToAlphabet[option] || option}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      className="cancel-button"
                      onClick={() => setIsEditing(false)}
                    >
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
        </ModalPortal>
      )}

      {/* ===================== ACTIVATE / DEACTIVATE CONFIRM ===================== */}
      {confirmModalOpen && (
        <ModalPortal>
          <div className="modal-overlay confirm-overlay">
            <div className="confirm-modal">
              <div
                className={`confirm-icon-badge ${
                  isDeactivating ? "tone-warn" : "tone-safe"
                }`}
              >
                <Power size={26} />
              </div>

              <h3>{isDeactivating ? "Deactivate warden?" : "Activate warden?"}</h3>
              <p>
                {isDeactivating ? (
                  <>
                    <strong>{pendingWarden?.name}</strong> will be marked
                    inactive. Choose a replacement warden for each year they
                    currently cover.
                  </>
                ) : (
                  <>
                    <strong>{pendingWarden?.name}</strong> will be marked
                    active again and can be assigned to students right away.
                  </>
                )}
              </p>

              {isDeactivating && primaryYears?.length > 0 && (
                <div className="reallocation-list">
                  {primaryYears.map((year, index) => (
                    <div key={index} className="reallocation-card">
                      <label className="reallocation-year">
                        {yearToAlphabet[year] || year}
                      </label>
                      <select
                        value={selectedReallocations[year] || ""}
                        onChange={(e) =>
                          handleReallocationChange(year, e.target.value)
                        }
                        className="warden-status-select"
                      >
                        <option value="">Select warden</option>
                        {reallocationWardens?.map((warden) => (
                          <option key={warden} value={warden}>
                            {warden}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div className="confirm-actions">
                <button
                  className="cancel-button"
                  onClick={() => setConfirmModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  disabled={!reallocationComplete}
                  onClick={() => {
                    toggleStatus(pendingToggleId);
                    setConfirmModalOpen(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ===================== DELETE CONFIRM ===================== */}
      {confirmModalOpenDelete && (
        <ModalPortal>
          <div className="modal-overlay confirm-overlay">
            <div className="confirm-modal tone-danger">
              <div className="confirm-icon-badge tone-danger">
                <ShieldAlert size={26} />
              </div>

              <h3>Remove this warden?</h3>
              <p>
                <strong>{pendingWarden?.name}</strong> will be permanently
                removed. This can't be undone.
              </p>

              <div className="confirm-actions">
                <button
                  className="cancel-button"
                  onClick={() => setconfirmModalOpenDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  onClick={() => {
                    handleDelete(pendingToggleId);
                    setconfirmModalOpenDelete(false);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default WardenProfile;
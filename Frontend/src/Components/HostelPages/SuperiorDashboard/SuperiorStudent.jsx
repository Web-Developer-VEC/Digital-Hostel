import React, { useEffect, useRef, useState } from 'react';
import { Download, Filter, Footprints, Home, Search, X, Phone } from 'lucide-react';
import './SuperiorStudent.css';
import axiosInstance from '../../../api/axios';
import DownloadPdf from '../pdf';
import Swal from 'sweetalert2';

// Helper to get initials for the Avatar
const getInitials = (name) => {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

function SuperiorStudent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState({ male: [], female: [] });
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // States
  const [selectedGender, setSelectedGender] = useState('Male'); // Default to Boys
  const [selectedStudent, setSelectedStudent] = useState(null); // Modal state

  // State for Inline Editing Food Type
  const [inlineEdit, setInlineEdit] = useState({ field: null, value: '' });

  // Increment Student Year states
  const [isModalOpen, setIsModalOpen] = useState(false); // Control confirmation modal visibility
  const [tempYear, setTempYear] = useState(""); // Store selected batch before confirmation
  const [selectedYear, setSelectedYear] = useState("");
  const [uniqueBatches, setUniqueBatches] = useState([]);

  const [filters, setFilters] = useState({
    year: 'All',
    department: 'All',
    foodType: 'All',
    transitStatus: "All",
    passType: "All"
  });

  const yearToAlphabet = {
    '1': 'First Year',
    '2': 'Second Year',
    '3': 'Third Year',
    '4': 'Fourth Year',
    '10': 'MBA',
    '9': 'ME',
    'overall': 'Overall'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/api/fetch_student_details_superior');
        const fetchedData = response.data;

        const formattedData = fetchedData.students.map((student) => ({
          id: student._id,
          name: student.name,
          photo: student.profile_photo_path,
          admissionNumber: student.admin_number,
          registrationNumber: student.registration_number,
          gender: student.gender,
          year: yearToAlphabet[student.year] || student.year,
          department: student.department,
          roomNumber: student.room_number,
          studentMobile: student.phone_number_student,
          parentMobile: student.phone_number_parent,
          area: student.city,
          foodType: student.foodtype || "Not Specified",
          transitStatus: student.transit_status,
          vacateStatus: student.vacate_status,
          passInfo: student.pass_info || {},
          batch: student.batch
        }));

        const batches = [...new Set(formattedData.map(student => student.batch))];
        setUniqueBatches(batches);

        setStudents({
          male: formattedData.filter(student => student.gender === "Male"),
          female: formattedData.filter(student => student.gender === "Female")
        });

      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchData();
  }, []);

  const activeStudents = selectedGender === 'Male' ? (students.male || []) : (students.female || []);

  const filteredStudents = activeStudents.filter(student => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      student.name.toLowerCase().includes(searchTermLower) ||
      student.admissionNumber.toLowerCase().includes(searchTermLower) ||
      (student.area && student.area.toLowerCase().includes(searchTermLower)) ||
      student.roomNumber?.toString().includes(searchTermLower) ||
      student.department?.toLowerCase().includes(searchTermLower);

    const matchesYear = filters.year === "All" || student.year === yearToAlphabet[filters.year];
    const matchesDepartment = filters.department === "All" || student.department === filters.department;
    const matchesFoodType = filters.foodType === "All" || student.foodType === filters.foodType;

    const matchesTransitStatus =
      filters.transitStatus === "All" ||
      (filters.transitStatus === "true" && student.transitStatus) ||
      (filters.transitStatus === "false" && !student.transitStatus);

    return matchesSearch && matchesYear && matchesDepartment && matchesFoodType && matchesTransitStatus;
  });

  const handleDelete = async (registration_number, studentName) => {
    const result = await Swal.fire({
      title: "Mark Vacate?",
      text: `Are you sure you want to vacate ${studentName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7f1d1d",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Vacate",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axiosInstance.post("/api/delete_student", {
        registration_number,
        type: "student"
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Vacated! ✅",
          text: "Student has been vacated successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  // Handle batch selection for incrementing student year
  const handleYearChange = (event) => {
    const year = event.target.value;

    // If "Increment Student Year" placeholder is selected, do nothing
    if (year === "") {
      return;
    }

    setTempYear(year); // Store the selected batch
    setIsModalOpen(true); // Open confirmation modal
  };

  const confirmYearChange = async () => {
    setIsModalOpen(false);

    Swal.fire({
      title: "Processing ⏳",
      text: "Incrementing student year...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axiosInstance.post("/api/increment_student_year", {
        batch: tempYear
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: `Student year for batch ${tempYear} has been incremented successfully.`,
          icon: "success",
          confirmButtonText: "OK"
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Error updating year:", error);
    }
  };

  const ConfirmationModal = ({ onConfirm, onCancel }) => (
    <div className="AR-confirmation-modal-overlay">
      <div className="AR-confirmation-modal">
        <h3>Confirm Year Increment</h3>
        <p>Are you sure you want to increment the student year {tempYear} ?</p>
        <div className="AR-confirmation-buttons">
          <button onClick={onCancel} className="AR-button AR-button-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="AR-button AR-button-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  const handleSaveStudentField = async (field, newValue, successMessage = "Updated successfully!") => {
    if (!selectedStudent) return;

    const updateFields = {
      [field]: newValue
    };

    try {
      const response = await axiosInstance.post('/api/update_student_by_warden', {
        registration_number: selectedStudent.registrationNumber,
        ...updateFields,
      });

      if (response.status === 200) {
        const formattedFood = newValue === 'Veg' ? 'Vegetarian' : (newValue === 'Non-Veg' ? 'Non-Vegetarian' : newValue);

        setSelectedStudent(prev => ({ ...prev, [field === 'room_number' ? 'roomNumber' : 'foodType']: formattedFood }));

        setStudents(prev => ({
          male: prev.male.map(s => s.id === selectedStudent.id ? { ...s, [field === 'room_number' ? 'roomNumber' : 'foodType']: formattedFood } : s),
          female: prev.female.map(s => s.id === selectedStudent.id ? { ...s, [field === 'room_number' ? 'roomNumber' : 'foodType']: formattedFood } : s)
        }));

        Swal.fire({
          title: "Success! ✅",
          text: successMessage,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating student:', error);
      Swal.fire("Error", "Failed to update record.", "error");
    }
  };

  // Room number — inline edit, matching Hostelstudents.jsx exactly
  // (a text input with a checkmark/cross, no separate popup).
  const [editingRoom, setEditingRoom] = useState(false);
  const [tempRoom, setTempRoom] = useState('');

  const startEditRoom = () => {
    setTempRoom(selectedStudent.roomNumber || '');
    setEditingRoom(true);
  };

  const cancelEditRoom = () => {
    setEditingRoom(false);
    setTempRoom('');
  };

  const confirmEditRoom = async () => {
    if (!tempRoom || tempRoom === selectedStudent.roomNumber) {
      cancelEditRoom();
      return;
    }
    await handleSaveStudentField('room_number', tempRoom, "Room number updated successfully.");
    cancelEditRoom();
  };

  const startEditFood = () => {
    const rawValue = selectedStudent.foodType === 'Vegetarian' ? 'Veg' : (selectedStudent.foodType === 'Non-Vegetarian' ? 'Non-Veg' : selectedStudent.foodType);
    setInlineEdit({ field: 'foodType', value: rawValue });
  };

  const cancelInlineEdit = () => {
    setInlineEdit({ field: null, value: '' });
  };

  const closeModal = () => {
    setSelectedStudent(null);
    cancelInlineEdit();
    cancelEditRoom();
  };

  // Modal behavior parity with the Hostel Students popup: Escape closes it,
  // and the page behind it can't scroll while it's open.
  useEffect(() => {
    if (!selectedStudent) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedStudent]);

  // Food type — saves directly on the checkmark, same as Hostelstudents.jsx
  // (no extra "are you sure" dialog in between).
  const confirmEditFood = async () => {
    const currentRaw = selectedStudent.foodType === 'Vegetarian' ? 'Veg' : (selectedStudent.foodType === 'Non-Vegetarian' ? 'Non-Veg' : selectedStudent.foodType);

    if (inlineEdit.value === currentRaw) {
      cancelInlineEdit();
      return;
    }

    await handleSaveStudentField('foodtype', inlineEdit.value, "Food type updated successfully.");
    cancelInlineEdit();
  };

  return (
    <div className="superior-container">
      <div className="superior-content">

        {/* Top Header Row */}
        <div className="warden-header-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search students by anything"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="header-actions">
            <div className="gender-toggle">
              <button
                className={`gender-btn ${selectedGender === 'Male' ? 'active' : ''}`}
                onClick={() => setSelectedGender('Male')}
              >
                Boys
              </button>
              <button
                className={`gender-btn ${selectedGender === 'Female' ? 'active' : ''}`}
                onClick={() => setSelectedGender('Female')}
              >
                Girls
              </button>
            </div>

            <select onChange={handleYearChange} value={selectedYear} className="year-select">
              <option value="">Increment Student Year</option>
              {uniqueBatches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>

            <button className="action-btn">
              <Download size={18} />
              <DownloadPdf studentData={filteredStudents} />
            </button>

            <div className="filter-wrapper" ref={filterRef}>
              <button className="action-btn" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={18} /> Filters
              </button>

              {showFilters && (
                <div className="filter-popup">
                  <div className="filter-section">
                    <label>Year</label>
                    <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
                      <option value="All">All Years</option>
                      <option value="1">First Year</option>
                      <option value="2">Second Year</option>
                      <option value="3">Third Year</option>
                      <option value="4">Fourth Year</option>
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Department</label>
                    <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
                      <option value="All">All Depts</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">Mechanical</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isModalOpen && (
          <ConfirmationModal
            onConfirm={confirmYearChange}
            onCancel={() => setIsModalOpen(false)}
          />
        )}

        {/* Grid Layout */}
        <div className="students-grid">
          {filteredStudents.map(student => (
            <div key={student.id} className="student-card">
              <div className="status-icon-top">
                {student.transitStatus ? (
                  <Footprints size={18} color="#f59e0b" />
                ) : (
                  <Home size={18} color="#3b82f6" />
                )}
              </div>

              <div className="card-info-row">
                <div className="avatar-circle">
                  {getInitials(student.name)}
                </div>
                <div className="card-details">
                  <h3 title={student.name}>{student.name}</h3>
                  <p>Admission No: {student.admissionNumber}</p>
                  <p>{student.year}</p>
                  <p>{student.department}</p>
                </div>
              </div>

              <button className="view-more-btn" onClick={() => setSelectedStudent(student)}>
                View More
              </button>
            </div>
          ))}
        </div>

        {/* =========================================
    STUDENT DETAILS MODAL
========================================= */}

        {selectedStudent && (
          <div
            className="student-modal-overlay"
            onClick={closeModal}
          >
            <div
              className="student-modal"
              onClick={(e) => e.stopPropagation()}
            >

              {/* =====================================
          MODAL TOP / HEADER
      ===================================== */}

              <div className="student-modal-header">

                {/* Close */}
                <button
                  type="button"
                  className="student-modal-close"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={21} />
                </button>


                {/* Student Information */}
                <div className="student-modal-profile">

                  <div className="student-modal-avatar">
                    {getInitials(selectedStudent.name)}
                  </div>

                  <div className="student-modal-identity">

                    <div className="student-modal-name-row">
                      <h2>
                        {selectedStudent.name}
                      </h2>

                      <span className="student-modal-active-badge">
                        {selectedStudent.transitStatus
                          ? "In Transit"
                          : "In Hostel"}
                      </span>
                    </div>

                    <p className="student-modal-academic">
                      {selectedStudent.year}
                      <span>•</span>
                      {selectedStudent.department}
                    </p>

                    <p className="student-modal-admission">
                      Admission No.
                      <strong>
                        {selectedStudent.admissionNumber}
                      </strong>
                    </p>

                  </div>

                </div>


                {/* Mark Vacate */}
                <button
                  type="button"
                  className="student-modal-vacate"
                  onClick={() =>
                    handleDelete(
                      selectedStudent.registrationNumber,
                      selectedStudent.name
                    )
                  }
                >
                  Mark Vacate
                </button>

              </div>


              {/* =====================================
          HEADER ACCENT
      ===================================== */}

              <div className="student-modal-accent"></div>


              {/* =====================================
          MODAL BODY
      ===================================== */}

              <div className="student-modal-body">


                {/* ===================================
            HOSTEL SECTION
        =================================== */}

                <section className="student-modal-section">

                  <div className="student-modal-section-heading">

                    <div className="student-modal-section-icon">
                      <Home size={17} />
                    </div>

                    <div>
                      <h3>Hostel Information</h3>
                      <p>Current accommodation details</p>
                    </div>

                  </div>


                  <div className="student-modal-info-grid">


                    {/* ROOM */}
                    <div className="student-modal-info-card">

                      <span className="student-modal-info-label">
                        ROOM
                      </span>

                      {editingRoom ? (

                        <div className="student-modal-edit-wrapper">

                          <input
                            type="text"
                            className="student-modal-input"
                            value={tempRoom}
                            onChange={(e) =>
                              setTempRoom(e.target.value)
                            }
                            autoFocus
                          />

                          <div className="student-modal-edit-buttons">

                            <button
                              type="button"
                              className="student-modal-save"
                              onClick={confirmEditRoom}
                              title="Save"
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              className="student-modal-edit-cancel"
                              onClick={cancelEditRoom}
                              title="Cancel"
                            >
                              ×
                            </button>

                          </div>

                        </div>

                      ) : (

                        <>

                          <div className="student-modal-value">
                            {selectedStudent.roomNumber || "N/A"}
                          </div>

                          <button
                            type="button"
                            className="student-modal-edit-link"
                            onClick={startEditRoom}
                          >
                            Edit
                          </button>

                        </>

                      )}

                    </div>


                    {/* FOOD */}
                    <div className="student-modal-info-card">

                      <span className="student-modal-info-label">
                        FOOD
                      </span>

                      {inlineEdit.field === "foodType" ? (

                        <div className="student-modal-edit-wrapper">

                          <select
                            className="student-modal-input"
                            value={inlineEdit.value}
                            onChange={(e) =>
                              setInlineEdit({
                                ...inlineEdit,
                                value: e.target.value
                              })
                            }
                            autoFocus
                          >
                            <option value="Veg">
                              Vegetarian
                            </option>

                            <option value="Non-Veg">
                              Non-Vegetarian
                            </option>
                          </select>

                          <div className="student-modal-edit-buttons">

                            <button
                              type="button"
                              className="student-modal-save"
                              onClick={confirmEditFood}
                              title="Save"
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              className="student-modal-edit-cancel"
                              onClick={cancelInlineEdit}
                              title="Cancel"
                            >
                              ×
                            </button>

                          </div>

                        </div>

                      ) : (

                        <>

                          <div className="student-modal-value">
                            {selectedStudent.foodType || "N/A"}
                          </div>

                          <button
                            type="button"
                            className="student-modal-edit-link"
                            onClick={startEditFood}
                          >
                            Edit
                          </button>

                        </>

                      )}

                    </div>


                    {/* STATUS */}
                    <div className="student-modal-info-card">

                      <span className="student-modal-info-label">
                        STATUS
                      </span>

                      <div className="student-modal-status">

                        <span
                          className={`student-modal-status-dot ${selectedStudent.transitStatus
                              ? "transit"
                              : "hostel"
                            }`}
                        ></span>

                        <span>
                          {selectedStudent.transitStatus
                            ? "In Transit"
                            : "In Hostel"}
                        </span>

                      </div>

                    </div>

                  </div>

                </section>


                {/* ===================================
            CONTACT SECTION
        =================================== */}

                <section className="student-modal-section student-modal-contact-section">

                  <div className="student-modal-section-heading">

                    <div className="student-modal-section-icon">
                      <Phone size={17} />
                    </div>

                    <div>
                      <h3>Contact Information</h3>
                      <p>Student and parent contact details</p>
                    </div>

                  </div>


                  <div className="student-modal-contact-grid">


                    {/* STUDENT */}
                    <div className="student-modal-contact-card">

                      <span className="student-modal-info-label">
                        STUDENT
                      </span>

                      <a
                        href={
                          selectedStudent.studentMobile
                            ? `tel:${selectedStudent.studentMobile}`
                            : "#"
                        }
                        className="student-modal-contact-value"
                        onClick={(e) => {
                          if (!selectedStudent.studentMobile) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {selectedStudent.studentMobile || "N/A"}
                      </a>

                    </div>


                    {/* PARENT */}
                    <div className="student-modal-contact-card">

                      <span className="student-modal-info-label">
                        PARENT
                      </span>

                      <a
                        href={
                          selectedStudent.parentMobile
                            ? `tel:${selectedStudent.parentMobile}`
                            : "#"
                        }
                        className="student-modal-contact-value"
                        onClick={(e) => {
                          if (!selectedStudent.parentMobile) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {selectedStudent.parentMobile || "N/A"}
                      </a>

                    </div>


                    {/* AREA */}
                    <div className="student-modal-contact-card">

                      <span className="student-modal-info-label">
                        AREA
                      </span>

                      <span className="student-modal-contact-value">
                        {selectedStudent.area || "N/A"}
                      </span>

                    </div>

                  </div>

                </section>


              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default SuperiorStudent;
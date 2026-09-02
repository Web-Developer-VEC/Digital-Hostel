import React, { useState, useRef, useEffect } from 'react';
import { BarChart, ClipboardList, GraduationCap, Search, Filter, Check, X, Footprints, Download } from 'lucide-react';
import { Home, Walk } from "lucide-react";

import './Hostelstudents.css';
import axios from 'axios';
import DownloadPdf from '../pdf';
import showSweetAlert from '../Alert';
import Swal from 'sweetalert2';
import { getRequest, postRequest } from '../../../api/axios';

function Hostelstudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    year: 'All',
    department: 'All',
    foodType: 'All',
    transitStatus: "All",
    passType: "All"
  });
  const [expandedCards, setExpandedCards] = useState(null);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  );
  const [modalStudentId, setModalStudentId] = useState(null);
  const [activeNav, setActiveNav] = useState('students');
  const [editingStates, setEditingStates] = useState({});
  const [tempFoodTypes, setTempFoodTypes] = useState({});
  const filterRef = useRef(null);
  const [studentsData, setStudentData] = useState(null);
  const [yearData, setYearData] = useState(null);
  const [reg, setReg] = useState(null);
  const [editingRoomStates, setEditingRoomStates] = useState({});
  const [tempRoomNumbers, setTempRoomNumbers] = useState({});

  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  // Temporary dummy avatar, generated per student from their initials —
  // used whenever a real photo isn't available yet or fails to load.
  // Once the backend serves a real photo URL, the <img src> below just
  // uses that directly, so there's nothing extra to wire up later.
  const getAvatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=fdcd03&color=1c1c1f&bold=true&size=128`;

  const handlePhotoError = (name) => (e) => {
    e.target.onerror = null;
    e.target.src = getAvatarUrl(name);
  };

  // Year Mapping
  const yearToAlphabet = {
    '1': 'First Year',
    '2': 'Second Year',
    '3': 'Third Year',
    '4': 'Fourth Year',
    '10': 'MBA',
    '9': 'ME',
    'overall': 'Overall'
  };

  // Mapping Department Codes to Full Names
  const departmentLabels = {
    "AI&DS": "AI",
    "AUTO": "Automobile",
    "CIVIL": "Civil",
    "CSE": "Computer Science",
    "CYBER": "Cyber",
    "EEE": "EEE",
    "ECE": "ECE",
    "EIE": "EIE",
    "IT": "IT",
    "MECH": "Mechanical",
    "MBA": "MBA",
  };

  // Fetching Data for warden student base
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getRequest('/api/get_student_details');
        if (response.data && response.data.students) {
          const formattedData = response.data.students.map((student) => ({
            id: student._id,
            name: student.name,
            photo: student.profile_photo_path, // Ensure this is a valid URL
            admissionNumber: student.admin_number,
            registrationNumber: student.registration_number,
            year: yearToAlphabet[student.year] || `Year ${student.year}`, // Handles missing mapping
            department: student.department,
            roomNumber: student.room_number,
            studentMobile: student.phone_number_student,
            parentMobile: student.phone_number_parent,
            area: student.city,
            foodType: student.foodtype === "Veg" ? "Vegetarian" : "Non-Vegetarian",
            transitStatus: student.transit_status,
            vacateStatus: student.vacate_status,
            passInfo: student.pass_info || {}, // Ensure it's always an object
          }));
          setStudentData(formattedData);
        }
      } catch (err) {
        console.error("Error fetching data", err);
        Swal.fire({
          title: "Error ❌",
          text: "Failed to fetch student details. Please refresh the page.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    };
    fetchData();
  }, []);


  const handleVacateStatus = async (studentId) => {

    // Find the student by ID in studentsData
    const student = studentsData.find(s => s.id === studentId);

    if (!student) {
      console.error("Student not found for ID:", studentId);
      showSweetAlert("Error", "Student not found!", "error");
      return;
    }

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Mark as Vacate?",
      text: `Are you sure you want to mark ${student.name} as vacated?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Mark Vacate",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) {
      return; // User cancelled
    }

    // Show loading state
    Swal.fire({
      title: "Processing ⏳",
      text: "Marking student as vacated...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await postRequest(
        "/api/mark_student_vacate",
        { student_id: student.registrationNumber }
      );

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: response.data.message || "Student marked as vacated successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          setStudentData(studentsData.map(s => s.id === studentId ? { ...s, vacateStatus: true } : s));
        })
      }
    } catch (error) {
      console.error("Error Fetching Data:", error);
      Swal.fire({
        title: "Error ❌",
        text: error.response?.data?.message || "Failed to mark student as vacated. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };


  //getting year data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getRequest('/api/sidebar_warden');
        const fetchdata = response.data;
        setYearData(fetchdata?.["primary batch"] || fetchdata?.["primary year"]);
      }
      catch (err) {
        console.error("Failed to fetch", err);
        Swal.fire({
          title: "Error ❌",
          text: "Failed to fetch year data. Some filters may not work properly.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track desktop/mobile breakpoint (matches existing 768px breakpoint used in CSS)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 769px)');

    const handleBreakpointChange = (e) => {
      setIsDesktop(e.matches);
      // If switching into desktop view, make sure no card is left expanded
      // so the grid/card heights stay uniform on desktop.
      if (e.matches) {
        setExpandedCards(null);
      } else {
        // If switching into mobile view, close any open desktop modal.
        setModalStudentId(null);
      }
    };

    setIsDesktop(mql.matches);
    if (mql.matches) setExpandedCards(null);

    mql.addEventListener('change', handleBreakpointChange);
    return () => mql.removeEventListener('change', handleBreakpointChange);
  }, []);

  // Desktop modal: close on Escape + lock body scroll while open
  useEffect(() => {
    if (!isDesktop || !modalStudentId) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setModalStudentId(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktop, modalStudentId]);

  const toggleCard = (id) => {
    setExpandedCards(prev => (prev === id ? null : id));
  };

  // Desktop -> open centered modal. Mobile -> keep existing inline expand behavior.
  const handleViewMore = (id) => {
    if (isDesktop) {
      setModalStudentId(id);
    } else {
      toggleCard(id);
    }
  };

  const startEditing = (studentId) => {
    setEditingStates(prev => ({ ...prev, [studentId]: true }));
    setTempFoodTypes(prev => ({
      ...prev,
      [studentId]: studentsData.find(s => s.id === studentId)?.foodType
    }));
  };

  const cancelEditing = (studentId) => {
    setEditingStates(prev => ({ ...prev, [studentId]: false }));
    setTempFoodTypes(prev => ({ ...prev, [studentId]: null }));
  };

  const saveFoodType = async (studentId) => {
    const newFoodType = tempFoodTypes[studentId];
    if (!newFoodType) return;

    const student = studentsData?.find(s => s.id === studentId);
    if (!student) return;

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Change Food Type?",
      html: `Are you sure you want to change the food type for <strong>${student.name}</strong>?<br/><br/>
             <span style="color: ${student.foodType === 'Vegetarian' ? '#10b981' : '#ef4444'}">${student.foodType}</span> → 
             <span style="color: ${newFoodType === 'Vegetarian' ? '#10b981' : '#ef4444'}">${newFoodType}</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Change",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) {
      return; // User cancelled
    }

    // Show loading state
    Swal.fire({
      title: "Processing ⏳",
      text: "Updating food type...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await postRequest('/api/warden_change_foodtype',
        { registration_number: student.registrationNumber },
      );

      Swal.fire({
        title: "Success! ✅",
        text: "Food type updated successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        setStudentData(prev => prev?.map(student =>
          student.id === studentId
            ? { ...student, foodType: newFoodType }
            : student
        ));

        setEditingStates(prev => ({ ...prev, [studentId]: false }));
        setTempFoodTypes(prev => ({ ...prev, [studentId]: null }));
      });

    } catch (error) {
      console.error("Error updating food type:", error);
      Swal.fire({
        title: "Error ❌",
        text: error.response?.data?.message || "Failed to update food type. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const startRoomEditing = (studentId) => {
    setEditingRoomStates(prev => ({ ...prev, [studentId]: true }));
    setTempRoomNumbers(prev => ({
      ...prev,
      [studentId]: studentsData.find(s => s.id === studentId)?.roomNumber
    }));
  };

  const cancelRoomEditing = (studentId) => {
    setEditingRoomStates(prev => ({ ...prev, [studentId]: false }));
    setTempRoomNumbers(prev => ({ ...prev, [studentId]: null }));
  };

  const saveRoomNumber = async (studentId) => {
    const newRoomNumber = tempRoomNumbers[studentId];
    if (!newRoomNumber) {
      Swal.fire({
        title: "Invalid Input",
        text: "Please enter a valid room number.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    const student = studentsData?.find(s => s.id === studentId);
    if (!student) return;

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Change Room Number?",
      html: `Are you sure you want to change the room number for <strong>${student.name}</strong>?<br/><br/>
             <span style="font-weight: bold">${student.roomNumber}</span> → 
             <span style="font-weight: bold">${newRoomNumber}</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Change",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) {
      return; // User cancelled
    }

    // Show loading state
    Swal.fire({
      title: "Processing ⏳",
      text: "Updating room number...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await axios.post('/api/edit_student_room_number',
        {
          student_id: student.registrationNumber,
          new_room_number: newRoomNumber
        },
        { withCredentials: true }
      );

      Swal.fire({
        title: "Success! ✅",
        text: "Room number updated successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        setStudentData(prev => prev?.map(student =>
          student.id === studentId
            ? { ...student, roomNumber: newRoomNumber }
            : student
        ));

        setEditingRoomStates(prev => ({ ...prev, [studentId]: false }));
        setTempRoomNumbers(prev => ({ ...prev, [studentId]: null }));
      });
    } catch (error) {
      console.error("Error updating room number:", error);
      Swal.fire({
        title: "Error ❌",
        text: error.response?.data?.message || "Failed to update room number. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const handleRoomNumberChange = (studentId, newValue) => {
    setTempRoomNumbers(prev => ({ ...prev, [studentId]: newValue }));
  };


const handleFoodTypeChange = (studentId, newValue) => {
  setTempFoodTypes(prev => ({
    ...prev,
    [studentId]: newValue
  }));
};

const hasFoodTypeChanged = (studentId) => {
  const student = studentsData?.find(
    (s) => s.id === studentId
  );

  return (
    student &&
    tempFoodTypes[studentId] &&
    tempFoodTypes[studentId] !== student.foodType
  );
};




  const formatDateTime = (dateTime) => {
    if (!dateTime) return { date: "N/A", time: "N/A" }; // Handle missing values

    const dateObj = new Date(dateTime);
    return {
      date: dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), // Example: "21 February 2025"
      time: dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) // Example: "09:00 AM"
    };
  };



  const filteredStudents = studentsData?.filter(student => {
    // Convert search term to lowercase for case-insensitive search
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch =
      student.name.toLowerCase().includes(searchTermLower) ||
      student.admissionNumber.toLowerCase().includes(searchTermLower) ||
      student.area.toLowerCase().includes(searchTermLower) ||
      student.roomNumber.toString().includes(searchTermLower) ||
      student.studentMobile.toString().includes(searchTermLower) ||
      departmentLabels[student.department]?.toLowerCase().includes(searchTermLower);

    const matchesYear =
      filters.year === "All" || student.year === yearToAlphabet[filters.year];

    const matchesDepartment =
      filters.department === "All" || student.department === filters.department;

    const matchesFoodType =
      filters.foodType === "All" || student.foodType === filters.foodType;

    const matchesTransitStatus =
      filters.transitStatus === "All" ||
      (filters.transitStatus === "true" && student.transitStatus) ||
      (filters.transitStatus === "false" && !student.transitStatus);

    const matchesPassType =
      filters.passType === 'All' ||
      (filters.passType === 'staypass' && student.passInfo.passtype === 'staypass') ||
      (filters.passType === 'outpass' && student.passInfo.passtype === 'outpass') ||
      (filters.passType === 'od' && student.passInfo.passtype === 'od') ||
      (filters.passType === 'leave' && student.passInfo.passtype === 'leave');

    return matchesSearch && matchesYear && matchesDepartment && matchesFoodType && matchesTransitStatus && matchesPassType;
  });

  return (
    <div className="details-container">
      {/* Main Content */}
      <div className="details-main">
        {/* Header with Search and Filter */}
        <div className="details-header">
          <div className="details-search">
            <Search className="details-search-icon" />
            <input
              type="text"
              placeholder="Search students by anything"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="details-search-input"
            />
          </div>
          <div className="buttons">

            <button className='filter-button download'>
              <Download size={18} />
              <DownloadPdf studentData={filteredStudents} />
            </button>

            <div className="details-filter" ref={filterRef}>
              <button
                className="filter-button"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
                Filters
              </button>

              {showFilters && (
                <div className="filter-popup">
                  <div className="filter-section">
                    <label className="filter-label">Year</label>
                    <select
                      className="filter-select"
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    >
                      <option value="All">All Years</option>
                      {yearData?.map((year) => (
                        <option key={year} value={year}>
                          {yearToAlphabet[year]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-section">
                    <label className="filter-label">Department</label>
                    <select
                      className="filter-select"
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                      <option value="All">All Departments</option>
                      <option value="AI&DS">AI</option>
                      <option value="AUTO">Automobile</option>
                      <option value="CIVIL">Civil</option>
                      <option value="CSE">Computer Science</option>
                      <option value="CYBER">Cyber</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="EIE">EIE</option>
                      <option value="IT">IT</option>
                      <option value="MECH">Mechanical</option>
                      <option value="MBA">MBA</option>
                    </select>
                  </div>

                  <div className="filter-section">
                    <label className="filter-label">Food Type</label>
                    <select
                      className="filter-select"
                      value={filters.foodType}
                      onChange={(e) => setFilters({ ...filters, foodType: e.target.value })}
                    >
                      <option value="All">All Types</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                    </select>
                  </div>
                  {/* Transit Status Filter */}
                  <div className="filter-section">
                    <label className="filter-label">Transit Status</label>
                    <select
                      className="filter-select"
                      value={filters.transitStatus}
                      onChange={(e) => setFilters({ ...filters, transitStatus: e.target.value })}
                    >
                      <option value="All">All Students</option>
                      <option value="true">In Transit</option>
                      <option value="false">In Hostel</option>
                    </select>
                  </div>
                  <div className="filter-section">
                    <label className="filter-label">Pass Type</label>
                    <select
                      className="filter-select"
                      value={filters.passType}
                      onChange={(e) => setFilters({ ...filters, passType: e.target.value })}
                    >
                      <option value="All">All Students</option>
                      <option value="staypass">Stay Pass</option>
                      <option value="outpass">Out Pass</option>
                      <option value="od">OD</option>
                      <option value="leave">Leave</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="details-grid-hos">
          {filteredStudents?.map(student => (
            <div key={student.id} className="details-card">
              <div className="logo">
                <div className="tooltip-container">
                  {student.transitStatus ? (
                    <Footprints size={18} className="transit-icon" />
                  ) : (
                    <Home size={18} className="home-icon" />
                  )}

                  <span className="tooltip">
                    {student.transitStatus ? "In Transit" : "In Hostel"}
                  </span>
                </div>
              </div>
              <div className="details-basic-info">
                <img
                  src={student.photo ? UrlParser(student.photo) : getAvatarUrl(student.name)}
                  alt={student.name}
                  className="details-student-photo"
                  onError={handlePhotoError(student.name)}
                />
                <div className="details-primary-info">
                  <h3 className="details-name">{student.name}</h3>
                  <p className="details-admission">Admission No: {student.admissionNumber}</p>
                  <p className="details-year">{student.year}</p>
                  <p className="details-department">{departmentLabels[student.department]}</p>
                </div>
              </div>

              <div className={`details-extended-info ${expandedCards === student.id ? 'details-expanded' : ''
                }`}>
                <div className="details-info-grid">
                  <div className="details-info-item">
                    <span className="details-label">Room Number:</span>
                    {editingRoomStates[student.id] ? (
                      <div className="details-food-edit">
                        <input
                          type="text"
                          value={tempRoomNumbers[student.id] || student.roomNumber}
                          onChange={(e) => handleRoomNumberChange(student.id, e.target.value)}
                          className="details-room-input"
                        />
                        <button
                          className="details-food-button save"
                          onClick={() => saveRoomNumber(student.id)}
                        >
                          ✔
                        </button>
                        <button
                          className="details-food-button cancel"
                          onClick={() => cancelRoomEditing(student.id)}
                        >
                          ✘
                        </button>
                      </div>
                    ) : (
                      <div className="details-food-display">
                        <span>{student.roomNumber}</span>
                        <button
                          className="details-food-edit-button"
                          onClick={() => startRoomEditing(student.id)}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="details-info-item">
                    <span className="details-label">Transit Status:</span>
                    {student.transitStatus ? <span>In Transit</span> : <span>In Hostel</span>}
                  </div>

                  {/* Display pass details only if passInfo exists and has non-null values */}
                  {student.passInfo && (student.passInfo.passtype || student.passInfo.from || student.passInfo.to) && (
                    <>
                      <div className="details-info-item">
                        <span className="details-label">Pass Type:</span>
                        <span>{student.passInfo.passtype || "N/A"}</span>
                      </div>
                      <div className="details-info-item">
                        <span className="details-label">From:</span>
                        <span className='text-xs'>{formatDateTime(student.passInfo?.from).date} at {formatDateTime(student.passInfo?.from).time}</span>
                      </div>
                      <div className="details-info-item">
                        <span className="details-label">To:</span>
                        <span className='text-xs'>{formatDateTime(student.passInfo?.to).date} at {formatDateTime(student.passInfo?.to).time}</span>
                      </div>
                    </>
                  )}

                  <div className="details-info-item">
                    <span className="details-label">Student Mobile:</span>
                    <span><a href={`tel:'${student.studentMobile}`} className='no-underline text-black'>{student.studentMobile}</a></span>
                  </div>
                  <div className="details-info-item">
                    <span className="details-label">Parent Mobile:</span>
                    <span><a href={`tel:${student.parentMobile}`} className='no-underline text-black'>{student.parentMobile}</a></span>
                  </div>
                  <div className="details-info-item">
                    <span className="details-label">Area:</span>
                    <span>{student.area}</span>
                  </div>
                <div className="details-info-item">
  <span className="details-label">Food Type:</span>

  {editingStates[student.id] ? (
    <div className="details-food-edit">

      {/* Dropdown */}
      <select
        value={tempFoodTypes[student.id] || student.foodType}
        onChange={(e) =>
          handleFoodTypeChange(student.id, e.target.value)
        }
        className="details-food-select"
      >
        <option value="Vegetarian">Vegetarian</option>
        <option value="Non-Vegetarian">Non-Vegetarian</option>
      </select>

      {/* Show buttons ONLY after changing dropdown */}
      {hasFoodTypeChanged(student.id) && (
        <>
          <button
            className="details-food-button save"
            onClick={() => saveFoodType(student.id)}
          >
            ✔
          </button>

          <button
            className="details-food-button cancel"
            onClick={() => cancelEditing(student.id)}
          >
            ✘
          </button>
        </>
      )}

    </div>
  ) : (
    <div className="details-food-display">
      <span>{student.foodType}</span>

      <button
        className="details-food-edit-button"
        onClick={() => startEditing(student.id)}
      >
        Edit
      </button>
    </div>
  )}
</div>
                  {!student.vacateStatus && (
                    <div className="details-vaccate-display">
                      <button
                        className="details-vaccate-button"
                        onClick={() => handleVacateStatus(student.id)}
                      >
                        Mark Vaccate
                      </button>
                      {/* <span>Vacate </span> */}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="details-view-more"
                onClick={() => handleViewMore(student.id)}
              >
                {!isDesktop && expandedCards == student.id ? 'View Less' : 'View More'}
              </button>
            </div>
          ))}
        </div>

        {/* Desktop-only centered "View More" modal. Reuses existing student data & handlers. */}
        {isDesktop && modalStudentId && (() => {
          const modalStudent = studentsData?.find(s => s.id === modalStudentId);
          if (!modalStudent) return null;

          const departmentDisplay = departmentLabels[modalStudent.department] || modalStudent.department || 'N/A';
          const hasPassInfo = modalStudent.passInfo && (modalStudent.passInfo.passtype || modalStudent.passInfo.from || modalStudent.passInfo.to);

          return (
            <div
              className="modal-backdrop"
              onClick={() => setModalStudentId(null)}
            >
              <div
                className="student-modal"
                onClick={(e) => e.stopPropagation()}
              >
               

                <div className="modal-header-new">
                  <img
                    src={modalStudent.photo ? UrlParser(modalStudent.photo) : getAvatarUrl(modalStudent.name)}
                    alt={modalStudent.name}
                    className="modal-student-photo"
                    onError={handlePhotoError(modalStudent.name)}
                  />
                  <div className="modal-header-text">
                    <h2 className="modal-student-name">{modalStudent.name}</h2>
                    <p className="modal-subtitle">
                      {modalStudent.year || 'N/A'} • {departmentDisplay}
                    </p>
                    <p className="modal-admission">Admission No. {modalStudent.admissionNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="modal-divider" />

                <div className="modal-body">
                  {/* Hostel */}
                  <div className="modal-section-plain">
                    <h3 className="modal-section-label">Hostel</h3>
                    <div className="modal-columns">
                      <div className="modal-col">
                        <span className="modal-col-label">Room</span>
                        {editingRoomStates[modalStudent.id] ? (
                          <div className="details-food-edit">
                            <input
                              type="text"
                              value={tempRoomNumbers[modalStudent.id] || modalStudent.roomNumber}
                              onChange={(e) => handleRoomNumberChange(modalStudent.id, e.target.value)}
                              className="details-room-input"
                            />
                            <button
                              className="details-food-button save"
                              onClick={() => saveRoomNumber(modalStudent.id)}
                            >
                              ✔
                            </button>
                            <button
                              className="details-food-button cancel"
                              onClick={() => cancelRoomEditing(modalStudent.id)}
                            >
                              ✘
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="modal-col-value">{modalStudent.roomNumber || 'N/A'}</span>
                            <button
                              className="details-food-edit-button"
                              onClick={() => startRoomEditing(modalStudent.id)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>

                      <div className="modal-col">
                        <span className="modal-col-label">Food</span>
                    {editingStates[modalStudent.id] ? (
  <div className="details-food-edit">

    <select
      value={tempFoodTypes[modalStudent.id] || modalStudent.foodType}
      onChange={(e) =>
        handleFoodTypeChange(modalStudent.id, e.target.value)
      }
      className="details-food-select"
    >
      <option value="Vegetarian">Vegetarian</option>
      <option value="Non-Vegetarian">Non-Vegetarian</option>
    </select>

    {hasFoodTypeChanged(modalStudent.id) && (
      <>
        <button
          className="details-food-button save"
          onClick={() => saveFoodType(modalStudent.id)}
        >
          ✔
        </button>

        <button
          className="details-food-button cancel"
          onClick={() => cancelEditing(modalStudent.id)}
        >
          ✘
        </button>
      </>
    )}

  </div>
) : (
  <>
    <span className="modal-col-value">
      {modalStudent.foodType || 'N/A'}
    </span>

    <button
      className="details-food-edit-button"
      onClick={() => startEditing(modalStudent.id)}
    >
      Edit
    </button>
  </>
)}
                      </div>

                      <div className="modal-col">
                        <span className="modal-col-label">Status</span>
                        <span className="modal-col-value modal-status-value">
                          <span className={`modal-status-dot ${modalStudent.transitStatus ? 'in-transit' : 'in-hostel'}`} />
                          {modalStudent.transitStatus ? 'In Transit' : 'In Hostel'}
                        </span>
                      </div>
                    </div>

                    {hasPassInfo && (
                      <p className="modal-pass-row">
                        Pass: {modalStudent.passInfo.passtype || 'N/A'} — {formatDateTime(modalStudent.passInfo?.from).date} at {formatDateTime(modalStudent.passInfo?.from).time}
                        {' '}&rarr;{' '}
                        {formatDateTime(modalStudent.passInfo?.to).date} at {formatDateTime(modalStudent.passInfo?.to).time}
                      </p>
                    )}
                  </div>

                  <div className="modal-divider" />

                  {/* Contact */}
                  <div className="modal-section-plain">
                    <h3 className="modal-section-label">Contact</h3>
                    <div className="modal-columns">
                      <div className="modal-col">
                        <span className="modal-col-label">Student</span>
                        <span className="modal-col-value">
                          {modalStudent.studentMobile ? (
                            <a href={`tel:${modalStudent.studentMobile}`} className='no-underline text-black'>
                              {modalStudent.studentMobile}
                            </a>
                          ) : 'N/A'}
                        </span>
                      </div>
                      <div className="modal-col">
                        <span className="modal-col-label">Parent</span>
                        <span className="modal-col-value">
                          {modalStudent.parentMobile ? (
                            <a href={`tel:${modalStudent.parentMobile}`} className='no-underline text-black'>
                              {modalStudent.parentMobile}
                            </a>
                          ) : 'N/A'}
                        </span>
                      </div>
                      <div className="modal-col">
                        <span className="modal-col-label">Area</span>
                        <span className="modal-col-value">{modalStudent.area || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    {!modalStudent.vacateStatus && (
                      <button
                        className="details-vaccate-button modal-vacate-btn"
                        onClick={() => handleVacateStatus(modalStudent.id)}
                      >
                        Mark Vaccate
                      </button>
                    )}
                    <button
                      className="modal-close-bottom"
                      onClick={() => setModalStudentId(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default Hostelstudents;
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  Users,
  ClipboardCheck,
  UserX,
  AlertTriangle,
  Utensils,
  X,
  Carrot,
  Ham
} from "lucide-react";
import './SuperiorAttendance.css';
import axiosInstance from '../../../api/axios';
import Swal from 'sweetalert2';



function AttendanceDashboard() {
  const [showIframe, setShowIframe] = useState(false);
  const [selectedYear, setSelectedYear] = useState('overall');
  const [selectedGender, setSelectedGender] = useState('overall');
  const [animatedCount, setAnimatedCount] = useState(0);
  const [animatedVeg, setAnimatedVeg] = useState(0);
  const [animatedNonVeg, setAnimatedNonVeg] = useState(0);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [maledata, setMaleData] = useState(null);
  const [femaledata, setFemaledata] = useState(null);
  const [count, setCount] = useState({ veg_count: 0, non_veg_count: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const yearToAlphabet = {
    '1': 'First Year',
    '2': 'Second Year',
    '3': 'Third Year',
    '4': 'Fourth Year',
    '10': 'MBA',
    '9': 'ME',
    'overall': 'Overall'
  };

  const vegCount = count.veg_count || 0;
  const nonVegCount = count.non_veg_count || 0;
  const totalStudents = vegCount + nonVegCount;
  // Donut chart geometry
  const RADIUS = 80;
  const STROKE_WIDTH = 26;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const GAP_DEG = totalStudents > 0 && vegCount > 0 && nonVegCount > 0 ? 6 : 0;
  const usableDeg = 360 - GAP_DEG * 2;

  const animatedFoodTotal = animatedVeg + animatedNonVeg;
  const vegRingPct = animatedFoodTotal > 0 ? (animatedVeg / animatedFoodTotal) * 100 : 0;
  const nonVegRingPct = animatedFoodTotal > 0 ? 100 - vegRingPct : 0;

  const vegArcLen = (vegRingPct / 100) * usableDeg / 360 * CIRCUMFERENCE;
  const nonVegArcLen = (nonVegRingPct / 100) * usableDeg / 360 * CIRCUMFERENCE;
  const gapArcLen = (GAP_DEG / 360) * CIRCUMFERENCE;
  useEffect(() => {
    if (showAbsentModal || showMismatchModal || showIframe) {
      document.body.style.overflow = "hidden"; // Disable scrolling when any modal is open
    } else {
      document.body.style.overflow = "auto"; // Restore scrolling when all modals are closed
    }

    return () => {
      document.body.style.overflow = "auto"; // Ensure scrolling restores on unmount
    };
  }, [showAbsentModal, showMismatchModal, showIframe]); // Runs when modal state changes


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/api/food_count_warden')

        const fetchedData = response.data.foodCounts;

        if (!fetchedData || (!fetchedData.Male && !fetchedData.Female)) {
          Swal.fire({
            title: "No Data",
            text: "📋 No food count data available.",
            icon: "info",
            showConfirmButton: true
          });
        }

        setMaleData(fetchedData.Male);
        setFemaledata(fetchedData.Female);

      } catch (error) {
        console.error("error fetched food count data", error);
        Swal.fire({
          title: "Error!",
          text: "❌ Failed to fetch food count data. Please refresh the page.",
          icon: "error",
          showConfirmButton: true
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleYearChange = (e) => {
    const newYear = e.target.value;

    setSelectedYear(newYear);

    // IMPORTANT:
    // Use newYear directly instead of waiting for React state update
    const data = getCurrentData(newYear, selectedGender);

    setCount(data);

    if (data.veg_count === 0 && data.non_veg_count === 0) {
      Swal.fire({
        title: "No Data",
        text: "📋 No food count data available for the selected filters.",
        icon: "info",
        showConfirmButton: true,
        timer: 3000
      });
    }
  };

  const handleGenderChange = (e) => {
    const newGender = e.target.value;

    setSelectedGender(newGender);

    // IMPORTANT:
    // Use newGender directly
    const data = getCurrentData(selectedYear, newGender);

    setCount(data);

    if (data.veg_count === 0 && data.non_veg_count === 0) {
      Swal.fire({
        title: "No Data",
        text: "📋 No food count data available for the selected filters.",
        icon: "info",
        showConfirmButton: true,
        timer: 3000
      });
    }
  };


  const getCurrentData = (
    year = selectedYear,
    gender = selectedGender
  ) => {
    const genderKey =
      gender === 'boys'
        ? 'Male'
        : gender === 'girls'
          ? 'Female'
          : null;

    const yearKey =
      year === 'first' ? '1' :
        year === 'second' ? '2' :
          year === 'third' ? '3' :
            year === 'fourth' ? '4' :
              year === 'me1' ? '8' :
                year === 'me2' ? '7' :
                  year === 'mba1' ? '10' :
                    year === 'mba2' ? '9' :
                      'Overall';

    if (gender === 'overall') {
      const maleData =
        maledata?.[yearKey] || {
          veg_count: 0,
          non_veg_count: 0
        };

      const femaleData =
        femaledata?.[yearKey] || {
          veg_count: 0,
          non_veg_count: 0
        };

      return {
        veg_count: maleData.veg_count + femaleData.veg_count,
        non_veg_count:
          maleData.non_veg_count + femaleData.non_veg_count
      };
    }

    const genderData =
      genderKey === 'Male' ? maledata : femaledata;

    return (
      genderData?.[yearKey] || {
        veg_count: 0,
        non_veg_count: 0
      }
    );
  };
  useEffect(() => {
    if (!maledata && !femaledata) return;

    const data = getCurrentData(
      selectedYear,
      selectedGender
    );

    setCount(data);
  }, [
    selectedYear,
    selectedGender,
    maledata,
    femaledata
  ]);

  const closeAbsentModal = () => {
    setShowAbsentModal(false);
    setTimeout(() => {
      document.body.style.overflow = "auto";
    }, 100);
  };

  const closeMismatchModal = () => {
    setShowMismatchModal(false);
    setTimeout(() => {
      document.body.style.overflow = "auto";
    }, 100);
  };

  const closeIframeModal = () => {
    setShowIframe(false);
    setTimeout(() => {
      document.body.style.overflow = "auto";
    }, 100);
  };

  const currentData = getCurrentData();
  console.log("Current Data ", currentData);


  useEffect(() => {
    const targetCount = currentData.veg_count + currentData.non_veg_count;
    const targetVeg = currentData.veg_count;
    console.log(targetVeg);
    const targetNonVeg = currentData.non_veg_count;
    let current = 0;
    let vegCurrent = 0;
    let nonVegCurrent = 0;

    const animationDuration = 1000;
    const steps = 60;
    const interval = animationDuration / steps;

    const countIncrement = targetCount / steps;
    const vegIncrement = targetVeg / steps;
    const nonVegIncrement = targetNonVeg / steps;

    const timer = setInterval(() => {
      current += countIncrement;
      vegCurrent += vegIncrement;
      nonVegCurrent += nonVegIncrement;

      if (current >= targetCount) {
        setAnimatedCount(targetCount);
        setAnimatedVeg(targetVeg);
        setAnimatedNonVeg(targetNonVeg);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.round(current));
        setAnimatedVeg(Math.round(vegCurrent));
        setAnimatedNonVeg(Math.round(nonVegCurrent));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [selectedYear, selectedGender, maledata, femaledata]);

  const getFilteredList = (list) => {
    if (selectedGender === 'overall') return list;
    return list.filter(item =>
      (selectedGender === 'boys' && item.gender === 'male') ||
      (selectedGender === 'girls' && item.gender === 'female')
    );
  };

  return (
    <div className="attendance-container">
      {isLoading ? (
        <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ fontSize: '20px' }}>⏳ Loading food count data...</p>
        </div>
      ) : (
        <div className="attendance-main">
          <div className="attendance-filters">
            <div className="attendance-filter-group">
              <label className="attendance-filter-label">Year</label>
              <select
                className="attendance-filter-select"
                value={selectedYear}
                onChange={handleYearChange}
              >
                <option value="overall">Overall</option>
                <option value="first">First Year</option>
                <option value="second">Second Year</option>
                <option value="third">Third Year</option>
                <option value="fourth">Fourth Year</option>
                <option value="me1">ME First Year</option>
                <option value="me2">ME Second Year</option>
                <option value="mba1">MBA First Year</option>
                <option value="mba2">MBA Second Year</option>
              </select>
            </div>

            <div className="attendance-filter-group">
              <label className="attendance-filter-label">Gender</label>
              <select
                className="attendance-filter-select"
                value={selectedGender}
                onChange={handleGenderChange}
              >
                <option value="overall">Overall</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
          </div>

          {/* <div className="attendance-overview">
          <div className="attendance-chart">
            <div className="attendance-chart-container">
              <svg viewBox="0 0 200 100" className="attendance-donut">
                <path
                  d="M20 90 A 60 60 0 0 1 180 90"
                  className="attendance-donut-bg"
                />
                <path
                  d="M20 90 A 60 60 0 0 1 180 90"
                  className="attendance-donut-fill"
                  style={{
                    stroke: "#fdcc03",
                    strokeDasharray: `${(animatedCount / currentData.totalStudents) * 251.2} 251.2`
                  }}
                />
                <text x="100" y="50" className="attendance-donut-number">
                  {currentData.presentStudents}
                </text>
                <text x="100" y="70" className="attendance-donut-label">
                  Present
                </text>
                <text x="100" y="85" className="attendance-donut-total">
                  out of {currentData.totalStudents} students
                </text>
              </svg>
            </div>
          </div>

          <div className="attendance-status-cards">
            <div className="attendance-card attendance-present">
              <Users className="attendance-card-icon" />
              <div className="attendance-card-content">
                <h3>Present</h3>
                <p className="attendance-card-number">{currentData.presentStudents}</p>
                <p className="attendance-card-percentage">
                  {((currentData.presentStudents / currentData.totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div 
              className="attendance-card attendance-absent"
              onClick={() => setShowAbsentModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <UserX className="attendance-card-icon" />
              <div className="attendance-card-content">
                <h3>Absent</h3>
                <p className="attendance-card-number">{currentData.absentStudents}</p>
                <p className="attendance-card-percentage">
                  {((currentData.absentStudents / currentData.totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div 
              className="attendance-card attendance-mismatched"
              onClick={() => setShowMismatchModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <AlertTriangle className="attendance-card-icon" />
              <div className="attendance-card-content">
                <h3>Mismatched</h3>
                <p className="attendance-card-number">{currentData.mismatchedStudents}</p>
                <p className="attendance-card-percentage">
                  {((currentData.mismatchedStudents / currentData.totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div> */}

          <div className="attendance-food-section">
            <div className="attendance-food-counts">
              <div className="attendance-food-type">
                <Carrot className="attendance-food-icon attendance-veg" />
                <div className="attendance-food-details">
                  <h3>Vegetarian</h3>
                  <p className="attendance-food-number">{animatedVeg}</p>
                  <p className="attendance-food-percentage">
                    {(currentData.veg_count + currentData.non_veg_count) > 0
                      ? ((currentData.veg_count / (currentData.veg_count + currentData.non_veg_count)) * 100).toFixed(1)
                      : '0.0'}%
                  </p>
                </div>
              </div>
              <div className="attendance-food-type">
                <Ham className="attendance-food-icon attendance-non-veg" />
                <div className="attendance-food-details">
                  <h3>Non-Vegetarian</h3>
                  <p className="attendance-food-number">{animatedNonVeg}</p>
                  <p className="attendance-food-percentage">
                    {(currentData.veg_count + currentData.non_veg_count) > 0
                      ? ((currentData.non_veg_count / (currentData.veg_count + currentData.non_veg_count)) * 100).toFixed(1)
                      : '0.0'}%
                  </p>
                </div>
              </div>
            </div>

            <div className="attendance-pie-chart">
              <div className="attendance-donut-wrap">
                <svg viewBox="0 0 200 200" className="attendance-donut-svg">
                  <defs>
                    <linearGradient id="vegGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="nonVegGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <filter id="donutShadow" x="-40%" y="-40%" width="180%" height="180%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
                    </filter>
                  </defs>

                  <circle
                    cx="100"
                    cy="100"
                    r={RADIUS}
                    className="attendance-donut-track"
                    strokeWidth={STROKE_WIDTH}
                  />

                  {totalStudents > 0 && (
                    <>
                      <circle
                        cx="100"
                        cy="100"
                        r={RADIUS}
                        fill="none"
                        stroke="url(#vegGradient)"
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeDasharray={`${vegArcLen} ${CIRCUMFERENCE - vegArcLen}`}
                        strokeDashoffset="0"
                        transform="rotate(-90 100 100)"
                        filter="url(#donutShadow)"
                        className="attendance-donut-segment"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r={RADIUS}
                        fill="none"
                        stroke="url(#nonVegGradient)"
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeDasharray={`${nonVegArcLen} ${CIRCUMFERENCE - nonVegArcLen}`}
                        strokeDashoffset={-(vegArcLen + gapArcLen)}
                        transform="rotate(-90 100 100)"
                        filter="url(#donutShadow)"
                        className="attendance-donut-segment"
                      />
                    </>
                  )}

                  <text x="100" y="94" textAnchor="middle" className="attendance-donut-center-number">
                    {totalStudents}
                  </text>
                  <text x="100" y="116" textAnchor="middle" className="attendance-donut-center-label">
                    Total Students
                  </text>
                </svg>
              </div>
               <div className="attendance-pie-legend">
              <div className="attendance-legend-item">
                <span className="attendance-legend-color attendance-veg"></span>
                <span className="attendance-legend-text">Vegetarian</span>
                <span className="attendance-legend-pct">
                  {totalStudents > 0 ? ((vegCount / totalStudents) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="attendance-legend-item">
                <span className="attendance-legend-color attendance-non-veg"></span>
                <span className="attendance-legend-text">Non-Vegetarian</span>
                <span className="attendance-legend-pct">
                  {totalStudents > 0 ? ((nonVegCount / totalStudents) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
            </div>
          </div>

          {/* <button 
          className="attendance-consolidation-button"
          onClick={() => setShowIframe(true)}
        >
          View Attendance Consolidation
        </button> */}

          {/* {showIframe && (
          <div className="attendance-modal-overlay" onClick={() => setShowIframe(false)}>
            <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
              <div className="attendance-modal-header">
                <h2>Attendance Consolidation</h2>
                <button className="attendance-modal-close" onClick={closeIframeModal}>
                  <X />
                </button>
              </div>
              <div className="attendance-modal-content">
                <iframe
                  src="https://drive.google.com/file/d/11BOmR-0biNhpCG2dipZsLH_s1vdk6Gb0"
                  className="attendance-iframe"
                ></iframe>
              </div>
            </div>
          </div>
        )} */}

          {/* {showAbsentModal && (
          <div 
            className="attendance-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAbsentModal(false);
              }
            }}
          >
            <div className="attendance-modal">
              <div className="attendance-modal-header">
                <h2>Absent Students</h2>
                <button 
                  className="attendance-modal-close"
                  onClick={closeAbsentModal}
                >
                  <X />
                </button>
              </div>
              <div className="attendance-modal-content">
                {getFilteredList(yearData[selectedYear].absentList).map((student, index) => (
                  <div key={index} className="attendance-modal-item">
                    <span className="attendance-modal-name">{student.name}</span>
                    <span className="attendance-modal-room">{student.roomNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} */}

          {/* {showMismatchModal && (
          <div 
            className="attendance-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowMismatchModal(false);
              }
            }}
          >
            <div className="attendance-modal">
              <div className="attendance-modal-header">
                <h2>Mismatched Students</h2>
                <button 
                  className="attendance-modal-close"
                  onClick={closeMismatchModal}
                >
                  <X />
                </button>
              </div>
              <div className="attendance-modal-content">
                {getFilteredList(yearData[selectedYear].mismatchedList).map((student, index) => (
                  <div key={index} className="attendance-modal-item">
                    <div className="attendance-modal-student-info">
                      <span className="attendance-modal-name">{student.name}</span>
                      <span className="attendance-modal-room">{student.roomNumber}</span>
                    </div>
                    <span className="attendance-modal-issue">{student.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} */}
        </div>)}    </div>
  );
}

export default AttendanceDashboard;
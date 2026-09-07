import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  Users,
  ClipboardCheck,
  UserX,
  AlertTriangle,
  Leaf,
  Drumstick,
  X
} from 'lucide-react';
import './AttendanceDashboard.css';
import Swal from 'sweetalert2';
import { getRequest } from '../../../api/axios';

function AttendanceDashboard() {
  const [showIframe, setShowIframe] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [animatedVeg, setAnimatedVeg] = useState(0);
  const [animatedNonVeg, setAnimatedNonVeg] = useState(0);
  const [foodCount, setFoodCount] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  const yearToAlphabet = {
    '1': 'First Year',
    '2': 'Second Year',
    '3': 'Third Year',
    '4': 'Fourth Year',
    '10': 'MBA',
    '9': 'ME',
    'overall': 'Overall'
  };

  const vegCount = foodCount?.[selectedYear]?.veg_count || 0;
  const nonVegCount = foodCount?.[selectedYear]?.non_veg_count || 0;
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
    // Reset animations when year changes
    setAnimatedVeg(0);
    setAnimatedNonVeg(0);

    // Animate food counts
    const foodDuration = 1000;
    const foodSteps = 40;
    const vegIncrement = vegCount / foodSteps;
    const nonVegIncrement = nonVegCount / foodSteps;
    let vegCurrent = 0;
    let nonVegCurrent = 0;

    const foodInterval = setInterval(() => {
      if (vegCurrent < vegCount || nonVegCurrent < nonVegCount) {
        vegCurrent = Math.min(vegCurrent + vegIncrement, vegCount);
        nonVegCurrent = Math.min(nonVegCurrent + nonVegIncrement, nonVegCount);
        setAnimatedVeg(Math.round(vegCurrent));
        setAnimatedNonVeg(Math.round(nonVegCurrent));
      } else {
        clearInterval(foodInterval);
      }
    }, foodDuration / foodSteps);

    return () => {
      clearInterval(foodInterval);
    };
  }, [selectedYear, vegCount, nonVegCount]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getRequest('/api/food_count_warden');
        const fetchedData = response.data;

        // Extract years dynamically from API response (e.g. ["3", "4"])
        const years = Object.keys(fetchedData.foodCounts);
        setAvailableYears(years);

        // Auto-select the first available year if data exists
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }

        setFoodCount(fetchedData.foodCounts);
      } catch (err) {
        console.error("Failed to fetch data", err);
        Swal.fire({
          title: "Error ❌",
          text: "Failed to fetch food count data. Please refresh the page.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    };
    fetchData();
  }, []);

  // Show alert if no data available for selected year
  useEffect(() => {
    if (selectedYear && foodCount && totalStudents === 0) {
      Swal.fire({
        title: "No Data 📋",
        text: `No food count data available for ${yearToAlphabet[selectedYear] || `Year ${selectedYear}`}.`,
        icon: "info",
        confirmButtonText: "OK"
      });
    }
  }, [selectedYear, totalStudents, foodCount]);

  return (
    <div className="attendance-container">
      <div className="attendance-main">
        
        {/* Dynamic Year Dropdown UI */}
        <div className="attendance-year-selector" style={{ marginBottom: '20px' }}>
          <label htmlFor="yearDropdown" style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Select Year: 
          </label>
          <select 
            id="yearDropdown"
            className="attendance-year-dropdown"
            value={selectedYear || ''} 
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
          >
            {availableYears.map((yearKey) => (
              <option key={yearKey} value={yearKey}>
                {yearToAlphabet[yearKey] || `Year ${yearKey}`}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-food-section">
          <div className="attendance-food-counts">
            <div className="attendance-food-type">
              <Leaf className="attendance-food-icon attendance-veg" />
              <div className="attendance-food-details">
                <h3>Vegetarian</h3>
                <p className="attendance-food-number">{animatedVeg}</p>
                <p className="attendance-food-percentage">
                  {totalStudents > 0 ? ((vegCount / totalStudents) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            <div className="attendance-food-type">
              <Drumstick className="attendance-food-icon attendance-non-veg" />
              <div className="attendance-food-details">
                <h3>Non-Vegetarian</h3>
                <p className="attendance-food-number">{animatedNonVeg}</p>
                <p className="attendance-food-percentage">
                  {totalStudents > 0 ? ((nonVegCount / totalStudents) * 100).toFixed(1) : 0}%
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
      </div>
    </div>
  );
}

export default AttendanceDashboard;
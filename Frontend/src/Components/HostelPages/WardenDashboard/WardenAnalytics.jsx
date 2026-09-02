import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import "./WardenAnalytics.css";
import axios from "axios";
import Swal from "sweetalert2";

// Custom palette corresponding to your login brand colors:
// Terracotta, Rust, Tangerine, Muted Amber
const BRAND_COLORS = ["#a73d1a", "#ea580c", "#7c2d12", "#f97316"];

const DashboardCard = ({ title, number, tag, isInteractive, isDanger, onClick }) => {
  return (
    <div
      className={`hl-metric-card ${isInteractive ? "interactive" : ""} ${isDanger ? "danger" : ""}`}
      onClick={onClick}
    >
      <div className="hl-card-header">
        <span className="hl-card-label">{title}</span>
        {tag && <span className="hl-card-tag">{tag}</span>}
      </div>
      <p className="hl-metric-number">{number ?? 0}</p>
      {isInteractive ? (
        <div className="hl-card-footer">
          <span>Click to view entries</span>
          <span>→</span>
        </div>
      ) : (
        <div className="hl-card-footer passive">
          <span>Daily total</span>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showNames, setShowNames] = useState(false);
  const [highlightedData, setHighlightedData] = useState(null);
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [chartPopupData, setChartPopupData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedYear, setSelectedYear] = useState("overall");
  const [fetchData, setFetchData] = useState(null);
  const [years, setYears] = useState(null);
  const [showNameList, setShowNameList] = useState(false);
  const [nameListData, setNameListData] = useState([]);
  const [fetchedPassAnalysis, setFetchedPassAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const yearToAlphabet = {
    "1": "First Year",
    "2": "Second Year",
    "3": "Third Year",
    "4": "Fourth Year",
    "10": "MBA First Year",
    "9": "MBA Second Year",
    "8": "ME First Year",
    "7": "ME Second Year",
    overall: "Overall"
  };

  const passTypeParse = {
    od: "OD Pass",
    outpass: "Out Pass",
    staypass: "Stay Pass",
    leave: "Leave"
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Synchronized with login branding for alert dialogs
  const fireSwal = (config) => {
    return Swal.fire({
      background: "#fefbf4",
      color: "#7c2d12",
      confirmButtonColor: "#a73d1a",
      ...config
    });
  };

  useEffect(() => {
    const fetchMeasures = async () => {
      try {
        const response = await axios.get("/api/pass_measures_warden");
        const fetched = response.data;
        const yearKeys = Object.keys(fetched?.data || {});
        setYears(yearKeys);
        setFetchData(fetched?.data);
      } catch (err) {
        console.error("Error Fetching data", err);
        fireSwal({
          title: "Network Error",
          text: "Failed to fetch pass analytics data. Please refresh.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    };
    fetchMeasures();
  }, []);

  const passMeasure = fetchData ? fetchData[selectedYear] : {};

  const cardData = [
    {
      title: "Outgoing",
      tag: "Out",
      number: passMeasure?.exitTimeCount,
      names: passMeasure?.exitTimeDetails || passMeasure?.exitDetails, // Attach backend exit list
      isInteractive: true,
      isDanger: false
    },
    {
      title: "Arrive",
      tag: "Inside",
      number: passMeasure?.reEntryTimeCount,
      names: passMeasure?.reEntryTimeDetails || passMeasure?.reEntryDetails, // Attach backend return list
      isInteractive: true,
      isDanger: false
    },
    {
      title: "Waiting",
      tag: "Waiting",
      number: passMeasure?.activeOutsideCount,
      names: passMeasure?.activeOutsideDetails,
      isInteractive: true,
      isDanger: false
    },
    {
      title: "Overtime",
      tag: "Late",
      number: passMeasure?.overdueReturnCount,
      names: passMeasure?.overdueReturnDetails,
      isInteractive: true,
      isDanger: true
    }
  ];

  const chartData = [
    { name: "OD", value: passMeasure?.passTypeCounts?.od?.count || 0 },
    { name: "Leave", value: passMeasure?.passTypeCounts?.leave?.count || 0 },
    { name: "Stay Pass", value: passMeasure?.passTypeCounts?.staypass?.count || 0 },
    { name: "Out Pass", value: passMeasure?.passTypeCounts?.outpass?.count || 0 }
  ];

  const totalPassCount = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const getRandomThemeColor = (idx) => {
    const palette = ["#a73d1a", "#ea580c", "#7c2d12", "#c2410c", "#9a3412", "#f97316"];
    return palette[idx % palette.length];
  };

  const handleCardClick = (card) => {
    // Check if the card has a student list with names
    const namesList = card.names?.names || (Array.isArray(card.names) ? card.names : []);

    if (!namesList || namesList.length === 0) {
      fireSwal({
        title: "No Data",
        text: `No student records found for ${card.title}.`,
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }

    setSelectedCard(card);
    setShowNames(true);
  };

  const closeModal = () => {
    setShowNames(false);
    setShowChartPopup(false);
  };

  const handlePieMouseEnter = (data) => {
    if (window.innerWidth < 769) return;
    setHighlightedData(data);
  };

  const handlePieMouseLeave = () => {
    setHighlightedData(null);
  };

  const handlePieClick = async (data) => {
    if (!data || !data.value) {
      fireSwal({
        title: "No Records Found",
        text: "Zero student passes filed in this category.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    fireSwal({
      title: "Fetching Category Data",
      text: "Loading pass analysis records...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axios.post(
        "/api/pass_analysis_warden",
        {
          type: data.name.trim().toLowerCase().replace(/\s+/g, ""),
          year: selectedYear
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        Swal.close();
        const fetched = response.data;
        setFetchedPassAnalysis(fetched);

        const popupChartData = Object.entries(fetched.reasonTypeCounts || {}).map(
          ([reason, count], idx) => ({
            name: reason,
            value: count,
            color: getRandomThemeColor(idx)
          })
        );

        setChartPopupData({
          title: data.name,
          count: data.value,
          dates: [],
          popupChartData
        });

        setShowChartPopup(true);
      } else {
        throw new Error(response.data.error || "Failed to fetch pass analysis data");
      }
    } catch (err) {
      console.error("Error fetching pass analysis data:", err);
      fireSwal({
        title: "Query Failed",
        text: err.response?.data?.message || "Could not retrieve breakdown.",
        icon: "error",
        confirmButtonText: "OK"
      });
      setError(err.message || "Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = async (date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setSelectedDate(formattedDate);
    setShowCalendar(false);
    setIsLoading(true);
    setError(null);

    fireSwal({
      title: "Filtering by Date",
      text: `Syncing records for ${formattedDate}...`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axios.post(
        "/api/pass_analysis_by_date_warden",
        {
          type: chartPopupData?.title.trim().toLowerCase().replace(/\s+/g, ""),
          year: selectedYear,
          date: formattedDate
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        Swal.close();
        const fetched = response.data;
        setFetchedPassAnalysis(fetched);

        const popupChartData = Object.entries(fetched.reasonTypeCounts || {}).map(
          ([reason, count], idx) => ({
            name: reason,
            value: count,
            color: getRandomThemeColor(idx)
          })
        );

        setChartPopupData((prev) => ({
          ...prev,
          popupChartData
        }));
      } else {
        throw new Error(response.data.error || "Failed to query date metrics");
      }
    } catch (err) {
      console.error("Error:", err);
      fireSwal({
        title: "Filter Failed",
        text: err.response?.data?.message || "Failed to fetch data for this date.",
        icon: "error",
        confirmButtonText: "OK"
      });
      setError(err.message || "Failed to fetch data for selected date.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCalendar = () => {
    setShowCalendar((prev) => !prev);
  };

  const handleTotalClick = () => {
    const names = fetchedPassAnalysis?.activePasses?.names || [];
    if (names.length === 0) {
      fireSwal({
        title: "No Data",
        text: "No students registered in this category.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }
    setNameListData(names);
    setShowNameList(true);
  };

  const handleReturningClick = () => {
    const names = fetchedPassAnalysis?.toFieldMatch?.names || [];
    if (names.length === 0) {
      fireSwal({
        title: "No Data",
        text: "No students registered in this category.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }
    setNameListData(names);
    setShowNameList(true);
  };

  const handleOvertimeClick = () => {
    const names = fetchedPassAnalysis?.overduePasses?.names || [];
    if (names.length === 0) {
      fireSwal({
        title: "No Data",
        text: "No students registered in this category.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }
    setNameListData(names);
    setShowNameList(true);
  };

  return (
    <div className="hl-warden-dashboard">
      {/* Top Header */}
      <header className="hl-warden-header">
        <div>
          
          <h1 className="hl-title">Pass Measures & Analytics</h1>
          <p className="hl-subtitle">
            Hostel warden administrative overview and pass clearance audits
          </p>
        </div>

        <div className="hl-filter-control">
          <label htmlFor="hl-year-select" className="hl-filter-label">
            Select Year:
          </label>
          <select
            id="hl-year-select"
            className="hl-select-box"
            value={selectedYear}
            onChange={handleYearChange}
          >
            {years?.map((year) => (
              <option key={year} value={year}>
                {yearToAlphabet[year] || year}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Top 4 KPI Metrics */}
      <section className="hl-metrics-grid">
        {cardData.map((card, index) => (
          <DashboardCard
            key={index}
            title={card.title}
            number={card.number}
            tag={card.tag}
            isInteractive={card.isInteractive}
            isDanger={card.isDanger}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </section>

      {/* Main Visualizer */}
      <section className="hl-chart-card">
        <div className="hl-chart-header">
          <div>
            <h3 className="hl-chart-title">Pass Classification</h3>
            <p className="hl-chart-sub">
              Distribution of issued passes. Click any slice or legend item to drill down.
            </p>
          </div>
          <div className="hl-total-badge">
            Total Passes: <strong>{totalPassCount}</strong>
          </div>
        </div>

        <div className="hl-chart-content-split">
          <div className="hl-chart-wrapper">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={95}
                  outerRadius={140}
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={handlePieMouseEnter}
                  onMouseLeave={handlePieMouseLeave}
                  onClick={handlePieClick}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BRAND_COLORS[index % BRAND_COLORS.length]}
                      opacity={
                        highlightedData && highlightedData.name !== entry.name
                          ? 0.4
                          : 1
                      }
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="hl-tooltip-box">
                          <span className="hl-tooltip-title">{payload[0].name}</span>
                          <span>{payload[0].value} Passes</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="hl-chart-hub-center">
              <span className="hl-hub-label">TOTAL ISSUED</span>
              <span className="hl-hub-count">{totalPassCount}</span>
            </div>
          </div>

          <div className="hl-legend-stack">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className="hl-legend-pill"
                onClick={() => handlePieClick(item)}
              >
                <div
                  className="hl-color-swatch"
                  style={{
                    backgroundColor: BRAND_COLORS[idx % BRAND_COLORS.length]
                  }}
                />
                <div className="hl-legend-meta">
                  <span className="hl-legend-name">{item.name}</span>
                  <span className="hl-legend-sub">Click to inspect entries</span>
                </div>
                <div className="hl-legend-val">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal: All 4 Cards Roster */}
      {showNames && selectedCard && (
        <div className="hl-modal-mask" onClick={closeModal}>
          <div className="hl-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="hl-modal-head">
              <h3>{selectedCard.title} Residents</h3>
              <button className="hl-btn-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="hl-scroll-body">
              {(() => {
                const list = selectedCard.names?.names || (Array.isArray(selectedCard.names) ? selectedCard.names : []);

                if (list.length === 0) {
                  return (
                    <p style={{ textAlign: "center", color: "#333333", padding: "16px" }}>
                      No resident records logged in this category.
                    </p>
                  );
                }

                return (
                  <ul className="hl-roster-list">
                    {list.map((entry, i) => (
                      <li key={i} className="hl-roster-entry">
                        <div className="hl-roster-name">
                          <span className="hl-roster-index">{i + 1}.</span>
                          {typeof entry === "string" ? entry : entry.name}
                        </div>
                        <div className="hl-tags-tray">
                          {selectedCard.names?.late_by?.[i] && (
                            <span className="hl-tag danger">
                              Late: {selectedCard.names.late_by[i]}
                            </span>
                          )}
                          {selectedCard.names?.passtypes?.[i] && (
                            <span className="hl-tag info">
                              {passTypeParse[selectedCard.names.passtypes[i]] ||
                                selectedCard.names.passtypes[i]}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pass Reason & Date Filtering */}
      {showChartPopup && chartPopupData && (
        <div className="hl-modal-mask" onClick={closeModal}>
          <div
            className="hl-modal-box hl-popup-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hl-modal-head">
              <div>
                <h3>{chartPopupData.title} Details</h3>
              </div>
              <button className="hl-btn-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            {/* Date Picker trigger */}
            <div className="hl-date-strip">
              {chartPopupData.title !== "Out Pass" && (
                <div>
                  <button
                    className="hl-date-toggle-btn"
                    onClick={handleToggleCalendar}
                  >
                    Date: {selectedDate}
                  </button>
                  {showCalendar && (
                    <div className="hl-calendar-wrapper">
                      <Calendar
                        onChange={handleDateChange}
                        value={new Date(selectedDate)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {isLoading && (
              <p style={{ textAlign: "center", padding: "20px", color: "#9a3412" }}>
                Loading analysis...
              </p>
            )}

            {error && (
              <p style={{ textAlign: "center", padding: "16px", color: "#c2410c" }}>
                {error}
              </p>
            )}

            {!isLoading && !error && (
              <>
                <div className="hl-summary-pods">
                  <div className="hl-summary-pod" onClick={handleTotalClick}>
                    <span>Total Active</span>
                    <strong>{fetchedPassAnalysis?.activePasses?.count || 0}</strong>
                    <small>View names</small>
                  </div>

                  <div className="hl-summary-pod" onClick={handleReturningClick}>
                    <span>
                      {chartPopupData.title !== "Out Pass"
                        ? `Returning (${selectedDate})`
                        : "Returning Count"}
                    </span>
                    <strong>{fetchedPassAnalysis?.toFieldMatch?.count || 0}</strong>
                    <small>View names</small>
                  </div>

                  <div className="hl-summary-pod danger" onClick={handleOvertimeClick}>
                    <span>
                      {chartPopupData.title !== "Out Pass"
                        ? `OverDay (${selectedDate})`
                        : "Overtime"}
                    </span>
                    <strong>{fetchedPassAnalysis?.overduePasses?.count || 0}</strong>
                    <small>View names</small>
                  </div>
                </div>

                {/* Nested student list flyout */}
                {showNameList && (
                  <div className="hl-submodal-overlay">
                    <div className="hl-submodal-content">
                      <div className="hl-submodal-head">
                        <h4>Student Manifest</h4>
                        <button
                          className="hl-btn-close"
                          style={{ width: "24px", height: "24px", fontSize: "0.9rem" }}
                          onClick={() => setShowNameList(false)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="hl-submodal-scroll">
                        <ul>
                          {nameListData.length > 0 ? (
                            nameListData.map((name, index) => (
                              <li key={index}>{name}</li>
                            ))
                          ) : (
                            <li>No students found</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason sub-donut */}
                <div style={{ padding: "0 24px 20px 24px" }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={
                          chartPopupData?.popupChartData?.length > 0
                            ? chartPopupData.popupChartData
                            : [{ name: "No Data", value: 1 }]
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                      >
                        {chartPopupData?.popupChartData?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.color ||
                              BRAND_COLORS[index % BRAND_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
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
import "./SuperiorAnalytics.css";
import axiosInstance from "../../../api/axios";
import { format } from "date-fns";
import Swal from "sweetalert2";

const BRAND_COLORS = ["#a73d1a", "#ea580c", "#7c2d12", "#f97316"];

const DashboardCard = ({ title, number, isInteractive, isDanger, onClick }) => {
  return (
    <div
      className={`hl-metric-card ${isInteractive ? "interactive" : ""} ${isDanger ? "danger" : ""}`}
      onClick={isInteractive ? onClick : undefined}
    >
      <div className="hl-card-header">
        <span className="hl-card-label">{title}</span>
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

const Dashboard1 = () => {
  const [selectedGender, setSelectedGender] = useState("Boys");
  const [selectedCard, setSelectedCard] = useState(null);
  const [showNames, setShowNames] = useState(false);
  const [highlightedData, setHighlightedData] = useState(null);
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [chartPopupData, setChartPopupData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedYear, setSelectedYear] = useState("overall");
  const [years, setYears] = useState(null);
  const [fetchedData, setFetchData] = useState({
    boys: {},
    girls: {}
  });
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

  const handleGenderToggle = () => {
    setSelectedGender((prev) => (prev === "Boys" ? "Girls" : "Boys"));
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const fireSwal = (config) => {
    return Swal.fire({
      background: "#fefbf4",
      color: "#111111",
      confirmButtonColor: "#a73d1a",
      ...config
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/api/pass_measures_superior");
        const resData = response.data;

        const availableYears = Array.isArray(resData.primary_years)
          ? resData.primary_years
          : Object.keys(resData?.data?.Male || {});
        setYears(availableYears);

        const boysData = resData.data?.Male || {};
        const girlsData = resData.data?.Female || {};

        setFetchData({
          boys: boysData,
          girls: girlsData
        });

        if (!boysData["overall"] && availableYears.length > 0) {
          setSelectedYear(availableYears[0]);
        }
      } catch (err) {
        console.error("Error Fetching data", err);
        fireSwal({
          title: "Network Error",
          text: "Failed to fetch analytics data. Please refresh the page.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    };

    fetchData();
  }, []);

  const activeGenderData =
    selectedGender === "Boys"
      ? fetchedData?.boys?.[selectedYear] || {}
      : fetchedData?.girls?.[selectedYear] || {};

  // Only Waiting and Overtime contain roster arrays in the backend response
  const cardData = [
    {
      title: "Outgoing",
      number: activeGenderData?.exitTimeCount,
      isInteractive: false,
      isDanger: false
    },
    {
      title: "Arrive",
      number: activeGenderData?.reEntryTimeCount,
      isInteractive: false,
      isDanger: false
    },
    {
      title: "Waiting",
      number: activeGenderData?.activeOutsideCount,
      names: {
        names: activeGenderData?.activeOutsideNames || [],
        passtypes: activeGenderData?.activeOutsidePassTypes || []
      },
      isInteractive: true,
      isDanger: false
    },
    {
      title: "Overtime",
      number: activeGenderData?.overdueReturnCount,
      names: {
        names: activeGenderData?.overdueReturnNames || [],
        late_by: activeGenderData?.overdueReturnLateBy || []
      },
      isInteractive: true,
      isDanger: true
    }
  ];

  const chartData = [
    { name: "OD", value: activeGenderData?.passTypeCounts?.od || 0 },
    { name: "Leave", value: activeGenderData?.passTypeCounts?.leave || 0 },
    { name: "Stay Pass", value: activeGenderData?.passTypeCounts?.staypass || 0 },
    { name: "Out Pass", value: activeGenderData?.passTypeCounts?.outpass || 0 }
  ];

  const totalPassCount = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const getRandomThemeColor = (idx) => {
    const palette = ["#a73d1a", "#ea580c", "#7c2d12", "#c2410c", "#9a3412", "#f97316"];
    return palette[idx % palette.length];
  };

  const handleCardClick = (card) => {
    if (!card.isInteractive) return;

    const list = card.names?.names || [];
    if (!list.length) {
      fireSwal({
        title: "No Data",
        text: `No students currently logged under ${card.title}.`,
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
        title: "No Data",
        text: "No active passes found for this category.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    fireSwal({
      title: "Loading Category Data",
      text: "Fetching pass analysis records...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axiosInstance.post(
        "/api/pass_analysis_superior",
        {
          type: data.name.trim().toLowerCase().replace(/\s+/g, ""),
          year: selectedYear,
          gender: selectedGender === "Boys" ? "Male" : "Female"
        },
        { withCredentials: true }
      );

      Swal.close();
      const resData = response.data;
      setFetchedPassAnalysis(resData);

      const popupChartData = Object.entries(resData.reasonTypeCounts || {}).map(
        ([reason, count], idx) => ({
          name: reason,
          value: count,
          color: getRandomThemeColor(idx)
        })
      );

      setChartPopupData({
        title: data.name,
        count: data.value,
        popupChartData
      });

      setShowChartPopup(true);
    } catch (err) {
      console.error("Error fetching pass analysis data:", err);
      setError(err.message || "Failed to fetch data.");
      fireSwal({
        title: "Error!",
        text: err.response?.data?.message || "Failed to fetch pass analysis data. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
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
      const response = await axiosInstance.post(
        "/api/pass_analysis_by_date_superior",
        {
          type: chartPopupData?.title.trim().toLowerCase().replace(/\s+/g, ""),
          year: selectedYear,
          gender: selectedGender === "Boys" ? "Male" : "Female",
          date: formattedDate
        },
        { withCredentials: true }
      );

      Swal.close();
      const resData = response.data;
      setFetchedPassAnalysis(resData);

      const popupChartData = Object.entries(resData.reasonTypeCounts || {}).map(
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
    } catch (err) {
      console.error("Error fetching pass analysis data:", err);
      setError(err.message || "Failed to fetch data.");
      fireSwal({
        title: "Error!",
        text: err.response?.data?.message || "Failed to fetch data for selected date. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCalendar = () => {
    setShowCalendar((prev) => !prev);
  };

  const openStudentList = (namesArray) => {
    if (!namesArray || namesArray.length === 0) {
      fireSwal({
        title: "No Data",
        text: "No students registered in this category.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }
    setNameListData(namesArray);
    setShowNameList(true);
  };

  return (
    <div className="hl-warden-dashboard">
      {/* Header with Gender Toggle and Cohort Select */}
      <header className="hl-warden-header">
        <div>
          <div className="hl-badge-live">
            <span className="hl-pulse-dot" />
            Superior Oversight Monitoring
          </div>
          <h1 className="hl-title">Pass Measures & Analytics — {selectedGender}</h1>
          <p className="hl-subtitle">
            Campus-wide administrative overview and pass movement audits
          </p>
        </div>

        <div className="hl-header-actions">
          <div className="hl-gender-toggle-wrapper">
            <span className={`hl-toggle-tag ${selectedGender === "Boys" ? "active" : ""}`}>
              Boys
            </span>
            <label className="hl-switch">
              <input
                type="checkbox"
                onChange={handleGenderToggle}
                checked={selectedGender === "Girls"}
              />
              <span className="hl-slider"></span>
            </label>
            <span className={`hl-toggle-tag ${selectedGender === "Girls" ? "active" : ""}`}>
              Girls
            </span>
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
              <option value="overall">Overall</option>
              {years
                ?.filter((y) => y !== "overall")
                .map((year) => (
                  <option key={year} value={year}>
                    {yearToAlphabet[year] || `Year ${year}`}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </header>

      {/* Top 4 Metrics */}
      <section className="hl-metrics-grid">
        {cardData.map((card, index) => (
          <DashboardCard
            key={index}
            title={card.title}
            number={card.number}
            isInteractive={card.isInteractive}
            isDanger={card.isDanger}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </section>

      {/* Main Donut Visualizer */}
      <section className="hl-chart-card">
        <div className="hl-chart-header">
          <div>
            <h3 className="hl-chart-title">Pass Classification ({selectedGender})</h3>
            <p className="hl-chart-sub">
              Distribution of issued passes. Click any slice or legend item to view details.
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
                  <span className="hl-legend-sub">Click to inspect category</span>
                </div>
                <div className="hl-legend-val">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roster Modal for Interactive Cards (Waiting & Overtime) */}
      {showNames && selectedCard && (
        <div className="hl-modal-mask" onClick={closeModal}>
          <div className="hl-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="hl-modal-head">
              <h3>{selectedCard.title} Residents ({selectedGender})</h3>
              <button className="hl-btn-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="hl-scroll-body">
              <ul className="hl-roster-list">
                {selectedCard.names?.names?.map((entry, i) => (
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
            </div>
          </div>
        </div>
      )}

      {/* Pass Reason Analysis & Date Filter Modal */}
      {showChartPopup && chartPopupData && (
        <div className="hl-modal-mask" onClick={closeModal}>
          <div
            className="hl-modal-box hl-popup-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hl-modal-head">
              <div>
                <h3>{chartPopupData.title} Details ({selectedGender})</h3>
              </div>
              <button className="hl-btn-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

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
              <p style={{ textAlign: "center", padding: "20px", color: "#333333" }}>
                Loading analysis...
              </p>
            )}

            {error && (
              <p style={{ textAlign: "center", padding: "16px", color: "#b91c1c" }}>
                {error}
              </p>
            )}

            {!isLoading && !error && (
              <>
                <div className="hl-summary-pods">
                  <div
                    className="hl-summary-pod"
                    onClick={() => openStudentList(fetchedPassAnalysis?.activePasses?.names)}
                  >
                    <span>Total Active</span>
                    <strong>{fetchedPassAnalysis?.activePasses?.count || 0}</strong>
                    <small>View names</small>
                  </div>

                  <div
                    className="hl-summary-pod"
                    onClick={() => openStudentList(fetchedPassAnalysis?.toFieldMatch?.names)}
                  >
                    <span>
                      {chartPopupData.title !== "Out Pass"
                        ? `Returning (${selectedDate})`
                        : "Returning Students"}
                    </span>
                    <strong>{fetchedPassAnalysis?.toFieldMatch?.count || 0}</strong>
                    <small>View names</small>
                  </div>

                  <div
                    className="hl-summary-pod danger"
                    onClick={() => openStudentList(fetchedPassAnalysis?.overduePasses?.names)}
                  >
                    <span>
                      {chartPopupData.title !== "Out Pass"
                        ? `OverDay (${selectedDate})`
                        : "Overtime"}
                    </span>
                    <strong>{fetchedPassAnalysis?.overduePasses?.count || 0}</strong>
                    <small>View names</small>
                  </div>
                </div>

                {/* Nested Student List Popup */}
                {showNameList && (
                  <div className="hl-submodal-overlay">
                    <div className="hl-submodal-content">
                      <div className="hl-submodal-head">
                        <h4>Student Names:</h4>
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
                          {nameListData.map((name, index) => (
                            <li key={index}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Donut Chart for Reasons */}
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

export default Dashboard1;
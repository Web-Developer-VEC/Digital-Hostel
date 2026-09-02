import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import axios from "axios";
import Swal from 'sweetalert2';
import { getRequest } from "../../../api/axios";

// Professional, muted categorical palette
const PALETTE = ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6c757d"];

const SWAL_THEME = {
  customClass: {
    popup: "admin-swal-card",
    confirmButton: "admin-swal-action",
  },
  buttonsStyling: false,
};

const COHORT_LABELS = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
  10: "MBA 1st",
  9: "MBA 2nd",
  8: "ME 1st",
  7: "ME 2nd",
  overall: "All Hostels",
};

const PASS_NAMES = {
  od: "On Duty",
  outpass: "Out Pass",
  staypass: "Stay Pass",
  leave: "Official Leave",
};

export default function WardenAnalyticsDashboard() {
  const [selectedYear, setSelectedYear] = useState("overall");
  const [years, setYears] = useState([]);
  const [fetchData, setFetchData] = useState(null);

  // Modal Sheet States
  const [activeModal, setActiveModal] = useState(null); // 'movement' | 'pass_analysis'
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);
  const [fetchedPassAnalysis, setFetchedPassAnalysis] = useState(null);
  const [activeRosterTab, setActiveRosterTab] = useState("total");

  // Filter States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Networking
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log("Fetched Data",fetchData);

  const ReasonTypeMapping = {
    od: ['Internship', 'Symposium', 'Hackathon', 'Sports', 'Others'],
    leave: ['Function', 'Medical', 'Exams', 'Emergency', 'Others'],
    outpass: ['Shopping', 'Classes', 'Internship', 'Medical', 'Others'],
    staypass: ['Holiday', 'Weekend Holiday', 'Semester Holiday', 'Festival Holiday', 'Others'],
  };

  const yearToAlphabet = {
    '1': 'First Year', 
    '2': 'Second Year',
    '3': 'Third Year',
    '4': 'Fourth Year',
    '10': 'MBA First Year',
    '9': 'MBA Second year',
    '8': 'ME First Year',
    '7': 'ME Second Year',
    'overall': 'Overall'
  };

  const passTypeParse = {
    'od': 'OD',
    'outpass': 'Out Pass',
    'staypass': 'Stay Pass',
    'leave': 'Leave'
  }

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // pass measure fetching
  useEffect(()=>{
    const fetchData = async ()=>{

      try{
        const response = await getRequest('/api/pass_measures_warden');
        const fetchedData = response.data;
        
        const years = Object.keys(fetchedData?.data)
        
        setYears(years);

        setFetchData(fetchedData?.data);
      } catch (err) {
        console.error(err);
        Swal.fire({
          ...SWAL_THEME,
          title: "Connection Lost",
          text: "Unable to sync with gate systems. Please reload.",
          icon: "error",
          confirmButtonText: "Okay",
        });
      }
    };
    fetchAnalytics();
  }, []);

  const passMeasure = fetchData?.[selectedYear] || {};

  const gateCards = [
    {
      id: "outgoing",
      title: "Departed Today",
      detail: "Gate exits processed",
      value: passMeasure?.exitTimeCount ?? 0,
      badge: "Normal",
      tone: "neutral",
      isLive: false,
    },
    {
      id: "arrived",
      title: "Checked In",
      detail: "Returned through gate",
      value: passMeasure?.reEntryTimeCount ?? 0,
      badge: "Cleared",
      tone: "success",
      isLive: false,
    },
    {
      id: "outside",
      title: "Currently Outside",
      detail: "Active off-campus students",
      value: passMeasure?.activeOutsideCount ?? 0,
      badge: "Tracking",
      tone: "warning",
      isLive: true,
      names: passMeasure?.activeOutsideDetails,
    },
    {
      id: "overtime",
      title: "Curfew Overdue",
      detail: "Passed allowed return hour",
      value: passMeasure?.overdueReturnCount ?? 0,
      badge: "Action Req.",
      tone: "danger",
      isLive: true,
      names: passMeasure?.overdueReturnDetails,
    },
  ];

  const passTypes = [
    { name: "OD", value: passMeasure?.passTypeCounts?.od?.count || 0 },
    { name: "Leave", value: passMeasure?.passTypeCounts?.leave?.count || 0 },
    { name: "Stay Pass", value: passMeasure?.passTypeCounts?.staypass?.count || 0 },
    { name: "Out Pass", value: passMeasure?.passTypeCounts?.outpass?.count || 0 },
  ];

  const totalPassCount = passTypes.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const handleCardInspect = (card) => {
    if (!card.isLive) return;
    setSelectedMovement(card);
    setActiveModal("movement");
  };

  const handlePassInspect = async (item) => {
    if (!item?.value) {
      Swal.fire({
        ...SWAL_THEME,
        title: "No Data",
        text: `Zero recorded passes for ${item.name} today.`,
        icon: "info",
        confirmButtonText: "Close",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedPass(item);
    setActiveModal("pass_analysis");

    try {
      const formatted = item.name.trim().toLowerCase().replace(/\s+/g, "");
      const res = await axios.post(
        "/api/pass_analysis_warden",
        { type: formatted, year: selectedYear },
        { withCredentials: true }
      );
      setFetchedPassAnalysis(res.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pass breakdown.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = async (date) => {
    const formatted = format(date, "yyyy-MM-dd");
    setSelectedDate(formatted);
    setShowCalendar(false);
    setIsLoading(true);
    setError(null);

    try {
      const formattedType = selectedPass?.name?.trim().toLowerCase().replace(/\s+/g, "");
      const res = await axios.post(
        "/api/pass_analysis_by_date_warden",
        { type: formattedType, year: selectedYear, date: formatted },
        { withCredentials: true }
      );
      setFetchedPassAnalysis(res.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to retrieve date log.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedMovement(null);
    setSelectedPass(null);
    setShowCalendar(false);
    setActiveRosterTab("total");
    setError(null);
  };

  const getRosterList = () => {
    if (activeRosterTab === "total") return fetchedPassAnalysis?.activePasses?.names || [];
    if (activeRosterTab === "returning") return fetchedPassAnalysis?.toFieldMatch?.names || [];
    if (activeRosterTab === "overtime") return fetchedPassAnalysis?.overduePasses?.names || [];
    return [];
  };

  const currentRosterList = getRosterList();

  const reasonData = Object.entries(fetchedPassAnalysis?.reasonTypeCounts || {}).map(
    ([reason, count], idx) => ({
      name: reason,
      value: count,
      color: PALETTE[idx % PALETTE.length],
    })
  );

  return (
    <div className="admin-layout-container">
      <div className="admin-content-wrapper">
        
        {/* Page Header */}
        <header className="page-header">
          <div className="header-titles">
            <h1>Campus Residence Control</h1>
            <p>Monitor gate access, active outpasses, and student curfews.</p>
          </div>
          <div className="header-actions">
            <label className="select-label">Cohort Filter:</label>
            <select
              className="admin-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {COHORT_LABELS[yr] || yr}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Real-Time Metrics */}
        <section className="dashboard-section">
          <h2 className="section-title">Active Gate Metrics</h2>
          <div className="metrics-grid">
            {gateCards.map((card) => (
              <div
                key={card.id}
                className={`stat-card border-${card.tone} ${card.isLive ? "interactive" : ""}`}
                onClick={() => handleCardInspect(card)}
              >
                <div className="stat-header">
                  <span className="stat-title">{card.title}</span>
                  <span className={`badge badge-${card.tone}`}>{card.badge}</span>
                </div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-footer">
                  <span className="stat-detail">{card.detail}</span>
                  {card.isLive && <span className="stat-link">View List &rarr;</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pass Distribution Panel */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <h2 className="section-title">Pass Distribution Matrix</h2>
            <div className="total-badge">
              <strong>{totalPassCount}</strong> Passes Registered Today
            </div>
          </div>

          <div className="analytics-panel">
            {/* Chart Column */}
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={passTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    onMouseEnter={(d) => setHoveredSlice(d.name)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={(d) => handlePassInspect(d)}
                  >
                    {passTypes.map((item, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PALETTE[index % PALETTE.length]}
                        opacity={hoveredSlice && hoveredSlice !== item.name ? 0.4 : 1}
                        style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      fontSize: "13px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-center-label">
                <span className="center-value">{totalPassCount}</span>
                <span className="center-text">Total Passes</span>
              </div>
            </div>

            {/* Progress Bars Column */}
            <div className="bars-container">
              {passTypes.map((item, idx) => {
                const percentage = totalPassCount > 0 ? Math.round((item.value / totalPassCount) * 100) : 0;
                const color = PALETTE[idx % PALETTE.length];

                return (
                  <div key={item.name} className="progress-row" onClick={() => handlePassInspect(item)}>
                    <div className="progress-header">
                      <div className="progress-label">
                        <span className="color-dot" style={{ backgroundColor: color }} />
                        {item.name}
                      </div>
                      <div className="progress-stats">
                        <strong>{item.value}</strong>
                        <span className="text-muted">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${percentage}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
              <p className="help-text">Click on any category to view detailed logs and student rosters.</p>
            </div>
          </div>
        </section>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Gate Movement Roster Modal */}
      {activeModal === "movement" && selectedMovement && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedMovement.title}</h3>
                <p className="modal-subtitle">Gate Records Analysis</p>
              </div>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="table-summary-bar">
                Total found in category: <strong>{selectedMovement.value} Students</strong>
              </div>
              
              <div className="data-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th width="10%">#</th>
                      <th width="60%">Student Name</th>
                      <th width="30%" className="text-right">Status / Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMovement.names?.names?.length ? (
                      selectedMovement.names.names.map((entry, i) => (
                        <tr key={i}>
                          <td className="text-muted">{String(i + 1).padStart(2, "0")}</td>
                          <td className="font-weight-bold">{typeof entry === "string" ? entry : entry.name}</td>
                          <td className="text-right text-primary">
                            {selectedMovement.names?.late_by?.[i] ||
                              (selectedMovement.names?.passtypes?.[i]
                                ? PASS_NAMES[selectedMovement.names.passtypes[i]]
                                : "Regular Gate")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-4">No log entries found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Pass Drilldown Analytics Modal */}
      {activeModal === "pass_analysis" && selectedPass && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedPass.name} Analytics</h3>
                <p className="modal-subtitle">Detailed pass telemetry and roster distribution</p>
              </div>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>

            {/* Date Picker Bar */}
            {selectedPass.name !== "Out Pass" && (
              <div className="modal-toolbar">
                <span className="toolbar-label">Audit Date:</span>
                <div className="dropdown-container">
                  <button className="btn-default" onClick={() => setShowCalendar(!showCalendar)}>
                    {selectedDate} &#9662;
                  </button>
                  {showCalendar && (
                    <div className="calendar-dropdown">
                      <Calendar onChange={handleDateChange} value={new Date(selectedDate)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="modal-body bg-light">
              {isLoading && <div className="state-message">Loading diagnostic logs...</div>}
              {error && <div className="state-message text-danger">{error}</div>}

              {!isLoading && !error && (
                <>
                  {/* Segmented Controls */}
                  <div className="segmented-controls">
                    <button
                      className={`segment-btn ${activeRosterTab === "total" ? "active" : ""}`}
                      onClick={() => setActiveRosterTab("total")}
                    >
                      <span className="segment-label">Active Passes</span>
                      <span className="segment-value">{fetchedPassAnalysis?.activePasses?.count || 0}</span>
                    </button>
                    <button
                      className={`segment-btn ${activeRosterTab === "returning" ? "active" : ""}`}
                      onClick={() => setActiveRosterTab("returning")}
                    >
                      <span className="segment-label">Scheduled Returning</span>
                      <span className="segment-value">{fetchedPassAnalysis?.toFieldMatch?.count || 0}</span>
                    </button>
                    <button
                      className={`segment-btn danger ${activeRosterTab === "overtime" ? "active" : ""}`}
                      onClick={() => setActiveRosterTab("overtime")}
                    >
                      <span className="segment-label">Overstayed</span>
                      <span className="segment-value">{fetchedPassAnalysis?.overduePasses?.count || 0}</span>
                    </button>
                  </div>

                  <div className="split-panel">
                    {/* Left: Reasons */}
                    <div className="panel-card">
                      <h4 className="panel-title">Stated Reasons</h4>
                      <div className="list-group">
                        {reasonData.length ? (
                          reasonData.map((r) => (
                            <div key={r.name} className="list-group-item">
                              <div className="item-left">
                                <span className="color-dot" style={{ backgroundColor: r.color }} />
                                {r.name}
                              </div>
                              <div className="item-right font-weight-bold">{r.value}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted p-3">No reasons logged.</div>
                        )}
                      </div>
                    </div>

                    {/* Right: Roster */}
                    <div className="panel-card">
                      <h4 className="panel-title">Roster ({activeRosterTab.toUpperCase()})</h4>
                      <div className="list-group">
                        {currentRosterList.length ? (
                          currentRosterList.map((st, i) => (
                            <div key={i} className="list-group-item">
                              <span className="text-muted mr-2">{String(i + 1).padStart(2, "0")}</span>
                              <span>{st}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted p-3">No students found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
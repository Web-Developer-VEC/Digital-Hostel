import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Send, CheckCircle } from 'lucide-react';
import './SuperiorRequest.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import axiosInstance from '../../../api/axios';

function SuperiorRequest() {
  const [records, setRecords] = useState([]);
  const [wardenYears, setWardenYears] = useState([1, 2, 3, 4]);
  const [departments, setDepartments] = useState([]);
  const [passTypes, setPassTypes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isMedical, setIsMedical] = useState(false);
  const [activeGender, setActiveGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', department: '', passType: '', search: '' });

  // Parent OTP flow state
  const [otpError, setOtpError] = useState("");
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpPassId, setOtpPassId] = useState(null);

  const navigate = useNavigate();

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
    "MBA": "MBA"
  };

  // Mapping Pass Types to Labels
  const passTypeLabels = {
    "od": "OD",
    "outpass": "Out Pass",
    "staypass": "Stay Pass",
    "leave": "Leave"
  };

  // Normalizes parent_approval (which may be null, a boolean, or a
  // string like "pending"/"approved"/"declined") into one of three
  // known states, instead of relying on JS truthiness.
  const getParentApprovalStatus = (value) => {
    if (value === null || value === undefined) return "pending";
    if (typeof value === "boolean") return value ? "approved" : "declined";

    const normalized = String(value).toLowerCase();
    if (["approved", "accepted", "true", "1"].includes(normalized)) {
      return "approved";
    }
    if (["declined", "rejected", "false", "0"].includes(normalized)) {
      return "declined";
    }
    return "pending"; // e.g. "pending", or any other unrecognized value
  };

  const handleGenderFilter = (gender) => {
    const newGender = activeGender === gender ? '' : gender; // Toggle selection
    setActiveGender(newGender);
  };


  useEffect(() => {
    fetchWardenDetails();
    fetchPendingPasses();
  }, []);

  const fetchWardenDetails = async () => {
    try {
      const response = await axiosInstance.get('/api/sidebar_warden');
      // We don't overwrite wardenYears with year years because we handle academic years (1, 2, 3, 4) in this dashboard.
    } catch (error) {
      console.error("Error fetching warden details:", error);
    }
  };

  const fetchPendingPasses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/fetch_passes_');
      const data = response.data;
      console.log("Data", data);
      if (data.data && data.data.length > 0) {
        setRecords(data.data);
        setDepartments([...new Set(data.data.map(pass => pass.dept))]);
        setPassTypes([...new Set(data.data.map(pass => pass.passtype))]);
        setWardenYears([...new Set([1, 2, 3, 4, ...data.data.map(pass => pass.year)])]);
      } else {
        setRecords([]);
        setWardenYears([1, 2, 3, 4]);
      }
    } catch (error) {
      console.error("Error fetching passes:", error);
      setRecords([]);
      setWardenYears([1, 2, 3, 4]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (pass_id, medical_status, comment) => {
    console.log("🔵 Sending Accept request for pass_id:", pass_id, "Medical:", medical_status);

    try {
      const response = await axiosInstance.post('/api/warden_decision', {
        pass_id,
        action: 'approve',
        medical_status,
        comment
      });

      console.log("✅ Pass accepted successfully:", response.data);
      setRecords(records.filter(record => record.pass_id !== pass_id));
      setSelectedRecord(null);
      Swal.fire({
        title: "Success!",
        text: "✅ Pass request accepted successfully.",
        icon: "success",
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error("❌ Error accepting pass:", error);
    }
  };


  const handleDecline = async (pass_id, medical_status, comment) => {
    console.log("🔴 Decline button clicked for pass_id:", pass_id, "Medical:", medical_status);
    try {
      const response = await axiosInstance.post('/api/warden_decision', {
        pass_id,
        action: 'reject',
        medical_status,
        comment
      });

      console.log("✅ Pass declined successfully:", response.data);
      setRecords(records.filter(record => record.pass_id !== pass_id));
      setSelectedRecord(null);
      Swal.fire({
        title: "Success!",
        text: "✅ Pass request declined successfully.",
        icon: "success",
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error("❌ Error declining pass:", error);
    }
  };

  // ----- Parent OTP flow (same backend endpoints as WardenRequest) -----

  const handleSendParentOTP = async (pass_id) => {
    try {
      await axiosInstance.post('/api/send_parent_otp', { pass_id });

      toast.success(
        "OTP has been sent to the parent's registered mobile number.",
        {
          position: "bottom-right",
        },
      );

      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send parent OTP.");

      return false;
    }
  };

  // Sends the OTP and, if that succeeds, opens the verification popup.
  const handleSendOtpAndOpenPopup = async (pass_id) => {
    const success = await handleSendParentOTP(pass_id);
    if (success) {
      openOtpPopup(pass_id);
    }
  };

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);

    setOtp(newOtp);
    if (otpError) setOtpError("");

    // Move to next box automatically
    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Move to previous box when Backspace is pressed
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }

    // Move using arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedData) return;

    const newOtp = ["", "", "", "", "", ""];

    pastedData.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    // Focus last entered box
    const lastIndex = Math.min(pastedData.length - 1, 5);

    setTimeout(() => {
      document.getElementById(`otp-input-${lastIndex}`)?.focus();
    }, 50);
  };

  const handleValidateOTP = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      const response = await axiosInstance.post('/api/verify_parent_otp', {
        pass_id: otpPassId,
        otp: enteredOtp,
      });

      toast.success(response?.data?.message || "OTP verified successfully.", {
        position: "bottom-right",
      });

      setRecords((prev) =>
        prev.map((record) =>
          record.pass_id === otpPassId
            ? {
                ...record,
                parent_approval: "approved",
              }
            : record,
        ),
      );

      // The modal is bound to `selectedRecord`, a separate snapshot from
      // `records` — without this it keeps showing the stale (pending)
      // status and the button never flips to "Verified".
      setSelectedRecord((prev) =>
        prev && prev.pass_id === otpPassId
          ? { ...prev, parent_approval: "approved" }
          : prev,
      );

      setShowOtpPopup(false);
      setOtp(["", "", "", "", "", ""]);
      setOtpPassId(null);
      setOtpError("");
    } catch (error) {
      setOtpError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Invalid OTP. Please try again.",
      );
    }
  };

  const openOtpPopup = (pass_id) => {
    setOtp(["", "", "", "", "", ""]);
    setOtpPassId(pass_id);
    setOtpError("");
    setShowOtpPopup(true);

    // Automatically focus first box
    setTimeout(() => {
      document.getElementById("otp-input-0")?.focus();
    }, 100);
  };

  const filteredRecords = records.filter(record => {
    const searchQuery = filters.search.toLowerCase();
    return (
      (!activeGender || record.gender === activeGender) &&
      (!filters.year || record.year?.toString() === filters.year) &&
      (!filters.department || record.dept === filters.department) &&
      (!filters.passType || record.passtype === filters.passType) &&
      (!filters.search ||
        record.name.toLowerCase().includes(searchQuery) ||
        record.room_no.toLowerCase().includes(searchQuery) ||
        record.place_to_visit.toLowerCase().includes(searchQuery)
      )
    );
  });

  return (
    <div className="SR-app">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
      <div className="SR-main">
        <h1 className="SR-page-title">Requests</h1>

        <div className="SR-filter-bar">
          <div className="SR-search-container">
            <Search className="SR-search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Room No, or Place..."
              className="SR-search-input"
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div className="SR-filters">
            <div className="SR-gender-buttons">
              <button
                className={`SR-gender-button ${activeGender === 'Male' ? 'SR-gender-button-active' : ''}`}
                onClick={() => handleGenderFilter(activeGender === 'Male' ? '' : 'Male')}
              >
                Boys
              </button>
              <button
                className={`SR-gender-button ${activeGender === 'Female' ? 'SR-gender-button-active' : ''}`}
                onClick={() => handleGenderFilter(activeGender === 'Female' ? '' : 'Female')}
              >
                Girls
              </button>
            </div>
            {/* Year Filter (Dynamically Generated) */}
            <select className="SR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}>
              <option value="">All Years</option>
              {wardenYears.map(year => (
                <option key={year} value={year}>
                  {year === 1 ? "First Year" :
                    year === 2 ? "Second Year" :
                      year === 3 ? "Third Year" :
                        year === 4 ? "Fourth Year" : `year ${year}`}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select className="SR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}>
              <option value="">All Departments</option>
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {departmentLabels[dept] || dept}
                  </option>
                ))
              ) : (
                <option disabled>No departments available</option>
              )}
            </select>

            {/* Pass Type Filter (Dynamically Generated) */}
            <select className="SR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, passType: e.target.value }))}>
              <option value="">All Types</option>
              {passTypes.length > 0 ? (
                passTypes.map((type) => (
                  <option key={type} value={type}>
                    {passTypeLabels[type] || type}
                  </option>
                ))
              ) : (
                <option disabled>No pass types available</option>
              )}
            </select>

            <div className='superior-req-button'>
              <button onClick={() => navigate('/hostel/superior/requests/Profile-Change-Request')} className='profile-change-button'>
                Profile Change Requests
              </button>

              <button onClick={() => navigate('/hostel/superior/requests/vacate')} className='profile-change-button'>
                Vacate Requests
              </button>

              <button onClick={() => navigate('/hostel/superior/requests/Prev-Requests')} className='prev-requests-button'>
                Pass Log History
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p>⏳ Loading pending passes...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="no-records-message">📋 No pending pass requests found.</p>
        ) : (
          <div className='SR-table-container'>
            <table className="SR-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Room</th>
                  <th>Req Date</th>
                  <th>Pass Type</th>
                  <th>Date</th>
                  <th>Late Count</th>
                  <th>Parent Approval</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  // Determine row color based on late_count
                  const getRowClass = (late_count) => {
                    if (late_count < 3) return "SR-row-green"; // Green row
                    if (late_count <= 5) return "SR-row-orange"; // Orange row
                    return "SR-row-red"; // Red row
                  };
                  const getStatusClass = (status) => {
                    const normalized = getParentApprovalStatus(status);
                    if (normalized === "approved") return "SR-status-green";
                    if (normalized === "declined") return "SR-status-red";
                    return "SR-status-orange"; // Pending
                  };

                  return (
                    <tr key={record.pass_id} className={getRowClass(record.late_count)} onClick={() => setSelectedRecord(record)}>
                      <td>{record.name}</td>
                      <td>{["I", "II", "III", "IV"][record.year - 1] || record.year}</td>
                      <td>{record.room_no}</td>
                      <td>{new Date(record.request_date_time).toLocaleDateString('en-GB').replace(/\//g, ' - ')}</td>
                      <td>{passTypeLabels[record.passtype] || record.passtype}</td>
                      <td>{new Date(record.from).toLocaleDateString('en-GB').replace(/\//g, ' - ')}</td>
                      <td>
                        <span className={`SR-late-circle ${getRowClass(record.late_count)}`}>
                          {record.late_count}
                        </span>
                      </td>
                      <td>
                        <span className={`SR-status-circle ${getStatusClass(record.parent_approval)}`}>
                          {getParentApprovalStatus(record.parent_approval) === "approved"
                            ? "Accepted"
                            : getParentApprovalStatus(record.parent_approval) === "declined"
                              ? "Declined"
                              : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedRecord && (
          <DetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onSendParentOTP={handleSendOtpAndOpenPopup}
            isMedical={isMedical} // ✅ Pass down medical state
            setIsMedical={setIsMedical} // ✅ Allow modal to update medical state
          />
        )}

        {showOtpPopup && (
          <div
            className="AR-otp-overlay"
            onClick={() => setShowOtpPopup(false)}
          >
            <div className="AR-otp-popup" onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button
                className="AR-otp-close"
                onClick={() => setShowOtpPopup(false)}
              >
                <X size={20} />
              </button>

              {/* Icon */}
              <div className="AR-otp-icon">🔐</div>

              {/* Title */}
              <h2>Verify Parent OTP</h2>

              <p className="AR-otp-description">
                We've sent a 6-digit OTP to the parent's registered mobile
                number.
              </p>

              {/* OTP Boxes */}
              <div className="AR-otp-boxes">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    className={`AR-otp-input ${digit ? "AR-otp-filled" : ""} ${otpError ? "AR-otp-invalid" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoComplete="one-time-code"
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>

              {/* Inline error */}
              {otpError && <p className="AR-otp-error">{otpError}</p>}

              {/* Helper Text */}
              <p className="AR-otp-helper">
                Enter the OTP received on the parent's mobile
              </p>

              {/* Buttons */}
              <div className="AR-otp-actions">
                <button
                  type="button"
                  className="AR-otp-resend"
                  onClick={async () => {
                    const success = await handleSendParentOTP(otpPassId);
                    if (success) {
                      setOtp(["", "", "", "", "", ""]);
                      setOtpError("");
                      document.getElementById("otp-input-0")?.focus();
                    }
                  }}
                >
                  ↻ Resend OTP
                </button>

                <button
                  type="button"
                  className="AR-otp-verify"
                  onClick={handleValidateOTP}
                  disabled={otp.join("").length !== 6}
                >
                  ✓ Verify OTP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Detail Modal Component
const PairedInfo = ({ left, right }) => (
  <div className="SR-paired-info">
    <div className="SR-info-container">
      <span className="SR-label">{left.label}</span>
      <p className="SR-value">{left.value}</p>
    </div>
    <div className="SR-info-container">
      <span className="SR-label">{right.label}</span>
      <p className="SR-value">{right.value}</p>
    </div>
  </div>
);

function DetailModal({ record, onClose, onAccept, onDecline, onSendParentOTP, isMedical, setIsMedical }) {
  const [showDocument, setShowDocument] = useState(false);
  const [comment, setComment] = useState("");

  // Normalizes parent_approval the same way as the list view, so the
  // OTP button and status text stay in sync after verification.
  const getParentApprovalStatus = (value) => {
    if (value === null || value === undefined) return "pending";
    if (typeof value === "boolean") return value ? "approved" : "declined";

    const normalized = String(value).toLowerCase();
    if (["approved", "accepted", "true", "1"].includes(normalized)) {
      return "approved";
    }
    if (["declined", "rejected", "false", "0"].includes(normalized)) {
      return "declined";
    }
    return "pending";
  };

  // Convert "from" and "to" timestamps into date & time formats
  const fromDateTime = new Date(record.from);
  const toDateTime = new Date(record.to);

  const formattedFromDate = fromDateTime.toLocaleDateString('en-GB').replace(/\//g, ' - '); // Format: DD - MM - YYYY
  const formattedFromTime = fromDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }); // Format: HH:MM AM/PM

  const formattedToDate = toDateTime.toLocaleDateString('en-GB').replace(/\//g, ' - '); // Format: DD - MM - YYYY
  const formattedToTime = toDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }); // Format: HH:MM AM/PM

  const handleDocumentButtonClick = (e) => {
    e.stopPropagation(); // Prevent click from propagating to overlay
    Swal.fire({
      title: "Loading Document...",
      text: "Please wait while we load the document preview.",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(() => {
      setShowDocument(true);
      Swal.close();
    }, 1000);
  };

  const handleModalClick = (e) => {
    e.stopPropagation(); // Prevent click from propagating to overlay
  };

  const handleMedicalChange = (e) => {  // <--- Here's the declaration
    setIsMedical(e.target.checked);
  };

  const handleOverlayClick = () => {
    setShowDocument(false); // Close document modal if overlay is clicked.
    onClose(); // Close main modal if the overlay is clicked.
  };

  const getLateCountClass = (lateCount) => {
    if (lateCount < 3) return "SR-status-green";  // Green
    if (lateCount <= 5) return "SR-status-orange"; // Orange
    return "SR-status-red"; // Red
  };

  const passTypeLabels = {
    "od": "OD",
    "outpass": "Out Pass",
    "staypass": "Stay Pass",
    "leave": "Leave"
  };

  const reasonTypeLabels = {
    "intern": "Intern",
    "semester": "Semester",
    "festival": "Festival",
    "medical": "Medical",
    "others": "Other"
  };

  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  return (
    <div className="AR-modal-overlay" onClick={handleOverlayClick}> {/* Overlay click handler for main modal */}
      <div className="AR-modal-container" onClick={handleModalClick}> {/* Modal click handler */}
        <div className="AR-modal-content">
          <div className="AR-modal-header">
            <h2 className="AR-title">Request Details</h2>
            <button onClick={onClose} className="AR-close-button">
              <X className="AR-icon" />
            </button>
          </div>

          <div className="AR-modal-body">
            <PairedInfo
              left={{ label: "Name", value: record.name }}
              right={{ label: "Department", value: record.dept }}
            />

            <PairedInfo
              left={{ label: "Year", value: record.year }}
              right={{ label: "Room", value: record.room_no }}
            />

            <PairedInfo
              left={{
                label: "Pass Type",
                value: (
                  <span className="AR-badge AR-badge-primary">
                    {passTypeLabels[record.passtype] || record.passtype}
                  </span>
                )
              }}
              right={{
                label: "Late Count",
                value: (
                  <span className={`SR-late-circle ${getLateCountClass(record.late_count)}`}>
                    {record.late_count}
                  </span>
                )
              }}
            />

            <PairedInfo
              left={{ label: "From Date", value: formattedFromDate }}
              right={{ label: "From Time", value: formattedFromTime }}
            />
            <PairedInfo
              left={{ label: "To Date", value: formattedToDate }}
              right={{ label: "To Time", value: formattedToTime }}
            />

            <PairedInfo
              left={{ label: "Place to Visit", value: record.place_to_visit }}
              right={{
                label: "Reason Category",
                value: (
                  <span className="AR-badge SR-badge-secondary">
                    {reasonTypeLabels[record.reason_type] || record.reason_type}
                  </span>
                )
              }}
            />

            <div className="AR-parent-section">
              <span>Parent Approval</span>

              {getParentApprovalStatus(record.parent_approval) === "approved" ? (
                <span className="AR-otp-verified-badge">
                  <CheckCircle size={16} />
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  className="AR-send-otp-button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onSendParentOTP(record.pass_id);
                  }}
                >
                  <Send size={16} />
                  <span>Send Parent OTP</span>
                </button>
              )}
            </div>

            {(record.parent_approval === null || record.parent_approval === false) && (
              <div className="AR-warden-note">
                <span className="AR-label-warden">Warden notes</span>
                <textarea
                  value={comment || ""}
                  onChange={(e) => setComment(e.target.value)} // Update comment state
                ></textarea>
              </div>
            )}


            {record.reason_type === 'others' && (
              <div className="AR-additional-info">
                <span className="AR-label">Additional Details</span>
                <p className="AR-value">{record.reason_for_visit || ''}</p>
              </div>
            )}

            {record.passtype === 'outpass' && (
              <div className="AR-medical-checkbox">
                <label className="AR-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isMedical}
                    onChange={handleMedicalChange}
                    className="AR-checkbox"
                  />
                  <span className="AR-checkbox-text">Medical Related</span>
                </label>
              </div>
            )}
          </div>

          {(record.passtype === 'od' || record.passtype === 'leave') && record.file_path && (
            <button
              onClick={handleDocumentButtonClick}  // Use the new handler
              className="AR-document-button"
            >
              <FileText className="AR-icon" />
              <span>View Document</span>
            </button>
          )}

          <div className="AR-modal-footer">
            <button
              onClick={() => {
                Swal.fire({
                  title: "Decline Request?",
                  text: `Are you sure you want to decline this pass request for ${record.name}?`,
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#dc3545",
                  cancelButtonColor: "#6c757d",
                  confirmButtonText: "Yes, Decline",
                  cancelButtonText: "Cancel"
                }).then((result) => {
                  if (result.isConfirmed) {
                    onDecline(record.pass_id, isMedical, comment);
                  }
                });
              }}
              className="AR-button AR-button-secondary"
            >
              Decline
            </button>
            <button
              onClick={() => {
                Swal.fire({
                  title: "Accept Request?",
                  text: `Are you sure you want to accept this pass request for ${record.name}?`,
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonColor: "#28a745",
                  cancelButtonColor: "#6c757d",
                  confirmButtonText: "Yes, Accept",
                  cancelButtonText: "Cancel"
                }).then((result) => {
                  if (result.isConfirmed) {
                    onAccept(record.pass_id, isMedical, comment);
                  }
                });
              }}
              className="AR-button AR-button-primary"
            >
              Accept
            </button>
          </div>

        </div>
      </div>

      {showDocument && (
        <div className="AR-document-modal" onClick={handleOverlayClick}>
          <div className="AR-document-container" onClick={handleModalClick}>

            {/* Header */}
            <div className="AR-document-header">
              <h3 className="AR-document-title">Document Preview</h3>
              <button onClick={() => setShowDocument(false)} className="AR-close-button">
                <X className="AR-icon" />
              </button>
            </div>

            {/* Dynamic Content */}
            <div className="AR-document-content">
              {(() => {
                const fileUrl = UrlParser(record.file_path); // get parsed URL
                const fileExtension = fileUrl.split('.').pop().toLowerCase();

                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                  return <img src={fileUrl} alt="Document Preview" className="AR-document-image" />;
                } else if (fileExtension === 'pdf') {
                  return (
                    <iframe
                      src={fileUrl}
                      title="PDF Document"
                      className="AR-document-frame"
                    >
                      Your browser does not support PDF viewing. <a href={fileUrl}>Download PDF</a>
                    </iframe>
                  );
                } else {
                  return <p>Unsupported file format.</p>;
                }
              })()}
            </div>

          </div>
        </div>
      )}


    </div>
  );
}

export default SuperiorRequest;
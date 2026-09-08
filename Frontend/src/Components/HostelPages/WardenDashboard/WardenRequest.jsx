import React, { useState, useEffect } from "react";
import { Search, X, FileText, Send } from "lucide-react";
import "./WardenRequest.css";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { getRequest, postRequest } from "../../../api/axios";

function WardenRequest() {
  const [records, setRecords] = useState([]);
  const [otpError, setOtpError] = useState("");
  const [wardenYears, setWardenYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [passTypes, setPassTypes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isMedical, setIsMedical] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: 0,
    department: "",
    passType: "",
    search: "",
  });

  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpPassId, setOtpPassId] = useState(null);
  const [showDocument, setShowDocument] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };
  // Mapping Department Codes to Full Names
  const departmentLabels = {
    "AI&DS": "AI",
    AUTO: "Automobile",
    CIVIL: "Civil",
    CSE: "Computer Science",
    CYBER: "Cyber",
    EEE: "EEE",
    ECE: "ECE",
    EIE: "EIE",
    IT: "IT",
    MECH: "Mechanical",
    MBA: "MBA",
  };

  // Mapping Pass Types to Labels
  // Mapping Pass Types to Labels
  const passTypeLabels = {
    od: "OD",
    outpass: "Out Pass",
    staypass: "Stay Pass",
    leave: "Leave",
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

  useEffect(() => {
    fetchPendingPasses();
  }, []);

  const fetchPendingPasses = async () => {
    setLoading(true);

    try {
      const { data } = await getRequest("/api/fetch_passes_");

      setRecords(data?.data || []);

      setWardenYears([...new Set(data?.data?.map((pass) => pass.year) || [])]);

      setDepartments([...new Set(data?.data?.map((pass) => pass.dept) || [])]);

      setPassTypes([
        ...new Set(data?.data?.map((pass) => pass.passtype) || []),
      ]);
    } catch (error) {
      console.error("Error fetching passes:", error);
      Swal.fire({
        title: "Error ❌",
        text:
          error.response?.data?.message || "Failed to fetch pending passes.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendParentOTP = async (pass_id) => {
    try {
      await postRequest("/api/send_parent_otp", {
        pass_id,
      });

      toast.success(
        "OTP has been sent to the parent's registered mobile number.",
        {
          position: "bottom-right",
        },
      );

      // OTP sent successfully
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send parent OTP.");

      // OTP sending failed
      return false;
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
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/api/verify_parent_otp`,
        {
          pass_id: otpPassId,
          otp: enteredOtp,
        },
        {
          withCredentials: true,
          timeout: 30000,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

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

  const handleAccept = async (pass_id, medical_status, comment) => {
    Swal.fire({
      title: "Processing ⏳",
      text: "Accepting pass request...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await postRequest("/api/warden_decision", {
        pass_id,
        action: "approve",
        medical_status,
        comment: comment || "",
      });

      Swal.fire({
        title: "Success! ✅",
        text: "Pass request accepted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      setRecords((prev) => prev.filter((record) => record.pass_id !== pass_id));

      setSelectedRecord(null);
    } catch (error) {
      if (!error.response) {
        Swal.fire({
          title: "Error ❌",
          text: "An unexpected error occurred.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };

  const handleDecline = async (pass_id, medical_status, comment) => {
    Swal.fire({
      title: "Processing ⏳",
      text: "Declining pass request...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await postRequest("/api/warden_decision", {
        pass_id,
        action: "reject",
        medical_status,
        comment: comment || "",
      });

      Swal.fire({
        title: "Declined ✅",
        text: "Pass request declined successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        setRecords((prev) =>
          prev.filter((record) => record.pass_id !== pass_id),
        );
        setSelectedRecord(null);
      });
    } catch (error) {
      if (!error.response) {
        Swal.fire({
          title: "Error ❌",
          text: "An error occurred while declining the pass. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
  console.log(records);
  const filteredRecords = records
    .filter((record) => {
      const searchQuery = filters.search.toLowerCase();

      return (
        (!filters.year || record.year.toString() === filters.year) &&
        (!filters.department || record.dept === filters.department) &&
        (!filters.passType || record.passtype === filters.passType) &&
        (!filters.search ||
          record.name.toLowerCase().includes(searchQuery) ||
          record.room_no.toLowerCase().includes(searchQuery) ||
          record.place_to_visit.toLowerCase().includes(searchQuery))
      );
    })
    .sort((a, b) => {
      const getStatusPriority = (record) => {
        const status = String(record.parent_approval).toLowerCase();

        // Pending first
        if (record.parent_approval === null || status === "pending") {
          return 0;
        }

        // Accepted second
        if (status === "approved" || status === "accepted") {
          return 1;
        }

        // Rejected last
        if (status === "declined" || status === "rejected") {
          return 2;
        }

        // Unknown status
        return 3;
      };

      return getStatusPriority(a) - getStatusPriority(b);
    });

  return (
    <div className="AR-app">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
      <div className="AR-main">
        <h1 className="AR-page-title">Requests</h1>

        <div className="AR-filter-bar">
          <div className="AR-search-container">
            <Search className="AR-search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Room No, or Place..."
              className="AR-search-input"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
          <div className="AR-filters">
            {/* Year Filter (Dynamically Generated) */}
            <select
              className="AR-filter-select"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, year: e.target.value }))
              }
            >
              <option value="">All Years</option>
              {wardenYears.map((year) => (
                <option key={year} value={year}>
                  {year === 1
                    ? "First Year"
                    : year === 2
                      ? "Second Year"
                      : year === 3
                        ? "Third Year"
                        : year === 4
                          ? "Fourth Year"
                          : year === 9
                            ? "ME"
                            : year === 10
                              ? "MBA"
                              : `year ${year}`}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              className="AR-filter-select"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, department: e.target.value }))
              }
            >
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
            <select
              className="AR-filter-select"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, passType: e.target.value }))
              }
            >
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

            <div className="navigate-button">
              <button
                onClick={() =>
                  navigate("/hostel/warden/request/Food-Change-Request")
                }
                className="Food-Request-button"
              >
                Food Type Requests
              </button>
              <button
                onClick={() =>
                  navigate("/hostel/warden/request/pass-log-history")
                }
                className="Food-Request-button"
              >
                Pass Log History
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="AR-loading-message">
            ⏳ Loading pending pass requests...
          </p>
        ) : filteredRecords.length === 0 ? (
          <p className="AR-no-data-message">
            📋 No pending pass requests found.
          </p>
        ) : (
          <div className="AR-table-container">
            <table className="AR-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Room</th>
                  <th>Reg data</th>
                  <th>Pass Type</th>
                  <th>from Date</th>
                  <th>Late Count</th>
                  <th>Parent Approval</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  // Determine row color based on late_count
                  const getRowClass = (late_count) => {
                    if (late_count < 3) return "AR-row-green"; // Green row
                    if (late_count <= 5) return "AR-row-orange"; // Orange row
                    return "AR-row-red"; // Red row
                  };
                  const getStatusClass = (status) => {
                    const normalized = getParentApprovalStatus(status);
                    if (normalized === "approved") return "AR-status-green";
                    if (normalized === "declined") return "AR-status-red";
                    return "AR-status-orange"; // Pending
                  };

                  return (
                    <>
                      <tr
                        key={record.pass_id}
                        className={getRowClass(record.late_count)}
                        onClick={() => {
                          setSelectedRecord(
                            selectedRecord?.pass_id === record.pass_id
                              ? null
                              : record,
                          );
                          setShowDocument(false);
                        }}
                      >
                        <td>{record.name}</td>
                        <td>
                          {["I", "II", "III", "IV"][record.year - 1] ||
                            record.year}
                        </td>
                        <td>{record.room_no}</td>
                        <td>
                          {new Date(record.request_time)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, " - ")}
                        </td>
                        <td>
                          {passTypeLabels[record.passtype] || record.passtype}
                        </td>
                        <td>
                          {new Date(record.from)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, " - ")}
                        </td>
                        <td>
                          {record.passtype === "outpass" ? (
                            <span
                              className={`AR-late-circle ${getRowClass(record.late_count)}`}
                            >
                              {record.late_count}
                            </span>
                          ) : (
                            <span
                              className={`AR-late-circle ${getRowClass(record.late_count)}`}
                            >
                              -
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`AR-status-circle ${getStatusClass(record.parent_approval)}`}
                          >
                            {getParentApprovalStatus(record.parent_approval) ===
                            "approved"
                              ? "Accepted"
                              : getParentApprovalStatus(
                                    record.parent_approval,
                                  ) === "declined"
                                ? "Declined"
                                : "Pending"}
                          </span>
                        </td>
                      </tr>

                      {selectedRecord?.pass_id === record.pass_id && (
                        <tr className="AR-details-row">
                          <td colSpan="8">
                            <div className="AR-inline-details">
                              <div className="AR-inline-details-header">
                                <h2>Request Details</h2>
                              </div>

                              <div className="AR-inline-details-grid">
                                <div>
                                  <span>Name</span>
                                  <p>{record.name}</p>
                                </div>

                                <div>
                                  <span>Department</span>
                                  <p>{record.dept}</p>
                                </div>

                                <div>
                                  <span>Year</span>
                                  <p>
                                    {["I", "II", "III", "IV"][
                                      record.year - 1
                                    ] || record.year}
                                  </p>
                                </div>

                                <div>
                                  <span>Room</span>
                                  <p>{record.room_no}</p>
                                </div>

                                <div>
                                  <span>Pass Type</span>
                                  <p>
                                    {passTypeLabels[record.passtype] ||
                                      record.passtype}
                                  </p>
                                </div>

                                <div>
                                  <span>Late Count</span>
                                  <p>
                                    {record.passtype === "outpass"
                                      ? record.late_count
                                      : "-"}
                                  </p>
                                </div>

                                <div>
                                  <span>From Date</span>
                                  <p>
                                    {new Date(record.from)
                                      .toLocaleDateString("en-GB")
                                      .replace(/\//g, " - ")}
                                  </p>
                                </div>

                                <div>
                                  <span>From Time</span>
                                  <p>
                                    {new Date(record.from).toLocaleTimeString(
                                      "en-US",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      },
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span>To Date</span>
                                  <p>
                                    {new Date(record.to)
                                      .toLocaleDateString("en-GB")
                                      .replace(/\//g, " - ")}
                                  </p>
                                </div>

                                <div>
                                  <span>To Time</span>
                                  <p>
                                    {new Date(record.to).toLocaleTimeString(
                                      "en-US",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      },
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span>Place to Visit</span>
                                  <p>{record.place_to_visit}</p>
                                </div>

                                <div>
                                  <span>Reason</span>
                                  <p>
                                    {record.reason_type === "intern"
                                      ? "Intern"
                                      : record.reason_type === "semester"
                                        ? "Semester"
                                        : record.reason_type === "festival"
                                          ? "Festival"
                                          : record.reason_type === "medical"
                                            ? "Medical"
                                            : record.reason_type === "others"
                                              ? "Other"
                                              : record.reason_type}
                                  </p>
                                </div>

                                <div>
                                  <span>Parent Approval</span>
                                  <p>
                                    {getParentApprovalStatus(
                                      record.parent_approval,
                                    ) === "approved"
                                      ? "Accepted"
                                      : getParentApprovalStatus(
                                            record.parent_approval,
                                          ) === "declined"
                                        ? "Declined"
                                        : "Pending"}
                                  </p>
                                </div>
                              </div>

                              {getParentApprovalStatus(
                                record.parent_approval,
                              ) !== "approved" && (
                                <div className="AR-parent-section">
                                  <span>Parent Approval</span>

                                  <button
                                    type="button"
                                    className="AR-send-otp-button"
                                    onClick={async (e) => {
                                      e.stopPropagation();

                                      const success = await handleSendParentOTP(
                                        record.pass_id,
                                      );

                                      if (success) {
                                        openOtpPopup(record.pass_id);
                                      }
                                    }}
                                  >
                                    <Send />
                                    <span>Send Parent OTP</span>
                                  </button>
                                </div>
                              )}

                              {(record.parent_approval === null ||
                                record.parent_approval === false) && (
                                <div className="AR-warden-note">
                                  <span>Warden Notes</span>

                                  <textarea
                                    placeholder="Enter warden notes..."
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}

                              {record.reason_type === "others" && (
                                <div className="AR-additional-info">
                                  <span>Additional Details</span>
                                  <p>{record.reason_for_visit || "-"}</p>
                                </div>
                              )}

                              {record.passtype === "outpass" && (
                                <div className="AR-medical-checkbox">
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={isMedical}
                                      onChange={(e) =>
                                        setIsMedical(e.target.checked)
                                      }
                                    />
                                    <span>Medical Related</span>
                                  </label>
                                </div>
                              )}

                                                            {(record.passtype === "od" ||
                                record.passtype === "leave") &&
                                record.file_path && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDocument(true);
                                    }}
                                    className="AR-document-button"
                                  >
                                    <FileText size={18} />
                                    View Document
                                  </button>
                                )}

                              <div className="AR-inline-actions">
                                <button
                                  className="AR-decline-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDecline(record.pass_id, isMedical);
                                  }}
                                >
                                  Decline
                                </button>

                                <button
                                  className="AR-accept-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAccept(record.pass_id, isMedical, "");
                                  }}
                                >
                                  Accept
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* {selectedRecord && (
          <DetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onSendParentOTP={handleSendParentOTP}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isMedical={isMedical} // ✅ Pass down medical state
            setIsMedical={setIsMedical} // ✅ Allow modal to update medical state
          />
        )} */}

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

        {showDocument && selectedRecord && (
          <div
            className="AR-document-modal"
            onClick={() => setShowDocument(false)}
          >
            <div
              className="AR-document-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="AR-document-header">
                <h3 className="AR-document-title">Document Preview</h3>
                <button
                  onClick={() => setShowDocument(false)}
                  className="AR-close-button"
                >
                  <X className="AR-icon" />
                </button>
              </div>

              <div className="AR-document-content">
                {(() => {
                  const fileUrl = UrlParser(selectedRecord.file_path);
                  const fileExtension = fileUrl.split(".").pop().toLowerCase();

                  if (
                    ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
                      fileExtension,
                    )
                  ) {
                    return (
                      <img
                        src={fileUrl}
                        alt="Document Preview"
                        className="AR-document-image"
                      />
                    );
                  } else if (fileExtension === "pdf") {
                    return (
                      <iframe
                        src={fileUrl}
                        title="PDF Document"
                        className="AR-document-frame"
                      >
                        Your browser does not support PDF viewing.{" "}
                        <a href={fileUrl}>Download PDF</a>
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
    </div>
  );
}

function DetailModal({
  record,
  onClose,
  onSendParentOTP,
  onAccept,
  onDecline,
  isMedical,
  setIsMedical,
}) {
  const [showDocument, setShowDocument] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [comment, setComment] = useState(null);
  console.log("Record", record.file_path);

  // Convert "from" and "to" timestamps into date & time formats
  const fromDateTime = new Date(record.from);
  const toDateTime = new Date(record.to);

  const formattedFromDate = fromDateTime
    .toLocaleDateString("en-GB")
    .replace(/\//g, " - "); // Format: DD - MM - YYYY
  const formattedFromTime = fromDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }); // Format: HH:MM AM/PM

  const formattedToDate = toDateTime
    .toLocaleDateString("en-GB")
    .replace(/\//g, " - "); // Format: DD - MM - YYYY
  const formattedToTime = toDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }); // Format: HH:MM AM/PM

  const handleDocumentButtonClick = (e) => {
    e.stopPropagation(); // Prevent click from propagating to overlay

    if (!record.file_path) {
      Swal.fire({
        title: "No Document",
        text: "No document is attached to this request.",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    // Show loading message
    Swal.fire({
      title: "Loading Document ⏳",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 1000,
      showConfirmButton: false,
    }).then(() => {
      setShowDocument(true);
    });
  };

  const handleModalClick = (e) => {
    e.stopPropagation(); // Prevent click from propagating to overlay
  };

  const handleMedicalChange = (e) => {
    // <--- Here's the declaration
    setIsMedical(e.target.checked);
  };

  const handleOverlayClick = () => {
    setShowDocument(false); // Close document modal if overlay is clicked.
    onClose(); // Close main modal if the overlay is clicked.
  };

  const ConfirmationModal = ({ onConfirm, onCancel }) => (
    <div className="AR-confirmation-modal-overlay">
      <div className="AR-confirmation-modal">
        <h3>Confirm Acceptance</h3>
        <p>Are you sure you want to accept this pass request?</p>
        <div className="AR-confirmation-buttons">
          <button onClick={onAccept} className="AR-button AR-button-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="AR-button AR-button-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  const getLateCountClass = (lateCount, passType) => {
    if (passType === "outpass") {
      if (lateCount < 3) return "AR-status-green"; // Green
      if (lateCount <= 5) return "AR-status-orange"; // Orange
      return "AR-status-red"; // Red
    }
    return "AR-status-gray";
  };

  const passTypeLabels = {
    od: "OD",
    outpass: "Out Pass",
    staypass: "Stay Pass",
    leave: "Leave",
  };

  const reasonTypeLabels = {
    intern: "Intern",
    semester: "Semester",
    festival: "Festival",
    medical: "Medical",
    others: "Other",
  };

  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  return (
    <div className="AR-modal-overlay" onClick={handleOverlayClick}>
      {" "}
      {/* Overlay click handler for main modal */}
      <div className="AR-modal-container" onClick={handleModalClick}>
        {" "}
        {/* Modal click handler */}
        <div className="AR-modal-content">
          <div className="AR-modal-header">
            <h2 className="AR-title">Request Details</h2>
            <button onClick={onClose} className="AR-close-button">
              <X className="AR-icon" />
            </button>
          </div>

          {(record.passtype === "od" || record.passtype === "leave") &&
            record.file_path && (
              <button
                onClick={handleDocumentButtonClick} // Use the new handler
                className="AR-document-button"
              >
                <FileText className="AR-icon" />
                <span>View Document</span>
              </button>
            )}

          <div className="AR-modal-footer">
            <button
              onClick={() => onDecline(record.pass_id, isMedical)}
              className="AR-button AR-button-secondary"
            >
              Decline
            </button>
            <button
              onClick={() => setShowConfirmation(true)}
              className="AR-button AR-button-primary"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
      {showConfirmation && (
        <ConfirmationModal
          onConfirm={() => {
            onAccept(record.pass_id, isMedical, comment);
            setShowConfirmation(false);
          }}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
      {showDocument && (
        <div className="AR-document-modal" onClick={handleOverlayClick}>
          <div className="AR-document-container" onClick={handleModalClick}>
            {/* Header */}
            <div className="AR-document-header">
              <h3 className="AR-document-title">Document Preview</h3>
              <button
                onClick={() => setShowDocument(false)}
                className="AR-close-button"
              >
                <X className="AR-icon" />
              </button>
            </div>

            {/* Dynamic Content */}
            <div className="AR-document-content">
              {(() => {
                const fileUrl = UrlParser(record.file_path);
                const fileExtension = fileUrl.split(".").pop().toLowerCase();

                if (
                  ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
                    fileExtension,
                  )
                ) {
                  return (
                    <img
                      src={fileUrl}
                      alt="Document Preview"
                      className="AR-document-image"
                    />
                  );
                } else if (fileExtension === "pdf") {
                  return (
                    <iframe
                      src={fileUrl}
                      title="PDF Document"
                      className="AR-document-frame"
                    >
                      Your browser does not support PDF viewing.{" "}
                      <a href={fileUrl}>Download PDF</a>
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

export default WardenRequest;

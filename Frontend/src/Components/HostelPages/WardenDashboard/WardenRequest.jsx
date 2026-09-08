
import React, { useState, useEffect } from "react";
import { Search, X, FileText, Send } from "lucide-react";
import "./WardenRequest.css";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { getRequest, postRequest } from "../../../api/axios";

function WardenRequest() {
  // ============================================================
  // STATE
  // ============================================================

  const [records, setRecords] = useState([]);
  const [otpError, setOtpError] = useState("");
  const [wardenYears, setWardenYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [passTypes, setPassTypes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isMedical, setIsMedical] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    year: "",
    department: "",
    passType: "",
    search: "",
  });

  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [otpPassId, setOtpPassId] = useState(null);
  const [showDocument, setShowDocument] = useState(false);

  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_QR_URL;

  // ============================================================
  // URL PARSER
  // ============================================================

  const UrlParser = (path) => {
    if (!path) return "";

    if (path.startsWith("http")) {
      return path;
    }

    return `${BASE_URL || ""}${path}`;
  };

  // ============================================================
  // DEPARTMENT LABELS
  // ============================================================

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

  // ============================================================
  // PASS TYPE LABELS
  // ============================================================

  const passTypeLabels = {
    od: "OD",
    outpass: "Out Pass",
    staypass: "Stay Pass",
    leave: "Leave",
  };

  // ============================================================
  // PARENT APPROVAL STATUS
  // ============================================================

  const getParentApprovalStatus = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "pending";
    }

    if (typeof value === "boolean") {
      return value ? "approved" : "declined";
    }

    const normalized = String(value)
      .trim()
      .toLowerCase();

    if (
      [
        "approved",
        "approve",
        "accepted",
        "accept",
        "true",
        "1",
      ].includes(normalized)
    ) {
      return "approved";
    }

    if (
      [
        "declined",
        "decline",
        "rejected",
        "reject",
        "false",
        "0",
      ].includes(normalized)
    ) {
      return "declined";
    }

    return "pending";
  };

  // ============================================================
  // FETCH PENDING PASSES
  // ============================================================

  useEffect(() => {
    fetchPendingPasses();
  }, []);

  const fetchPendingPasses = async () => {
    setLoading(true);

    try {
      console.log(
        "=========================================="
      );

      console.log(
        "FETCHING PENDING PASSES..."
      );

      const response =
        await getRequest("/api/fetch_passes_");

      // ========================================================
      // IMPORTANT DEBUG LOGS
      // ========================================================

      console.log(
        "FULL API RESPONSE:",
        response
      );

      console.log(
        "API RESPONSE DATA:",
        response?.data
      );

      console.log(
        "API PASSES:",
        response?.data?.data
      );

      // ========================================================
      // SAFELY EXTRACT ARRAY
      // ========================================================

      let passes = [];

      if (
        Array.isArray(response?.data?.data)
      ) {
        passes = response.data.data;
      } else if (
        Array.isArray(response?.data)
      ) {
        passes = response.data;
      } else if (
        Array.isArray(response)
      ) {
        passes = response;
      }

      console.log(
        "FINAL RECORDS ARRAY:",
        passes
      );

      console.log(
        "RECORD COUNT:",
        passes.length
      );

      console.log(
        "=========================================="
      );

      // ========================================================
      // SET RECORDS
      // ========================================================

      setRecords(passes);

      // ========================================================
      // YEARS
      // ========================================================

      const years = [
        ...new Set(
          passes
            .map((pass) => pass?.year)
            .filter(
              (year) =>
                year !== null &&
                year !== undefined &&
                year !== ""
            )
        ),
      ];

      setWardenYears(years);

      // ========================================================
      // DEPARTMENTS
      // ========================================================

      const depts = [
        ...new Set(
          passes
            .map((pass) => pass?.dept)
            .filter(Boolean)
        ),
      ];

      setDepartments(depts);

      // ========================================================
      // PASS TYPES
      // ========================================================

      const types = [
        ...new Set(
          passes
            .map((pass) => pass?.passtype)
            .filter(Boolean)
        ),
      ];

      setPassTypes(types);

    } catch (error) {
      console.error(
        "❌ Error fetching passes:",
        error
      );

      console.error(
        "❌ Server response:",
        error?.response?.data
      );

      setRecords([]);

      Swal.fire({
        title: "Error ❌",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to fetch pending passes.",
        icon: "error",
        confirmButtonText: "OK",
      });

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SEND PARENT OTP
  // ============================================================

  const handleSendParentOTP = async (pass_id) => {
    try {
      if (!pass_id) {
        toast.error("Pass ID is missing.");
        return false;
      }

      console.log(
        "Sending parent OTP for:",
        pass_id
      );

      await postRequest(
        "/api/send_parent_otp",
        {
          pass_id,
        }
      );

      toast.success(
        "OTP has been sent to the parent's registered mobile number.",
        {
          position: "bottom-right",
        }
      );

      return true;

    } catch (error) {
      console.error(
        "Send Parent OTP Error:",
        error
      );

      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to send parent OTP."
      );

      return false;
    }
  };

  // ============================================================
  // OPEN OTP POPUP
  // ============================================================

  const openOtpPopup = (pass_id) => {
    setOtp([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setOtpPassId(pass_id);

    setOtpError("");

    setShowOtpPopup(true);

    setTimeout(() => {
      document
        .getElementById("otp-input-0")
        ?.focus();
    }, 100);
  };

  // ============================================================
  // OTP CHANGE
  // ============================================================

  const handleOtpChange = (
    value,
    index
  ) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];

    newOtp[index] =
      value.slice(-1);

    setOtp(newOtp);

    if (otpError) {
      setOtpError("");
    }

    if (
      value &&
      index < 5
    ) {
      document
        .getElementById(
          `otp-input-${index + 1}`
        )
        ?.focus();
    }
  };

  // ============================================================
  // OTP KEY DOWN
  // ============================================================

  const handleOtpKeyDown = (
    e,
    index
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      document
        .getElementById(
          `otp-input-${index - 1}`
        )
        ?.focus();
    }

    if (
      e.key === "ArrowLeft" &&
      index > 0
    ) {
      document
        .getElementById(
          `otp-input-${index - 1}`
        )
        ?.focus();
    }

    if (
      e.key === "ArrowRight" &&
      index < 5
    ) {
      document
        .getElementById(
          `otp-input-${index + 1}`
        )
        ?.focus();
    }
  };

  // ============================================================
  // OTP PASTE
  // ============================================================

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pastedData =
      e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!pastedData) {
      return;
    }

    const newOtp = [
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    pastedData
      .split("")
      .forEach(
        (digit, index) => {
          newOtp[index] = digit;
        }
      );

    setOtp(newOtp);

    const lastIndex =
      Math.min(
        pastedData.length - 1,
        5
      );

    setTimeout(() => {
      document
        .getElementById(
          `otp-input-${lastIndex}`
        )
        ?.focus();
    }, 50);
  };

  // ============================================================
  // VERIFY PARENT OTP
  // ============================================================

  const handleValidateOTP =
    async () => {
      const enteredOtp =
        otp.join("");

      if (
        enteredOtp.length !== 6
      ) {
        setOtpError(
          "Please enter the complete 6-digit OTP."
        );
        return;
      }

      if (!otpPassId) {
        setOtpError(
          "Pass ID is missing."
        );
        return;
      }

      try {
        console.log(
          "Verifying OTP for:",
          otpPassId
        );

        const response =
          await axios.post(
            `${process.env.REACT_APP_BASE_URL}/api/verify_parent_otp`,
            {
              pass_id: otpPassId,
              otp: enteredOtp,
            },
            {
              withCredentials: true,
              timeout: 30000,
              headers: {
                Accept:
                  "application/json",
                "Content-Type":
                  "application/json",
              },
            }
          );

        console.log(
          "OTP verification response:",
          response
        );

        toast.success(
          response?.data?.message ||
            "OTP verified successfully.",
          {
            position:
              "bottom-right",
          }
        );

        // ======================================================
        // UPDATE RECORD
        // ======================================================

        setRecords((prev) =>
          Array.isArray(prev)
            ? prev.map(
                (record) =>
                  record?.pass_id ===
                  otpPassId
                    ? {
                        ...record,
                        parent_approval:
                          "Approved",
                      }
                    : record
              )
            : []
        );

        // ======================================================
        // UPDATE SELECTED RECORD
        // ======================================================

        setSelectedRecord(
          (prev) =>
            prev?.pass_id ===
            otpPassId
              ? {
                  ...prev,
                  parent_approval:
                    "Approved",
                }
              : prev
        );

        // ======================================================
        // CLOSE POPUP
        // ======================================================

        setShowOtpPopup(false);

        setOtp([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        setOtpPassId(null);

        setOtpError("");

      } catch (error) {
        console.error(
          "OTP verification error:",
          error
        );

        setOtpError(
          error?.response?.data
            ?.error ||
            error?.response?.data
              ?.message ||
            "Invalid OTP. Please try again."
        );
      }
    };

  // ============================================================
  // ACCEPT
  // ============================================================

  const handleAccept = async (
    pass_id,
    medical_status,
    comment
  ) => {
    Swal.fire({
      title: "Processing ⏳",
      text: "Accepting pass request...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await postRequest(
        "/api/warden_decision",
        {
          pass_id,
          action: "approve",
          medical_status,
          comment: comment || "",
        }
      );

      Swal.fire({
        title: "Success! ✅",
        text:
          "Pass request accepted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      setRecords((prev) =>
        Array.isArray(prev)
          ? prev.filter(
              (record) =>
                record?.pass_id !==
                pass_id
            )
          : []
      );

      setSelectedRecord(null);

      setIsMedical(false);

    } catch (error) {
      console.error(
        "Accept error:",
        error
      );

      Swal.close();

      Swal.fire({
        title: "Error ❌",
        text:
          error?.response?.data
            ?.message ||
          error?.response?.data
            ?.error ||
          "Failed to accept pass request.",
        icon: "error",
        confirmButtonText:
          "OK",
      });
    }
  };

  // ============================================================
  // DECLINE
  // ============================================================

  const handleDecline =
    async (
      pass_id,
      medical_status,
      comment
    ) => {
      Swal.fire({
        title: "Processing ⏳",
        text: "Declining pass request...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await postRequest(
          "/api/warden_decision",
          {
            pass_id,
            action: "reject",
            medical_status,
            comment: comment || "",
          }
        );

        Swal.fire({
          title: "Declined ✅",
          text:
            "Pass request declined successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          setRecords((prev) =>
            Array.isArray(prev)
              ? prev.filter(
                  (record) =>
                    record?.pass_id !==
                    pass_id
                )
              : []
          );

          setSelectedRecord(null);

          setIsMedical(false);
        });

      } catch (error) {
        console.error(
          "Decline error:",
          error
        );

        Swal.close();

        Swal.fire({
          title: "Error ❌",
          text:
            error?.response?.data
              ?.message ||
            error?.response?.data
              ?.error ||
            "An error occurred while declining the pass.",
          icon: "error",
          confirmButtonText:
            "OK",
        });
      }
    };

  // ============================================================
  // SAFE RECORDS ARRAY
  // ============================================================

  const safeRecords =
    Array.isArray(records)
      ? records
      : [];

  // ============================================================
  // FILTER RECORDS
  // ============================================================

  const filteredRecords =
    safeRecords
      .filter((record) => {
        if (!record) {
          return false;
        }

        const searchQuery =
          String(
            filters.search || ""
          )
            .trim()
            .toLowerCase();

        const recordYear =
          String(
            record.year ?? ""
          );

        const recordDept =
          String(
            record.dept ?? ""
          );

        const recordPassType =
          String(
            record.passtype ?? ""
          );

        const recordName =
          String(
            record.name ?? ""
          ).toLowerCase();

        const recordRoom =
          String(
            record.room_no ?? ""
          ).toLowerCase();

        const recordPlace =
          String(
            record.place_to_visit ??
              ""
          ).toLowerCase();

        return (
          (
            !filters.year ||
            recordYear ===
              String(
                filters.year
              )
          ) &&

          (
            !filters.department ||
            recordDept ===
              String(
                filters.department
              )
          ) &&

          (
            !filters.passType ||
            recordPassType ===
              String(
                filters.passType
              )
          ) &&

          (
            !searchQuery ||
            recordName.includes(
              searchQuery
            ) ||
            recordRoom.includes(
              searchQuery
            ) ||
            recordPlace.includes(
              searchQuery
            )
          )
        );
      })
      .sort((a, b) => {
        const getStatusPriority =
          (record) => {
            const status =
              getParentApprovalStatus(
                record?.parent_approval
              );

            if (
              status === "pending"
            ) {
              return 0;
            }

            if (
              status === "approved"
            ) {
              return 1;
            }

            if (
              status === "declined"
            ) {
              return 2;
            }

            return 3;
          };

        return (
          getStatusPriority(a) -
          getStatusPriority(b)
        );
      });

  // ============================================================
  // ROW CLASS
  // ============================================================

  const getRowClass =
    (late_count) => {
      const count =
        Number(late_count) || 0;

      if (count < 3) {
        return "AR-row-green";
      }

      if (count <= 5) {
        return "AR-row-orange";
      }

      return "AR-row-red";
    };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass =
    (status) => {
      const normalized =
        getParentApprovalStatus(
          status
        );

      if (
        normalized === "approved"
      ) {
        return "AR-status-green";
      }

      if (
        normalized === "declined"
      ) {
        return "AR-status-red";
      }

      return "AR-status-orange";
    };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      isNaN(date.getTime())
    ) {
      return "-";
    }

    return date
      .toLocaleDateString(
        "en-GB"
      )
      .replace(
        /\//g,
        " - "
      );
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      isNaN(date.getTime())
    ) {
      return "-";
    }

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  // ============================================================
  // YEAR LABEL
  // ============================================================

  const getYearLabel =
    (year) => {
      const numericYear =
        Number(year);

      const labels = {
        1: "I",
        2: "II",
        3: "III",
        4: "IV",
      };

      return (
        labels[numericYear] ||
        year ||
        "-"
      );
    };

  // ============================================================
  // RETURN UI
  // ============================================================

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

        {/* ======================================================
            PAGE TITLE
        ====================================================== */}

        <h1 className="AR-page-title">
          Requests
        </h1>

        {/* ======================================================
            FILTER BAR
        ====================================================== */}

        <div className="AR-filter-bar">

          {/* SEARCH */}

          <div className="AR-search-container">
            <Search className="AR-search-icon" />

            <input
              type="text"
              placeholder="Search by Name, Room No, or Place..."
              className="AR-search-input"
              value={
                filters.search
              }
              onChange={(e) =>
                setFilters(
                  (prev) => ({
                    ...prev,
                    search:
                      e.target.value,
                  })
                )
              }
            />
          </div>

          <div className="AR-filters">

            {/* YEAR */}

            <select
              className="AR-filter-select"
              value={
                filters.year
              }
              onChange={(e) =>
                setFilters(
                  (prev) => ({
                    ...prev,
                    year:
                      e.target.value,
                  })
                )
              }
            >
              <option value="">
                All Years
              </option>

              {wardenYears.map(
                (year) => (
                  <option
                    key={String(
                      year
                    )}
                    value={year}
                  >
                    {Number(year) ===
                    1
                      ? "First Year"
                      : Number(year) ===
                        2
                      ? "Second Year"
                      : Number(year) ===
                        3
                      ? "Third Year"
                      : Number(year) ===
                        4
                      ? "Fourth Year"
                      : Number(year) ===
                        9
                      ? "ME"
                      : Number(year) ===
                        10
                      ? "MBA"
                      : `Year ${year}`}
                  </option>
                )
              )}
            </select>

            {/* DEPARTMENT */}

            <select
              className="AR-filter-select"
              value={
                filters.department
              }
              onChange={(e) =>
                setFilters(
                  (prev) => ({
                    ...prev,
                    department:
                      e.target.value,
                  })
                )
              }
            >
              <option value="">
                All Departments
              </option>

              {departments.length >
              0 ? (
                departments.map(
                  (dept) => (
                    <option
                      key={dept}
                      value={dept}
                    >
                      {
                        departmentLabels[
                          dept
                        ]
                      ||
                        dept}
                    </option>
                  )
                )
              ) : (
                <option disabled>
                  No departments available
                </option>
              )}
            </select>

            {/* PASS TYPE */}

            <select
              className="AR-filter-select"
              value={
                filters.passType
              }
              onChange={(e) =>
                setFilters(
                  (prev) => ({
                    ...prev,
                    passType:
                      e.target.value,
                  })
                )
              }
            >
              <option value="">
                All Types
              </option>

              {passTypes.length >
              0 ? (
                passTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {
                        passTypeLabels[
                          type
                        ]
                      ||
                        type}
                    </option>
                  )
                )
              ) : (
                <option disabled>
                  No pass types available
                </option>
              )}
            </select>

            {/* NAVIGATION BUTTONS */}

            <div className="navigate-button">

              <button
                onClick={() =>
                  navigate(
                    "/hostel/warden/request/Food-Change-Request"
                  )
                }
                className="Food-Request-button"
              >
                Food Type Requests
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/hostel/warden/request/pass-log-history"
                  )
                }
                className="Food-Request-button"
              >
                Pass Log History
              </button>

            </div>
          </div>
        </div>

        {/* ======================================================
            LOADING / NO DATA / TABLE
        ====================================================== */}

        {loading ? (
          <p className="AR-loading-message">
            ⏳ Loading pending pass requests...
          </p>
        ) : filteredRecords.length ===
          0 ? (
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

                {filteredRecords.map(
                  (record) => {

                    const parentStatus =
                      getParentApprovalStatus(
                        record?.parent_approval
                      );

                    return (
                      <React.Fragment
                        key={
                          record?.pass_id ||
                          `${record?.registration_number}-${record?.request_time}`
                        }
                      >

                        {/* ==================================================
                            MAIN ROW
                        ================================================== */}

                        <tr
                          className={getRowClass(
                            record?.late_count
                          )}
                          onClick={() => {

                            setSelectedRecord(
                              selectedRecord?.pass_id ===
                                record?.pass_id
                                ? null
                                : record
                            );

                            setShowDocument(
                              false
                            );

                          }}
                        >

                          <td>
                            {record?.name ||
                              "-"}
                          </td>

                          <td>
                            {getYearLabel(
                              record?.year
                            )}
                          </td>

                          <td>
                            {record?.room_no ||
                              "-"}
                          </td>

                          <td>
                            {formatDate(
                              record?.request_time
                            )}
                          </td>

                          <td>
                            {
                              passTypeLabels[
                                record?.passtype
                              ] ||
                              record?.passtype ||
                              "-"
                            }
                          </td>

                          <td>
                            {formatDate(
                              record?.from
                            )}
                          </td>

                          <td>

                            {record?.passtype ===
                            "outpass" ? (
                              <span
                                className={`AR-late-circle ${getRowClass(
                                  record?.late_count
                                )}`}
                              >
                                {
                                  record?.late_count ??
                                  0
                                }
                              </span>
                            ) : (
                              <span
                                className={`AR-late-circle ${getRowClass(
                                  record?.late_count
                                )}`}
                              >
                                -
                              </span>
                            )}

                          </td>

                          <td>

                            <span
                              className={`AR-status-circle ${getStatusClass(
                                record?.parent_approval
                              )}`}
                            >
                              {parentStatus ===
                              "approved"
                                ? "Accepted"
                                : parentStatus ===
                                  "declined"
                                ? "Declined"
                                : "Pending"}
                            </span>

                          </td>

                        </tr>

                        {/* ==================================================
                            DETAILS ROW
                        ================================================== */}

                        {selectedRecord?.pass_id ===
                          record?.pass_id && (

                          <tr className="AR-details-row">

                            <td colSpan="8">

                              <div className="AR-inline-details">

                                <div className="AR-inline-details-header">
                                  <h2>
                                    Request Details
                                  </h2>
                                </div>

                                <div className="AR-inline-details-grid">

                                  <div>
                                    <span>
                                      Name
                                    </span>
                                    <p>
                                      {record?.name ||
                                        "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Department
                                    </span>
                                    <p>
                                      {record?.dept ||
                                        "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Year
                                    </span>
                                    <p>
                                      {getYearLabel(
                                        record?.year
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Room
                                    </span>
                                    <p>
                                      {record?.room_no ||
                                        "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Pass Type
                                    </span>
                                    <p>
                                      {
                                        passTypeLabels[
                                          record?.passtype
                                        ]
                                      ||
                                        record?.passtype ||
                                        "-"
                                      }
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Late Count
                                    </span>
                                    <p>
                                      {record?.passtype ===
                                      "outpass"
                                        ? record?.late_count ??
                                          0
                                        : "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      From Date
                                    </span>
                                    <p>
                                      {formatDate(
                                        record?.from
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      From Time
                                    </span>
                                    <p>
                                      {formatTime(
                                        record?.from
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      To Date
                                    </span>
                                    <p>
                                      {formatDate(
                                        record?.to
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      To Time
                                    </span>
                                    <p>
                                      {formatTime(
                                        record?.to
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Place to Visit
                                    </span>
                                    <p>
                                      {record?.place_to_visit ||
                                        "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Reason
                                    </span>
                                    <p>
                                      {record?.reason_type ===
                                      "intern"
                                        ? "Intern"
                                        : record?.reason_type ===
                                          "semester"
                                        ? "Semester"
                                        : record?.reason_type ===
                                          "festival"
                                        ? "Festival"
                                        : record?.reason_type ===
                                          "medical"
                                        ? "Medical"
                                        : record?.reason_type ===
                                          "others"
                                        ? "Other"
                                        : record?.reason_type ||
                                          "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      Parent Approval
                                    </span>
                                    <p>
                                      {parentStatus ===
                                      "approved"
                                        ? "Accepted"
                                        : parentStatus ===
                                          "declined"
                                        ? "Declined"
                                        : "Pending"}
                                    </p>
                                  </div>

                                </div>

                                {/* ==================================================
                                    PARENT OTP
                                ================================================== */}

                                {parentStatus !==
                                  "approved" && (

                                  <div className="AR-parent-section">

                                    <span>
                                      Parent Approval
                                    </span>

                                    <button
                                      type="button"
                                      className="AR-send-otp-button"
                                      onClick={async (
                                        e
                                      ) => {

                                        e.stopPropagation();

                                        const success =
                                          await handleSendParentOTP(
                                            record?.pass_id
                                          );

                                        if (
                                          success
                                        ) {
                                          openOtpPopup(
                                            record?.pass_id
                                          );
                                        }

                                      }}
                                    >
                                      <Send />
                                      <span>
                                        Send Parent OTP
                                      </span>
                                    </button>

                                  </div>
                                )}

                                {/* ==================================================
                                    WARDEN NOTES
                                ================================================== */}

                                {parentStatus ===
                                  "pending" && (

                                  <div className="AR-warden-note">

                                    <span>
                                      Warden Notes
                                    </span>

                                    <textarea
                                      placeholder="Enter warden notes..."
                                      onClick={(e) =>
                                        e.stopPropagation()
                                      }
                                    />

                                  </div>
                                )}

                                {/* ==================================================
                                    OTHER DETAILS
                                ================================================== */}

                                {record?.reason_type ===
                                  "others" && (

                                  <div className="AR-additional-info">

                                    <span>
                                      Additional Details
                                    </span>

                                    <p>
                                      {record?.reason_for_visit ||
                                        "-"}
                                    </p>

                                  </div>
                                )}

                                {/* ==================================================
                                    MEDICAL
                                ================================================== */}

                                {record?.passtype ===
                                  "outpass" && (

                                  <div className="AR-medical-checkbox">

                                    <label>

                                      <input
                                        type="checkbox"
                                        checked={
                                          isMedical
                                        }
                                        onChange={(e) =>
                                          setIsMedical(
                                            e.target.checked
                                          )
                                        }
                                      />

                                      <span>
                                        Medical Related
                                      </span>

                                    </label>

                                  </div>
                                )}

                                {/* ==================================================
                                    DOCUMENT
                                ================================================== */}

                                {(
                                  record?.passtype ===
                                    "od" ||
                                  record?.passtype ===
                                    "leave"
                                ) &&
                                  record?.file_path && (

                                  <button
                                    onClick={(e) => {

                                      e.stopPropagation();

                                      setShowDocument(
                                        true
                                      );

                                    }}
                                    className="AR-document-button"
                                  >
                                    <FileText
                                      size={18}
                                    />

                                    View Document
                                  </button>
                                )}

                                {/* ==================================================
                                    ACTION BUTTONS
                                ================================================== */}

                                <div className="AR-inline-actions">

                                  <button
                                    className="AR-decline-button"
                                    onClick={(e) => {

                                      e.stopPropagation();

                                      handleDecline(
                                        record?.pass_id,
                                        isMedical,
                                        ""
                                      );

                                    }}
                                  >
                                    Decline
                                  </button>

                                  <button
                                    className="AR-accept-button"
                                    onClick={(e) => {

                                      e.stopPropagation();

                                      handleAccept(
                                        record?.pass_id,
                                        isMedical,
                                        ""
                                      );

                                    }}
                                  >
                                    Accept
                                  </button>

                                </div>

                              </div>

                            </td>

                          </tr>
                        )}

                      </React.Fragment>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* ============================================================
            OTP POPUP
        ============================================================ */}

        {showOtpPopup && (

          <div
            className="AR-otp-overlay"
            onClick={() =>
              setShowOtpPopup(false)
            }
          >

            <div
              className="AR-otp-popup"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="AR-otp-close"
                onClick={() =>
                  setShowOtpPopup(false)
                }
              >
                <X size={20} />
              </button>

              <div className="AR-otp-icon">
                🔐
              </div>

              <h2>
                Verify Parent OTP
              </h2>

              <p className="AR-otp-description">
                We've sent a 6-digit OTP to
                the parent's registered
                mobile number.
              </p>

              {/* OTP BOXES */}

              <div className="AR-otp-boxes">

                {otp.map(
                  (
                    digit,
                    index
                  ) => (

                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      className={`AR-otp-input ${
                        digit
                          ? "AR-otp-filled"
                          : ""
                      } ${
                        otpError
                          ? "AR-otp-invalid"
                          : ""
                      }`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      autoComplete="one-time-code"
                      onChange={(e) =>
                        handleOtpChange(
                          e.target.value,
                          index
                        )
                      }
                      onKeyDown={(e) =>
                        handleOtpKeyDown(
                          e,
                          index
                        )
                      }
                      onPaste={
                        handleOtpPaste
                      }
                      onFocus={(e) =>
                        e.target.select()
                      }
                    />

                  )
                )}

              </div>

              {/* OTP ERROR */}

              {otpError && (
                <p className="AR-otp-error">
                  {otpError}
                </p>
              )}

              <p className="AR-otp-helper">
                Enter the OTP received on
                the parent's mobile
              </p>

              {/* OTP BUTTONS */}

              <div className="AR-otp-actions">

                <button
                  type="button"
                  className="AR-otp-resend"
                  onClick={async () => {

                    if (!otpPassId) {
                      return;
                    }

                    const success =
                      await handleSendParentOTP(
                        otpPassId
                      );

                    if (success) {

                      setOtp([
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                      ]);

                      setOtpError("");

                      document
                        .getElementById(
                          "otp-input-0"
                        )
                        ?.focus();
                    }

                  }}
                >
                  ↻ Resend OTP
                </button>

                <button
                  type="button"
                  className="AR-otp-verify"
                  onClick={
                    handleValidateOTP
                  }
                  disabled={
                    otp.join("")
                      .length !== 6
                  }
                >
                  ✓ Verify OTP
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================
            DOCUMENT MODAL
        ============================================================ */}

        {showDocument &&
          selectedRecord && (

            <div
              className="AR-document-modal"
              onClick={() =>
                setShowDocument(false)
              }
            >

              <div
                className="AR-document-container"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="AR-document-header">

                  <h3 className="AR-document-title">
                    Document Preview
                  </h3>

                  <button
                    onClick={() =>
                      setShowDocument(false)
                    }
                    className="AR-close-button"
                  >
                    <X className="AR-icon" />
                  </button>

                </div>

                <div className="AR-document-content">

                  {(() => {

                    const fileUrl =
                      UrlParser(
                        selectedRecord.file_path
                      );

                    if (!fileUrl) {
                      return (
                        <p>
                          No document available.
                        </p>
                      );
                    }

                    const fileExtension =
                      fileUrl
                        .split("?")[0]
                        .split(".")
                        .pop()
                        ?.toLowerCase();

                    if (
                      [
                        "jpg",
                        "jpeg",
                        "png",
                        "gif",
                        "bmp",
                        "webp",
                      ].includes(
                        fileExtension
                      )
                    ) {

                      return (
                        <img
                          src={fileUrl}
                          alt="Document Preview"
                          className="AR-document-image"
                        />
                      );

                    }

                    if (
                      fileExtension ===
                      "pdf"
                    ) {

                      return (
                        <iframe
                          src={fileUrl}
                          title="PDF Document"
                          className="AR-document-frame"
                        >
                          Your browser does not
                          support PDF viewing.
                          <a
                            href={
                              fileUrl
                            }
                          >
                            Download PDF
                          </a>
                        </iframe>
                      );

                    }

                    return (
                      <p>
                        Unsupported file
                        format.
                      </p>
                    );

                  })()}

                </div>

              </div>

            </div>
          )}

      </div>
    </div>
  );
}

export default WardenRequest;

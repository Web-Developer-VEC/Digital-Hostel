import React, { useState, useEffect } from "react";
import "./StudentHistory.css";
import {
  X,
  History,
  Download,
  Calendar,
  MapPin,
  FileText,
  LogOut,
  LogIn,
  CheckCircle,
  Clock,
  AlertCircle,
  LoaderIcon,
  Clipboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axiosInstance from "../../../api/axios";

const StudentHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState("Current");
  const [selectedData, setSelectedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  const navigate = useNavigate();

  // Handle 401 authentication errors
  const handle401Error = (error) => {
    if (error.response?.status === 401) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text:
          error.response.data.message ||
          "Your session has expired. Please login again.",
        confirmButtonText: "Login",
        allowOutsideClick: false,
      }).then(() => {
        navigate("/hostel/login");
      });
      return true;
    }
    return false;
  };

  useEffect(() => {
    const fetchStudentPasses = async () => {
      try {
        const response = await axiosInstance.get("/api/get_student_pass");
        const passes = response.data.passes;

        if (passes.length === 0) {
          setHistory([]);
          setLoading(false);
          return;
        }

        // CURRENT PASSES
        // Show only active passes:
        // 1. Pending approval
        // 2. Parent approved / Warden approved
        // 3. Fully approved passes
        // Exclude rejected and completed (re-entered) passes
        const currentPasses = passes.filter((pass) => {
          const isNotCompleted = pass.re_entry_time === null;

          const isNotRejected =
            pass.parent_approval !== false &&
            pass.wardern_approval !== false &&
            pass.superior_wardern_approval !== false;

          return isNotCompleted && isNotRejected;
        });

        // HISTORY GROUPING
        // Keep ALL non-current/completed passes grouped by month
        const completedPasses = passes.filter(
          (pass) => pass.re_entry_time !== null,
        );

        const groupedHistory = {};

        completedPasses.forEach((pass) => {
          const monthYear = new Date(pass.request_date_time).toLocaleString(
            "en-US",
            { month: "long", year: "numeric" },
          );

          if (!groupedHistory[monthYear]) {
            groupedHistory[monthYear] = [];
          }
          groupedHistory[monthYear].push(pass);
        });

        const formattedHistory = [
          ...(currentPasses.length > 0
            ? [{ year: "Current", data: currentPasses }]
            : []),
          ...Object.keys(groupedHistory).map((month) => ({
            year: month,
            data: groupedHistory[month],
          })),
        ];

        setHistory(formattedHistory);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching passes:", error);

        // Handle 401 authentication error
        if (handle401Error(error)) {
          setLoading(false);
          return;
        }

        if (error.response?.data?.error) {
          setError(error.response.data.error);
          Swal.fire({
            title: "Error!",
            text: error.response.data.error,
            icon: "error",
            showConfirmButton: true,
            timer: 4000,
          });
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
          Swal.fire({
            title: "Error!",
            text: error.response.data.message,
            icon: "error",
            showConfirmButton: true,
            timer: 4000,
          });
        } else {
          setError("Failed to fetch student passes.");
          Swal.fire({
            title: "Error!",
            text: "Failed to fetch student passes. Please try again.",
            icon: "error",
            showConfirmButton: true,
            timer: 4000,
          });
        }
        setLoading(false);
      }
    };

    fetchStudentPasses();
  }, []);

  const handleCardClick = (data, year) => {
    if (year === "Current") {
      setSelectedData(data);
      setIsModalOpen(true);
      document.body.classList.add("blur-background");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedData(null);
    document.body.classList.remove("blur-background");
  };

  const handleEditClick = (passid, event) => {
    event.stopPropagation();
    Swal.fire({
      title: "Edit Pass Request?",
      text: "You are about to edit this pass request. Continue?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Edit",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/hostel/student/request", { state: { passid } });
      }
    });
  };

  const downloadImage = (imageUrl, fileName) => {
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.setAttribute("download", fileName);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        title: "Success!",
        text: "✅ QR Code downloaded successfully.",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "❌ Failed to download QR Code. Please try again.",
        icon: "error",
        showConfirmButton: true,
      });
    }
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getStatusBadge = (status, type) => {
    if (type === "parent") {
      if (status === null) {
        return (
          <span className="status pending">
            <Clock size={14} /> Pending
          </span>
        );
      } else if (status) {
        return (
          <span className="status completed">
            <CheckCircle size={14} /> Approved
          </span>
        );
      } else {
        return (
          <span className="status rejected">
            <AlertCircle size={14} /> Rejected
          </span>
        );
      }
    } else {
      if (status === null) {
        return (
          <span className="status pending">
            <Clock size={14} /> Pending
          </span>
        );
      } else if (status) {
        return (
          <span className="status completed">
            <CheckCircle size={14} /> Approved
          </span>
        );
      } else {
        return (
          <span className="status rejected">
            <AlertCircle size={14} /> Rejected
          </span>
        );
      }
    }
  };

  const filteredHistory =
    selectedYear === "Overall"
      ? history
      : history.filter((item) => item.year === selectedYear);

  return (
    <div className="student-history-container">
      <div className="mt-[10%] md:mt-[1%] mb-8 flex justify-between items-center">
        <h2 className="student-history-header flex items-center gap-2">
          <History className="" size={42} />
          Student History
        </h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="select-dropdown"
        >
          <option value="Current">Current Passes</option>
          <option value="Overall">All History</option>
          {history
            .filter((item) => item.year !== "Current")
            .map((item) => (
              <option key={item.year} value={item.year}>
                {item.year}
              </option>
            ))}
        </select>
      </div>

      {loading ? (
        <p className="loading-message">
          <LoaderIcon /> Loading student passes...
        </p>
      ) : error ? (
        <p className="error-message">
          <X /> {error}
        </p>
      ) : history.length === 0 ? (
        <p className="no-data-message">
          <Clipboard /> No passes found. Create a new pass request to get
          started.
        </p>
      ) : (
        <div className="student-history-cards">
          {filteredHistory.map((val) => (
            <section key={val.year} className="history-section">
              <div className="history-section-heading">
                <div className="section-line"></div>
                <h3 className="header">{val.year}</h3>
                <div className="section-count">
                  {val.data.length} {val.data.length === 1 ? "Pass" : "Passes"}
                </div>
              </div>

              <div className="history-list">
                {val.data.map((info, index) => (
                  <div
                    key={index}
                    className="student-history-card"
                    onClick={() => handleCardClick(info, val.year)}
                  >
                    {/* DATE BLOCK */}
                    <div className="pass-date-block">
                      <Calendar size={20} />
                      <span className="date-label">REQUESTED</span>
                      <strong>
                        {new Date(info.request_date_time).toLocaleDateString(
                          "en-US",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        )}
                      </strong>
                      <small>
                        {new Date(info.request_date_time).getFullYear()}
                      </small>
                    </div>

                    {/* MAIN INFORMATION */}
                    <div className="pass-main-content">
                      <div className="pass-title-row">
                        <div>
                          <span className="pass-label">DESTINATION</span>
                          <h3>{info.place_to_visit}</h3>
                        </div>

                        <span
                          className={`status ${
                            info.request_completed ? "completed" : "pending"
                          }`}
                        >
                          {info.request_completed ? "Completed" : "Active"}
                        </span>
                      </div>

                      <div className="pass-reason">
                        <FileText size={16} />
                        <span>{info.reason_for_visit || info.reason_type}</span>
                      </div>

                      <div className="pass-journey">
                        <div className="journey-item">
                          <div className="journey-icon out">
                            <LogOut size={16} />
                          </div>

                          <div>
                            <span>OUT DATE</span>
                            <strong>{formatDate(info.from)}</strong>
                          </div>
                        </div>

                        <div className="journey-divider"></div>

                        <div className="journey-item">
                          <div className="journey-icon in">
                            <LogIn size={16} />
                          </div>

                          <div>
                            <span>RETURN DATE</span>
                            <strong>{formatDate(info.to)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="pass-right-panel">
                      <div className="approval-statuses">
                        <div className="approval-item">
                          <span>Parent</span>
                          {getStatusBadge(info.parent_approval, "parent")}
                        </div>

                        <div className="approval-item">
                          <span>
                            {info.notify_superior
                              ? "Superior Warden"
                              : "Warden"}
                          </span>

                          {info.notify_superior
                            ? getStatusBadge(
                                info.superior_wardern_approval,
                                "superior",
                              )
                            : getStatusBadge(info.wardern_approval, "warden")}
                        </div>
                      </div>

                      <div className="card-action-buttons">
                        <button
                          className="view-details-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(info, val.year);
                          }}
                        >
                          View Details
                        </button>

                        {!info.wardern_approval &&
                          !info.superior_wardern_approval && (
                            <button
                              className="stu-edit-button"
                              onClick={(e) => handleEditClick(info.pass_id, e)}
                            >
                              Edit
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {isModalOpen && selectedData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="popup-x">
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold text-blue-800 mb-4">
              Pass Details
            </h2>
            <div className="details-row">
              <div className="details-column">
                <p>
                  <strong>Destination</strong>
                  {selectedData.place_to_visit}
                </p>
                {selectedData.reason_for_visit ? (
                  <p>
                    <strong>Reason</strong>
                    {selectedData.reason_for_visit}
                  </p>
                ) : (
                  <p>
                    <strong>Reason</strong>
                    {selectedData.reason_type}
                  </p>
                )}
                <p>
                  <strong>Out Date</strong>
                  {formatDate(selectedData.from)}
                </p>
                <p>
                  <strong>In Date</strong>
                  {formatDate(selectedData.to)}
                </p>
              </div>
              <div className="details-column">
                <p>
                  <strong>Status</strong>
                  <span
                    className={`status ${selectedData.request_completed ? "completed" : "pending"}`}
                  >
                    {selectedData.request_completed ? "Completed" : "Pending"}
                  </span>
                </p>
                <p>
                  <strong>Applied Date</strong>
                  {formatDate(selectedData.request_date_time)}
                </p>
                <p>
                  <strong>Pass Type</strong>
                  {selectedData.passtype}
                </p>
                <p>
                  <strong>Parent Approval</strong>
                  {getStatusBadge(selectedData.parent_approval, "parent")}
                </p>
              </div>
            </div>

            {selectedData.file_path && (
              <div className="mt-4">
                <p className="font-semibold text-blue-800 mb-2">
                  Supporting Document:
                </p>

                {selectedData.file_path &&
                  (() => {
                    const fileUrl = UrlParser(selectedData.file_path);
                    const fileExtension = fileUrl
                      .split(".")
                      .pop()
                      .toLowerCase();

                    if (
                      ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
                        fileExtension,
                      )
                    ) {
                      return (
                        <img
                          src={fileUrl}
                          alt="Proof"
                          className="modal-image"
                        />
                      );
                    } else if (fileExtension === "pdf") {
                      return (
                        <iframe
                          src={fileUrl}
                          title="PDF Document"
                          className="w-full h-96 border"
                        >
                          This browser does not support PDFs. Please download
                          the PDF to view it:
                          {/* <a href={fileUrl}>Download PDF</a> */}
                        </iframe>
                      );
                    } else {
                      return <p>Unsupported file format.</p>;
                    }
                  })()}
              </div>
            )}

            {selectedData.qrcode_path && (
              <div className="qr-container">
                <button
                  onClick={() =>
                    downloadImage(
                      UrlParser(selectedData.qrcode_path),
                      `${selectedData.registration_number}_${selectedData.from.split("T")[0]}.png`,
                    )
                  }
                  className="qr-download-button"
                  title="Download QR Code"
                >
                  <Download size={26} />
                </button>

                <p className="qr-title">
                  <strong>Scan QR Code</strong>
                </p>

                <div className="qr-code-wrapper">
                  <img
                    src={UrlParser(selectedData.qrcode_path)}
                    alt="QR Code"
                    className="qr-image"
                  />
                </div>
              </div>
            )}

            <button onClick={closeModal} className="modal-close-button">
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;

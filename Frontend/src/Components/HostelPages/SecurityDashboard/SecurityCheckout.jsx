import React, { useState, useEffect, useRef } from "react";
import Scanner from "react-qr-barcode-scanner";
import { X, Printer, MapPin, Phone, QrCode, ShieldCheck } from "lucide-react";
import "./SecurityCheckout.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function SecurityCheckout() {
  const [showScanner, setShowScanner] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [scannedUrl, setScannedUrl] = useState("");
  const [passDetails, setPassDetails] = useState(null);

  const [loading, setLoading] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);

  const streamRef = useRef(null);
  const modalRef = useRef(null);

  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_QR_URL;

  /* ---------------- URL PARSER ---------------- */

  const UrlParser = (path) => {
    if (!path) return "";

    if (typeof path !== "string") return "";

    if (path.startsWith("http")) {
      return path;
    }

    return `${BASE_URL || ""}${path}`;
  };

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          title: "Logged Out",
          text: data.message || "You have been logged out successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          navigate(data.redirect || "/");
        });
      } else {
        Swal.fire({
          title: "Logout Failed",
          text: data.message || "Unable to logout.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Logout Error:", error);

      Swal.fire({
        title: "Logout Failed",
        text: "Unable to connect to the server.",
        icon: "error",
      });
    }
  };

  /* ---------------- YEAR PARSER ---------------- */

  const yearToAlphabet = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
    10: "MBA",
    9: "ME",
    overall: "Overall",
  };

  /* ---------------- PASS TYPE ---------------- */

  const passTypeParse = {
    od: "ON Duty",
    staypass: "Stay Pass",
    outpass: "Out Pass",
    leave: "Leave",
  };

  /* ---------------- CAMERA PERMISSION ---------------- */

  const requestCameraPermission = async () => {
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.protocol !== "http:"
    ) {
      Swal.fire({
        title: "Camera Unavailable",
        text: "Camera access requires HTTPS or localhost.",
        icon: "warning",
      });

      return false;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        Swal.fire({
          title: "Camera Not Supported",
          text: "Your browser does not support camera access.",
          icon: "error",
        });

        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
      });

      streamRef.current = stream;

      return true;
    } catch (error) {
      console.error("Camera access denied:", error);

      Swal.fire({
        title: "Camera Permission Required",
        text: "Please allow camera access in your browser settings to scan QR codes.",
        icon: "warning",
      });

      return false;
    }
  };

  /* ---------------- STOP CAMERA ---------------- */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /* ---------------- START SCANNER ---------------- */

  const startScanner = async () => {
    setScannerLoading(true);

    const permissionGranted = await requestCameraPermission();

    if (permissionGranted) {
      setShowScanner(true);
    }

    setScannerLoading(false);
  };

  /* ---------------- FETCH PASS DETAILS ---------------- */

  const fetchPassDetails = async (passId) => {
    try {
      setLoading(true);

      const response = await fetch("/api/fetch_pass_details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pass_unique_id: passId,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to fetch pass details."
        );
      }

      if (!data.pass_data) {
        throw new Error("Pass details were not returned by the server.");
      }

      setPassDetails(data.pass_data);

      return true;
    } catch (error) {
      console.error("Fetch Pass Error:", error);

      await Swal.fire({
        title: "Invalid QR Code",
        text:
          error.message ||
          "Unable to retrieve pass details from the server.",
        icon: "error",
        confirmButtonText: "OK",
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- QR SCAN ---------------- */

  const handleScan = async (data) => {
    if (!data) return;

    const scannedText = data.text;

    if (!scannedText) return;

    setScannedUrl(scannedText);

    const success = await fetchPassDetails(scannedText);

    if (success) {
      setShowScanner(false);
      stopCamera();
      setShowPopup(true);
    }
  };

  const handleError = (error) => {
    if (error) {
      console.error("QR Scanner Error:", error);
    }
  };

  /* ---------------- CLOSE SCANNER ---------------- */

  const closeScanner = () => {
    setShowScanner(false);
    stopCamera();
  };

  /* ---------------- PASS ACTION ---------------- */

  const handlePassAction = async (action) => {
    if (!passDetails?.pass_id) {
      Swal.fire({
        title: "Invalid Pass",
        text: "Pass information is missing.",
        icon: "error",
      });

      return;
    }

    /*
      Existing backend contract:

      POST /api/security_accept

      Body:
      {
        pass_id: passDetails.pass_id
      }
    */

    if (action !== "accept") {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/security_accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pass_id: passDetails.pass_id,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to process the pass."
        );
      }

      await Swal.fire({
        title: "Success",
        text: data.message || "Pass processed successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });

      setShowPopup(false);
      setPassDetails(null);
      setScannedUrl("");
    } catch (error) {
      console.error("Pass Action Error:", error);

      Swal.fire({
        title: "Action Failed",
        text:
          error.message ||
          "Unable to process the pass. Please try again.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PRINT ---------------- */

  const handlePrint = () => {
    if (!modalRef.current) return;

    const printContents = modalRef.current.cloneNode(true);

    const actionButtons =
      printContents.querySelector(".action-buttons");

    if (actionButtons) {
      actionButtons.remove();
    }

    const remarksTextarea =
      printContents.querySelector(".remarks-section textarea");

    if (remarksTextarea && !remarksTextarea.value.trim()) {
      const remarksSection =
        printContents.querySelector(".remarks-section");

      if (remarksSection) {
        remarksSection.remove();
      }
    }

    const printIframe = document.createElement("iframe");

    printIframe.style.position = "absolute";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "none";

    document.body.appendChild(printIframe);

    printIframe.contentDocument.body.appendChild(printContents);

    const printStyles = `
      @media print {

        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          color: #000;
          background: #fff;
        }

        .close-button,
        .action-buttons,
        .security-login-overlay {
          display: none !important;
        }

        .modal-card {
          width: 100%;
          max-width: none;
          box-shadow: none;
          border: none;
          padding: 20px;
          margin: 0;
        }

        .profile-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .profile-image {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin-right: 15px;
        }

        .profile-info h2 {
          font-size: 18px;
          margin: 0;
          color: #000;
        }

        .profile-info p {
          font-size: 14px;
          margin: 5px 0 0;
          color: #555;
        }

        .quick-info {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #000;
        }

        .info-item svg {
          display: none;
        }

        .pass-details {
          margin-bottom: 20px;
        }

        .time-details {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
        }

        .time-details .label,
        .reason-details .label {
          font-size: 12px;
          color: #777;
          margin-bottom: 5px;
        }

        .time-details .value,
        .reason-details .value {
          font-size: 14px;
          color: #000;
        }

        .status-badges {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .status-badge {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          text-align: center;
          flex: 1;
        }

        .status-badge.approved {
          background-color: #e8f5e9;
        }

        .status-badge.pending {
          background-color: #fff3e0;
        }

        .badge-label {
          font-size: 12px;
          color: #777;
          margin-bottom: 5px;
        }

        .badge-value {
          font-size: 14px;
          color: #000;
        }

        a {
          color: #000;
          text-decoration: none;
        }
      }
    `;

    const styleElement =
      document.createElement("style");

    styleElement.innerHTML = printStyles;

    printIframe.contentDocument.head.appendChild(
      styleElement
    );

    printIframe.contentWindow.print();

    setTimeout(() => {
      document.body.removeChild(printIframe);
    }, 100);
  };

  /* ---------------- CLOSE MODAL ON OUTSIDE CLICK ---------------- */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [showPopup]);

  /* ---------------- FORMAT DATE ---------------- */

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return {
        date: "N/A",
        time: "N/A",
      };
    }

    const dateObj = new Date(dateTime);

    if (Number.isNaN(dateObj.getTime())) {
      return {
        date: "N/A",
        time: "N/A",
      };
    }

    return {
      date: dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),

      time: dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="security-page">

      {/* Decorative background */}
      <div className="security-bg-decoration security-bg-one"></div>
      <div className="security-bg-decoration security-bg-two"></div>

      {/* Main content */}
      <main className="security-content">

        {/* Heading */}
        <section className="security-intro">

          <div className="security-icon">
            <ShieldCheck size={30} strokeWidth={2} />
          </div>

          <h1 className="security-login-heading">
            Security Login
          </h1>

          <div className="security-heading-line"></div>

          <p className="security-description">
            Scan the student's QR code to securely verify
            and process their hostel pass.
          </p>

        </section>

        {/* Scanner / Login Card */}
        {!showScanner && (
          <section className="security-card">

            <div className="security-card-icon">
              <QrCode size={48} strokeWidth={1.5} />
            </div>

            <h2>Ready to Scan</h2>

            <p>
              Use the security scanner to verify a
              student's hostel pass.
            </p>

            <button
              className="security-login-scan-button"
              onClick={startScanner}
              disabled={scannerLoading}
            >
              <QrCode size={20} />

              {scannerLoading
                ? "Opening Camera..."
                : "Scan QR Code"}
            </button>

            <span className="security-card-note">
              Please allow camera access when prompted.
            </span>

          </section>
        )}

        {/* QR Scanner */}
        {showScanner && (
          <section className="security-scanner-card">

            <div className="scanner-header">
              <div>
                <h2>Scan Student QR Code</h2>
                <p>
                  Position the QR code inside the scanning area.
                </p>
              </div>
            </div>

            <div className="security-login-scanner-container">

              <Scanner
                onUpdate={(err, result) => {
                  if (result) {
                    handleScan(result);
                  } else {
                    handleError(err);
                  }
                }}
                constraints={{
                  video: {
                    facingMode: {
                      ideal: "environment",
                    },
                    width: {
                      ideal: 640,
                    },
                    height: {
                      ideal: 480,
                    },
                  },
                }}
                videoStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "18px",
                }}
              />

              <div className="scanner-frame">
                <span className="corner top-left"></span>
                <span className="corner top-right"></span>
                <span className="corner bottom-left"></span>
                <span className="corner bottom-right"></span>
              </div>

            </div>

            <button
              className="security-login-cancel-button"
              onClick={closeScanner}
            >
              Cancel Scan
            </button>

          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="security-loading">
            <div className="security-spinner"></div>
            <span>Processing...</span>
          </div>
        )}

      </main>

      {/* Modal Overlay */}
      {showPopup && (
        <div className="modal-overlay">

          {passDetails && (
            <div
              className="modal-card"
              ref={modalRef}
            >

              {/* Modal Header */}
              <div className="modal-top-bar">
                <div>
                  <span className="modal-eyebrow">
                    VERIFIED PASS
                  </span>

                  <h2>Pass Details</h2>
                </div>

                <button
                  className="close-button"
                  onClick={() => setShowPopup(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Student Profile */}
              <div className="profile-header">

                <img
                  src={UrlParser(passDetails.profile_image)}
                  alt="Profile"
                  className="profile-image"
                />

                <div className="profile-info">
                  <h2>{passDetails.name}</h2>

                  <p>
                    {passDetails.dept}
                    {" • "}
                    {yearToAlphabet[passDetails.year] ||
                      passDetails.year}
                  </p>
                </div>

              </div>

              {/* Quick Information */}
              <div className="quick-info">

                <div className="info-item">
                  <MapPin size={17} />

                  <div>
                    <span className="info-label">
                      Room
                    </span>

                    <strong>
                      {passDetails.room_no || "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="info-item">
                  <Phone size={17} />

                  <div>
                    <span className="info-label">
                      Mobile
                    </span>

                    <a
                      href={`tel:${passDetails.mobile_number}`}
                    >
                      {passDetails.mobile_number || "N/A"}
                    </a>
                  </div>
                </div>

              </div>

              {/* Pass Details */}
              <div className="pass-details">

                <div className="detail-section">

                  <div className="time-details">

                    <div className="time-box">
                      <span className="label">
                        From
                      </span>

                      <strong className="value">
                        {
                          formatDateTime(
                            passDetails.from
                          ).date
                        }
                      </strong>

                      <small>
                        {
                          formatDateTime(
                            passDetails.from
                          ).time
                        }
                      </small>
                    </div>

                    <div className="time-divider">
                      →
                    </div>

                    <div className="time-box">
                      <span className="label">
                        To
                      </span>

                      <strong className="value">
                        {
                          formatDateTime(
                            passDetails.to
                          ).date
                        }
                      </strong>

                      <small>
                        {
                          formatDateTime(
                            passDetails.to
                          ).time
                        }
                      </small>
                    </div>

                  </div>

                </div>

                <div className="reason-details">

                  <span className="label">
                    Pass Type
                  </span>

                  <strong className="value">
                    {
                      passTypeParse[
                        passDetails.passtype
                      ] ||
                      passDetails.passtype ||
                      "N/A"
                    }
                  </strong>

                </div>

                <div className="reason-details">

                  <span className="label">
                    Place & Reason
                  </span>

                  <strong className="value">
                    {passDetails.place_to_visit ||
                      "N/A"}
                  </strong>

                  {passDetails.reason_type && (
                    <p>
                      {passDetails.reason_type}
                    </p>
                  )}

                  {passDetails.reason_for_visit && (
                    <div className="description-box">
                      <span className="label">
                        Description
                      </span>

                      <p>
                        {passDetails.reason_for_visit}
                      </p>
                    </div>
                  )}

                </div>

                {/* Approval Status */}
                <div className="status-badges">

                  <div
                    className={`status-badge ${
                      passDetails.parent_approval
                        ? "approved"
                        : "pending"
                    }`}
                  >
                    <span className="badge-label">
                      Parent Approval
                    </span>

                    <strong className="badge-value">
                      {passDetails.parent_approval
                        ? "Accepted"
                        : "Pending"}
                    </strong>
                  </div>

                  {passDetails.superior_wardern_approval ===
                  null ? (
                    <div
                      className={`status-badge ${
                        passDetails.wardern_approval
                          ? "approved"
                          : "pending"
                      }`}
                    >
                      <span className="badge-label">
                        Warden Approval
                      </span>

                      <strong className="badge-value">
                        {passDetails.wardern_approval
                          ? "Approved"
                          : "Pending"}
                      </strong>
                    </div>
                  ) : (
                    <div
                      className={`status-badge ${
                        passDetails.superior_wardern_approval
                          ? "approved"
                          : "pending"
                      }`}
                    >
                      <span className="badge-label">
                        Superior Warden
                      </span>

                      <strong className="badge-value">
                        {passDetails.superior_wardern_approval
                          ? "Approved"
                          : "Pending"}
                      </strong>
                    </div>
                  )}

                </div>

                {/* Warden Comment */}
                {passDetails.comment !== null &&
                  passDetails.comment !== undefined && (
                    <div className="remarks-section">
                      <span className="label">
                        Warden Notes
                      </span>

                      <p>
                        {passDetails.comment ||
                          "No notes available."}
                      </p>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="action-buttons">

                  {passDetails.exit_time !== null ? (

                    <button
                      className="accept-button"
                      disabled={loading}
                      onClick={() =>
                        handlePassAction("accept")
                      }
                    >
                      {loading
                        ? "Processing..."
                        : "Check In"}
                    </button>

                  ) : (

                    <>
                      <button
                        className="accept-button"
                        disabled={loading}
                        onClick={() =>
                          handlePassAction("accept")
                        }
                      >
                        {loading
                          ? "Processing..."
                          : "Check Out"}
                      </button>

                      <button
                        className="print-button"
                        onClick={handlePrint}
                        title="Print Pass"
                      >
                        <Printer size={18} />
                      </button>
                    </>

                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      )}
      {/* Logout */}
      <button
        className="security-logout-button"
        onClick={handleLogout}
      >
        Logout
      </button>

    </div>
  );
}
import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Users,
  FileText,
  BarChart3,
  User,
  Clock,
  PenSquare,
  Phone,
  ScrollText,
  BookOpenCheck,
  DoorOpen,
} from "lucide-react";
import { CiLogout } from "react-icons/ci";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./HostelSidebar.css";
import axios from "axios";
import Swal from "sweetalert2";

const navItems = {
  student: [
    {
      path: "/hostel/student/request",
      label: "Request",
      mobileLabel: "Request",
      icon: <PenSquare />,
    },
    {
      path: "/hostel/student/previousrequest",
      label: "Previous Request",
      mobileLabel: "Previous",
      icon: <Clock />,
    },
    {
      path: "/hostel/student/profile",
      label: "Profile",
      mobileLabel: "Profile",
      icon: <User />,
    },
    {
      path: "/hostel/student/tutorial",
      label: "Tutorial Page",
      mobileLabel: "Tutorial",
      icon: <BookOpenCheck />,
    },
    {
      path: "/hostel/student/vacate",
      label: "Vacate Form",
      mobileLabel: "Vacate",
      icon: <DoorOpen />,
    },
  ],

  warden: [
    {
      path: "/hostel/warden/analytics",
      label: "Analytics",
      mobileLabel: "Analytics",
      icon: <BarChart3 />,
    },
    {
      path: "/hostel/warden/attendance",
      label: "Attendance",
      mobileLabel: "Attendance",
      icon: <ClipboardCheck />,
    },
    {
      path: "/hostel/warden/request",
      label: "Request",
      mobileLabel: "Request",
      icon: <FileText />,
    },
    {
      path: "/hostel/warden/student",
      label: "Student",
      mobileLabel: "Student",
      icon: <Users />,
    },
    {
      path: "/hostel/warden/tutorial",
      label: "Tutorial Page",
      mobileLabel: "Tutorial",
      icon: <BookOpenCheck />,
    },
  ],

  superior: [
    {
      path: "/hostel/superior/wardens",
      label: "Wardens",
      mobileLabel: "Wardens",
      icon: <Users />,
    },
    {
      path: "/hostel/superior/analytics",
      label: "Analytics",
      mobileLabel: "Analytics",
      icon: <BarChart3 />,
    },
    {
      path: "/hostel/superior/attendance",
      label: "Attendance",
      mobileLabel: "Attendance",
      icon: <ClipboardCheck />,
    },
    {
      path: "/hostel/superior/requests",
      label: "Requests",
      mobileLabel: "Requests",
      icon: <FileText />,
    },
    {
      path: "/hostel/superior/students",
      label: "Students",
      mobileLabel: "Students",
      icon: <Users />,
    },
    {
      path: "/hostel/superior/wardenlogs",
      label: "Warden Logs",
      mobileLabel: "Logs",
      icon: <ScrollText />,
    },
  ],
};

function Hostelsidebar({ role, activeNav, setActiveNav }) {
  const items = navItems[role] || [];
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [wardenSlidebar, setWardenSlidebar] = useState(null);
  const [message, setMessage] = useState(null);

  /* =====================================================
     FETCH WARDEN DATA
  ===================================================== */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/sidebar_warden");
        setWardenSlidebar(response.data);
      } catch (err) {
        console.error("Failed to fetch", err);
      }
    };

    if (role === "student") {
      fetchData();
    }
  }, [role]);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success: ${data.message}`);

        Swal.fire({
          title: "Log out",
          text: data.message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          willClose: () => {
            Swal.close();
            navigate("/");
          },
        });
      } else {
        setMessage(`Error: ${data.error || data.message}`);
      }
    } catch (error) {
      setMessage("Error connecting to the server");
      console.error("Logout Error:", error);
    }
  };

  /* =====================================================
     RESPONSIVE CHECK
  ===================================================== */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =====================================================
     ROMAN YEAR CONVERTER
  ===================================================== */

  const toRoman = (num) => {
    const romanMap = {
      1: "I",
      2: "II",
      3: "III",
      4: "IV",
    };

    return romanMap[num] || num;
  };

  const primaryYearArray = Array.isArray(
    wardenSlidebar?.["primary batch"]
  )
    ? wardenSlidebar["primary batch"]
    : Array.isArray(wardenSlidebar?.["primary year"])
      ? wardenSlidebar["primary year"]
      : [];

  const primaryYears =
    primaryYearArray.map(toRoman).join(", ") || "N/A";

  const yearLabel =
    primaryYearArray.length === 1 ? "year" : "years";

  return (
    <>
      {/* =====================================================
          MOBILE FLOATING BOTTOM DOCK
      ===================================================== */}

      {isMobile ? (
        <>
          <nav className="Hostel-mobile-dock">

            {/* Navigation Items */}
            {items.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`Hostel-mobile-dock-item ${
                    isActive ? "active" : ""
                  }`}
                >
                  <div className="Hostel-mobile-dock-icon">
                    {item.icon}
                  </div>

                  <span className="Hostel-mobile-dock-label">
                    {item.mobileLabel || item.label}
                  </span>
                </NavLink>
              );
            })}

            {/* Student Warden Button */}
            {role === "student" && (
              <button
                type="button"
                className={`Hostel-mobile-dock-item ${
                  showProfile ? "warden-active" : ""
                }`}
                onClick={() => setShowProfile(!showProfile)}
              >
                <div className="Hostel-mobile-dock-icon">
                  <User />
                </div>

                <span className="Hostel-mobile-dock-label">
                  Warden
                </span>
              </button>
            )}

            {/* Logout */}
            {role !== "warden" && (
              <button
                type="button"
                className="Hostel-mobile-dock-item logout-mobile"
                onClick={handleLogout}
              >
                <div className="Hostel-mobile-dock-icon">
                  <CiLogout />
                </div>

                <span className="Hostel-mobile-dock-label">
                  Logout
                </span>
              </button>
            )}
          </nav>

          {/* =====================================================
              MOBILE WARDEN PROFILE CARD
          ===================================================== */}

          {showProfile && role === "student" && (
            <>
              <div
                className="warden-popup-backdrop"
                onClick={() => setShowProfile(false)}
              />

              <div className="warden-profile-popup">

                <div className="warden-popup-handle" />

                <div className="warden-profile-header">

                  <div className="warden-popup-image-wrapper">
                    <img
                      src={
                        wardenSlidebar?.image_path ||
                        "https://via.placeholder.com/150"
                      }
                      alt={wardenSlidebar?.name}
                      className="warden-popup-photo"
                    />

                    <span
                      className={`warden-online-dot ${
                        wardenSlidebar?.["Active Status"]
                          ? "online"
                          : "offline"
                      }`}
                    />
                  </div>

                  <div className="warden-popup-info">
                    <span className="warden-popup-small-title">
                      YOUR WARDEN
                    </span>

                    <h3>
                      {wardenSlidebar?.name || "Warden"}
                    </h3>

                    <p>
                      Handling {primaryYears} {yearLabel}
                    </p>
                  </div>
                </div>

                <div className="warden-popup-divider" />

                <a
                  href={`tel:${wardenSlidebar?.["Phone number"]}`}
                  className="warden-contact-card"
                >
                  <div className="warden-contact-icon">
                    <Phone size={18} />
                  </div>

                  <div>
                    <span>Contact Warden</span>

                    <strong>
                      {wardenSlidebar?.["Phone number"] ||
                        "Not Available"}
                    </strong>
                  </div>
                </a>

                <div className="warden-popup-status-row">
                  <span>Current Status</span>

                  <span
                    className={`warden-popup-status ${
                      wardenSlidebar?.["Active Status"]
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    <span className="status-dot" />

                    {wardenSlidebar?.["Active Status"]
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </div>

                <button
                  className="warden-popup-close"
                  onClick={() => setShowProfile(false)}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        /* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */

        <div
          className={`Hostel-sidebar ${
            sidebarOpen ? "open" : ""
          }`}
        >
          {/* Student Warden Section */}

          {role === "student" && (
            <>
              <div className="warden-sidebar-top">

                <div className="warden-photo-container">
                  <img
                    src={UrlParser(wardenSlidebar?.image_path) }
                    alt={wardenSlidebar?.name}
                    className="warden-photo"
                  />
                </div>

                <div className="warden-sidebar-info">
                  <span className="warden-title">
                    YOUR WARDEN
                  </span>

                  <h3 className="sidebar-warden-name">
                    {wardenSlidebar?.name}
                  </h3>

                  <p className="warden-years">
                    Handling{" "}
                    <span>
                      {primaryYears} {yearLabel}
                    </span>
                  </p>
                </div>
              </div>

              <div className="warden-contact">

                <a
                  href={`tel:${wardenSlidebar?.["Phone number"]}`}
                  className="warden-mobile"
                >
                  <Phone size={15} />

                  <span>
                    {wardenSlidebar?.["Phone number"]}
                  </span>
                </a>

                <div className="warden-status-row">
                  <span>Status</span>

                  <span
                    className={`warden-status ${
                      wardenSlidebar?.["Active Status"]
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    <span className="warden-status-dot" />

                    {wardenSlidebar?.["Active Status"]
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Desktop Navigation */}

          <div className="Hostel-sidebar-content">
            <div className="Hostel-sidebar-menu">
              <nav>
                {items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`Hostel-nav-button ${
                      location.pathname.startsWith(item.path)
                        ? "Hostel-nav-active"
                        : ""
                    }`}
                  >
                    {item.icon}

                    <span>{item.label}</span>
                  </NavLink>
                ))}

                {/* Logout */}

                <div
                  className="Logout-container"
                  onClick={handleLogout}
                >
                  <CiLogout className="Hostel-icon" />

                  <button
                    className="Logout-button"
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
<<<<<<< Updated upstream

        {/* Warden Profile Popup */}
        {showProfile && (
          <div className="warden-profile-popup">
            <div className="warden-profile-header">
              <img
                src={UrlParser(wardenSlidebar?.image_path) || "https://via.placeholder.com/150"}
                alt={wardenSlidebar?.name}
                className="warden-photo"
              />
              <div>
                <h3 className="sidebar-warden-name">{wardenSlidebar?.name}</h3>
                <p className="warden-years">Handling: <span className="text-white">{primaryYears} {yearLabel}</span></p>
              </div>
            </div>
          </div>
          <p className="warden-mobile">
            <Phone size={16} />{" "}
            <a
              href={`tel:${wardenSlidebar?.["Phone number"]}`}
              className="no-underline text-white"
            >
              {wardenSlidebar?.["Phone number"]}
            </a>
          </p>
          <p className="text-white">
            Status:{" "}
            <span
              className={`warden-status ${wardenSlidebar?.["Active Status"] ? "active" : "inactive"}`}
            >
              {wardenSlidebar?.["Active Status"] ? "Active" : "Inactive"}
            </span>
          </p>

          {/* Logout Button Inside Profile Popup */}
          <button
            className="warden-profile-logout-button"
            onClick={handleLogout}
          >
            <CiLogout className="warden-profile-logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      )}
=======
>>>>>>> Stashed changes
    </>
  );
}

export default Hostelsidebar;
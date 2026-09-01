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

/* =========================================================
   NAVIGATION ITEMS
========================================================= */

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

/* =========================================================
   COMPONENT
========================================================= */

function Hostelsidebar({ role, activeNav, setActiveNav }) {
  const items = navItems[role] || [];

  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  const [showProfile, setShowProfile] = useState(false);
  const [wardenSlidebar, setWardenSlidebar] = useState(null);

  /* =========================================================
     FETCH WARDEN DATA
  ========================================================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/sidebar_warden");
        setWardenSlidebar(response.data);
      } catch (err) {
        console.error("Failed to fetch warden data:", err);
      }
    };

    if (role === "student") {
      fetchData();
    }
  }, [role]);

  /* =========================================================
     RESPONSIVE CHECK
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);

      if (window.innerWidth > 768) {
        setShowProfile(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     LOGOUT
  ========================================================= */

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
          text: data.message || "You have been logged out successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          willClose: () => {
            navigate("/");
          },
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.error || data.message || "Logout failed",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Logout Error:", error);

      Swal.fire({
        title: "Error",
        text: "Error connecting to the server",
        icon: "error",
      });
    }
  };

  /* =========================================================
     ROMAN YEAR CONVERTER
  ========================================================= */

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

  /* =========================================================
     IMAGE SOURCE
     Change this if your project requires UrlParser
  ========================================================= */

  const wardenImage =
    wardenSlidebar?.image_path ||
    "https://via.placeholder.com/150";

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <>
      {/* =====================================================
          MOBILE FLOATING BOTTOM DOCK
      ===================================================== */}

      {isMobile ? (
        <>
          <nav className="Hostel-mobile-dock">
            {/* NAVIGATION ITEMS */}

            {items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`Hostel-mobile-dock-item ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() => {
                    setShowProfile(false);

                    if (setActiveNav) {
                      setActiveNav(item.path);
                    }
                  }}
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

            {/* STUDENT WARDEN BUTTON */}

            {role === "student" && (
              <button
                type="button"
                className={`Hostel-mobile-dock-item ${
                  showProfile ? "warden-active" : ""
                }`}
                onClick={() => setShowProfile((prev) => !prev)}
              >
                <div className="Hostel-mobile-dock-icon">
                  <User />
                </div>

                <span className="Hostel-mobile-dock-label">
                  Warden
                </span>
              </button>
            )}

            {/* LOGOUT */}

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
              MOBILE WARDEN PROFILE POPUP
          ===================================================== */}

          {showProfile && role === "student" && (
            <>
              <div
                className="warden-popup-backdrop"
                onClick={() => setShowProfile(false)}
              />

              <div className="warden-profile-popup">
                <div className="warden-popup-handle" />

                {/* PROFILE HEADER */}

                <div className="warden-profile-header">
                  <div className="warden-popup-image-wrapper">
                    <img
                      src={wardenImage}
                      alt={wardenSlidebar?.name || "Warden"}
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

                {/* CONTACT */}

                <a
                  href={
                    wardenSlidebar?.["Phone number"]
                      ? `tel:${wardenSlidebar["Phone number"]}`
                      : undefined
                  }
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

                {/* STATUS */}

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

                {/* CLOSE */}

                <button
                  type="button"
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

        <aside className="Hostel-sidebar">
          {/* =================================================
              STUDENT WARDEN SECTION
          ================================================= */}

          {role === "student" && (
            <>
              <div className="warden-sidebar-top">
                <div className="warden-photo-container">
                  <img
                    src={wardenImage}
                    alt={wardenSlidebar?.name || "Warden"}
                    className="warden-photo"
                  />
                </div>

                <div className="warden-sidebar-info">
                  <span className="warden-title">
                    YOUR WARDEN
                  </span>

                  <h3 className="sidebar-warden-name">
                    {wardenSlidebar?.name || "Warden"}
                  </h3>

                  <p className="warden-years">
                    Handling{" "}
                    <span>
                      {primaryYears} {yearLabel}
                    </span>
                  </p>
                </div>
              </div>

              {/* CONTACT */}

              <div className="warden-contact">
                <a
                  href={
                    wardenSlidebar?.["Phone number"]
                      ? `tel:${wardenSlidebar["Phone number"]}`
                      : undefined
                  }
                  className="warden-mobile"
                >
                  <Phone size={15} />

                  <span>
                    {wardenSlidebar?.["Phone number"] ||
                      "Not Available"}
                  </span>
                </a>

                {/* STATUS */}

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

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <div className="Hostel-sidebar-content">
            <div className="Hostel-sidebar-menu">
              <nav>
                {items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(
                      `${item.path}/`
                    );

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`Hostel-nav-button ${
                        isActive ? "Hostel-nav-active" : ""
                      }`}
                      onClick={() => {
                        if (setActiveNav) {
                          setActiveNav(item.path);
                        }
                      }}
                    >
                      {item.icon}

                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                {/* LOGOUT */}

                <button
                  type="button"
                  className="Logout-container"
                  onClick={handleLogout}
                >
                  <CiLogout className="Hostel-icon" />

                  <span className="Logout-button">
                    Logout
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

export default Hostelsidebar;
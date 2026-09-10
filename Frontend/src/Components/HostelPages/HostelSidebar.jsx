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

const yearToAlphabet = {
  1: "First Year",
  2: "Second Year",
  3: "Third Year",
  4: "Fourth Year",
  9: "ME",
  10: "MBA",
};

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
      path: "/hostel/warden/profile",
      label: "Profile",
      mobileLabel: "Profile",
      icon: <User />,
    },
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
      path: "/hostel/superior/profile",
      label: "Profile",
      mobileLabel: "Profile",
      icon: <User />,
    },
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

  security: [
    {
      path: "/hostel/security/profile",
      label: "Profile",
      mobileLabel: "Profile",
      icon: <User />,
    },
    {
      path: "/hostel/security/attendance",
      label: "Attendance",
      mobileLabel: "Attendance",
      icon: <ClipboardCheck />,
    },
    {
      path: "/hostel/security/request",
      label: "Request",
      mobileLabel: "Request",
      icon: <FileText />,
    },
    {
      path: "/hostel/security/student",
      label: "Student",
      mobileLabel: "Student",
      icon: <Users />,
    },
    {
      path: "/hostel/security/tutorial",
      label: "Tutorial Page",
      mobileLabel: "Tutorial",
      icon: <BookOpenCheck />,
    },
  ],
};

const BASE_URL = process.env.REACT_APP_QR_URL;

function Hostelsidebar({ role, activeNav, setActiveNav }) {
  const items = navItems[role] || [];

  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  const [showProfile, setShowProfile] = useState(false);

  const [wardenSidebar, setWardenSidebar] = useState(null);

  // Logged-in warden / superior profile
  const [selfProfile, setSelfProfile] = useState(null);


  const isStudent = role === "student";

  const isWarden = role === "warden";

  const isSuperior = role === "superior";

  const isStaff =
    role === "warden" ||
    role === "superior" ||
    role === "security";

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {

        if (role === "student") {
          const response = await axios.get(
            "/api/sidebar_warden"
          );

          console.log(
            "Student Sidebar Warden:",
            response.data
          );

          if (mounted) {
            setWardenSidebar(
              response.data?.data || response.data || null
            );
          }

          return;
        }


        if (role === "warden" || role === "superior") {
          const response = await axios.get(
            "/api/warden_profile"
          );

          console.log(
            `${role} Sidebar Profile:`,
            response.data
          );

          if (mounted) {
            setSelfProfile(
              response.data?.data || {}
            );
          }

          return;
        }
        console.warn(
          "No profile endpoint configured for role:",
          role
        );
      } catch (error) {
        console.error(
          "Failed to fetch sidebar profile:",
          error
        );

        console.error(
          "Backend response:",
          error.response?.data
        );
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [role]);

  const profileData = isStudent
    ? wardenSidebar
    : selfProfile;


  const profileName =
    profileData?.warden_name ||
    profileData?.name ||
    profileData?.superior_warden_name ||
    profileData?.security_name ||
    profileData?.full_name ||
    profileData?.username ||
    "Profile";

  const profileId =
    profileData?.unique_id ||
    profileData?.warden_id ||
    profileData?.superior_id ||
    profileData?.security_id ||
    profileData?.employee_id ||
    profileData?.id ||
    "N/A";

  const profileImagePath =
    profileData?.image_path ||
    profileData?.profile_image ||
    profileData?.image ||
    null;

  const getProfileImage = () => {
    if (!profileImagePath) {
      return "https://via.placeholder.com/150";
    }

    // If backend already sends a complete URL
    if (
      profileImagePath.startsWith("http://") ||
      profileImagePath.startsWith("https://")
    ) {
      return profileImagePath;
    }

    return `${BASE_URL || ""}${profileImagePath}`;
  };

  const profileImage = getProfileImage();


  const profilePhone =
    profileData?.mobile_number ||
    profileData?.phone_number ||
    profileData?.phone ||
    profileData?.mobile ||
    profileData?.["Phone number"] ||
    "Not Available";


  const profileActive =
    profileData?.["Active Status"] ??
    profileData?.active_status ??
    profileData?.active ??
    profileData?.is_active ??
    false;


  const profileGender =
    profileData?.gender || "";

  const profileCategory =
    profileData?.category || "";


  const profileJoinedDate =
    profileData?.joined_date || "";


  const handlingYears = Array.isArray(
    profileData?.handling_year
  )
    ? profileData.handling_year
    : Array.isArray(profileData?.handling_years)
      ? profileData.handling_years
      : Array.isArray(profileData?.["primary year"])
        ? profileData["primary year"]
        : [];

  const handlingYearText = handlingYears
    .map(
      (year) =>
        yearToAlphabet[year] || year
    )
    .join(", ");


  const profileInchargeOf =
    profileData?.incharge_of || "";


  const profileTitle =
    role === "student"
      ? "YOUR WARDEN"
      : "YOUR PROFILE";


  let profileDescription = "";

  if (isStudent) {
    profileDescription = handlingYearText
      ? `Handling ${handlingYearText}`
      : "Your assigned warden";
  }

  if (isWarden) {
    profileDescription = handlingYearText
      ? `Handling ${handlingYearText}`
      : "Hostel Warden";
  }

  if (isSuperior) {
    profileDescription = handlingYearText
      ? `Handling ${handlingYearText}`
      : "Superior Warden";
  }

  if (role === "security") {
    profileDescription = "Security";
  }

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth <= 768;

      setIsMobile(mobile);

      if (!mobile) {
        setShowProfile(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);


  const closeProfile = () => {
    setShowProfile(false);
  };


  const handleProfileNavigation = (
    event,
    item
  ) => {
    

    if (
      isMobile &&
      isStaff &&
      item.label === "Profile"
    ) {
      event.preventDefault();

      setShowProfile(
        (previous) => !previous
      );

      return;
    }

    closeProfile();

    if (setActiveNav) {
      setActiveNav(item.path);
    }
  };


  const handleLogout = async () => {
    try {
      const response = await fetch(
        "/api/logout",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        Swal.fire({
          title: "Logged Out",
          text:
            data.message ||
            "You have been logged out successfully",
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
          text:
            data.error ||
            data.message ||
            "Logout failed",
          icon: "error",
        });
      }
    } catch (error) {
      console.error(
        "Logout Error:",
        error
      );

      Swal.fire({
        title: "Error",
        text:
          "Error connecting to the server",
        icon: "error",
      });
    }
  };

  return (
    <>
      {isMobile ? (
        <>
          <nav className="Hostel-mobile-dock">

            {items.map((item) => {
              const isActive =
                location.pathname ===
                item.path ||
                location.pathname.startsWith(
                  `${item.path}/`
                );

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`Hostel-mobile-dock-item ${isActive
                    ? "active"
                    : ""
                    } ${isStaff &&
                      item.label === "Profile" &&
                      showProfile
                      ? "profile-open"
                      : ""
                    }`}
                  onClick={(event) =>
                    handleProfileNavigation(
                      event,
                      item
                    )
                  }
                >
                  <div className="Hostel-mobile-dock-icon">
                    {item.icon}
                  </div>

                  <span className="Hostel-mobile-dock-label">
                    {item.mobileLabel ||
                      item.label}
                  </span>
                </NavLink>
              );
            })}


            {role === "student" && (
              <button
                type="button"
                className={`Hostel-mobile-dock-item ${showProfile
                  ? "profile-open"
                  : ""
                  }`}
                onClick={() =>
                  setShowProfile(
                    (previous) =>
                      !previous
                  )
                }
              >
                <div className="Hostel-mobile-dock-icon">
                  <User />
                </div>

                <span className="Hostel-mobile-dock-label">
                  Warden
                </span>
              </button>
            )}

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
          </nav>


          {showProfile &&
            (isStudent || isStaff) && (
              <>
                <div
                  className="warden-popup-backdrop"
                  onClick={closeProfile}
                />

                <div className="warden-profile-popup">

                  <div className="warden-popup-handle" />

                  {/* PROFILE HEADER */}

                  <div className="warden-profile-header">

                    <div className="warden-popup-image-wrapper">

                      <img
                        src={profileImage}
                        alt={
                          profileName
                        }
                        className="warden-popup-photo"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            "https://via.placeholder.com/150";
                        }}
                      />

                      <span
                        className={`warden-online-dot ${profileActive
                          ? "online"
                          : "offline"
                          }`}
                      />

                    </div>

                    <div className="warden-popup-info">

                      <span className="warden-popup-small-title">
                        {profileTitle}
                      </span>

                      <h3>
                        {profileName}
                      </h3>

                      <p>
                        {profileDescription}
                      </p>

                    </div>
                  </div>

                  <div className="warden-popup-divider" />


                  <a
                    href={
                      profilePhone !==
                        "Not Available"
                        ? `tel:${profilePhone}`
                        : undefined
                    }
                    className="warden-contact-card"
                  >

                    <div className="warden-contact-icon">
                      <Phone size={18} />
                    </div>

                    <div>
                      <span>
                        {isStudent
                          ? "Contact Warden"
                          : "Contact"}
                      </span>

                      <strong>
                        {profilePhone}
                      </strong>
                    </div>

                  </a>

                  {isStudent && (
                    <div className="warden-popup-status-row">
                      <span>Current Status</span>

                      <span
                        className={`warden-popup-status ${profileActive ? "active" : "inactive"
                          }`}
                      >
                        <span className="status-dot" />

                        {profileActive
                          ? "Available"
                          : "Unavailable"}
                      </span>
                    </div>
                  )}


                  <div className="profile-popup-id-row">

                    <span>
                      ID
                    </span>

                    <strong>
                      {profileId}
                    </strong>

                  </div>

                  {!isStudent && (
                    <>
                      {profileGender && (
                        <div className="profile-popup-id-row">
                          <span>
                            Gender
                          </span>

                          <strong>
                            {profileGender}
                          </strong>
                        </div>
                      )}

                      {profileCategory && (
                        <div className="profile-popup-id-row">
                          <span>
                            Category
                          </span>

                          <strong>
                            {profileCategory}
                          </strong>
                        </div>
                      )}
                    </>
                  )}

                  {/* CLOSE */}

                  <button
                    type="button"
                    className="warden-popup-close"
                    onClick={closeProfile}
                  >
                    Close
                  </button>

                </div>
              </>
            )}
        </>
      ) : (

        <aside className="Hostel-sidebar">

          {(isStudent || isStaff) && (
            <>

              <div className="warden-sidebar-top">

                <div className="warden-photo-container">

                  <img
                    src={profileImage}
                    alt={profileName}
                    className="warden-photo"
                    onError={(
                      event
                    ) => {
                      event.currentTarget.src =
                        "https://via.placeholder.com/150";
                    }}
                  />

                  {/* ONLINE STATUS */}

                  <span
                    className={`sidebar-profile-status ${profileActive
                      ? "online"
                      : "offline"
                      }`}
                  />

                </div>

                <div className="warden-sidebar-info">

                  <span className="warden-title">
                    {profileTitle}
                  </span>

                  <h3 className="sidebar-warden-name">
                    {profileName}
                  </h3>

                  <p className="warden-years">
                    {profileDescription}
                  </p>

                </div>

              </div>

              <div className="warden-contact">

                <a
                  href={
                    profilePhone !==
                      "Not Available"
                      ? `tel:${profilePhone}`
                      : undefined
                  }
                  className="warden-mobile"
                >

                  <Phone size={15} />

                  <span>
                    {profilePhone}
                  </span>

                </a>

                {isStudent && (
                  <div className="warden-status-row">
                    <span>Status</span>

                    <span
                      className={`warden-status ${profileActive ? "active" : "inactive"
                        }`}
                    >
                      <span className="warden-status-dot" />

                      {profileActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                )}

              </div>

            </>
          )}

          <div className="Hostel-sidebar-content">

            <div className="Hostel-sidebar-menu">

              <nav>

                {items.map((item) => {

                  const isActive =
                    location.pathname ===
                    item.path ||
                    location.pathname.startsWith(
                      `${item.path}/`
                    );

                  return (
                    <div
                      key={item.path}
                      className="Hostel-nav-item-wrapper"
                    >

                      <NavLink
                        to={item.path}
                        className={`Hostel-nav-button ${isActive
                          ? "Hostel-nav-active"
                          : ""
                          }`}
                        onClick={() => {

                          closeProfile();

                          if (
                            setActiveNav
                          ) {
                            setActiveNav(
                              item.path
                            );
                          }

                        }}
                      >

                        {item.icon}

                        <span>
                          {item.label}
                        </span>

                      </NavLink>

                    </div>
                  );

                })}

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

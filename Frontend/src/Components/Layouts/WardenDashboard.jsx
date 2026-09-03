import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import HostelSidebar from "../HostelPages/HostelSidebar";
import WardenRequest from "../HostelPages/WardenDashboard/WardenRequest.jsx";
import Attendance from "../HostelPages/WardenDashboard/AttendanceDashboard.jsx";
import WardenStudent from "../HostelPages/WardenDashboard/Hostelstudents.jsx";
import WardenAnalytics from "../HostelPages/WardenDashboard/WardenAnalytics.jsx";
import FoodTypeRequest from "../HostelPages/WardenDashboard/FoodTypeRequest.jsx";
import WardenPassHistory from "../HostelPages/WardenDashboard/WardenPassHistory.jsx";
import WardenProfile from "../HostelPages/WardenDashboard/WardenProfile.jsx";
import TutorialPage2 from "../HostelPages/WardenDashboard/TutorialPage2.jsx";
import LoadComp from "../LoadComp.jsx";
import { useState, useEffect } from "react";

const WardenLayout = () => {
  const [activeNav, setActiveNav] = useState("profile");
  const [pageLoading, setPageLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setPageLoading(true);

    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="dashboard-container">
      <HostelSidebar role="warden" activeNav={activeNav} setActiveNav={setActiveNav} />
      <div className="dashboard-content">
        {pageLoading ? (
          <div className="page-transition-loader">
            <LoadComp txt="Loading..." />
          </div>
        ) : (
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<WardenProfile />} />
            <Route path="analytics" element={<WardenAnalytics />} />
            <Route path="request" element={<WardenRequest />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="student" element={<WardenStudent />} />
            <Route path="request/Food-Change-Request" element={<FoodTypeRequest />} />
            <Route path="request/pass-log-history" element={<WardenPassHistory />} />
            <Route path="tutorial" element={<TutorialPage2 />} />
          </Routes>
        )}
      </div>
    </div>
  );
};

export default WardenLayout;
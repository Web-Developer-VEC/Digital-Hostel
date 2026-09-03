import React, { useState, useCallback, useEffect } from "react";
import { Routes, Route, useLocation} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import styled from "styled-components";
import {createGlobalStyle} from "styled-components";
import Cookies from "universal-cookie";
/* Landing Page Imports */
import Boot from "./Components/BootUp";
// Digital Hostel
import StudentLayout from "./Components/Layouts/StudentDashboard.jsx";
import WardenLayout from "./Components/Layouts/WardenDashboard.jsx";
import SuperiorLayout from "./Components/Layouts/SuperiorDashboard.jsx";
import SecurityLayout from "./Components/Layouts/SecurityDashboard.jsx";
import HostelLoginDigital from "./Components/HostelPages/Hostel Login.jsx";
import ForgotPassword from "./Components/HostelPages/ForgetPassword.jsx";
import HostelHeader from "./Components/HostelPages/HeadHeader.jsx";
// other stuffs
import NotFound from "./NotFound";
import RateLimitReach from "./ratelimit.jsx";
import LoadComp from "./Components/LoadComp.jsx";

import ErrorLogPage from "./Components/Developer_stuffs/errorlog/errorlog.jsx";
import HitLogs from './Components/Developer_stuffs/AnalyticsDashboard/HitLogs';
import DynamicTitle from "./Header.jsx";



const GlobalStyle = createGlobalStyle`
    /* Global Cursor Style */
    body {
        cursor: url("/cursor.svg") 10 0, auto; /* Custom cursor with defined hotspot */
        overflow: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
        overflow-x: hidden; 
    }

    html {
        overflow-x: hidden;
    }

    body::-webkit-scrollbar {
        display: none; 
    }

    button, a, .clickable {
        cursor: url("/cursor.svg") 0 0, auto;
    }
    `;
    
    const AppContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
`;

const MainContentWrapper = styled.div`
flex: 1;
padding-top: 8.69%;
`;

const App = () => {
    const location = useLocation();
    const [currentPath, setCurrentPath] = useState(location.pathname);
    const cookies = new Cookies()
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
    
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
    
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (cookies.get('theme') === undefined) cookies.set('theme', 'light')


    const [loaded, setLoaded] = useState(false);
    const [theme, setTheme] = useState(cookies.get('theme'));

    let isAuth = cookies.get('firstTime') !== undefined && +(cookies.get('firstTime')) > 3
    if (cookies.get('firstTime') === undefined) cookies.set('firstTime', 0)
    else if(cookies.get('firstTime') < 5) cookies.set('firstTime', +(cookies.get('firstTime')) + 1)

    const load = useCallback(() => {
        setLoaded(true);
    })

    const toggle = useCallback(() => {
        if(theme === "light") cookies.set('theme', 'dark')
        else cookies.set('theme', 'light')
        setTheme(cookies.get('theme'))
    })

    const [showBoot, setShowBoot] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowBoot(false);
        }, 4000); // or when isLoaded is true

        return () => clearTimeout(timeout);
    }, [loaded]);

    useEffect(() => {
        setCurrentPath(location.pathname); 
    }, [location]);

    if (!isOnline) {
        return (
          <div className="h-screen flex items-center justify-center md:mt-[15%] md:block">
            <LoadComp txt={"You are offline"} />
          </div>
        );
    }

    return (
        <>
            <GlobalStyle/>
            {/* The rest of the routes */}
                    <AppContainer className={`App ${theme} bg-prim dark:bg-drkp text-text dark:text-drkt`}>
                    {window.location.pathname === "/" && showBoot && (<Boot isAuth={isAuth} isLoaded={loaded} theme={theme} />)}
                    {/* Conditionally render Head and Footer */}  
                    <>
                        {/* <Head/> */} 
                        <HostelHeader />
                        <MainContentWrapper id="main-content" className="overflow-y-auto h-full">
                            <DynamicTitle/>
                            <Routes>
                                <Route path="/" drk element={<HostelLoginDigital load={load} toggle={toggle} theme={theme} />}/>
                                <Route path="/forget-password" element={<ForgotPassword/>}/>
                                {/* Hostel Pages */}
                                <Route path="/hostel/student/*" element={<StudentLayout />} />
                                <Route path="/hostel/warden/*" element={<WardenLayout />} />
                                <Route path="/hostel/superior/*" element={<SuperiorLayout />} />
                                <Route path="/hostel/security/*" element={<SecurityLayout />} />
                                {/* <Route path="/hostel/login" element={<HostelLoginDigital/>}/> */}

                                <Route path="/errorlog" element={<ErrorLogPage />} />

                                {/* Rate limit page */}
                                <Route path="/ratelimit" element={<RateLimitReach />} />
                                <Route path="/hit_logs" element={<HitLogs />} />
                                {/*  404 - Page not found  */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                          
                        </MainContentWrapper>
                    </>
                </AppContainer>
        </>
    );
};

export default App;

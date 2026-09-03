import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Eye,
  EyeOff,
  ChevronDown,
  GraduationCap,
  ShieldCheck,
  UserCog,
  Building2,
  Lock,
  User,
} from "lucide-react";

import "./Hostel_Login.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { createJsonRequest } from "../../api/axios";


/* =========================================================
   SKY BACKGROUND
========================================================= */

function SkyBox() {
  const mesh = useRef(null);
  const [dayTexture, setDayTexture] = useState(null);
  const [nightTexture, setNightTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();

    loader.load(
      "/day-sky.jpg",
      (texture) => setDayTexture(texture)
    );

    loader.load(
      "/night-sky.jpg",
      (texture) => setNightTexture(texture)
    );
  }, []);

  useFrame(({ clock }) => {
    if (
      dayTexture &&
      nightTexture &&
      mesh.current &&
      mesh.current.material
    ) {
      const t =
        (Math.sin(clock.getElapsedTime() * 0.1) + 1) / 2;

      mesh.current.material.uniforms.mixRatio.value = t;
    }
  });

  if (!dayTexture || !nightTexture) {
    return null;
  }

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />

      <shaderMaterial
        uniforms={{
          dayTexture: { value: dayTexture },
          nightTexture: { value: nightTexture },
          mixRatio: { value: 0 },
        }}
        vertexShader={`
          varying vec2 vUv;

          void main() {
            vUv = uv;

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          uniform float mixRatio;

          varying vec2 vUv;

          void main() {
            vec4 dayColor =
              texture2D(dayTexture, vUv);

            vec4 nightColor =
              texture2D(nightTexture, vUv);

            gl_FragColor =
              mix(dayColor, nightColor, mixRatio);
          }
        `}
      />
    </mesh>
  );
}


/* =========================================================
   DYNAMIC BACKGROUND
========================================================= */

function DynamicBackground() {
  return (
    <div className="HL-dynamic-background">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <SkyBox />
      </Canvas>
    </div>
  );
}


/* =========================================================
   ANIMATED LOGO
========================================================= */

function AnimatedLogo() {
  return (
    <motion.div
      className="HL-animated-logo"
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        duration: 0.7,
        type: "spring",
        stiffness: 200,
        damping: 15,
      }}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="HL-logo-icon"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </motion.svg>
    </motion.div>
  );
}


/* =========================================================
   LOGIN FORM
========================================================= */

function LoginForm() {
  const [registration_number, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [type, setLoginType] = useState("student");
  const [message, setMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();


  /* =========================================================
     LOGIN ROLE OPTIONS
  ========================================================= */

  const loginOptions = [
    {
      value: "student",
      label: "Student",
      icon: GraduationCap,
    },
    {
      value: "warden",
      label: "Warden",
      icon: UserCog,
    },
    {
      value: "superior",
      label: "Superior Warden",
      icon: Building2,
    },
    {
      value: "security",
      label: "Security",
      icon: ShieldCheck,
    },
  ];

  const selectedOption =
    loginOptions.find((option) => option.value === type) ||
    loginOptions[0];

  const SelectedIcon = selectedOption.icon;


  /* =========================================================
     CLOSE DROPDOWN OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);


  /* =========================================================
     SUBMIT LOGIN
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await createJsonRequest("/api/login", {
        registration_number,
        password,
        type,
      });

      const data = response.data;

      if (response.status === 200) {
        setMessage(`Success: ${data.message}`);

        Swal.fire({
          title: "Login Successful",
          text: `${data.message} for ${data.user.name || "warden"}`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,

          willClose: () => {
            Swal.close();
            navigate(data.redirect);
          },
        });
      }
    } catch (error) {
      console.error("Login Error:", error);

      if (error.response?.data) {
        const { error: errorMsg } = error.response.data;

        if (errorMsg === "User Not Found") {
          Swal.fire({
            title: "User Not Found",
            text: "The provided Registration Number or ID does not exist in our system.",
            icon: "warning",
            confirmButtonText: "Try Again",
          });
        } else if (errorMsg === "Invalid credentials") {
          Swal.fire({
            title: "Incorrect Password",
            text: "The password you entered is incorrect. Please try again.",
            icon: "error",
            confirmButtonText: "Retry",
          });
        } else if (errorMsg === "Invalid user type") {
          Swal.fire({
            title: "Invalid User Type",
            text: "Please select the correct login type before signing in.",
            icon: "info",
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            title: "Login Failed",
            text:
              errorMsg ||
              "An unknown error occurred. Please try again later.",
            icon: "error",
            confirmButtonText: "Close",
          });
        }

        setMessage(`Error: ${errorMsg}`);
      } else {
        setMessage("Error connecting to the server");
      }
    }
  };


  return (
    <motion.div
      className="HL-login-form"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <h2 className="HL-form-title">
        Welcome Back
      </h2>

      <form
        onSubmit={handleSubmit}
        className="HL-form-content"
      >

        {/* =================================================
            LOGIN TYPE DROPDOWN
        ================================================= */}

        <motion.div
          className="HL-form-group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="HL-form-label">
            Login As
          </label>

          <div
            className="HL-custom-dropdown"
            ref={dropdownRef}
          >

            <button
              type="button"
              className={`HL-dropdown-trigger ${
                dropdownOpen ? "HL-dropdown-active" : ""
              }`}
              onClick={() =>
                setDropdownOpen(!dropdownOpen)
              }
            >
              <div className="HL-dropdown-selected">

                <div className="HL-dropdown-icon">
                  <SelectedIcon size={18} />
                </div>

                <span>
                  {selectedOption.label}
                </span>

              </div>

              <ChevronDown
                size={19}
                className={`HL-dropdown-chevron ${
                  dropdownOpen ? "HL-chevron-rotate" : ""
                }`}
              />

            </button>


            <AnimatePresence>

              {dropdownOpen && (

                <motion.div
                  className="HL-dropdown-menu"
                  initial={{
                    opacity: 0,
                    y: -8,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    scale: 0.97,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >

                  {loginOptions.map((option) => {

                    const OptionIcon = option.icon;

                    return (
                      <button
                        type="button"
                        key={option.value}
                        className={`HL-dropdown-option ${
                          type === option.value
                            ? "HL-option-selected"
                            : ""
                        }`}
                        onClick={() => {
                          setLoginType(option.value);
                          setDropdownOpen(false);
                        }}
                      >

                        <div className="HL-option-left">

                          <div className="HL-option-icon">
                            <OptionIcon size={17} />
                          </div>

                          <span>
                            {option.label}
                          </span>

                        </div>


                        {type === option.value && (
                          <motion.span
                            className="HL-selected-dot"
                            layoutId="selectedDot"
                          />
                        )}

                      </button>
                    );
                  })}

                </motion.div>

              )}

            </AnimatePresence>

          </div>
        </motion.div>


        {/* =================================================
            USERNAME
        ================================================= */}

        <motion.div
          className="HL-form-group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >

          <label
            htmlFor="username"
            className="HL-form-label"
          >
            {type === "student"
              ? "Registration Number"
              : "ID"}
          </label>

          <div className="HL-input-wrapper">

            <User
              size={18}
              className="HL-input-icon"
            />

            <input
              id="username"
              type="text"
              name="registration_number"
              placeholder={
                type === "student"
                  ? "Enter registration number"
                  : "Enter your ID"
              }
              value={registration_number}
              onChange={(e) =>
                setRegistrationNumber(e.target.value)
              }
              required
              className="HL-form-input HL-input-with-icon"
            />

          </div>

        </motion.div>


        {/* =================================================
            PASSWORD
        ================================================= */}

        <motion.div
          className="HL-form-group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >

          <label
            htmlFor="password"
            className="HL-form-label"
          >
            Password
          </label>

          <div className="HL-password-wrapper">

            <Lock
              size={18}
              className="HL-input-icon"
            />

            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="HL-form-input HL-password-input"
            />

            <button
              type="button"
              className="HL-password-toggle"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>

          </div>

        </motion.div>


        {/* =================================================
            SUBMIT BUTTON
        ================================================= */}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >

          <button
            type="submit"
            className="HL-form-button"
          >
            Log In
          </button>

          {message && (
            <p className="HL-login-message">
              {message}
            </p>
          )}

        </motion.div>

      </form>
    </motion.div>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function HostelLoginDigital() {
  return (
    <div className="HL-hostel-login">

      <DynamicBackground />

      <main className="HL-main-content">

        <div className="HL-logo-container">
          <AnimatedLogo />
        </div>

        <LoginForm />

      </main>

    </div>
  );
}
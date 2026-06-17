import React, { useEffect, useState } from 'react';
import { User, FileText, Clock, CheckCircle2 } from 'lucide-react';
import './Outpass.css';
import showSweetAlert from "../Alert";
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { createFormDataRequest, createJsonRequest } from '../../../api/axios';

function HostelPass() {
  const [verified, setVerified] = useState(false);
  const [passType, setPassType] = useState('');
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [reasonType, setReasonType] = useState('');
  const [phone_number_student, setMobileno] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [place, setPlace] = useState("");
  const [reason, setReason] = useState(null);
  const [existingFilePath, setExistingFilePath] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [parentApproval, setParentApproval] = useState(true)

  const location = useLocation();
  let passid  = location.state?.passid

  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_BASE_URL;

  const UrlParser = (path) => {
      return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  // Handle 401 authentication errors
  const handle401Error = (error) => {
    if (error.response?.status === 401) {
      Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: error.response.data.message || 'Your session has expired. Please login again.',
        confirmButtonText: 'Login',
        allowOutsideClick: false
      }).then(() => {
        // Redirect to login page
        navigate('/');
      });
      return true;
    }
    return false;
  };

  const ReasonTypeMapping =  { od : [ 'Internship','Symposium','Hackathon','Sports','Others'], leave : ['Function','Medical','Exams','Emergency','Ohers'], outpass :['Shopping','Classes','Internship','Medical','Others'], staypass: ['Holiday','Weekend Holiday','Semester Holiday','Festival Holiday','Others']}

  const handleFileChange = (event) => {
    const file = event.target.files ? event.target.files[0] : event.dataTransfer.files[0];

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: "Error",
          text: "❌ File size exceed 10mb limit",
          icon: "error",
          showConfirmButton: false,
          timer: 1500, // Auto-close in 1.5 sec
          didClose: () => {
            Swal.close();
          },
        });
        return;
      }

      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file)); // Generate preview link
    }
  };

  const handlePassTypeChange = (type) => {
    setPassType(type);
    setShowDocUpload(type === 'od' || type === 'leave');

    setFrom('');              
    setTo('');        
    // setFirstTime('')         
    // setSecondTime('');
    // setSelectedFromDate('');
    // setSelectedToDateTime('');
    // setOutpassFromDate('');
    setPlace("");
    setReason(null);
    setReasonType('');
    setSelectedFile(null);
    // setPreviewURL(null);
    setExistingFilePath('');
  };

  // Get current datetime in local format for min attribute
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get max datetime for "To" field when outpass is selected (same day as from)
  const getMaxToDateTime = () => {
    if (passType === 'outpass' && from) {
      const fromDate = from.split('T')[0];
      return `${fromDate}T23:59`;
    }
    return undefined;
  };

  const showTimeAlert = (message, inputElement) => {
    if (inputElement?.blur) {
      inputElement.blur();
    }
    showSweetAlert("Alert!", message, "error", { position: "top" });
  };

  const validateFromTime = (dateTime, gender, inputElement) => {
    // Only validate for outpass type
    if (passType !== 'outpass') return true;
    
    const selectedTime = new Date(dateTime);
    const selectedHour = selectedTime.getHours();
    const selectedMinutes = selectedTime.getMinutes();
    const totalMinutes = selectedHour * 60 + selectedMinutes;
    
    const minTimeLimit = 5 * 60; // 5:00 AM
    const maxTimeLimit = gender === "Female" ? 18 * 60 : 21 * 60; // 6:00 PM for girls, 9:00 PM for boys
    
    if (totalMinutes < minTimeLimit) {
      showTimeAlert("From time cannot be before 5:00 AM for outpass.", inputElement);
      return false;
    }

    if (totalMinutes > maxTimeLimit) {
      const limitMessage = gender === "Female"
        ? "From time cannot be after 6:00 PM for outpass."
        : "From time cannot be after 9:00 PM for outpass.";
      showTimeAlert(limitMessage, inputElement);
      return false;
    }
    
    return true;
  };

  const validateToTime = (dateTime, gender, inputElement) => {
    // Only validate for outpass type
    if (passType !== 'outpass') return true;
    
    const selectedTime = new Date(dateTime);
    const selectedHour = selectedTime.getHours();
    const selectedMinutes = selectedTime.getMinutes();
    const totalMinutes = selectedHour * 60 + selectedMinutes;
    
    const maleTimeLimit = 21 * 60; // 9:00 PM
    const femaleTimeLimit = 18 * 60; // 6:00 PM
    
    if (gender === "Female" && totalMinutes > femaleTimeLimit) {
      showTimeAlert("Girls are not allowed to select a time after 6:00 PM for outpass.", inputElement);
      return false;
    } else if (gender === "Male" && totalMinutes > maleTimeLimit) {
      showTimeAlert("Boys are not allowed to select a time after 9:00 PM for outpass.", inputElement);
      return false;
    }
    
    return true;
  };

  const handleFromChange = (e) => {
    const fromDateTime = e.target.value;
    
    if (!fromDateTime) {
      setFrom('');
      return;
    }
  
    // Validate from time (check if after 5:00 AM for outpass)
    if (validateFromTime(fromDateTime, studentData?.gender, e.target)) {
      setFrom(fromDateTime);
    } else {
      setFrom('');
      return;
    }
  };

  const handleToChange = (e) => {
    const toDateTime = e.target.value;

    if (!toDateTime) {
      setTo('');
      return;
    }
    
    // For outpass: ensure same day selection
    if (passType === "outpass") {
      // Validate time constraints (before 9 PM for boys, before 6 PM for girls)
      if (validateToTime(toDateTime, studentData?.gender, e.target)) {
        setTo(toDateTime);
      } else {
        setTo('');
      }
      return;
    }
  };

  // Fetch pass details if passid is present
  useEffect(() => {
    if (passid) {
      fetchPassDetails();
      setIsEditMode(true); // Enable edit mode
    }
  }, [passid]);

  // Fetch pass details
  const fetchPassDetails = async () => {
    try {
      const response = await createJsonRequest("/api/get_student_pass_by_passid", { 
        pass_id: passid 
      });

      const data = response.data.pass_details;

      if (response.status === 200) {
        // Update form state with fetched data
        setPassType(data.passtype);
        setShowDocUpload(data.passtype === "od" || data.passtype === "leave");
        setReasonType(data.reason_type);
        setFrom(data.from.split("T")[0] + "T" + data.from.split("T")[1].slice(0, 5));
        setTo(data.to.split("T")[0] + "T" + data.to.split("T")[1].slice(0, 5))
        setPlace(data.place_to_visit);
        setReason(data.reason_for_visit);
        setExistingFilePath(data.file_path || "");
        setMobileno(data.mobile_number);
        setParentApproval(data.parent_approval === null ? true : false);

        // Fetch student data for verification
        const studentResponse = await createJsonRequest("/api/verify_student", { 
          phone_number_student: data.mobile_number 
        });

        const studentData = studentResponse.data;

        if (studentResponse.status === 200) {
          setStudentData(studentData);
          setVerified(true);
        } else {
          showSweetAlert("Error!", "Student not found. Please check the mobile number", "error");
        }
      } else {
        showSweetAlert("Error!", response.data.error || "Failed to fetch pass details", "error");
      }
    } catch (error) {
      console.error("Error fetching pass details:", error);
      
      // Handle 401 authentication error
      if (handle401Error(error)) return;
      
      if (error.response?.data?.error) {
        showSweetAlert("Error!", error.response.data.error, "error");
      } else if (error.response?.data?.message) {
        showSweetAlert("Error!", error.response.data.message, "error");
      }
    }
  };

// Handle update pass
const handleUpdatePass = async () => {
  if (!phone_number_student) {
    showSweetAlert("Alert!", "Please verify your mobile number first.", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("pass_id", passid);
  formData.append("passtype", passType);
  formData.append("from", from);
  formData.append("to", to);
  formData.append("place_to_visit", place);
  formData.append("reason_type", reasonType);
  formData.append("reason_for_visit", reason || "");

  if (selectedFile) {
    formData.append("file", selectedFile);
  }

  try {
    const response = await createFormDataRequest("/api/edit_student_pass", formData);

    const data = response.data;

    if (response.status === 200) {
      setPassType("");
      setShowDocUpload(false);
      setReasonType("");
      setFrom("");
      setTo("");
      setPlace("");
      setReason("");
      setSelectedFile(null);
      setPreviewURL(null);
      setExistingFilePath("");
      setMobileno("");

      setStudentData(null);

      setVerified(false);

      setIsEditMode(false);
      if (location.state?.passid) {
        location.state.passid = null;
      }

      Swal.fire({
        title: "Successful",
        text: `✅ Pass updated successfully!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        willClose: () => {
          Swal.close();
          navigate('/hostel/student/previousrequest');
        },
      });
    } else {
      showSweetAlert("Error!", data.error || "Failed to update pass", "error");
    }
  } catch (error) {
    console.error("Error updating pass:", error);
    
    // Handle 401 authentication error
    if (handle401Error(error)) return;
    
    if (error.response?.data?.error) {
      showSweetAlert("Error!", error.response.data.error, "error");
    } else if (error.response?.data?.message) {
      showSweetAlert("Error!", error.response.data.message, "error");
    }
  }
};

  //verify details from mobile number
  const handleVerify = async () => {
    if (!phone_number_student) {
      showSweetAlert("Alert!", "Please enter a mobile number.", "warning");
      return;
    }
  
    try {
      const response = await createJsonRequest("/api/verify_student", { 
        phone_number_student 
      });
  
      const data = response.data;
  
      if (response.status === 200) {
        setStudentData(data);
        setVerified(true);
        showSweetAlert("Success!", "Student verified successfully.", "success");
      } else {
        setStudentData(null);
        showSweetAlert("Error!", "Student not found. Please check the mobile number", "error");
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      
      // Handle 401 authentication error
      if (handle401Error(error)) return;
      
      if (error.response?.data?.error) {
        showSweetAlert("Error!", error.response.data.error, "error");
      } else if (error.response?.data?.message) {
        showSweetAlert("Error!", error.response.data.message, "error");
      } else {
        showSweetAlert("Error!", "Error verifying student. Please try again.", "error");
      }
    }
  };

  //Unified function to submit pass with different modes
  const submitPassRequest = async (mode) => {
    if (!phone_number_student) {
      showSweetAlert("Alert!", "Please verify your mobile number first.", "warning");
      return;
    }
  
    const formData = new FormData();
    formData.append("mobile_number", phone_number_student);
    formData.append("name", studentData?.name);
    formData.append("department_name", studentData?.department);
    formData.append("batch", studentData?.batch);
    formData.append("year", studentData?.year);
    formData.append("room_no", studentData?.room_number);
    formData.append("registration_number", studentData?.registration_number);
    formData.append("block_name", studentData?.block_name);
    formData.append("pass_type", passType);
    formData.append("from", from);
    formData.append("to", to);
    formData.append("place_to_visit", place);
    formData.append("reason_type", reasonType);
    formData.append("reason_for_visit", reason || "");
    formData.append("mode", mode);
  
    if (selectedFile) {
      formData.append("file", selectedFile);
    } else if (existingFilePath) {
      formData.append("existingFilePath", existingFilePath);
    }
  
    try {
      const response = await createFormDataRequest("/api/submit_pass", formData);
  
      const data = response.data;
  
      if (response.status === 200 || response.status === 201) {
        const successMessages = {
          parent: "✅ Pass request submitted. Parent notified!",
          warden: "✅ Pass request submitted. Warden notified!",
          superior: "✅ Pass request submitted. Chief Warden notified!",
          draft: "✅ Pass saved as draft"
        };

        Swal.fire({
          title: "Success",
          text: successMessages[mode] || "✅ Pass request submitted successfully!",
          icon: "success",
          showConfirmButton: false,
          timer: 1500,
          didClose: () => {
            Swal.close();
            window.location.reload();
          },
        });
      } else {
        showSweetAlert("Error!", `${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error submitting pass:", error);
      
      // Handle 401 authentication error
      if (handle401Error(error)) return;
      
      if (error.response?.data?.error) {
        showSweetAlert("Error!", error.response.data.error, "error");
      } else if (error.response?.data?.message) {
        showSweetAlert("Error!", error.response.data.message, "error");
      } else {
        showSweetAlert("Error!", "Something went wrong! Please try again.", "error");
      }
    }
  };

  //fetch Draft data
  const fetchDrafts = async () => {
    try {
      const response = await createJsonRequest("/api/fetch_drafts", {});

      const data = response.data;

      if (response.status === 200 && data.drafts?.length > 0) {
        const firstDraft = data.drafts[0];

        setPassType(firstDraft.passtype);
        setShowDocUpload(firstDraft.passtype === "od" || firstDraft.passtype === "leave");
        setReasonType(firstDraft.reason_type);
        setMobileno(firstDraft.mobile_number);
        setStudentData({
          name: firstDraft.name,
          department: firstDraft.dept,
          year: firstDraft.year,
          room_number: firstDraft.room_no,
          registration_number: firstDraft.registration_number,
          block_name: firstDraft.blockname,
        });

        // Set Place to Visit and Reason for Visit correctly
        setReasonType(firstDraft.reason_type);
        setFrom(firstDraft.from.split("T")[0] + "T" + firstDraft.from.split("T")[1].slice(0, 5));
        setTo(firstDraft.to.split("T")[0] + "T" + firstDraft.to.split("T")[1].slice(0, 5))
        setPlace(firstDraft.place_to_visit || "");
        setReason(firstDraft.reason_for_visit || "")

        if (firstDraft.file_path) {
          setExistingFilePath(firstDraft.file_path); 
          setSelectedFile(null); 
        } else {
          setExistingFilePath("");
        }

      } else {
        showSweetAlert("Oops..!","No drafts found.", "info");
      }
    } catch (error) {
      console.error("Error fetching drafts:", error);
      
      // Handle 401 authentication error
      if (handle401Error(error)) return;
      
      if (error.response?.data?.message) {
        showSweetAlert("Info", error.response.data.message, "info");
      } else if (error.response?.data?.error) {
        showSweetAlert("Error!", error.response.data.error, "error");
      } else {
        showSweetAlert("Error!", "Error fetching drafts. Please try again.", "error");
      }
    }
    setFrom("")
    setTo("")
  };

  return (
    <div className="HS-container">
      <div className="HS-main">
        <div className="HS-content">
          <div className="HS-card">
            <h2 className="HS-title">Outpass / Stay Pass Application</h2>

            {/* Mobile Verification */}
            <div className="HS-section">
              <div className="HS-mobile-verify">
                <div className="HS-input-group">
                  <label className="HS-label">Mobile Number</label>
                  <input
                    type="tel"
                    className="HS-input"
                    placeholder="Enter your mobile number"
                    onChange={(e) => setMobileno(e.target.value)}
                    value={phone_number_student}
                  />
                </div>
                    <button
                    onClick={() => handleVerify()}
                    className="HS-button HS-button-verify"
                    >
                    Verify
                    </button>
              </div>
            </div>

            {/* Personal Information */}
            <div className="HS-section">
              <h3 className="HS-subtitle">
                <User size={20} />
                Personal Information
              </h3>
              <div className="HS-grid">
                <div className="HS-input-group">
                  <label className="HS-label">Name</label>
                  <input type="text" className="HS-input" value={studentData?.name} />
                </div>
                <div className="HS-input-group">
                  <label className="HS-label">Admission Number</label>
                  <input type="text" className="HS-input" value={studentData?.registration_number} />
                </div>
                <div className="HS-input-group">
                  <label className="HS-label">Department Name</label>
                  <input type="text" className="HS-input" value={studentData?.department} />
                </div>
                <div className="HS-input-group">
                  <label className="HS-label">Batch</label>
                  <input type="text" className="HS-input" value={studentData?.batch} />
                </div>
                <div className="HS-input-group">
                  <label className="HS-label">Year</label>
                  <input type="number" className="HS-input" value={studentData?.year}/>
                </div>
                <div className="HS-input-group">
                  <label className="HS-label">Room Number</label>
                  <input type="text" className="HS-input" value={studentData?.room_number}/>
                </div>
                <div className="HS-input-group">
                  <label className="HS-label">Block Name</label>
                  <input type="text" className="HS-input" value={studentData?.block_name}/>
                </div>
              </div>
            </div>

            {/* Pass Type */}
            <div className="HS-section">
              <h3 className="HS-subtitle">
                <FileText size={20} />
                Pass Type
              </h3>
              <div className="HS-pass-types">
                {['outpass', 'staypass', 'od', 'leave'].map((type) => (
                  <label
                    key={type}
                    className={`HS-pass-type ${passType === type ? 'HS-pass-type-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="passType"
                      value={type}
                      className="HS-radio"
                      
                      onChange={() => handlePassTypeChange(type)}
                      required
                    />
                    <span className="HS-pass-label">{type}</span>
                    {passType === type && (
                      <CheckCircle2 className="HS-check-icon" size={20} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Document Upload Section */}
            {showDocUpload && (
              <div className="HS-section HS-animate-expand">
                <h3 className="HS-subtitle">📂 Document Upload</h3>

                <div
                  className="HS-upload-box"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileChange(e);
                  }}
                >
                  <input
                    type="file"
                    className="HS-file-input"
                    id="document-upload"
                    onChange={handleFileChange}
                    accept=".pdf, .jpg, .jpeg, .png"
                    required
                  />

                  {!selectedFile && !existingFilePath && (
                    <label htmlFor="document-upload" className="HS-upload-label">
                      Click to upload or drag and drop
                    </label>
                  )}
                  <br />
                  {existingFilePath && !selectedFile ? (
                    <a
                      href={UrlParser(existingFilePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="HS-upload-success"
                    >
                      📄 View previously uploaded file
                    </a>
                  ) : null}
                  {selectedFile ? (
                    <a
                      href={previewURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="HS-upload-success"
                    >
                      📄 {selectedFile.name} uploaded successfully!
                    </a>
                  ) : null}
                  {!existingFilePath && !selectedFile && (
                    <p className="HS-upload-hint">PDF, JPG, JPEG, PNG up to 10MB</p>
                  )}
                </div>
              </div>
            )}
            {/* Pass Details */}
            {passType && (
              <div className="HS-section HS-animate-expand">
                <h3 className="HS-subtitle">
                  <Clock size={20} />
                  Pass Details
                </h3>
                <div className="HS-grid">
                  <div className="HS-input-group">
                    <label className="HS-label">From Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="HS-input" 
                      onkeydown="return false;"  
                      id='fromDateTime' 
                      value={from} 
                      onChange={handleFromChange}
                      onKeyDown={(e) => e.preventDefault()} 
                      onPaste={(e) => e.preventDefault()}
                      min={getCurrentDateTime()}
                      required
                    />
                  </div>
                  <div className="HS-input-group">
                    <label className="HS-label">To Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="HS-input" 
                      id='toDateTime' 
                      value={to} 
                      onkeydown="return false;"  
                      onChange={handleToChange}
                      onKeyDown={(e) => e.preventDefault()} 
                      onPaste={(e) => e.preventDefault()} 
                      min={passType === 'outpass' && from ? from.split('T')[0] + 'T00:00' : from || getCurrentDateTime()}
                      max={getMaxToDateTime()}
                      required
                      disabled={!from}
                    />
                  </div>
                  <div className="HS-input-group">
                    <label className="HS-label">Place of Visit</label>
                    <input type="text" className="HS-input"  id='placeOfVisit' value={place} onChange={(e)=> setPlace(e.target.value)} required
                    />
                  </div>
                  <div className="HS-input-group">
                    <label className="HS-label">Reason Type</label>
                    <select 
                      className="HS-select"
                      value={reasonType}
                      onChange={(e) => setReasonType(e.target.value)}
                    >
                      <option value="">Select Reason Type</option>
                      {ReasonTypeMapping[passType]?.map((type)=>(
                        <option value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  {reasonType === 'Others' && (
                    <div className="HS-input-group HS-full-width">
                      <label className="HS-label">Reason for Visit</label>
                      <textarea rows={3} className="HS-textarea" id='reasonForVisit' value={reason} onChange={(e)=> setReason(e.target.value)}/>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {passType && (
              <div className="HS-actions HS-animate-expand">
                {isEditMode ? (
                  <>
                    <button className="HS-button HS-button-update" onClick={handleUpdatePass}>
                      Update Pass
                    </button>
                    {parentApproval && (
                      <button className="HS-button HS-button-parent" onClick={() => submitPassRequest('parent')}> 
                          Parent Approval
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* <button className="HS-button HS-button-parent" onClick={() => submitPassRequest('parent')}> 
                      Parent Approval
                    </button> */}
                    <button className="HS-button HS-button-warden" onClick={() => submitPassRequest('warden')}>
                      Warden Approval
                    </button>
                    <button className="HS-button HS-button-chief" onClick={() => submitPassRequest('superior')}>
                      Chief Warden Approval
                    </button>
                    <button className="HS-button HS-button-save" onClick={() => submitPassRequest('draft')}>
                      Save
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Draft Button */}
            {!isEditMode && (
              <div className="HS-Draft-Button">
                <button className="HS-button HS-button-draft" onClick={fetchDrafts}>
                  <FileText size={20} />View Draft
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostelPass;
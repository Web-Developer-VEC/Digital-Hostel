import React, { useState, useEffect } from 'react';
import { Search, X, FileText } from 'lucide-react';
import './SuperiorRequest.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function SuperiorRequest() {
  const [records, setRecords] = useState([]);
  const [wardenYears, setWardenYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [passTypes, setPassTypes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isMedical, setIsMedical] = useState(false);
  const [activeGender, setActiveGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', department: '', passType: '', search: '' });

  const navigate = useNavigate();

  // Mapping Department Codes to Full Names
  const departmentLabels = {
    "AI&DS": "AI",
    "AUTO": "Automobile",
    "CIVIL": "Civil",
    "CSE": "Computer Science",
    "CYBER": "Cyber",
    "EEE": "EEE",
    "ECE": "ECE",
    "EIE": "EIE",
    "IT": "IT",
    "MECH": "Mechanical",
    "MBA": "MBA"
  };

  // Mapping Pass Types to Labels
  const passTypeLabels = {
    "od": "OD",
    "outpass": "Out Pass",
    "staypass": "Stay Pass",
    "leave": "Leave"
  };

  const handleGenderFilter = (gender) => {
    const newGender = activeGender === gender ? '' : gender; // Toggle selection
    setActiveGender(newGender);
  };
  

  useEffect(() => {
    fetchWardenDetails();
    fetchPendingPasses();
  }, []);

  const fetchWardenDetails = async () => {
    try {
      const response = await fetch('/api/sidebar_warden');
      const data = await response.json();
      
      if (data["primary year"] && Array.isArray(data["primary year"])) {
        setWardenYears([...data["primary year"]]);
      }
    } catch (error) {
      console.error("Error fetching warden details:", error);
      Swal.fire({
        title: "Error!",
        text: "❌ Failed to fetch warden details. Please refresh the page.",
        icon: "error",
        showConfirmButton: true
      });
    }
  };

  const fetchPendingPasses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fetch_passes_for_superior');
      const data = await response.json();
      console.log("Data", data);
      if (data.passes && data.passes.length > 0) {
        setRecords(data.passes);
        setDepartments([...new Set(data.passes.map(pass => pass.dept))]);
        setPassTypes([...new Set(data.passes.map(pass => pass.passtype))]);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Error fetching passes:", error);
      Swal.fire({
        title: "Error!",
        text: "❌ Failed to fetch pending passes. Please try again.",
        icon: "error",
        showConfirmButton: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (pass_id, medical_status) => {
    console.log("🔵 Sending Accept request for pass_id:", pass_id, "Medical:", medical_status);
  
    try {
      const response = await fetch('/api/superior_accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pass_id, medical_status  }) // Ensure JSON is correct
      });
  
      const responseData = await response.json(); // Parse JSON response
  
      if (response.ok) {
        console.log("✅ Pass accepted successfully:", responseData);
        setRecords(records.filter(record => record.pass_id !== pass_id));
        setSelectedRecord(null);
        Swal.fire({
          title: "Success!",
          text: "✅ Pass request accepted successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        console.error("❌ API Error:", responseData);
        Swal.fire({
          title: "Error!",
          text: `❌ ${responseData.error || 'Failed to accept pass request.'}`,
          icon: "error",
          showConfirmButton: true
        });
      }
    } catch (error) {
      console.error("❌ Network error accepting pass:", error);
      Swal.fire({
        title: "Error!",
        text: "❌ An error occurred while accepting the pass.",
        icon: "error",
        showConfirmButton: true
      });
    }
  };
  
  
  const handleDecline = async (pass_id, medical_status) => {
    console.log("🔴 Decline button clicked for pass_id:", pass_id, "Medical:", medical_status);
    try {
      const response = await fetch('/api/superior_decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass_id, medical_status })
      });
  
      if (response.ok) {
        console.log("✅ Pass declined successfully");
        setRecords(records.filter(record => record.pass_id !== pass_id));
        setSelectedRecord(null);
        Swal.fire({
          title: "Success!",
          text: "✅ Pass request declined successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        console.error("❌ Error declining pass:", response.statusText);
        Swal.fire({
          title: "Error!",
          text: "❌ Failed to decline pass request.",
          icon: "error",
          showConfirmButton: true
        });
      }
    } catch (error) {
      console.error("❌ Network error declining pass:", error);
      Swal.fire({
        title: "Error!",
        text: "❌ An error occurred while declining the pass.",
        icon: "error",
        showConfirmButton: true
      });
    }
  };
  

  const filteredRecords = records.filter(record => {
    const searchQuery = filters.search.toLowerCase();
    return (
      (!activeGender || record.gender === activeGender) && 
      (!filters.year || record.year.toString() === filters.year) &&
      (!filters.department || record.dept === filters.department) &&
      (!filters.passType || record.passtype === filters.passType) &&
      (!filters.search ||
        record.name.toLowerCase().includes(searchQuery) ||
        record.room_no.toLowerCase().includes(searchQuery) ||
        record.place_to_visit.toLowerCase().includes(searchQuery)
      )
    );
  });

  return (
    <div className="AR-app">
      <div className="AR-main">
        <h1 className="AR-page-title">Requests</h1>

        <div className="AR-filter-bar">
          <div className="AR-search-container">
            <Search className="AR-search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Room No, or Place..."
              className="AR-search-input"
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div className="AR-filters">
          <div className="SR-gender-buttons">
          <button
            className={`SR-gender-button ${activeGender === 'Male' ? 'SR-gender-button-active' : ''}`}
            onClick={() => handleGenderFilter(activeGender === 'Male' ? '' : 'Male')}
          >
            Boys
          </button>
          <button
            className={`SR-gender-button ${activeGender === 'Female' ? 'SR-gender-button-active' : ''}`}
            onClick={() => handleGenderFilter(activeGender === 'Female' ? '' : 'Female')}
          >
            Girls
          </button>
        </div>
            {/* Year Filter (Dynamically Generated) */}
            <select className="AR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}>
              <option value="">All Years</option>
              {wardenYears.map(year => (
                <option key={year} value={year}>
                  {year === 1 ? "First Year" :
                   year === 2 ? "Second Year" :
                   year === 3 ? "Third Year" :
                   year === 4 ? "Fourth Year" :`year ${year}`}
                </option>
              ))}
            </select>

             {/* Department Filter */}
            <select className="AR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}>
              <option value="">All Departments</option>
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {departmentLabels[dept] || dept}
                  </option>
                ))
              ) : (
                <option disabled>No departments available</option>
              )}
            </select>

            {/* Pass Type Filter (Dynamically Generated) */}
            <select className="AR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, passType: e.target.value }))}>
              <option value="">All Types</option>
              {passTypes.length > 0 ? (
                passTypes.map((type) => (
                  <option key={type} value={type}>
                    {passTypeLabels[type] || type}
                  </option>
                ))
              ) : (
                <option disabled>No pass types available</option>
              )}
            </select>

            <div className='superior-req-button'>
              <button onClick={() => navigate('/hostel/superior/requests/Profile-Change-Request')} className='profile-change-button'>
                Profile Change Requests
              </button>

              <button onClick={() => navigate('/hostel/superior/requests/vacate')} className='profile-change-button'>
                Vacate Requests
              </button>

              <button onClick={() => navigate('/hostel/superior/requests/Prev-Requests')} className='prev-requests-button'>
               Pass Log History
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p>⏳ Loading pending passes...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="no-records-message">📋 No pending pass requests found.</p>
        ) : (
          <div className='AR-table-container'>
          <table className="AR-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Year</th>
                <th>Room</th>
                <th>Req Date</th>
                <th>Pass Type</th>
                <th>Date</th>
                <th>Late Count</th>
                <th>Parent Approval</th>
              </tr>
            </thead>
            <tbody>
            {filteredRecords.map((record) => {
              // Determine row color based on late_count
              const getRowClass = (late_count) => {
                if (late_count < 3) return "AR-row-green"; // Green row
                if (late_count <= 5) return "AR-row-orange"; // Orange row
                return "AR-row-red"; // Red row
              };
              const getStatusClass = (status) => {
                if (status === null) return "AR-status-orange"; // Pending (Orange)
                return status ? "AR-status-green" : "AR-status-red"; // Accepted (Green) | Declined (Red)
              };    

              return (
                <tr key={record.pass_id} className={getRowClass(record.late_count)} onClick={() => setSelectedRecord(record)}>
                  <td>{record.name}</td>
                  <td>{["I", "II", "III", "IV"][record.year - 1] || record.year}</td>
                  <td>{record.room_no}</td>
                  <td>{new Date(record.request_date_time).toLocaleDateString('en-GB').replace(/\//g, ' - ')}</td>
                  <td>{passTypeLabels[record.passtype] || record.passtype}</td>
                  <td>{new Date(record.from).toLocaleDateString('en-GB').replace(/\//g, ' - ')}</td>
                  <td>
                  <span className={`AR-late-circle ${getRowClass(record.late_count)}`}>
                    {record.late_count}
                  </span>
                </td>
                    <td>
                      <span className={`AR-status-circle ${getStatusClass(record.parent_approval)}`}>
                        {record.parent_approval === null ? "Pending" : record.parent_approval ? "Accepted" : "Declined"}
                      </span>
                    </td>
                </tr>
              );
            })}
          </tbody>
          </table>
          </div>
        )}

        {selectedRecord && (
          <DetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isMedical={isMedical} // ✅ Pass down medical state
          setIsMedical={setIsMedical} // ✅ Allow modal to update medical state
        />
        )}
      </div>
    </div>
  );
}

// Detail Modal Component
const PairedInfo = ({ left, right }) => (
  <div className="AR-paired-info">
    <div className="AR-info-container">
      <span className="AR-label">{left.label}</span>
      <p className="AR-value">{left.value}</p>
    </div>
    <div className="AR-info-container">
      <span className="AR-label">{right.label}</span>
      <p className="AR-value">{right.value}</p>
    </div>
  </div>
);

function DetailModal({ record, onClose, onAccept, onDecline, isMedical, setIsMedical }) {
  const [showDocument, setShowDocument] = useState(false);
  const [comment,setComment] = useState(null);

  // Convert "from" and "to" timestamps into date & time formats
  const fromDateTime = new Date(record.from);
  const toDateTime = new Date(record.to);

  const formattedFromDate = fromDateTime.toLocaleDateString('en-GB').replace(/\//g, ' - '); // Format: DD - MM - YYYY
  const formattedFromTime = fromDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }); // Format: HH:MM AM/PM

  const formattedToDate = toDateTime.toLocaleDateString('en-GB').replace(/\//g, ' - '); // Format: DD - MM - YYYY
  const formattedToTime = toDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }); // Format: HH:MM AM/PM

  const handleDocumentButtonClick = (e) => {
    e.stopPropagation(); // Prevent click from propagating to overlay
    Swal.fire({
      title: "Loading Document...",
      text: "Please wait while we load the document preview.",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    setTimeout(() => {
      setShowDocument(true);
      Swal.close();
    }, 1000);
  };

  const handleModalClick = (e) => {
    e.stopPropagation(); // Prevent click from propagating to overlay
  };

    const handleMedicalChange = (e) => {  // <--- Here's the declaration
    setIsMedical(e.target.checked);
  };

  const handleOverlayClick = () => {
    setShowDocument(false); // Close document modal if overlay is clicked.
    onClose(); // Close main modal if the overlay is clicked.
  };

  const getLateCountClass = (lateCount) => {
    if (lateCount < 3) return "AR-status-green";  // Green
    if (lateCount <= 5) return "AR-status-orange"; // Orange
    return "AR-status-red"; // Red
  };

  const passTypeLabels = {
    "od": "OD",
    "outpass": "Out Pass",
    "staypass": "Stay Pass",
    "leave": "Leave"
  };
  
  const reasonTypeLabels = {
    "intern": "Intern",
    "semester": "Semester",
    "festival": "Festival",
    "medical": "Medical",
    "others": "Other"
  };

  const BASE_URL = process.env.REACT_APP_BASE_URL;
  
  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };
  
  return(
    <div className="AR-modal-overlay" onClick={handleOverlayClick}> {/* Overlay click handler for main modal */}
            <div className="AR-modal-container" onClick={handleModalClick}> {/* Modal click handler */}
            <div className="AR-modal-content">
              <div className="AR-modal-header">
                <h2 className="AR-title">Request Details</h2>
                <button onClick={onClose} className="AR-close-button">
                  <X className="AR-icon" />
                </button>
              </div>
    
              <div className="AR-modal-body">
                <PairedInfo
                  left={{ label: "Name", value: record.name }}
                  right={{ label: "Department", value: record.dept }}
                />
                
                <PairedInfo
                  left={{ label: "Year", value: record.year }}
                  right={{ label: "Room", value: record.room_no }}
                />
                
                <PairedInfo
                  left={{ 
                    label: "Pass Type", 
                    value: (
                      <span className="AR-badge AR-badge-primary">
                        {passTypeLabels[record.passtype] || record.passtype}
                      </span>
                    )
                  }}
                  right={{ 
                    label: "Late Count", 
                    value: (
                      <span className={`AR-late-circle ${getLateCountClass(record.late_count)}`}>
                        {record.late_count}
                      </span>
                    )
                  }}
                />
    
                <PairedInfo 
                  left={{ label: "From Date", value: formattedFromDate }} 
                  right={{ label: "From Time", value: formattedFromTime }} 
                />
                <PairedInfo 
                  left={{ label: "To Date", value: formattedToDate }} 
                  right={{ label: "To Time", value: formattedToTime }} 
                />
    
                <PairedInfo
                  left={{ label: "Place to Visit", value: record.place_to_visit }}
                  right={{
                    label: "Reason Category",
                    value: (
                      <span className="AR-badge AR-badge-secondary">
                        {reasonTypeLabels[record.reason_type] || record.reason_type}
                      </span>
                    )
                  }}
                />

                {(record.parent_approval === null || record.parent_approval === false) && (
                  <div className="AR-warden-note">
                    <span className="AR-label-warden">Warden notes</span>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)} // Update comment state
                    ></textarea>
                  </div>
                )}
                
    
                {record.reason_type === 'others' && (
                  <div className="AR-additional-info">
                    <span className="AR-label">Additional Details</span>
                    <p className="AR-value">{record.reason_for_visit || ''}</p>
                  </div>
                )}
    
                {record.passtype === 'outpass' && (
                  <div className="AR-medical-checkbox">
                    <label className="AR-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isMedical}
                        onChange={handleMedicalChange}
                        className="AR-checkbox"
                      />
                      <span className="AR-checkbox-text">Medical Related</span>
                    </label>
                  </div>
                )}
              </div>
    
              {(record.passtype === 'od' || record.passtype === 'leave') && record.file_path && (
                <button
                  onClick={handleDocumentButtonClick}  // Use the new handler
                  className="AR-document-button"
                >
                  <FileText className="AR-icon" />
                  <span>View Document</span>
                </button>
              )}
    
              <div className="AR-modal-footer">
                <button 
                  onClick={() => {
                    Swal.fire({
                      title: "Decline Request?",
                      text: `Are you sure you want to decline this pass request for ${record.name}?`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#dc3545",
                      cancelButtonColor: "#6c757d",
                      confirmButtonText: "Yes, Decline",
                      cancelButtonText: "Cancel"
                    }).then((result) => {
                      if (result.isConfirmed) {
                        onDecline(record.pass_id, isMedical);
                      }
                    });
                  }} 
                  className="AR-button AR-button-secondary"
                >
                  Decline
                </button>
                <button 
                  onClick={() => {
                    Swal.fire({
                      title: "Accept Request?",
                      text: `Are you sure you want to accept this pass request for ${record.name}?`,
                      icon: "question",
                      showCancelButton: true,
                      confirmButtonColor: "#28a745",
                      cancelButtonColor: "#6c757d",
                      confirmButtonText: "Yes, Accept",
                      cancelButtonText: "Cancel"
                    }).then((result) => {
                      if (result.isConfirmed) {
                        onAccept(record.pass_id, isMedical, comment);
                      }
                    });
                  }} 
                  className="AR-button AR-button-primary"
                >
                  Accept
                </button>
              </div>

            </div>
          </div>

          {showDocument && (
            <div className="AR-document-modal" onClick={handleOverlayClick}>
              <div className="AR-document-container" onClick={handleModalClick}>
                
                {/* Header */}
                <div className="AR-document-header">
                  <h3 className="AR-document-title">Document Preview</h3>
                  <button onClick={() => setShowDocument(false)} className="AR-close-button">
                    <X className="AR-icon" />
                  </button>
                </div>

                {/* Dynamic Content */}
                <div className="AR-document-content">
                  {(() => {
                    const fileUrl = UrlParser(record.file_path); // get parsed URL
                    const fileExtension = fileUrl.split('.').pop().toLowerCase();

                    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                      return <img src={fileUrl} alt="Document Preview" className="AR-document-image" />;
                    } else if (fileExtension === 'pdf') {
                      return (
                        <iframe
                          src={fileUrl}
                          title="PDF Document"
                          className="AR-document-frame"
                        >
                          Your browser does not support PDF viewing. <a href={fileUrl}>Download PDF</a>
                        </iframe>
                      );
                    } else {
                      return <p>Unsupported file format.</p>;
                    }
                  })()}
                </div>

              </div>
            </div>
          )}
    
    
        </div>
  );
}

export default SuperiorRequest;

import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Filter, ArrowLeft } from 'lucide-react';
import './SuperiorRequest.css';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axios';
import Swal from 'sweetalert2';

function PrevRequest() {
  const [records, setRecords] = useState([]);
  const [wardenYears, setWardenYears] = useState([1, 2, 3, 4]);
  const [departments, setDepartments] = useState([]);
  const [passTypes, setPassTypes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeGender, setActiveGender] = useState('');
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wardendata, setWardens] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({ year: '', department: '', passType: '', search: '', date: '', status: '', warden: '' });

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

  const yearToAlphabet = {
    '1': 'First Year',
    '2': 'Second Year',
    '3': 'Third Year',
    '4': 'Fourth Year',
    '10': 'MBA',
    '9': 'ME',
    'overall': 'Overall'
  };

  useEffect(() => {
    const fetchWardens = async () => {
      try {
        const response = await axiosInstance.get("/api/fetch_warden_details");
        const fetchedWardens = response.data.wardens;

        const formattedWardens = fetchedWardens.map((warden) => ({
          id: warden.unique_id,
          name: warden.warden_name,
        }));

        setWardens(formattedWardens);
      } catch (err) {
        console.error("Error fetching warden data", err);
      }
    };

    fetchWardens();
  }, []);

  const handleGenderFilter = (gender) => {
    const newGender = activeGender === gender ? '' : gender; // Toggle selection
    setActiveGender(newGender);
  };

  useEffect(() => {
    fetchWardenDetails();
  }, []);

  const fetchWardenDetails = async () => {
    try {
      const response = await axiosInstance.get('/api/sidebar_warden');
      // We don't overwrite wardenYears with batch years because we handle academic years (1, 2, 3, 4) in this dashboard.
    } catch (error) {
      console.error("Error fetching warden details:", error);
    }
  };

  useEffect(() => {
    const fetchPendingPasses = async (selectedDate) => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/fetch_passes_', {
          params: { date: selectedDate }
        });

        const data = response.data;
        console.log(data);


        if (data.data) {
          setRecords(data.data);
          setDepartments([...new Set(data.data.map(pass => pass.dept))]);
          setPassTypes([...new Set(data.data.map(pass => pass.passtype))]);
          setWardenYears([...new Set([1, 2, 3, 4, ...data.data.map(pass => pass.year)])]);
        } else {
          setRecords([]);
          setWardenYears([1, 2, 3, 4]);
        }
      } catch (error) {
        console.error("Error fetching passes:", error);
        setRecords([]);
        setWardenYears([1, 2, 3, 4]);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingPasses(selectedDate);

  }, [selectedDate])

  // Get unique warden IDs from the fetched pass details
  const uniqueWardenIds = [...new Set(records.map(record => record.authorised_warden_id))];

  // Filter wardens based on the unique IDs
  const filteredWardens = wardendata?.filter(warden => uniqueWardenIds.includes(warden.id));

  const filteredRecords = records.filter(record => {
    const searchQuery = filters.search.toLowerCase();
    return (
      (!activeGender || record.gender === activeGender) &&
      (!filters.warden || record.authorised_warden_id === filters.warden) &&
      (!filters.year || record.year?.toString() === filters.year) &&
      (!filters.department || record.dept === filters.department) &&
      (!filters.passType || record.passtype === filters.passType) &&
      (!filters.search ||
        record.name.toLowerCase().includes(searchQuery) ||
        record.room_no.toLowerCase().includes(searchQuery) ||
        record.place_to_visit.toLowerCase().includes(searchQuery)
      ) &&
      (!filters.status || (
        (filters.status === "accepted" && record.wardern_approval === true) ||
        (filters.status === "declined" && record.wardern_approval === false)
      ))
    );
  });

  const handleApprove = async (record, event) => {
    event.stopPropagation();

    Swal.fire({
      title: "Approve Request?",
      text: `Are you sure you want to approve the request for ${record.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axiosInstance.post('/api/warden_decision', {
            pass_id: record.pass_id,
            action: 'approve'
          });

          if (response.status === 200) {
            Swal.fire({
              title: "Success!",
              text: "✅ Pass request approved successfully.",
              icon: "success",
              showConfirmButton: false,
              timer: 2000
            });
            // Refresh the table data
            setSelectedDate(new Date().toISOString().split('T')[0]);
          } else {
            Swal.fire({
              title: "Error!",
              text: "❌ Failed to approve request. Please try again.",
              icon: "error",
              showConfirmButton: true
            });
          }
        } catch (error) {
          console.error("Error approving request:", error);
        }
      }
    });
  };

  const handleReject = async (record, event) => {
    event.stopPropagation();

    Swal.fire({
      title: "Reject Request?",
      text: `Are you sure you want to reject the request for ${record.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Reject",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axiosInstance.post('/api/warden_decision', {
            pass_id: record.pass_id,
            action: 'reject'
          });

          if (response.status === 200) {
            Swal.fire({
              title: "Success!",
              text: "✅ Pass request rejected successfully.",
              icon: "success",
              showConfirmButton: false,
              timer: 2000
            });
            // Refresh the table data
            setSelectedDate(new Date().toISOString().split('T')[0]);
          } else {
            Swal.fire({
              title: "Error!",
              text: "❌ Failed to reject request. Please try again.",
              icon: "error",
              showConfirmButton: true
            });
          }
        } catch (error) {
          console.error("Error rejecting request:", error);
        }
      }
    });
  };

  return (
    <div className="AR-app">
      <div className="AR-main">
        <div className='flex items-center justify-start gap-2'>
          <button className='flex gap-1 justify-center items-center back-btn' onClick={() => navigate(-1)}><ArrowLeft className='w-5' />Back</button>
          <h1 className="AR-page-title"> Previous Requests </h1>
        </div>

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
                        year === 4 ? "Fourth Year" : `year ${year}`}
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
            <select className="AR-filter-select" onChange={(e) => { setFilters(prev => ({ ...prev, passType: e.target.value })) }}>
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

            <input
              type="date"
              className="AR-filter-select"
              value={selectedDate}  // Bind the value to state
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                setFilters(prev => ({ ...prev, date: newDate }));
                // fetchPendingPasses(newDate); 
              }}
            />

            <select className="AR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>

            <select className="AR-filter-select" onChange={(e) => { setFilters(prev => ({ ...prev, warden: e.target.value })); setSelectedWarden(e.target.value) }}>
              <option value="">All Wardens</option>
              {filteredWardens?.map((warden) => (
                <option key={warden.id} value={warden.id}>
                  {warden.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>⏳ Loading passes for selected date...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="no-records-message">📋 No passes found for the selected date and filters.</p>
        ) : (
          <div className='AR-table-container'>
            <table className="AR-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Room</th>
                  <th>Req data</th>
                  <th>Pass Type</th>
                  <th>from Date</th>
                  <th>Warden Approval</th>
                  <th>Parent Approval</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const getStatusClass = (status) => {
                    if (status === null) return "AR-status-orange"; // Pending (Orange)
                    return status ? "AR-status-green" : "AR-status-red"; // Accepted (Green) | Declined (Red)
                  };

                  return (
                    <tr key={record.pass_id} onClick={() => setSelectedRecord(record)}>
                      <td>{record.name}</td>
                      <td>{["I", "II", "III", "IV"][record.year - 1] || record.year}</td>
                      <td>{record.room_no}</td>
                      <td>{new Date(record.request_time).toLocaleDateString('en-GB').replace(/\//g, ' - ')}</td>
                      <td>{passTypeLabels[record.passtype] || record.passtype}</td>
                      <td>{new Date(record.from).toLocaleDateString('en-GB').replace(/\//g, ' - ')}</td>
                      <td>
                        {record.wardern_approval === null ? (
                          <span className={`AR-status-circle ${getStatusClass(record.superior_wardern_approval)}`}>
                            {record.superior_wardern_approval ? "Accepted (SW)" : "Declined (SW)"}
                          </span>
                        ) : (
                          <span className={`AR-status-circle ${getStatusClass(record.wardern_approval)}`}>
                            {record.wardern_approval ? "Accepted (W)" : "Declined (W)"}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`AR-status-circle ${getStatusClass(record.parent_approval)}`}>
                          {record.parent_approval === null ? "Pending" : record.parent_approval ? "Accepted" : "Declined"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {record.wardern_approval === null && record.superior_wardern_approval === null && (
                            <>
                              <button
                                onClick={(e) => handleApprove(record, e)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                                title="Approve request"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={(e) => handleReject(record, e)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                                title="Reject request"
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}
                          {(record.wardern_approval !== null || record.superior_wardern_approval !== null) && (
                            <span style={{ color: '#999', fontSize: '12px' }}>Already Processed</span>
                          )}
                        </div>
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

function DetailModal({ record, onClose }) {
  const [showDocument, setShowDocument] = useState(false);

  // Convert "from" and "to" timestamps into date & time formats
  const fromDateTime = new Date(record.from);
  const toDateTime = new Date(record.to);
  const indateTime = new Date(record.re_entry_time);

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

  const formattedInDate = indateTime.toLocaleDateString('en-GB').replace(/\//g, '/'); // Format: DD - MM - YYYY
  const formattedINTime = indateTime.toLocaleTimeString('en-US', {
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

  const handleOverlayClick = () => {
    setShowDocument(false); // Close document modal if overlay is clicked.
    onClose(); // Close main modal if the overlay is clicked.
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

  const BASE_URL = process.env.REACT_APP_QR_URL;

  const UrlParser = (path) => {
    return path?.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  return (
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
                label: "Returned Detail",
                value: `${formattedInDate} - ${formattedINTime}`
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

            {record.reason_type === 'others' && (
              <div className="AR-additional-info">
                <span className="AR-label">Additional Details</span>
                <p className="AR-value">{record.reason_for_visit || ''}</p>
              </div>
            )}

            {record.comment !== null && (
              <div className="AR-warden-note">
                <span className="AR-label-warden">Warden notes</span>
                <p className="AR-value">{record.comment || ''}</p>
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
        </div>
      </div>

      {showDocument && (
        <div className="AR-document-modal" onClick={handleOverlayClick}> {/* Overlay click handler */}
          <div className="AR-document-container" onClick={handleModalClick}> {/* Modal click handler */}
            {/* ... document content */}
            <div className="AR-document-header">
              <h3 className="AR-document-title">Document Preview</h3>
              <button onClick={() => setShowDocument(false)} className="AR-close-button">
                <X className="AR-icon" />
              </button>
            </div>
            <div className="AR-document-content">
              <iframe
                src={UrlParser(record.documentUrl)}
                className="AR-document-frame"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrevRequest;

import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Home, ArrowLeft } from 'lucide-react';
import './FoodTypeRequest.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../../api/axios';

function FoodTypeRequest() {
  const [records, setRecords] = useState([]);
  const [wardenYears, setWardenYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({ year: '', department: '', search: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch warden years
  const fetchWardenDetails = async () => {
    try {
      const response = await axiosInstance.get('/api/sidebar_warden');
      const data = response.data;
      const years = data["primary batch"] || data["primary year"];
      if (years) {
        setWardenYears([...years]);
      }
    } catch (error) {
      console.error("❌ Error fetching warden details:", error);
      Swal.fire({
        title: "Error ❌",
        text: "Failed to fetch warden details. Some filters may not work properly.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  // Fetch food type requests
  const fetchFoodRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/food_requests_changes');
      const data = response.data;
      if (data.requests) {
        setRecords(data.requests);
        setDepartments([...new Set(data.requests.map(req => req.department))]);
      }
    } catch (error) {
      console.error("❌ Error fetching food requests:", error);
      Swal.fire({
        title: "Error ❌",
        text: "Failed to fetch food type requests. Please refresh the page.",
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardenDetails();
    fetchFoodRequests();
  }, []);

  // Accept/Decline Handlers
  const handleAction = async (registration_number, name, action, oldFood, newFood) => {
    console.log(`🔵 Sending ${action.toUpperCase()} request for ${registration_number}`);

    // Confirmation dialog
    const actionText = action === 'approve' ? 'accept' : 'decline';
    const result = await Swal.fire({
      title: `${action === 'approve' ? 'Accept' : 'Decline'} Request?`,
      html: `Are you sure you want to ${actionText} the food type change for <strong>${name}</strong>?<br/><br/>
             <span style="color: ${oldFood === 'Veg' ? '#10b981' : '#ef4444'}">${oldFood}</span> → 
             <span style="color: ${newFood === 'Veg' ? '#10b981' : '#ef4444'}">${newFood}</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: action === 'approve' ? "#28a745" : "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Yes, ${action === 'approve' ? 'Accept' : 'Decline'}`,
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) {
      return; // User cancelled
    }

    // Show loading state
    Swal.fire({
      title: "Processing ⏳",
      text: `${action === 'approve' ? 'Accepting' : 'Declining'} food type request...`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axiosInstance.post('/api/approve_food_change', {
        registration_number,
        name,
        action
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: `Food type request ${action === 'approve' ? 'accepted' : 'declined'} successfully.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          setRecords((prev) => prev.filter(record => record.registration_number !== registration_number));
          setSelectedRecord(null);
        });
      }
    } catch (error) {
      console.error(`❌ Error processing ${action} request:`, error);
    }
  };

  // Filter Logic
  const filteredRecords = records.filter(record => {
    const searchQuery = filters.search.toLowerCase();
    return (
      (!filters.year || record.year.toString() === filters.year) &&
      (!filters.department || record.department === filters.department) &&
      (!filters.search ||
        record.name.toLowerCase().includes(searchQuery) ||
        record.registration_number.toLowerCase().includes(searchQuery) ||
        record.requested_foodtype.toLowerCase().includes(searchQuery) ||
        record.room_number.toLowerCase().includes(searchQuery)
      )
    );
  });

  return (
    <div className="VR-app">
      <div className="VR-main">
        <div className='flex gap-3 items-center'>
          <button className='flex gap-1 justify-center items-center back-btn' onClick={() => navigate(-1)}><ArrowLeft className='w-5' />Back</button>
          <h1 className="VR-page-title">Food Type Requests</h1>
        </div>

        {/* Filter Bar */}
        <div className="VR-filter-bar">
          <div className="VR-search-container">
            <Search className="VR-search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Room Number, Registration No, or Food Type..."
              className="VR-search-input"
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="VR-filters">
            {/* Year Filter */}
            <select className="VR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}>
              <option value="">All Years</option>
              {wardenYears.map(year => (
                <option key={year} value={year}>
                  {year === 1 ? "First Year" :
                    year === 2 ? "Second Year" :
                      year === 3 ? "Third Year" :
                        year === 4 ? "Fourth Year" : `Year ${year}`}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select className="VR-filter-select" onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="VR-loading-message">⏳ Loading food type requests...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="VR-no-data-message">📋 No food type requests found.</p>
        ) : (
          <div className='SR-table-container'>

            <table className="VR-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Room</th>
                  <th>Food Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.registration_number} onClick={() => setSelectedRecord(record)}>
                    <td>{record.name}</td>
                    <td>{["I", "II", "III", "IV"][record.year - 1] || record.year}</td>
                    <td>{record.room_number}</td>
                    <td className="VR-food-cell">
                      <span className={`VR-food-old ${record.previous_foodtype === 'Veg' ? 'food-veg' : 'food-nonveg'}`}>
                        {record.previous_foodtype}
                      </span>
                      <ArrowRight size={16} className="VR-food-arrow" />
                      <span className={`VR-food-new ${record.requested_foodtype === 'Veg' ? 'food-veg' : 'food-nonveg'}`}>
                        {record.requested_foodtype}
                      </span>
                    </td>
                    <td>
                      <span className={`VR-status ${record.status === null ? "VR-status-warning" : record.status ? "VR-status-success" : "VR-status-danger"}`}>
                        {record.status === null ? "Pending" : record.status ? "Accepted" : "Declined"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {selectedRecord && (
          <DetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onAccept={() => handleAction(
              selectedRecord.registration_number,
              selectedRecord.name,
              "approve",
              selectedRecord.previous_foodtype,
              selectedRecord.requested_foodtype
            )}
            onDecline={() => handleAction(
              selectedRecord.registration_number,
              selectedRecord.name,
              "decline",
              selectedRecord.previous_foodtype,
              selectedRecord.requested_foodtype
            )}
          />
        )}
      </div>
    </div>
  );
}

// Detail Modal Component
function DetailModal({ record, onClose, onAccept, onDecline }) {
  return (
    <div className="VR-modal-overlay">
      <div className="VR-modal-container">
        <div className="VR-modal-content">
          <div className="VR-modal-header">
            <h2 className="VR-title">Confirm Changes</h2>
            <button onClick={onClose} className="VR-close-button">
              <X className="VR-icon" />
            </button>
          </div>

          <div className="VR-modal-body">
            <p className="VR-confirm-text">
              Are you sure you want to change the food type for <strong>{record.name}</strong>?
            </p>
          </div>

          <div className="VR-modal-footer">
            <button onClick={onDecline} className="VR-button VR-button-secondary">
              Decline
            </button>
            <button onClick={onAccept} className="VR-button VR-button-primary">
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoodTypeRequest;

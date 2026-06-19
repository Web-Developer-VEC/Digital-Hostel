import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axios';
import { ArrowLeft, Search, X } from 'lucide-react';
import './SuperiorRequest.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

function VacateReq() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeGender, setActiveGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', department: '', year: '' });
  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVacateForms = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/get_all_vacate_forms');

        const data = response.data;
        if (data.vacate_forms) {
          setRecords(data.vacate_forms);

          // Extract unique departments & years dynamically
          const uniqueDepartments = [
            ...new Set(data.vacate_forms.map((record) => record.dept).filter(Boolean)),
          ];
          const uniqueYears = [
            ...new Set(data.vacate_forms.map((record) => record.year).filter(Boolean)),
          ];

          setDepartments(uniqueDepartments);
          setYears(uniqueYears);
        } else {
          setRecords([]);
        }
      } catch (error) {
        console.error('Error fetching vacate forms:', error);
        Swal.fire({
          title: "Error ❌",
          text: "Failed to fetch vacate forms. Please refresh the page.",
          icon: "error",
          confirmButtonText: "OK"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVacateForms();
  }, []);

  const filteredRecords = records.filter((record) => {
    const searchQuery = filters.search.toLowerCase();
    return (
      (!activeGender || record.gender === activeGender) &&
      (!filters.department || record.dept === filters.department) &&
      (!filters.year || record.year.toString() === filters.year) &&
      (!filters.search ||
        record.name.toLowerCase().includes(searchQuery) ||
        record.registration_number.toLowerCase().includes(searchQuery) ||
        record.reason_for_leave.toLowerCase().includes(searchQuery))
    );
  });

  return (
    <div className="AR-app">
      <div className="AR-main">
        <div className='flex items-center justify-start gap-2'>
          <button className='flex gap-1 justify-center items-center back-btn' onClick={() => navigate(-1)}><ArrowLeft className='w-5' />Back</button>
          <h1 className="AR-page-title">Vacate Form Requests</h1>
        </div>

        {/* Filters Section */}
        <div className="AR-filter-bar">
          {/* Search Filter */}
          <div className="AR-search-container">
            <Search className="AR-search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Registration Number, or Reason..."
              className="AR-search-input"
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Gender Filter */}
          <div className="SR-gender-buttons">
            <button
              className={`SR-gender-button ${activeGender === 'Male' ? 'SR-gender-button-active' : ''}`}
              onClick={() => setActiveGender(activeGender === 'Male' ? '' : 'Male')}
            >
              Boys
            </button>
            <button
              className={`SR-gender-button ${activeGender === 'Female' ? 'SR-gender-button-active' : ''}`}
              onClick={() => setActiveGender(activeGender === 'Female' ? '' : 'Female')}
            >
              Girls
            </button>

            {/* Year Filter */}
            <select
              className="AR-filter-select"
              onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              className="AR-filter-select"
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <p className="AR-loading-message">⏳ Loading vacate forms...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="AR-no-data-message">📋 No vacate form requests found.</p>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-[100px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[50px]">
                    S.No
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[150px]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Registration Number
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Department
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[350px]">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[250px]">
                    Address
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Vacate Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr
                    key={record._id}
                    onClick={() => setSelectedRecord(record)}
                    className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800">
                      {record.name}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {record.registration_number}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800">
                      {record.dept}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {record.batch}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800">
                      {record.gender}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800 break-words max-w-[350px]">
                      {record.Reason}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800 break-words max-w-[250px]">
                      {record.Address}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {new Date(record.date_time).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {new Date(record.vacate_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Details */}
        {selectedRecord && (
          <DetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        )}
      </div>
    </div>
  );
}

function DetailModal({ record, onClose }) {

  const handleAction = async (action) => {
    // Confirmation dialog before action
    const actionText = action === 'approve' ? 'approve' : 'decline';
    const result = await Swal.fire({
      title: `${action === 'approve' ? 'Approve' : 'Decline'} Vacate Request?`,
      text: `Are you sure you want to ${actionText} the vacate request for ${record.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: action === 'approve' ? "#28a745" : "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Yes, ${action === 'approve' ? 'Approve' : 'Decline'}`,
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) {
      return; // User cancelled
    }

    // Show loading state
    Swal.fire({
      title: "Processing ⏳",
      text: `${action === 'approve' ? 'Approving' : 'Declining'} vacate request...`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axiosInstance.post('/api/archive_student', {
        student_id: record.registration_number,
        action: action
      });
      const data = response.data;

      if (response.status === 200) {
        Swal.fire({
          title: "Success! ✅",
          text: data.message || `Vacate request ${action === 'approve' ? 'approved' : 'declined'} successfully.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          onClose();
          window.location.reload();
        });
      } else {
        Swal.fire({
          title: "Error ❌",
          text: data.message || `Failed to ${actionText} vacate request.`,
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (error) {
      console.error("Error handling request:", error);
      Swal.fire({
        title: "Error ❌",
        text: "Failed to process vacate request. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  return (
    <div className="AR-modal-overlay" onClick={onClose}>
      <div className="AR-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="AR-modal-content">
          <div className="AR-modal-header">
            <h2 className="AR-title">Request Details</h2>
            <button onClick={onClose} className="AR-close-button">
              <X className="AR-icon" />
            </button>
          </div>

          <div className="AR-modal-body">
            <PairedInfo left={{ label: 'Name', value: record.name }} right={{ label: 'Reg. Number', value: record.registration_number }} />
            <PairedInfo left={{ label: 'Department', value: record.dept || 'N/A' }} right={{ label: 'Year', value: record.year }} />
            <PairedInfo left={{ label: 'Gender', value: record.gender }} right={{ label: 'Reason for Leave', value: record.reason_for_leave }} />
            <PairedInfo left={{ label: 'Address', value: record.Address }} right={{ label: 'Vacate Date', value: new Date(record.vacate_date).toLocaleString() }} />
          </div>

          <div className="SR-modal-footer">
            <button onClick={() => handleAction('decline')} className="SR-button SR-button-secondary">
              Decline
            </button>
            <button onClick={() => handleAction('approve')} className="SR-button SR-button-primary">
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default VacateReq;

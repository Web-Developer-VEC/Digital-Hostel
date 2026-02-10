import axios from 'axios';
import Swal from 'sweetalert2';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL || '',
  timeout: 30000, // 30 seconds timeout
  withCredentials: true, // Always send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Only handle truly global errors here
      // Let components handle specific status codes like 401, 400, 404, etc.
      switch (status) {
        case 500:
        case 502:
        case 503:
        case 504:
          // Only show alert for server errors
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: data.message || 'An internal server error occurred. Please try again later.',
            confirmButtonText: 'OK'
          });
          break;

        default:
          // Let component handle all other status codes (401, 403, 404, 400, etc.)
          break;
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your internet connection.',
        confirmButtonText: 'OK'
      });
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      Swal.fire({
        icon: 'error',
        title: 'Request Timeout',
        text: 'The request took too long. Please try again.',
        confirmButtonText: 'OK'
      });
    }

    return Promise.reject(error);
  }
);

// Helper function for FormData requests
export const createFormDataRequest = (url, formData, config = {}) => {
  return axiosInstance.post(url, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Helper function for JSON requests
export const createJsonRequest = (url, data, config = {}) => {
  return axiosInstance.post(url, data, config);
};

export default axiosInstance;

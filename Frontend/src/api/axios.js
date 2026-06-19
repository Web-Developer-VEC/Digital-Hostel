import axios from "axios";
import Swal from "sweetalert2";

let isAlertOpen = false;

const showAlert = ({
  icon = "error",
  title = "Error",
  text = "Something went wrong",
}) => {
  if (isAlertOpen) return;

  isAlertOpen = true;

  Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: "OK",
  }).finally(() => {
    isAlertOpen = false;
  });
};

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    /*
     * Request Timeout
     */
    if (error.code === "ECONNABORTED") {
      showAlert({
        title: "Request Timeout",
        text: "The server took too long to respond. Please try again.",
      });

      return Promise.reject(error);
    }

    /*
     * Network Error
     */
    if (!error.response) {
      showAlert({
        title: "Network Error",
        text: "Unable to connect to the server. Please check your internet connection.",
      });

      return Promise.reject(error);
    }

    const { status, data } = error.response;

    /*
     * Don't show alerts for login errors.
     * Login page already handles them.
     */
    const currentUrl = error.config?.url || "";

    if (
      currentUrl.includes("/login") &&
      [400, 401, 404].includes(status)
    ) {
      return Promise.reject(error);
    }

    switch (status) {
      case 400:
        showAlert({
          icon: "warning",
          title: "Invalid Request",
          text:
            data?.error ||
            data?.message ||
            "Please verify your input.",
        });
        break;

      case 401:
        if (!isAlertOpen) {
          isAlertOpen = true;

          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Please login again.",
            confirmButtonText: "OK",
          }).then(() => {
            isAlertOpen = false;
            window.location.href = "/";
          });
        }

        return Promise.reject(error);

      case 403:
        showAlert({
          icon: "warning",
          title: "Access Denied",
          text:
            data?.error ||
            "You do not have permission to perform this action.",
        });
        break;

      case 404:
        showAlert({
          icon: "info",
          title: "Not Found",
          text:
            data?.error ||
            "The requested resource could not be found.",
        });
        break;

      case 429:
        showAlert({
          icon: "warning",
          title: "Too Many Requests",
          text: "Please wait a few moments before trying again.",
        });
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        showAlert({
          icon: "error",
          title: "Server Error",
          text:
            data?.error ||
            "The server is temporarily unavailable.",
        });
        break;

      default:
        showAlert({
          icon: "error",
          title: "Error",
          text:
            data?.error ||
            data?.message ||
            error.message ||
            "Something went wrong.",
        });
    }

    return Promise.reject(error);
  }
);

export const getRequest = (url, config = {}) =>
  axiosInstance.get(url, config);

export const postRequest = (url, data, config = {}) =>
  axiosInstance.post(url, data, config);

export const putRequest = (url, data, config = {}) =>
  axiosInstance.put(url, data, config);

export const patchRequest = (url, data, config = {}) =>
  axiosInstance.patch(url, data, config);

export const deleteRequest = (url, config = {}) =>
  axiosInstance.delete(url, config);

export const createJsonRequest = (url, data, config = {}) =>
  axiosInstance.post(url, data, config);

export const createFormDataRequest = (
  url,
  formData,
  config = {}
) =>
  axiosInstance.post(url, formData, {
    ...config,
    headers: {
      ...config.headers,
      "Content-Type": "multipart/form-data",
    },
  });

export default axiosInstance;
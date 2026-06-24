import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout for API requests
});

// Attach JWT as Bearer header — reliable fallback when cookies are blocked
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no internet, server down)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.customMessage = "Request timed out. Please check your connection and try again.";
      } else if (error.code === 'ERR_NETWORK') {
        error.customMessage = "Network error. Please check your internet connection.";
      } else {
        error.customMessage = "Unable to reach the server. Please try again later.";
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const serverError = error.response.data?.error || error.response.data?.message;

    // Provide clearer error messages based on status code
    switch (status) {
      case 400:
        error.customMessage = serverError || "Invalid request. Please check your input and try again.";
        break;
      case 401:
        error.customMessage = "Your session has expired. Please sign in again.";
        // Clear auth data and redirect to login
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        window.location.href = "/login";
        break;
      case 403:
        error.customMessage = "You don't have permission to perform this action.";
        break;
      case 404:
        error.customMessage = serverError || "The requested resource was not found.";
        break;
      case 409:
        error.customMessage = serverError || "This action conflicts with existing data.";
        break;
      case 422:
        error.customMessage = serverError || "Validation failed. Please check your input.";
        break;
      case 429:
        error.customMessage = "Too many requests. Please wait a moment and try again.";
        break;
      case 500:
        error.customMessage = "Something went wrong on our end. Please try again later.";
        break;
      case 502:
        error.customMessage = "Service temporarily unavailable. Please try again later.";
        break;
      case 503:
        error.customMessage = "Service is currently unavailable. Please try again later.";
        break;
      default:
        error.customMessage = serverError || `An unexpected error occurred (${status}). Please try again.`;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

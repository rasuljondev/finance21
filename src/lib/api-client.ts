import axios, { AxiosInstance } from "axios";

/**
 * Finance21 backend client.
 *
 * Frontend talks to our backend (same-origin via Next rewrite), backend talks to Didox + DB.
 * Session is stored in httpOnly cookie.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: "/api/backend",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login ONLY if:
      // 1. Not already on the login page
      // 2. We are on a "protected" route (starting with /app)
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (!path.startsWith("/login") && path.startsWith("/app")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;


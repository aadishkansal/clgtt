import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { isTokenValid } from "../utils/helpers";

console.log("%c✅ AuthProvider.jsx loaded", "color: purple; font-size: 14px;");

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const storedAdmin = localStorage.getItem("admin");

      if (token && isTokenValid() && storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("AuthProvider error:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token, adminData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("admin", JSON.stringify(adminData));
    setAdmin(adminData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setAdmin(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

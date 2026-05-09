    import { createContext, useState } from "react";
    import api from "../api/axios";

    const AuthContext = createContext(null);

    // Helper to get initial state from localStorage
    const getInitialUser = () => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
    };

    const getInitialToken = () => {
    return localStorage.getItem("token") || null;
    };

    export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getInitialUser);
    const [token, setToken] = useState(getInitialToken);
    const [loading, setLoading] = useState(false);

    // Login function
    const login = async (email, password) => {
        try {
        const response = await api.post("/user/login", { email, password });
        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setToken(token);
        setUser(user);

        return { success: true, user, token };
        } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || "Login failed",
        };
        }
    };

    // Doctor login function
    const doctorLogin = async (email, password) => {
        try {
        const response = await api.post("/user/doctor-login", { email, password });
        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setToken(token);
        setUser(user);

        return { success: true, user, token };
        } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || "Doctor login failed",
        };
        }
    };

    // Register function
    const register = async (userData) => {
        try {
        const response = await api.post("/user/register", userData);
        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setToken(token);
        setUser(user);

        return { success: true, user, token };
        } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || "Registration failed",
        };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    // Update user profile
    const updateUser = (updatedUser) => {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        doctorLogin,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    };

    export default AuthContext;

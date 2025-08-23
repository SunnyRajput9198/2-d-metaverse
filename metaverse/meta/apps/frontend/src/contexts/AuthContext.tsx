import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import type { AuthResponse } from '../types';

import { BACKEND_URL, WS_URL } from "../config";

interface AuthContextType {
    token: string | null;
    userId: string | null;
    username: string | null;
    avatarId: string | null;
    isAuthenticated: boolean;
    isLoadingAuth: boolean;
    signup: (username: string, password: string, type?: "admin" | "user") => Promise<{ success: boolean; error?: string }>;
    signin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signout: () => void;
    BACKEND_URL: string;
    WS_URL: string;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); // NEW: Initialize as true
    const [username, setUsername] = useState<string | null>(null);
    const [avatarId, setAvatarId] = useState<string | null>(null);


    const navigate = useNavigate();

    // Effect to load initial state from localStorage (runs once on mount)
    // This effect is responsible for the initial determination of auth status
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');
        const storedUsername = localStorage.getItem('username');
        const storedAvatarId = localStorage.getItem('avatarId');
        if (storedToken && storedUserId) {
            setToken(storedToken);
            setUserId(storedUserId);
            setUsername(storedUsername);
            setAvatarId(storedAvatarId);
            setIsAuthenticated(true);
        }
        setIsLoadingAuth(false); // NEW: Set loading to false AFTER checking localStorage
    }, []);

    // Effect to keep localStorage and isAuthenticated in sync with token/userId state changes
    // This runs whenever setToken are explicitly called by signin/signout
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
        }
    }, [token]);

    const signup = async (username: string, password: string, type: "admin" | "user" = "user") => {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, { username, password, type });
            if (response.status === 200) {
                const signinResponse = await axios.post<AuthResponse>(`${BACKEND_URL}/api/v1/signin`, { username, password });
                if (signinResponse.status === 200 && signinResponse.data.token) {
                    setToken(signinResponse.data.token);
                    return { success: true };
                } else {
                    return { success: false, error: "Auto-signin failed after signup." };
                }
            }
            return { success: false, error: "Signup failed unexpectedly." };
        } catch (error: any) {
            console.error('Signup error:', error.response?.data?.message || error.message);
            return { success: false, error: error.response?.data?.message || 'Signup failed' };
        }
    };

    const signin = async (username: string, password: string) => {
        try {
            const response = await axios.post<AuthResponse>(`${BACKEND_URL}/api/v1/signin`, { username, password });
            if (response.status === 200 && response.data.token) {
                setToken(response.data.token);
                setUserId(response.data.userId);
                setUsername(response.data.username);
                setAvatarId(response.data.avatarId || null);

                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('username', response.data.username);
                if (response.data.avatarId) {
                    localStorage.setItem('avatarId', response.data.avatarId);
                }

                return { success: true };
            }
            return { success: false, error: "Invalid response from server. Token or userId missing." };
        } catch (error: any) {
            console.log('Signin error:', error.response?.data?.message || error.message);
            setToken(null);
            setUserId(null);
            setIsAuthenticated(false);
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            return { success: false, error: error.response?.data?.message || 'Signin failed' }; // ✅ Return proper object
        }
    };

    const signout = () => {
        setToken(null);
        setUserId(null);
        navigate('/login');
    };

    const value = {
    token,
    userId,
    username,
    avatarId,
    isAuthenticated,
    isLoadingAuth,
    signup,
    signin,
    signout,
    BACKEND_URL,
    WS_URL
};


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

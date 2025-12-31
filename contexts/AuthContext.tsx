import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  avatar?: string;
  region?: string;
  faceData?: string; // Base64 encoded face image for Face ID
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithFace: (faceImage: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  region?: string;
  faceData?: string;
}

const API_BASE = 'http://localhost:3005/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Save auth changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, [token, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithFace = async (faceImage: string): Promise<boolean> => {
    // Get all users with face data from local storage (demo mode)
    // In production, this would be a backend endpoint with proper face matching
    const savedUsers = localStorage.getItem('registered_faces');
    if (!savedUsers) return false;

    try {
      const faces: Array<{ email: string; faceData: string }> = JSON.parse(savedUsers);

      // Simple demo: find user with face data
      // In production, use face-api.js or backend ML service for real matching
      const matchedUser = faces.find(f => f.faceData);

      if (matchedUser) {
        // Try to login with the matched email
        // For demo, we'll simulate successful face match
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: matchedUser.email,
            password: 'face_auth_bypass',
            faceAuth: true
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
          setUser({ ...data.user, faceData: matchedUser.faceData });
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          nombre: data.nombre,
          apellido: data.apellido,
          region: data.region,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await res.json();

      // Save face data locally for Face ID
      if (data.faceData) {
        const savedFaces = localStorage.getItem('registered_faces');
        const faces = savedFaces ? JSON.parse(savedFaces) : [];
        faces.push({ email: data.email, faceData: data.faceData });
        localStorage.setItem('registered_faces', JSON.stringify(faces));
      }

      setToken(result.token);
      setUser({ ...result.user, faceData: data.faceData });
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) return false;

      const updated = await res.json();
      setUser(prev => prev ? { ...prev, ...updated } : null);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        loginWithFace,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

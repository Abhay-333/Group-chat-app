import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { connectSocket, disconnectSocket } from "../socket/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("chat_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("chat_token"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("chat_token")));

  useEffect(() => {
    const loadSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("chat_user", JSON.stringify(data.user));
        connectSocket(token);
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [token]);

  const saveSession = (payload) => {
    localStorage.setItem("chat_token", payload.token);
    localStorage.setItem("chat_user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
    connectSocket(payload.token);
  };

  const login = async (form) => {
    const { data } = await api.post("/auth/login", form);
    saveSession(data);
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);
    saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

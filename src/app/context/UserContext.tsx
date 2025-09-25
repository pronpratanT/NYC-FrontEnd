"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToken } from "./TokenContext";

export type Me = {
  employee_id: string;
  Department?: {
    ID: number;
    name: string;
    short_name: string;
  };
  f_name: string;
  l_name: string;
};

interface UserContextType {
  user: Me | null;
  setUser: React.Dispatch<React.SetStateAction<Me | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Me | null>(null);
  const token = useToken();

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:6001/api/user/me`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setUser(data.data);
        console.log("Fetched user data:", data);
      } catch {
        setUser(null);
      }
    };
    fetchUserInfo();
  }, [token]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToken } from "./TokenContext";

export type Role = {
  role_id: number;
  role_name: string;
  service_id: number;
  service_name: string;
};

export type Department = {
  ID: number;
  name: string;
  short_name: string;
  dep_no?: string;
  dept_econ?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
};

export type Me = {
  ID: number;
  employee_id: string;
  password?: string;
  DepartmentID?: number;
  Department?: Department;
  f_name: string;
  l_name: string;
  is_active?: boolean;
  last_login?: string | null;
  has_license?: boolean;
  birth_date?: string;
  UserDepartmentId?: number | null;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
  role?: Role[]; // เปลี่ยนเป็น array
};

interface UserContextType {
  user: Me | null;
  setUser: React.Dispatch<React.SetStateAction<Me | null>>;
  // Department is available via user.Department
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
  // Removed unused variable apiUrl

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/me`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        // Merge role array into user object for context
        setUser({
          ...data.data,
          role: data.role
        });
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

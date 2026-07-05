"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import type { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<{ success: boolean; userId?: string; pending?: boolean; error?: string }>;
  changePassword: (
    userId: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem("xtrace_current_user");
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const stored = getStoredCurrentUser();
      setUser(stored);
      setIsLoading(false);
    }, 0);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (error || !data)
        return { success: false, error: "Email atau password salah" };

      const isValid = await bcrypt.compare(password, data.password_hash);
      if (!isValid)
        return { success: false, error: "Email atau password salah" };

      const userObj: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        password: "",
        role: data.role,
      };
      setUser(userObj);
      localStorage.setItem("xtrace_current_user", JSON.stringify(userObj));
      return { success: true };
    } catch {
      return { success: false, error: "Terjadi kesalahan, coba lagi" };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<{ success: boolean; userId?: string; pending?: boolean; error?: string }> => {
    try {
      const passwordHash = await bcrypt.hash(password, 12);

      // Pasien langsung masuk ke tabel users
      // Dokter, farmasi, admin → masuk pending dulu, nunggu approval admin
      if (role === "pasien") {
        const { data, error } = await supabase
          .from("users")
          .insert({ name, email, password_hash: passwordHash, role })
          .select("id")
          .single();

        if (error) {
          if (error.code === "23505")
            return { success: false, error: "Email sudah terdaftar" };
          return { success: false, error: "Terjadi kesalahan, coba lagi" };
        }

        return { success: true, userId: data?.id };
      } else {
        // Cek apakah email sudah ada di pending atau users
        const { data: existingPending } = await supabase
          .from("pending_registrations")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingPending) {
          return { success: false, error: "Email sudah dalam antrian pendaftaran" };
        }

        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingUser) {
          return { success: false, error: "Email sudah terdaftar" };
        }

        const { error } = await supabase
          .from("pending_registrations")
          .insert({ name, email, password_hash: passwordHash, role });

        if (error) {
          return { success: false, error: "Terjadi kesalahan, coba lagi" };
        }

        return { success: true, pending: true };
      }
    } catch {
      return { success: false, error: "Terjadi kesalahan, coba lagi" };
    }
  };

  const changePassword = async (
    userId: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 12);
      const { error } = await supabase
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("id", userId);

      if (error)
        return { success: false, error: "Terjadi kesalahan, coba lagi" };

      if (user?.id === userId) {
        const updatedUser = { ...user, password: "" };
        setUser(updatedUser);
        localStorage.setItem(
          "xtrace_current_user",
          JSON.stringify(updatedUser),
        );
      }

      return { success: true };
    } catch {
      return { success: false, error: "Terjadi kesalahan, coba lagi" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("xtrace_current_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, changePassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "dokter":
      return "/dokter";
    case "farmasi":
      return "/farmasi";
    case "pasien":
      return "/pasien";
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "dokter":
      return "Dokter";
    case "farmasi":
      return "Farmasi";
    case "pasien":
      return "Pasien";
  }
}

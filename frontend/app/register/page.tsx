"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  HeartPulse,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  Shield,
  Stethoscope,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";
import { Toaster, toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Register() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  // Pasien didaftarkan oleh admin, bukan self-register
  const roleOptions = [
    {
      value: "admin" as UserRole,
      label: "Admin",
      desc: "Manajemen sistem & pendaftaran",
      icon: Shield,
      color: "text-blue-400",
    },
    {
      value: "dokter" as UserRole,
      label: "Dokter",
      desc: "Pemeriksaan & diagnosis pasien",
      icon: Stethoscope,
      color: "text-emerald-400",
    },
    {
      value: "farmasi" as UserRole,
      label: "Farmasi",
      desc: "Penyediaan & penyerahan obat",
      icon: FlaskConical,
      color: "text-violet-400",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast.error("Mohon isi semua field");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setIsLoading(true);
    const result = await register(name, email, password, role);
    if (result.success) {
      if (result.pending) {
        setIsPending(true);
      } else {
        toast.success("Registrasi berhasil! Silakan login.");
        setTimeout(() => router.push("/login"), 1000);
      }
    } else {
      toast.error(result.error || "Registrasi gagal");
    }
    setIsLoading(false);
  };

  // Tampilan saat registrasi berhasil masuk ke antrian pending
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Menunggu Verifikasi</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Pendaftaran Anda telah berhasil dikirim. Akun Anda akan diaktifkan setelah
                diverifikasi oleh <span className="font-semibold text-foreground">Admin Vitas</span>.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Info</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Setelah disetujui, Anda bisa login menggunakan email dan password yang telah didaftarkan.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm transition-all"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Toaster position="top-right" richColors />

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-violet-400/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2,
              }}
              className="relative w-14 h-14 mx-auto rounded-2xl overflow-hidden mb-4 shadow-xl shadow-emerald-500/20 flex-shrink-0"
            >
              <Image src="/Logo.png" alt="Logo Vitas" fill sizes="56px" className="object-cover" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Daftar Akun Baru
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Buat akun untuk mengakses sistem Vitas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground text-sm">
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="reg-email"
                  className="text-muted-foreground text-sm"
                >
                  Email
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="reg-password"
                  className="text-muted-foreground text-sm"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">
                  Role / Peran
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${isSelected
                            ? "bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/30"
                            : "bg-muted/50 border-border hover:bg-muted"
                          }`}
                      >
                        <Icon
                          className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? "text-emerald-400" : "text-slate-400"}`}
                        />
                        <span
                          className={`block text-xs font-semibold ${isSelected ? "text-emerald-300" : "text-muted-foreground"}`}
                        >
                          {opt.label}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Daftar
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

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
import { HeartPulse, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useAuth, getRoleDashboardPath } from "@/contexts/AuthContext";
import { Toaster, toast } from "sonner";
import { motion } from "framer-motion";

export default function Login() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(getRoleDashboardPath(user.role));
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Mohon isi semua field");
      return;
    }
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      toast.success("Login berhasil!");
      // user state sudah di-set oleh login(), useEffect akan redirect
    } else {
      toast.error(result.error || "Login gagal");
    }
    setIsLoading(false);
  };

  const demoAccounts = [
    { role: "Admin", email: "Ammar@212.id", password: "admin123" },
    { role: "Dokter 1", email: "Farid@212.id", password: "dokter123" },
    { role: "Dokter 2", email: "Zicco@212.id", password: "123456" },
    { role: "Farmasi", email: "Adryan@212.id", password: "farmasi123" },
    { role: "Pasien 1", email: "Ammay@212.id", password: "pasien123" },
    { role: "Pasien 2", email: "Tougashi@212.id", password: "jiko123" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Toaster position="top-right" richColors />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-20 w-96 h-96 bg-teal-400/10 rounded-full blur-[120px]"
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
        {/* Back link */}
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
              Masuk ke Vitas
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Masuk dengan akun yang telah terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-muted-foreground text-sm"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@rsmisal.id"
                  className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-muted-foreground text-sm"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
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
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Akun Demo (klik untuk mengisi)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.password);
                    }}
                    className="px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-all text-center"
                  >
                    <span className="block font-semibold">{acc.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

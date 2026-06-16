"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { SlideUp } from "@/components/motion";
import { toast, Toaster } from "sonner";
import {
  UserCheck,
  UserX,
  Clock,
  Shield,
  Stethoscope,
  FlaskConical,
  RefreshCw,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "dokter" | "farmasi";
  created_at: string;
}

const roleConfig = {
  admin: {
    label: "Admin",
    icon: Shield,
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    iconClass: "text-blue-500",
  },
  dokter: {
    label: "Dokter",
    icon: Stethoscope,
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    iconClass: "text-emerald-500",
  },
  farmasi: {
    label: "Farmasi",
    icon: FlaskConical,
    badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    iconClass: "text-violet-500",
  },
};

export default function VerifikasiRegistrasi() {
  const [pendingList, setPendingList] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("pending_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data pendaftaran");
      console.error(error);
    } else {
      setPendingList(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (item: PendingRegistration) => {
    setProcessingId(item.id);
    try {
      // 1. Insert ke tabel users dengan password_hash yang sudah ada
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          name: item.name,
          email: item.email,
          password_hash: item.password_hash,
          role: item.role,
          is_active: true,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("Email sudah terdaftar di sistem");
        } else {
          toast.error("Gagal membuat akun: " + insertError.message);
        }
        setProcessingId(null);
        return;
      }

      // 2. Hapus dari pending_registrations
      const { error: deleteError } = await supabase
        .from("pending_registrations")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        toast.error("Akun dibuat tapi gagal menghapus dari antrian");
        setProcessingId(null);
        return;
      }

      toast.success(`Akun ${item.name} berhasil disetujui dan diaktifkan!`);
      setPendingList((prev) => prev.filter((p) => p.id !== item.id));
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
    }
    setProcessingId(null);
  };

  const handleReject = async (item: PendingRegistration) => {
    setProcessingId(item.id);
    try {
      const { error } = await supabase
        .from("pending_registrations")
        .delete()
        .eq("id", item.id);

      if (error) {
        toast.error("Gagal menolak pendaftaran");
        setProcessingId(null);
        return;
      }

      toast.success(`Pendaftaran ${item.name} telah ditolak`);
      setPendingList((prev) => prev.filter((p) => p.id !== item.id));
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
    }
    setProcessingId(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <SlideUp>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Verifikasi Registrasi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tinjau dan setujui atau tolak pendaftaran akun baru
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingList.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-3 py-1 text-sm font-semibold">
                {pendingList.length} menunggu
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPending}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </SlideUp>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Memuat data pendaftaran...</span>
        </div>
      ) : pendingList.length === 0 ? (
        <SlideUp>
          <Card className="border-border shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">Tidak ada pendaftaran baru</p>
                <p className="text-sm mt-1">Semua pendaftaran telah diproses.</p>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {pendingList.map((item, i) => {
              const cfg = roleConfig[item.role];
              const RoleIcon = cfg.icon;
              const isProcessing = processingId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-foreground flex-shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold text-foreground">
                              {item.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs font-semibold gap-1 ${cfg.badgeClass}`}>
                                <RoleIcon className="w-3 h-3" />
                                {cfg.label}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleReject(item)}
                            disabled={isProcessing}
                            variant="outline"
                            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <UserX className="w-4 h-4" />
                            Tolak
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item)}
                            disabled={isProcessing}
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                            {isProcessing ? "Memproses..." : "Setujui"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="bg-muted/50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5 font-medium">
                            Nama Lengkap
                          </p>
                          <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5 font-medium">Peran</p>
                          <p className={`text-sm font-semibold ${cfg.iconClass}`}>{cfg.label}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5 font-medium">
                            Tanggal Daftar
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        Email dan password tidak ditampilkan demi keamanan
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Info card */}
      <SlideUp delay={0.2}>
        <Card className="border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-none">
          <CardContent className="p-4 flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300">Cara Kerja</p>
              <ul className="text-blue-700 dark:text-blue-400 mt-1 space-y-1 text-xs">
                <li>• <strong>Setujui</strong> → akun aktif dibuat, pendaftar dapat login</li>
                <li>• <strong>Tolak</strong> → data pendaftaran dihapus permanen</li>
                <li>• Email & password tidak ditampilkan untuk keamanan data</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </SlideUp>
    </div>
  );
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity, Phone, Mail, MapPin, Clock, ArrowRight,
  Stethoscope, FlaskConical, HeartPulse, Microscope,
  Ambulance, Baby, Brain, Bone, Shield, Users,
  Menu, X
} from 'lucide-react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const services = [
    { icon: Ambulance, title: 'Unit Gawat Darurat', desc: 'Layanan darurat 24 jam dengan dokter spesialis siaga', color: 'bg-red-500' },
    { icon: HeartPulse, title: 'Rawat Jalan', desc: 'Pemeriksaan umum dan konsultasi dengan jadwal fleksibel', color: 'bg-emerald-500' },
    { icon: Microscope, title: 'Laboratorium', desc: 'Pemeriksaan laboratorium lengkap dan akurat', color: 'bg-blue-500' },
    { icon: FlaskConical, title: 'Farmasi', desc: 'Apotek lengkap dengan obat berkualitas', color: 'bg-violet-500' },
    { icon: Baby, title: 'Poli Anak', desc: 'Layanan kesehatan khusus anak dan balita', color: 'bg-pink-500' },
    { icon: Brain, title: 'Poli Saraf', desc: 'Konsultasi dan penanganan gangguan neurologi', color: 'bg-amber-500' },
  ]

  const advantages = [
    { icon: Stethoscope, title: 'AI-Powered Triage', desc: 'Sistem triase berbasis AI untuk prioritas pasien yang lebih akurat' },
    { icon: Shield, title: 'Blockchain Audit', desc: 'Rekam medis tercatat secara immutable di blockchain' },
    { icon: Users, title: 'Tim Profesional', desc: 'Dokter spesialis berpengalaman dan tenaga medis terlatih' },
    { icon: Clock, title: 'Layanan 24 Jam', desc: 'Unit gawat darurat siap melayani sepanjang hari' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 leading-tight tracking-tight">RS Misal</span>
                <span className="text-[10px] text-slate-400 leading-tight font-medium">Rumah Sakit Terpercaya</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md shadow-emerald-500/25"
              >
                Daftar Akun
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                Masuk
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg text-center font-semibold">
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal-400 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/25 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-300 font-medium">Sistem Aktif — AI Triage & Blockchain</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Pelayanan Kesehatan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Modern & Terpercaya
              </span>
            </h1>

            <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl">
              RS Misal hadir dengan teknologi AI untuk triase pasien yang lebih cepat dan akurat.
              Didukung sistem blockchain untuk rekam medis yang transparan dan aman.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                Daftar Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#layanan"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 px-7 py-3.5 rounded-xl font-semibold transition-all backdrop-blur-sm"
              >
                Lihat Layanan
              </a>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pasien Terlayani', value: '12,847', color: 'from-emerald-500 to-teal-500' },
            { label: 'Dokter Spesialis', value: '24', color: 'from-blue-500 to-indigo-500' },
            { label: 'Akurasi AI Triage', value: '91.4%', color: 'from-violet-500 to-purple-500' },
            { label: 'Waktu Respons', value: '<5 menit', color: 'from-amber-500 to-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl transition-shadow">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-md`}>
                <Activity className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keunggulan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Mengapa RS Misal?</span>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Keunggulan Kami</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Menggabungkan teknologi terdepan dengan pelayanan kesehatan yang manusiawi
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((adv) => {
            const Icon = adv.icon
            return (
              <div key={adv.title} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{adv.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{adv.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Layanan */}
      <div id="layanan" className="bg-slate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Layanan</span>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Layanan Kesehatan Kami</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Pelayanan kesehatan komprehensif untuk seluruh keluarga
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.title} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{service.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Alur Kerja */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Alur Layanan</span>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Bagaimana Cara Kerja Sistem Kami</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Alur yang terintegrasi dari pendaftaran hingga pengambilan obat
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Pendaftaran', desc: 'Admin mendaftarkan pasien dan menginput data keluhan serta vital sign.', icon: Users, color: 'from-blue-500 to-indigo-500' },
            { step: '02', title: 'Triage AI', desc: 'Sistem AI menganalisis data dan menentukan prioritas antrian pasien.', icon: Brain, color: 'from-violet-500 to-purple-500' },
            { step: '03', title: 'Pemeriksaan', desc: 'Dokter memeriksa pasien, mendiagnosis, dan meresepkan obat.', icon: Stethoscope, color: 'from-emerald-500 to-teal-500' },
            { step: '04', title: 'Farmasi', desc: 'Apoteker menyiapkan obat sesuai resep dan menyerahkan ke pasien.', icon: FlaskConical, color: 'from-amber-500 to-orange-500' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.step} className="relative text-center group">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-3 py-1 mb-3">
                  {item.step}
                </span>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Kontak */}
      <div id="kontak" className="bg-slate-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Hubungi Kami</span>
              <h2 className="text-3xl font-bold text-white mb-4">Kontak & Informasi</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Kami siap melayani Anda 24 jam. Jangan ragu untuk menghubungi kami kapan saja.
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white mb-0.5">Alamat</p>
                    <p className="text-sm text-slate-400">Jl. Kesehatan No. 123, Kelurahan Sejahtera, Kecamatan Sehat, Kota Bahagia 12345</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white mb-0.5">Telepon</p>
                    <p className="text-sm text-slate-400">(021) 1234-5678</p>
                    <p className="text-sm text-slate-400">Hotline UGD: 0800-1234-5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white mb-0.5">Email</p>
                    <p className="text-sm text-slate-400">info@rsmisal.id</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white mb-0.5">Jam Operasional</p>
                    <p className="text-sm text-slate-400">Rawat Jalan: Senin - Sabtu, 08:00 - 16:00</p>
                    <p className="text-sm text-slate-400">UGD: 24 Jam</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-6">Lokasi Kami</h3>
              <div className="bg-slate-700 rounded-xl h-64 flex items-center justify-center border border-slate-600">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Google Maps</p>
                  <p className="text-xs text-slate-500 mt-1">Jl. Kesehatan No. 123</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Parkir</p>
                  <p className="text-sm font-semibold text-white">Tersedia Luas</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Akses</p>
                  <p className="text-sm font-semibold text-white">Ramah Disabilitas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">RS Misal</p>
                <p className="text-[10px] text-slate-500">Rumah Sakit Terpercaya</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              © 2026 RS Misal. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

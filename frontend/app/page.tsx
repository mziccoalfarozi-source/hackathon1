'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  HeartPulse, Phone, Mail, MapPin, Clock, ArrowRight,
  Stethoscope, FlaskConical, Microscope,
  Ambulance, Baby, Brain, Bone, Shield, Users,
  Sparkles, Building2, ParkingCircle, Accessibility
} from 'lucide-react'
import { motion } from 'framer-motion'
import { SlideUp, StaggerContainer, StaggerItem, AnimatedCard, PulseDot } from '@/components/motion'

export default function Home() {
  const services = [
    { icon: Users, title: 'Admin Pendaftaran', desc: 'Input pasien terintegrasi dengan pemrosesan teks NLP otomatis', color: 'bg-blue-500' },
    { icon: Brain, title: 'AI Triage Engine', desc: 'Sistem prediksi ESI Level (1-5) berbasis model Machine Learning', color: 'bg-emerald-500' },
    { icon: Stethoscope, title: 'Dashboard Dokter', desc: 'Antarmuka CDSS untuk konfirmasi diagnosis dan penanganan medis', color: 'bg-indigo-500' },
    { icon: Shield, title: 'Blockchain Security', desc: 'Sistem dual-log (Initial & Final) untuk keamanan dan audit medis', color: 'bg-violet-500' },
    { icon: Sparkles, title: 'Explainable AI', desc: 'Analisis SHAP values untuk menjelaskan parameter prioritas triase', color: 'bg-amber-500' },
    { icon: Clock, title: 'Live Queue System', desc: 'Manajemen antrian pasien real-time dengan estimasi waktu tunggu', color: 'bg-pink-500' },
  ]

  const advantages = [
    { icon: Brain, title: 'NLP Text Extraction', desc: 'Ekstraksi otomatis tanda vital & gejala dari narasi keluhan pasien.' },
    { icon: Stethoscope, title: 'AI-Powered Triage', desc: 'Sistem CDSS triase berbasis AI (XGBoost) untuk penentuan ESI Level.' },
    { icon: Shield, title: 'Blockchain Audit Log', desc: 'Pencatatan rekam medis & triase secara immutable (Dual-log).' },
    { icon: Sparkles, title: 'Explainable AI (SHAP)', desc: 'Menampilkan transparansi alasan model AI dalam mengambil keputusan medis.' },
  ]

  const statIcons = [Users, Stethoscope, Sparkles, Clock]

  return (
    <div className="min-h-screen bg-background text-foreground">


      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900">
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-10 right-20 w-96 h-96 bg-teal-400 rounded-full blur-[120px]"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400 rounded-full blur-[80px]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <SlideUp delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                Pelayanan Kesehatan{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Modern & Terpercaya
                </span>
              </h1>
            </SlideUp>

            <SlideUp delay={0.35}>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-2xl">
                Aplikasi Clinical Decision Support System (CDSS) berbasis AI dengan fitur Natural Language Processing (NLP) untuk triase pasien cepat & akurat. Didukung sistem Blockchain untuk audit medis transparan.
              </p>
            </SlideUp>

            <SlideUp delay={0.5}>
              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    Masuk Sekarang
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('layanan')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/15 px-7 py-3.5 rounded-xl font-semibold transition-all backdrop-blur-sm shadow-sm dark:shadow-none"
                  >
                    Lihat Layanan
                  </button>
                </motion.div>
              </div>
            </SlideUp>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="currentColor" className="text-background dark:text-slate-950" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 relative z-10">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.1} initialDelay={0.2}>
          {[
            { label: 'Pasien Terlayani', value: '12,847', color: 'from-emerald-500 to-teal-500' },
            { label: 'Dokter Spesialis', value: '24', color: 'from-blue-500 to-indigo-500' },
            { label: 'Akurasi AI Triage', value: '91.4%', color: 'from-violet-500 to-purple-500' },
            { label: 'Waktu Respons', value: '<5 menit', color: 'from-amber-500 to-orange-500' },
          ].map((stat, i) => {
            const StatIcon = statIcons[i]
            return (
              <StaggerItem key={stat.label}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 20px 60px -12px rgba(0,0,0,0.15)' }}
                  className="bg-white dark:bg-card rounded-2xl p-5 shadow-md dark:shadow-none border border-slate-200 dark:border-border transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-md`}>
                    <StatIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{stat.label}</p>
                </motion.div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>

      {/* Keunggulan */}
      <div className="bg-slate-50 dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <SlideUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Mengapa Vitas?</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Keunggulan Kami</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Menggabungkan teknologi terdepan dengan pelayanan kesehatan yang manusiawi
            </p>
          </SlideUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {advantages.map((adv) => {
              const Icon = adv.icon
              return (
                <StaggerItem key={adv.title}>
                  <motion.div
                    whileHover={{ y: -6, borderColor: 'rgb(167, 243, 208)' }}
                    className="group bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-border shadow-md dark:shadow-none transition-all duration-300"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 flex items-center justify-center mb-4 transition-colors"
                    >
                      <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{adv.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{adv.desc}</p>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </div>

      {/* Layanan */}
      <div id="layanan" className="bg-slate-50 dark:bg-background scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <SlideUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Fitur Aplikasi</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Fitur Utama Sistem</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Sistem medis komprehensif terintegrasi kecerdasan buatan
            </p>
          </SlideUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
            {services.map((service) => {
              const Icon = service.icon
              return (
                <StaggerItem key={service.title}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="group bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-border shadow-md dark:shadow-none transition-all duration-300 hover:shadow-lg dark:hover:shadow-none"
                  >
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: -5 }}
                      className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4 shadow-md`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{service.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{service.desc}</p>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </div>

      {/* Alur Kerja */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SlideUp className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Alur Layanan</span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Bagaimana Cara Kerja Sistem Kami</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Alur yang terintegrasi dari pendaftaran hingga pengambilan obat
          </p>
        </SlideUp>

        <StaggerContainer className="grid md:grid-cols-4 gap-6" staggerDelay={0.15}>
          {[
            { step: '01', title: 'Input Narasi (NLP)', desc: 'Admin mengetik keluhan, AI mengekstrak data vital & gejala otomatis.', icon: Users, color: 'from-blue-500 to-indigo-500' },
            { step: '02', title: 'AI Triage', desc: 'Model AI memprediksi tingkat kegawatan (ESI Level 1-5).', icon: Brain, color: 'from-violet-500 to-purple-500' },
            { step: '03', title: 'Pemeriksaan', desc: 'Dokter memverifikasi hasil AI dan memberikan penanganan medis.', icon: Stethoscope, color: 'from-emerald-500 to-teal-500' },
            { step: '04', title: 'Blockchain Log', desc: 'Data triase awal & final disimpan permanen di blockchain.', icon: Shield, color: 'from-amber-500 to-orange-500' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <StaggerItem key={item.step}>
                <div className="relative text-center group">
                  <motion.div
                    whileHover={{ scale: 1.1, y: -4 }}
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-3 py-1 mb-3">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>

      {/* Kontak */}
      <div id="kontak" className="bg-slate-100 dark:bg-slate-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <SlideUp delay={0.1}>
              <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-4 uppercase tracking-wider">Hubungi Kami</span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Kontak & Informasi</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Kami siap melayani Anda 24 jam. Jangan ragu untuk menghubungi kami kapan saja.
              </p>

              <div className="space-y-5">
                {[
                  { icon: MapPin, title: 'Alamat', lines: ['Jl. Peta, Kahuripan, Kec. Tawang, Kab. Tasikmalaya, Jawa Barat 46115'] },
                  { icon: Phone, title: 'Telepon', lines: ['0898-7782-689', 'Hotline UGD: 0895-3541-02316'] },
                  { icon: Mail, title: 'Email', lines: ['m.ziccoalfarozi@gmail.com'] },
                  { icon: Clock, title: 'Jam Operasional', lines: ['Rawat Jalan: Senin sampai Sabtu, 08:00 sampai 16:00', 'UGD: 24 Jam'] },
                ].map((contact, i) => {
                  const ContactIcon = contact.icon
                  return (
                    <motion.div
                      key={contact.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <ContactIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white mb-0.5">{contact.title}</p>
                        {contact.lines.map((line, j) => (
                          <p key={j} className="text-sm text-slate-600 dark:text-slate-400">{line}</p>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </SlideUp>

            <SlideUp delay={0.3}>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-md dark:shadow-none">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Lokasi Kami
                </h3>
                <a
                  href="https://maps.app.goo.gl/8J4xusMpdx7gbprY9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-slate-50 dark:bg-slate-700 rounded-xl h-64 flex items-center justify-center border border-slate-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer overflow-hidden relative"
                >
                  {/* Background grid pattern */}
                  <div className="absolute inset-0 opacity-30 dark:opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                      backgroundSize: '32px 32px'
                    }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-all duration-300" />
                  <div className="text-center relative z-10">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="w-7 h-7 text-white" />
                      </div>
                    </motion.div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Vitas</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Jl. Peta, Kahuripan, Kec. Tawang,<br/>Kab. Tasikmalaya</p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      Buka di Google Maps ↗
                    </span>
                  </div>
                </a>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                    <ParkingCircle className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Parkir</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Tersedia Luas</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                    <Accessibility className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Akses</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Ramah Disabilitas</p>
                  </div>
                </div>
              </div>
            </SlideUp>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                <Image src="/Logo.png" alt="Logo Vitas" fill sizes="32px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Vitas</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Rumah Sakit Terpercaya</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              © 2026 Vitas. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

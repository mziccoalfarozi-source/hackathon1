import { Link } from 'react-router'
import { Stethoscope, ClipboardList, ShieldCheck, Activity, ArrowRight, Brain, Lock, Clock } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: Stethoscope,
      title: 'Input Pasien',
      desc: 'Form lengkap gejala dan vital sign pasien untuk analisis AI',
      path: '/form',
      color: 'bg-blue-500',
      borderColor: 'border-blue-200 hover:border-blue-400',
    },
    {
      icon: Brain,
      title: 'AI Triage',
      desc: 'Analisis prioritas otomatis dengan penjelasan reasoning AI',
      path: '/form',
      color: 'bg-violet-500',
      borderColor: 'border-violet-200 hover:border-violet-400',
    },
    {
      icon: ClipboardList,
      title: 'Dashboard Antrian',
      desc: 'Monitor antrian pasien real-time berdasarkan prioritas triase',
      path: '/antrian',
      color: 'bg-emerald-500',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
    },
    {
      icon: ShieldCheck,
      title: 'Audit Trail',
      desc: 'Rekam medis tercatat di blockchain Polygon secara immutable',
      path: '/audit',
      color: 'bg-amber-500',
      borderColor: 'border-amber-200 hover:border-amber-400',
    },
  ]

  const stats = [
    { icon: Activity, label: 'Pasien Terlayani', value: '1,247' },
    { icon: Brain, label: 'Akurasi AI', value: '91.4%' },
    { icon: Lock, label: 'Transaksi Blockchain', value: '1,247' },
    { icon: Clock, label: 'Rata-rata Waktu Triage', value: '4.2 detik' },
  ]

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hero-puskesmas.jpg"
            alt="Puskesmas"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-300 font-medium">Sistem Aktif — Testnet Polygon</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              AI-Powered Triage<br />
              <span className="text-emerald-400">untuk Puskesmas</span>
            </h1>

            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Sistem triase berbasis AI yang membantu petugas memprioritaskan pasien berdasarkan gejala dan vital sign. Setiap keputusan tercatat secara immutable di blockchain sebagai audit trail.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/form"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-600/25"
              >
                <Stethoscope className="w-5 h-5" />
                Mulai Input Pasien
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/antrian"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-medium transition-all backdrop-blur-sm"
              >
                <ClipboardList className="w-5 h-5" />
                Lihat Antrian
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-5 shadow-lg border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">4 Pilar Sistem</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Dari input data pasien hingga penyimpanan blockchain — alur kerja yang terintegrasi penuh.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.title}
                to={feature.path}
                className={`group bg-white rounded-xl p-6 border ${feature.borderColor} shadow-sm transition-all hover:shadow-md`}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-400 mt-4 group-hover:text-emerald-600 transition-colors">
                  Buka
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Alur Kerja Sistem</h2>
            <p className="text-slate-600">Dari pendaftaran hingga audit trail blockchain</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Input Data',
                desc: 'Petugas memasukkan gejala, vital sign, dan riwayat pasien melalui form digital.',
                icon: Stethoscope,
              },
              {
                step: '02',
                title: 'Analisis AI',
                desc: 'AI model menganalisis data dan menentukan prioritas triase dengan reasoning.',
                icon: Brain,
              },
              {
                step: '03',
                title: 'Konfirmasi',
                desc: 'Petugas medis meninjau hasil AI dan mengkonfirmasi keputusan triase.',
                icon: ShieldCheck,
              },
              {
                step: '04',
                title: 'Blockchain',
                desc: 'Hash data pasien disimpan di Polygon untuk audit trail yang immutable.',
                icon: Lock,
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="relative text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-0.5 mb-3 inline-block">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

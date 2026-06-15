import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, Eye, EyeOff, UserPlus, ArrowLeft, Shield, Stethoscope, FlaskConical } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import { Toaster, toast } from 'sonner'

export default function Register() {
  const navigate = useNavigate()
  const { register, user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const roleOptions = [
    { value: 'admin' as UserRole, label: 'Admin', desc: 'Pendaftaran & manajemen pasien', icon: Shield, color: 'text-blue-400' },
    { value: 'dokter' as UserRole, label: 'Dokter', desc: 'Pemeriksaan & diagnosis pasien', icon: Stethoscope, color: 'text-emerald-400' },
    { value: 'farmasi' as UserRole, label: 'Farmasi', desc: 'Penyediaan & penyerahan obat', icon: FlaskConical, color: 'text-violet-400' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !role) {
      toast.error('Mohon isi semua field')
      return
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      const result = register(name, email, password, role)
      if (result.success) {
        toast.success('Registrasi berhasil! Silakan login.')
        setTimeout(() => navigate('/login'), 1000)
      } else {
        toast.error(result.error || 'Registrasi gagal')
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4 relative">
      <Toaster position="top-right" richColors />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-violet-400/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Daftar Akun Baru</CardTitle>
            <CardDescription className="text-slate-400">
              Buat akun untuk mengakses sistem RS Misal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 text-sm">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dr. Nama Lengkap"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-slate-300 text-sm">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@rsmisal.id"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Role / Peran</Label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(opt => {
                    const Icon = opt.icon
                    const isSelected = role === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className={`block text-xs font-semibold ${isSelected ? 'text-emerald-300' : 'text-slate-300'}`}>
                          {opt.label}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</span>
                      </button>
                    )
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
              <p className="text-sm text-slate-400">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

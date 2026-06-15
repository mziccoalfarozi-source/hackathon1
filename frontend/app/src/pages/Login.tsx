import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { useAuth, getRoleDashboardPath } from '@/contexts/AuthContext'
import { Toaster, toast } from 'sonner'

export default function Login() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // If already logged in, redirect
  if (user) {
    navigate(getRoleDashboardPath(user.role), { replace: true })
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Mohon isi semua field')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      const result = login(email, password)
      if (result.success) {
        toast.success('Login berhasil!')
        // Get updated users to find the role
        const users = JSON.parse(localStorage.getItem('rs_misal_users') || '[]')
        const loggedUser = users.find((u: { email: string }) => u.email === email)
        if (loggedUser) {
          setTimeout(() => navigate(getRoleDashboardPath(loggedUser.role), { replace: true }), 300)
        }
      } else {
        toast.error(result.error || 'Login gagal')
      }
      setIsLoading(false)
    }, 500)
  }

  const demoAccounts = [
    { role: 'Admin', email: 'admin@rsmisal.id', password: 'admin123' },
    { role: 'Dokter', email: 'dokter@rsmisal.id', password: 'dokter123' },
    { role: 'Farmasi', email: 'farmasi@rsmisal.id', password: 'farmasi123' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4 relative">
      <Toaster position="top-right" richColors />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Masuk ke RS Misal</CardTitle>
            <CardDescription className="text-slate-400">
              Masuk dengan akun yang telah terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@rsmisal.id"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
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
              <p className="text-sm text-slate-400">
                Belum punya akun?{' '}
                <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Daftar sekarang
                </Link>
              </p>
            </div>

            {/* Demo accounts */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-slate-500 text-center mb-3">Akun Demo (klik untuk mengisi)</p>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map(acc => (
                  <button
                    key={acc.role}
                    onClick={() => { setEmail(acc.email); setPassword(acc.password) }}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all text-center"
                  >
                    <span className="block font-semibold">{acc.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

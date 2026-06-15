import { Link } from 'react-router'
import { Home, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-lg text-slate-600 mb-2">Halaman tidak ditemukan</p>
        <p className="text-sm text-slate-400 mb-6">
          Halaman yang Anda cari mungkin telah dipindahkan atau tidak ada.
        </p>
        <Link to="/">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  )
}

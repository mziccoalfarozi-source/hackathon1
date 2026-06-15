import { HeartPulse, Globe, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Triage Puskesmas</p>
              <p className="text-xs text-slate-500">Sistem Triase Berbasis AI dengan Blockchain Audit Trail</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Jaringan: Polygon Amoy Testnet
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              Untuk Puskesmas Indonesia
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-600">
          Data pasien dienkripsi dan dicatat secara immutable di blockchain. Sistem ini merupakan prototipe untuk demonstrasi teknologi AI dan blockchain dalam layanan kesehatan primer.
        </div>
      </div>
    </footer>
  )
}

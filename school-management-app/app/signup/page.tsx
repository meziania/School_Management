import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl text-center space-y-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
        <ShieldAlert size={28} />
      </div>

      <h2 className="text-xl font-bold text-white tracking-tight">Inscription publique désactivée</h2>
      
      <p className="text-blue-200 text-sm">
        Pour des raisons de sécurité, la création autonome de comptes est désactivée.
        Tous les accès (Professeurs, Parents, Administrateurs) sont créés et délivrés directement par la direction de votre établissement.
      </p>

      <div className="pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-blue-600/30"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}

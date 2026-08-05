'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Save, Calculator, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AssiduiteSettingsPage() {
  const [deductionUnjustified, setDeductionUnjustified] = useState<number>(0.5)
  const [deductionJustified, setDeductionJustified] = useState<number>(0.0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings/assiduite')
        const json = await res.json()
        if (json.data) {
          setDeductionUnjustified(json.data.deduction_unjustified ?? 0.5)
          setDeductionJustified(json.data.deduction_justified ?? 0.0)
        }
      } catch (err) {
        console.error('Erreur chargement paramètres:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/admin/settings/assiduite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deduction_unjustified: deductionUnjustified,
          deduction_justified: deductionJustified,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erreur d\'enregistrement')
      }

      setSuccessMessage('Les règles de déduction pour l\'Assiduité & Conduite ont été enregistrées avec succès !')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  // Simulation calculation
  const sampleUnjustifiedCount = 2
  const sampleJustifiedCount = 1
  const calculatedGrade = Math.max(
    0,
    20 - sampleUnjustifiedCount * deductionUnjustified - sampleJustifiedCount * deductionJustified
  ).toFixed(1)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/presence"
              className="text-slate-400 hover:text-slate-600 transition flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft size={14} /> Retour Présence
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Paramètres d'Assiduité & Conduite
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Règles de déduction automatique des points pour le calcul de la note de comportement (sur 20)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200 shadow-sm">
          Chargement des paramètres...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Pondération des Pénalités d'Absence</h2>
                <p className="text-xs text-slate-500">
                  Fixez le nombre de points retirés de la note d'Assiduité (base de 20 points) pour chaque absence enregistrée.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input 1: Absence Non Justifiée */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Déduction pour une absence NON JUSTIFIÉE *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={deductionUnjustified}
                    onChange={e => setDeductionUnjustified(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    points / abs.
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Valeur par défaut recommandée : <strong className="text-slate-700">0.5 pt</strong> par absence sans justificatif.
                </p>
              </div>

              {/* Input 2: Absence Justifiée */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Déduction pour une absence JUSTIFIÉE *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={deductionJustified}
                    onChange={e => setDeductionJustified(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    points / abs.
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Valeur par défaut recommandée : <strong className="text-slate-700">0.0 pt</strong> (Absence médicale/justifiée sans pénalité).
                </p>
              </div>
            </div>

            {/* Live Simulation Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Calculator size={16} />
                Exemple de calcul automatique de la Note d'Assiduité
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-300">Base initiale</p>
                  <p className="text-lg font-black text-white">20.0 / 20</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-300">Pénalités cumulées</p>
                  <p className="text-lg font-black text-amber-300">
                    -{(sampleUnjustifiedCount * deductionUnjustified + sampleJustifiedCount * deductionJustified).toFixed(1)} pts
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    (2 non-justifiées + 1 justifiée)
                  </p>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-xs text-emerald-200 font-bold">Note finale Assiduité</p>
                  <p className="text-2xl font-black text-emerald-400">{calculatedGrade} / 20</p>
                </div>
              </div>
            </div>
          </div>

          {/* Toast / Alert Feedback */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/presence"
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
            >
              Annuler
            </Link>
            <button
              id="btn-save-assiduite-settings"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Enregistrement...' : 'Enregistrer les règles d\'Assiduité'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

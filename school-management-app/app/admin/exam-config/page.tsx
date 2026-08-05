'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw, AlertCircle, CheckCircle2, Sliders, ShieldCheck } from 'lucide-react'
import { ExamConfig } from '@/types/app'

const MOROCCAN_TARGET_LEVELS = [
  { level: '6AP', name: '6ème Année Primaire', desc: 'Examen Normalisé Provincial (50% CC + 50% Provincial)' },
  { level: '3AC', name: '3ème Année Collège', desc: 'Examen Normalisé Régional (50% CC + 50% Régional)' },
  { level: '1BAC', name: '1ère Année Baccalauréat', desc: 'Examen Régional du Baccalauréat' },
  { level: '2BAC', name: '2ème Année Baccalauréat', desc: 'Examen National du Baccalauréat (25% CC + 25% Régional + 50% National)' },
]

export default function ExamConfigAdminPage() {
  const [configs, setConfigs] = useState<Record<string, ExamConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/exam-config')
      const json = await res.json()

      const map: Record<string, ExamConfig> = {}

      // Initialiser avec valeurs par défaut
      map['6AP'] = { level: '6AP', cc_weight: 50, provincial_weight: 50, regional_weight: 0, national_weight: 0, passing_grade: 10 }
      map['3AC'] = { level: '3AC', cc_weight: 50, provincial_weight: 0, regional_weight: 50, national_weight: 0, passing_grade: 10 }
      map['1BAC'] = { level: '1BAC', cc_weight: 100, provincial_weight: 0, regional_weight: 0, national_weight: 0, passing_grade: 10 }
      map['2BAC'] = { level: '2BAC', cc_weight: 25, provincial_weight: 0, regional_weight: 25, national_weight: 50, passing_grade: 10 }

      if (json.data && Array.isArray(json.data)) {
        json.data.forEach((c: ExamConfig) => {
          map[c.level] = { ...map[c.level], ...c }
        })
      }

      setConfigs(map)
    } catch (err) {
      console.error('Erreur chargement exam configs:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    // Vérification de la somme des pourcentages = 100%
    const configArray = Object.values(configs)
    for (const c of configArray) {
      const sum = Number(c.cc_weight) + Number(c.provincial_weight) + Number(c.regional_weight) + Number(c.national_weight)
      if (sum !== 100) {
        setError(`Attention : La somme des coefficients pour le niveau ${c.level} doit être égale à 100% (actuel : ${sum}%).`)
        setSaving(false)
        return
      }
    }

    try {
      const res = await fetch('/api/admin/exam-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configArray }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de l\'enregistrement.')
        return
      }

      setSuccess('Configurations d\'examens enregistrées avec succès !')
      setTimeout(() => setSuccess(null), 4000)
    } catch {
      setError('Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  function updateValue(level: string, field: keyof ExamConfig, value: number) {
    setConfigs(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <RefreshCw className="animate-spin mr-2" size={20} />
        Chargement de la configuration des examens...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="text-blue-600" size={24} />
            Configuration des Examens & Coefficients
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Pondération officielle et calcul des moyennes pour les certifications du système marocain
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md text-sm flex-shrink-0"
        >
          <Save size={18} />
          {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {MOROCCAN_TARGET_LEVELS.map(item => {
          const cfg = configs[item.level] || { level: item.level, cc_weight: 50, provincial_weight: 0, regional_weight: 0, national_weight: 0, passing_grade: 10 }
          const currentSum = Number(cfg.cc_weight) + Number(cfg.provincial_weight) + Number(cfg.regional_weight) + Number(cfg.national_weight)

          return (
            <div key={item.level} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 font-extrabold rounded-lg text-xs">
                      {item.level}
                    </span>
                    <h2 className="font-bold text-slate-900 text-base">{item.name}</h2>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  currentSum === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  Total : {currentSum}% {currentSum !== 100 && '(Doit être égal à 100%)'}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Contrôle Continu */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    % Contrôle Continu
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={cfg.cc_weight}
                      onChange={e => updateValue(item.level, 'cc_weight', Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">%</span>
                  </div>
                </div>

                {/* Examen Provincial (6AP) */}
                {item.level === '6AP' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-700 uppercase mb-1">
                      % Normalisé Provincial
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cfg.provincial_weight}
                        onChange={e => updateValue(item.level, 'provincial_weight', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-amber-200 bg-amber-50/50 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">%</span>
                    </div>
                  </div>
                )}

                {/* Examen Régional (3AC, 2BAC) */}
                {(item.level === '3AC' || item.level === '2BAC') && (
                  <div>
                    <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">
                      % Examen Régional
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cfg.regional_weight}
                        onChange={e => updateValue(item.level, 'regional_weight', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50/50 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">%</span>
                    </div>
                  </div>
                )}

                {/* Examen National (2BAC) */}
                {item.level === '2BAC' && (
                  <div>
                    <label className="block text-xs font-bold text-purple-700 uppercase mb-1">
                      % Examen National
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cfg.national_weight}
                        onChange={e => updateValue(item.level, 'national_weight', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-purple-200 bg-purple-50/50 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">%</span>
                    </div>
                  </div>
                )}

                {/* Note de passage */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Note minimale de passage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={cfg.passing_grade}
                      onChange={e => updateValue(item.level, 'passing_grade', Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">/20</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </form>
    </div>
  )
}

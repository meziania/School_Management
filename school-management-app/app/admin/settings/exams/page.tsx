'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Info,
  ShieldCheck,
  Award,
} from 'lucide-react'

export interface LevelExamWeights {
  level: string
  name: string
  cycle: string
  description: string
  cc_weight: number
  provincial_weight?: number
  regional_weight?: number
  national_weight?: number
  passing_grade: number
}

// Initial Default Moroccan Educational Weights
const DEFAULT_WEIGHTS: Record<string, LevelExamWeights> = {
  '6AP': {
    level: '6AP',
    name: '6ème Année Primaire (6AP)',
    cycle: 'Cycle Primaire',
    description: 'Calcul combiné du Contrôle Continu et de l\'Examen Normalisé Provincial (Certification Primaire).',
    cc_weight: 50,
    provincial_weight: 50,
    passing_grade: 10.0,
  },
  '3AC': {
    level: '3AC',
    name: '3ème Année Collège (3AC)',
    cycle: 'Cycle Collégial',
    description: 'Calcul combiné du Contrôle Continu et de l\'Examen Normalisé Régional (Brevet / Certification Collège).',
    cc_weight: 50,
    regional_weight: 50,
    passing_grade: 10.0,
  },
  '1BAC': {
    level: '1BAC',
    name: '1ère Année Baccalauréat (1BAC)',
    cycle: 'Cycle Qualifiant (Lycée)',
    description: 'Pondération des notes du Contrôle Continu et de l\'Examen Régional anticipé.',
    cc_weight: 50,
    regional_weight: 50,
    passing_grade: 10.0,
  },
  '2BAC': {
    level: '2BAC',
    name: '2ème Année Baccalauréat (2BAC)',
    cycle: 'Cycle Qualifiant (Lycée)',
    description: 'Formule officielle du Baccalauréat Marocain (Contrôle Continu + Examen Régional + Examen National).',
    cc_weight: 25,
    regional_weight: 25,
    national_weight: 50,
    passing_grade: 10.0,
  },
}

export default function ConfigurableExamWeightsPage() {
  const [weights, setWeights] = useState<Record<string, LevelExamWeights>>(DEFAULT_WEIGHTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // 1. Fetch official exam weights from backend API on mount
  useEffect(() => {
    async function loadWeights() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/exam-config')
        const json = await res.json()
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const map = { ...DEFAULT_WEIGHTS }
          json.data.forEach((item: any) => {
            if (map[item.level]) {
              map[item.level] = {
                ...map[item.level],
                cc_weight: Number(item.cc_weight ?? map[item.level].cc_weight),
                provincial_weight: item.provincial_weight !== undefined ? Number(item.provincial_weight) : map[item.level].provincial_weight,
                regional_weight: item.regional_weight !== undefined ? Number(item.regional_weight) : map[item.level].regional_weight,
                national_weight: item.national_weight !== undefined ? Number(item.national_weight) : map[item.level].national_weight,
                passing_grade: Number(item.passing_grade ?? 10.0),
              }
            }
          })
          setWeights(map)
        }
      } catch (err) {
        console.error('Erreur chargement coefficients:', err)
      } finally {
        setLoading(false)
      }
    }
    loadWeights()
  }, [])

  // Calculate sum of percentages for a given level
  const calculateLevelSum = (item: LevelExamWeights): number => {
    const cc = Number(item.cc_weight || 0)
    const prov = Number(item.provincial_weight || 0)
    const reg = Number(item.regional_weight || 0)
    const nat = Number(item.national_weight || 0)
    return cc + prov + reg + nat
  }

  // Check if ALL level cards have valid 100% sums
  const isFormValid = useMemo(() => {
    return Object.values(weights).every(w => calculateLevelSum(w) === 100)
  }, [weights])

  // Update input value helper
  const handleWeightChange = (level: string, field: keyof LevelExamWeights, val: number) => {
    setWeights(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: isNaN(val) ? 0 : val,
      },
    }))
  }

  // Asynchronous API call to persist configurations
  async function saveExamWeights(data: LevelExamWeights[]) {
    const res = await fetch('/api/admin/exam-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configs: data.map(w => ({
          level: w.level,
          cc_weight: w.cc_weight,
          provincial_weight: w.provincial_weight || 0,
          regional_weight: w.regional_weight || 0,
          national_weight: w.national_weight || 0,
          passing_grade: w.passing_grade || 10.0,
        })),
      }),
    })
    return res.json()
  }

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid) {
      setSaveError('Veuillez vous assurer que la somme des pourcentages de chaque niveau est exactement égale à 100%.')
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const dataArray = Object.values(weights)
      const result = await saveExamWeights(dataArray)

      if (result.error) {
        setSaveError(result.error)
        return
      }

      setSaveSuccess('Les configurations des examens et coefficients ont été enregistrées avec succès !')
      setTimeout(() => setSaveSuccess(null), 5000)
    } catch {
      setSaveError('Erreur réseau lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 font-medium">
        <RefreshCw className="animate-spin mr-2 text-blue-600" size={20} />
        Chargement de la configuration des examens...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders size={24} className="text-blue-600" />
              Configuration des Examens & Coefficients
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Définissez la pondération des notes pour les niveaux de certification du système marocain
            </p>
          </div>
        </div>

        <button
          id="btn-save-exam-settings"
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || saving}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition ${
            isFormValid && !saving
              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Save size={18} />
          {saving ? 'Enregistrement...' : 'Sauvegarder les configurations'}
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs sm:text-sm flex items-start gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Information importante :</span> Les pourcentages configurés ici sont utilisés directement par le moteur de calcul pour déterminer les moyennes générales finales et les mentions des élèves. <span className="underline">La somme des coefficients pour chaque niveau doit impérativement être égale à 100%.</span>
        </div>
      </div>

      {/* Status Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span className="font-semibold">{saveError}</span>
        </div>
      )}

      {/* Form Grid: 4 Cards for Certification Levels */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(weights).map((item) => {
          const sum = calculateLevelSum(item)
          const isValidSum = sum === 100

          return (
            <div
              key={item.level}
              className={`bg-white rounded-2xl border transition-all shadow-sm p-6 space-y-5 flex flex-col justify-between ${
                isValidSum
                  ? 'border-slate-200 hover:border-blue-200'
                  : 'border-red-300 ring-2 ring-red-500/20 bg-red-50/10'
              }`}
            >
              <div className="space-y-4">
                {/* Card Header & Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase tracking-wider">
                      {item.cycle}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{item.name}</h2>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Validation Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex-shrink-0 flex items-center gap-1.5 ${
                      isValidSum
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {isValidSum ? (
                      <>
                        <ShieldCheck size={14} /> Total : 100%
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} /> Sum = {sum}% (Max 100%)
                      </>
                    )}
                  </span>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                  {/* Contrôle Continu */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Contrôle Continu (%)</span>
                      <span className="text-blue-600">{item.cc_weight}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={item.cc_weight}
                        onChange={(e) => handleWeightChange(item.level, 'cc_weight', Number(e.target.value))}
                        className="flex-1 accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.cc_weight}
                        onChange={(e) => handleWeightChange(item.level, 'cc_weight', Number(e.target.value))}
                        className={`w-20 px-3 py-1.5 rounded-xl border text-sm font-bold text-slate-900 text-center focus:outline-none focus:ring-2 ${
                          isValidSum ? 'border-slate-200 focus:ring-blue-500' : 'border-red-300 focus:ring-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Examen Normalisé Provincial (6AP) */}
                  {item.provincial_weight !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1.5">
                        <span>Examen Normalisé Provincial (%)</span>
                        <span className="text-amber-700">{item.provincial_weight}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={item.provincial_weight}
                          onChange={(e) => handleWeightChange(item.level, 'provincial_weight', Number(e.target.value))}
                          className="flex-1 accent-amber-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.provincial_weight}
                          onChange={(e) => handleWeightChange(item.level, 'provincial_weight', Number(e.target.value))}
                          className={`w-20 px-3 py-1.5 rounded-xl border text-sm font-bold text-slate-900 text-center focus:outline-none focus:ring-2 ${
                            isValidSum ? 'border-slate-200 focus:ring-blue-500' : 'border-red-300 focus:ring-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Examen Régional (3AC, 1BAC, 2BAC) */}
                  {item.regional_weight !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1.5">
                        <span>Examen Régional (%)</span>
                        <span className="text-indigo-700">{item.regional_weight}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={item.regional_weight}
                          onChange={(e) => handleWeightChange(item.level, 'regional_weight', Number(e.target.value))}
                          className="flex-1 accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.regional_weight}
                          onChange={(e) => handleWeightChange(item.level, 'regional_weight', Number(e.target.value))}
                          className={`w-20 px-3 py-1.5 rounded-xl border text-sm font-bold text-slate-900 text-center focus:outline-none focus:ring-2 ${
                            isValidSum ? 'border-slate-200 focus:ring-blue-500' : 'border-red-300 focus:ring-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Examen National (2BAC) */}
                  {item.national_weight !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-purple-800 mb-1.5">
                        <span>Examen National (%)</span>
                        <span className="text-purple-700">{item.national_weight}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={item.national_weight}
                          onChange={(e) => handleWeightChange(item.level, 'national_weight', Number(e.target.value))}
                          className="flex-1 accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.national_weight}
                          onChange={(e) => handleWeightChange(item.level, 'national_weight', Number(e.target.value))}
                          className={`w-20 px-3 py-1.5 rounded-xl border text-sm font-bold text-slate-900 text-center focus:outline-none focus:ring-2 ${
                            isValidSum ? 'border-slate-200 focus:ring-blue-500' : 'border-red-300 focus:ring-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error warning text inside card if sum invalid */}
              {!isValidSum && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-100/80 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  <span>Erreur : La somme actuelle est de {sum}%. Ajustez les valeurs pour atteindre exactement 100%.</span>
                </div>
              )}
            </div>
          )
        })}
      </form>
    </div>
  )
}

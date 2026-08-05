'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calculator, Sparkles, Trophy, Target, ArrowRight } from 'lucide-react'
import { ExamConfig } from '@/types/app'
import { calculateMoroccanFinalGrade, calculateRequiredExamScore } from '@/lib/calculations/moroccan-grading'

const DEFAULT_LEVEL_CONFIGS: Record<string, ExamConfig> = {
  '6AP': { level: '6AP', cc_weight: 50, provincial_weight: 50, regional_weight: 0, national_weight: 0, passing_grade: 10 },
  '3AC': { level: '3AC', cc_weight: 50, provincial_weight: 0, regional_weight: 50, national_weight: 0, passing_grade: 10 },
  '1BAC': { level: '1BAC', cc_weight: 100, provincial_weight: 0, regional_weight: 0, national_weight: 0, passing_grade: 10 },
  '2BAC': { level: '2BAC', cc_weight: 25, provincial_weight: 0, regional_weight: 25, national_weight: 50, passing_grade: 10 },
}

export default function GradeSimulatorPage() {
  const [level, setLevel] = useState<'6AP' | '3AC' | '1BAC' | '2BAC'>('2BAC')
  const [configs, setConfigs] = useState<Record<string, ExamConfig>>(DEFAULT_LEVEL_CONFIGS)

  // Scores saisis par l'élève
  const [ccScore, setCcScore] = useState<string>('15')
  const [provincialScore, setProvincialScore] = useState<string>('14')
  const [regionalScore, setRegionalScore] = useState<string>('13')
  const [nationalScore, setNationalScore] = useState<string>('12')

  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await fetch('/api/admin/exam-config')
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          const map = { ...DEFAULT_LEVEL_CONFIGS }
          json.data.forEach((c: ExamConfig) => {
            map[c.level] = { ...map[c.level], ...c }
          })
          setConfigs(map)
        }
      } catch (err) {
        console.error('Erreur chargement configs:', err)
      }
    }
    loadConfigs()
  }, [])

  const currentConfig = useMemo(() => configs[level] || DEFAULT_LEVEL_CONFIGS[level], [configs, level])

  // Resultat dynamique
  const result = useMemo(() => {
    return calculateMoroccanFinalGrade(currentConfig, {
      ccScore: ccScore ? parseFloat(ccScore) : null,
      provincialScore: provincialScore ? parseFloat(provincialScore) : null,
      regionalScore: regionalScore ? parseFloat(regionalScore) : null,
      nationalScore: nationalScore ? parseFloat(nationalScore) : null,
    })
  }, [currentConfig, ccScore, provincialScore, regionalScore, nationalScore])

  // Calcul du score requis au national pour les mentions
  const requiredForPassable = useMemo(() => {
    if (level !== '2BAC') return null
    return calculateRequiredExamScore(currentConfig, {
      ccScore: ccScore ? parseFloat(ccScore) : null,
      regionalScore: regionalScore ? parseFloat(regionalScore) : null,
    }, 10.0)
  }, [currentConfig, level, ccScore, regionalScore])

  const requiredForAssezBien = useMemo(() => {
    if (level !== '2BAC') return null
    return calculateRequiredExamScore(currentConfig, {
      ccScore: ccScore ? parseFloat(ccScore) : null,
      regionalScore: regionalScore ? parseFloat(regionalScore) : null,
    }, 12.0)
  }, [currentConfig, level, ccScore, regionalScore])

  const requiredForBien = useMemo(() => {
    if (level !== '2BAC') return null
    return calculateRequiredExamScore(currentConfig, {
      ccScore: ccScore ? parseFloat(ccScore) : null,
      regionalScore: regionalScore ? parseFloat(regionalScore) : null,
    }, 14.0)
  }, [currentConfig, level, ccScore, regionalScore])

  const requiredForTresBien = useMemo(() => {
    if (level !== '2BAC') return null
    return calculateRequiredExamScore(currentConfig, {
      ccScore: ccScore ? parseFloat(ccScore) : null,
      regionalScore: regionalScore ? parseFloat(regionalScore) : null,
    }, 16.0)
  }, [currentConfig, level, ccScore, regionalScore])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
          <Calculator size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Simulateur de Moyenne "What-If"</h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Estimez votre moyenne finale aux examens nationaux et régionaux marocains et découvrez la note nécessaire pour décrocher votre Mention !
        </p>
      </div>

      {/* Choix du niveau */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
        {[
          { id: '6AP', name: '6ème Primaire' },
          { id: '3AC', name: '3ème Collège' },
          { id: '1BAC', name: '1ère Bac (Régional)' },
          { id: '2BAC', name: '2ème Bac (National)' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setLevel(item.id as any)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition ${
              level === item.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Formulaire de simulation */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="text-blue-600" size={18} />
            Saisie de vos notes prévisionnelles
          </h2>

          <div className="space-y-3.5">
            {/* Contrôle continu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Note Contrôle Continu ({currentConfig.cc_weight}%)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                value={ccScore}
                onChange={e => setCcScore(e.target.value)}
                placeholder="/20"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Provincial 6AP */}
            {currentConfig.provincial_weight > 0 && (
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase mb-1">
                  Examen Normalisé Provincial ({currentConfig.provincial_weight}%)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  value={provincialScore}
                  onChange={e => setProvincialScore(e.target.value)}
                  placeholder="/20"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-base font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Régional 3AC / 2BAC */}
            {currentConfig.regional_weight > 0 && (
              <div>
                <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">
                  Examen Régional ({currentConfig.regional_weight}%)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  value={regionalScore}
                  onChange={e => setRegionalScore(e.target.value)}
                  placeholder="/20"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* National 2BAC */}
            {currentConfig.national_weight > 0 && (
              <div>
                <label className="block text-xs font-bold text-purple-700 uppercase mb-1">
                  Note Estimée Examen National ({currentConfig.national_weight}%)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  value={nationalScore}
                  onChange={e => setNationalScore(e.target.value)}
                  placeholder="/20"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-base font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Résultats et Mentions */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moyenne Générale Estimée</span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                result.isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {result.mention}
              </span>
            </div>

            <div className="text-center py-2">
              <span className="text-5xl font-extrabold tracking-tight">
                {result.finalAverage !== null ? `${result.finalAverage}` : '—'}
              </span>
              <span className="text-xl text-slate-400 font-medium"> / 20</span>
            </div>

            {/* Contribution breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10 text-slate-300">
              <div>Contrôle Continu : <span className="font-bold text-white">+{result.breakdown.ccContribution} pts</span></div>
              {result.breakdown.provincialContribution > 0 && <div>Provincial : <span className="font-bold text-white">+{result.breakdown.provincialContribution} pts</span></div>}
              {result.breakdown.regionalContribution > 0 && <div>Régional : <span className="font-bold text-white">+{result.breakdown.regionalContribution} pts</span></div>}
              {result.breakdown.nationalContribution > 0 && <div>National : <span className="font-bold text-white">+{result.breakdown.nationalContribution} pts</span></div>}
            </div>
          </div>

          {/* Objectifs au National (2BAC) */}
          {level === '2BAC' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Target size={16} className="text-blue-600" />
                Note requise au National (50%) pour décrocher :
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Mention Passable (10/20)</span>
                  <span className="font-extrabold text-blue-600 text-sm">{requiredForPassable}/20</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="font-semibold text-blue-900">Mention Assez Bien (12/20)</span>
                  <span className="font-extrabold text-blue-700 text-sm">{requiredForAssezBien}/20</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                  <span className="font-semibold text-indigo-900">Mention Bien (14/20)</span>
                  <span className="font-extrabold text-indigo-700 text-sm">{requiredForBien}/20</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="font-semibold text-purple-900">Mention Très Bien (16/20)</span>
                  <span className="font-extrabold text-purple-700 text-sm">{requiredForTresBien}/20</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

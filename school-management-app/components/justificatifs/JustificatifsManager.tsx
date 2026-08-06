'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, CheckCircle, XCircle, Paperclip, Calendar, User, Check, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface JustificationItem {
  id: string
  date: string
  status: string
  is_justified: boolean
  justification: string | null
  justified_file: string | null
  students: {
    first_name: string
    last_name: string
    classes?: { name?: string } | null
  } | null
}

export default function JustificatifsManager({ initialJustifications }: { initialJustifications: JustificationItem[] }) {
  const router = useRouter()
  const [justifications, setJustifications] = useState<JustificationItem[]>(initialJustifications)
  const [activeTab, setActiveTab] = useState<'pending' | 'validated' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  const handleAction = async (attendance_id: string, action: 'accept' | 'reject') => {
    setProcessingId(attendance_id)
    try {
      const res = await fetch('/api/admin/attendance/justify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_id, action }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        showToast(json.error || 'Erreur lors du traitement.', 'error')
        return
      }

      if (action === 'accept') {
        setJustifications(prev => prev.map(item => item.id === attendance_id ? { ...item, is_justified: true } : item))
        showToast('Justificatif approuvé et validé avec succès !')
      } else {
        setJustifications(prev => prev.filter(item => item.id !== attendance_id))
        showToast('Justificatif refusé.')
      }

      router.refresh()
    } catch {
      showToast('Erreur réseau lors du traitement.', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const pendingList = justifications.filter(j => !j.is_justified)
  const validatedList = justifications.filter(j => j.is_justified)

  const currentList = activeTab === 'pending'
    ? pendingList
    : activeTab === 'validated'
      ? validatedList
      : justifications

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-4 rounded-xl border font-bold text-sm flex items-center gap-2 animate-fadeIn ${
          toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" /> : <AlertCircle size={18} className="text-red-600 flex-shrink-0" />}
          {toastMsg.text}
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>En attente</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
          }`}>
            {pendingList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('validated')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
            activeTab === 'validated'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Validés</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'validated' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
          }`}>
            {validatedList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-white text-indigo-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Tous</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
            {justifications.length}
          </span>
        </button>
      </div>

      {/* LIST OF JUSTIFICATIONS */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <FileText className="text-slate-300 mx-auto mb-2" size={36} />
          <p className="text-slate-600 text-sm font-bold">
            {activeTab === 'pending'
              ? "Aucun justificatif d'absence en attente pour le moment."
              : activeTab === 'validated'
                ? "Aucun justificatif validé."
                : "Aucun justificatif enregistré."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map(item => {
            const studentName = item.students ? `${item.students.last_name} ${item.students.first_name}` : 'Élève'
            const className = item.students?.classes?.name || 'Classe non spécifiée'
            const isPending = !item.is_justified
            const isProcessing = processingId === item.id

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student Info & Badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                      {studentName[0] || 'E'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-base">{studentName}</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 text-xs font-bold border border-purple-100">
                          {className}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar size={13} className="text-slate-400" />
                        Absence du <span className="font-bold text-slate-700">{formatDate(item.date)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status Badge */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {item.is_justified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                        <Check size={15} className="text-emerald-600" /> Validé
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(item.id, 'accept')}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-xs transition"
                        >
                          <CheckCircle size={15} />
                          <span>{isProcessing ? 'Validation...' : 'Valider'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(item.id, 'reject')}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-xs transition"
                        >
                          <XCircle size={15} />
                          <span>{isProcessing ? 'Refus...' : 'Refuser'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Justification Reason Motif Box */}
                {item.justification && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 text-xs font-medium leading-relaxed italic">
                    "{item.justification}"
                  </div>
                )}

                {/* Attached File Download Button */}
                {item.justified_file && (
                  <div>
                    <a
                      href={item.justified_file.startsWith('http') ? item.justified_file : `#`}
                      onClick={(e) => {
                        if (!item.justified_file?.startsWith('http')) {
                          e.preventDefault()
                          showToast(`Fichier "${item.justified_file}" (Document de justification simulé).`)
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold transition shadow-2xs"
                    >
                      <Paperclip size={14} className="text-blue-600" />
                      <span>Document joint : <span className="underline">{item.justified_file}</span></span>
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

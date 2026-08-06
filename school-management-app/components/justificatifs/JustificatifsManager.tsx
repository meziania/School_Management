'use client'

import { useState } from 'react'
import { FileText, CheckCircle, XCircle, Paperclip, Calendar, Check, AlertCircle } from 'lucide-react'
import { useJustifications } from '@/lib/store/justifications-context'

export default function JustificatifsManager() {
  const {
    justifications,
    pendingCount,
    validatedCount,
    validateJustification,
    refuseJustification,
  } = useJustifications()

  const [activeTab, setActiveTab] = useState<'pending' | 'validated' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  const handleValidate = async (id: string, name: string) => {
    setProcessingId(id)
    try {
      await validateJustification(id)
      showToast(`Justificatif de ${name} validé avec succès !`)
    } catch {
      showToast('Erreur lors de la validation.', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRefuse = async (id: string, name: string) => {
    setProcessingId(id)
    try {
      await refuseJustification(id)
      showToast(`Justificatif de ${name} refoulé.`, 'error')
    } catch {
      showToast('Erreur lors du refus.', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const pendingList = justifications.filter(j => j.status === 'PENDING')
  const validatedList = justifications.filter(j => j.status === 'VALIDATED')

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
            {pendingCount}
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
            {validatedCount}
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
            const isPending = item.status === 'PENDING'
            const isValidated = item.status === 'VALIDATED'
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
                      {item.studentName[0] || 'E'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-base">{item.studentName}</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 text-xs font-bold border border-purple-100">
                          {item.className}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar size={13} className="text-slate-400" />
                        Absence du <span className="font-bold text-slate-700">{item.date}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status Badge */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {isValidated ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                        <Check size={15} className="text-emerald-600" /> Validé
                      </span>
                    ) : item.status === 'REFUSED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-extrabold">
                        <XCircle size={15} className="text-red-600" /> Refusé
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleValidate(item.id, item.studentName)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-xs transition"
                        >
                          <CheckCircle size={15} />
                          <span>{isProcessing ? 'Validation...' : 'Valider'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRefuse(item.id, item.studentName)}
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
                {item.motif && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 text-xs font-medium leading-relaxed italic">
                    "{item.motif}"
                  </div>
                )}

                {/* Attached File Download Button */}
                {item.hasFile && (
                  <div>
                    <button
                      type="button"
                      onClick={() => showToast(`Fichier "${item.fileName || 'document.pdf'}" (Aperçu du certificat).`)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <Paperclip size={14} className="text-blue-600" />
                      <span>Document joint : <span className="underline">{item.fileName || 'document.pdf'}</span></span>
                    </button>
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

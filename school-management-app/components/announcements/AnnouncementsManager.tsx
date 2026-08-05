'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, Plus, Edit, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface ClassItem {
  id: string
  name: string
}

interface AnnouncementItem {
  id: string
  title: string
  content: string
  class_id?: string | null
  created_at: string
  classes?: { name?: string } | null
}

interface AnnouncementsManagerProps {
  classes: ClassItem[]
  initialAnnouncements: AnnouncementItem[]
}

export default function AnnouncementsManager({ classes, initialAnnouncements }: AnnouncementsManagerProps) {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements)

  // New Announcement Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [classId, setClassId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit Modal State
  const [editingAnn, setEditingAnn] = useState<AnnouncementItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editClassId, setEditClassId] = useState('')

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Create Announcement
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          class_id: classId || null,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        showToast(json.error || 'Erreur lors de la publication.', 'error')
        return
      }

      // Add to list top
      setAnnouncements([json.data, ...announcements])
      setTitle('')
      setContent('')
      setClassId('')
      showToast('Annonce publiée avec succès !')
      router.refresh()
    } catch {
      showToast('Erreur réseau lors de la publication.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEdit = (ann: AnnouncementItem) => {
    setEditingAnn(ann)
    setEditTitle(ann.title)
    setEditContent(ann.content)
    setEditClassId(ann.class_id || '')
  }

  // Submit Edit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAnn || !editTitle.trim() || !editContent.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAnn.id,
          title: editTitle.trim(),
          content: editContent.trim(),
          class_id: editClassId || null,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        showToast(json.error || 'Erreur lors de la modification.', 'error')
        return
      }

      const targetClassName = classes.find(c => c.id === editClassId)?.name

      // Update state
      setAnnouncements(prev => prev.map(a => a.id === editingAnn.id ? {
        ...a,
        title: editTitle.trim(),
        content: editContent.trim(),
        class_id: editClassId || null,
        classes: editClassId ? { name: targetClassName } : null,
      } : a))

      setEditingAnn(null)
      showToast('Annonce modifiée avec succès !')
      router.refresh()
    } catch {
      showToast('Erreur réseau lors de la modification.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Announcement
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return

    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        showToast(json.error || 'Erreur lors de la suppression.', 'error')
        return
      }

      setAnnouncements(prev => prev.filter(a => a.id !== id))
      showToast('Annonce supprimée avec succès !')
      router.refresh()
    } catch {
      showToast('Erreur réseau lors de la suppression.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-4 rounded-xl border font-bold text-sm flex items-center gap-2 animate-fadeIn ${
          toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" /> : <AlertCircle size={18} className="text-red-600 flex-shrink-0" />}
          {toastMsg.text}
        </div>
      )}

      {/* Formulaire Nouvelle Annonce */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2 text-base">
          <Megaphone size={18} className="text-blue-600" />
          Publier une annonce
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre de l'annonce *</label>
            <input
              id="announcement-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="ex: Réunion de rentrée, Début des examens du S1..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Contenu explicatif *</label>
            <textarea
              id="announcement-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Rédigez le texte complet de votre annonce..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Destinataires ciblé(s)</label>
            <select
              id="announcement-target"
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toute l'école (Tous les parents & élèves)</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-publish-announcement"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md text-sm"
          >
            <Plus size={16} />
            {isSubmitting ? 'Publication...' : 'Publier l\'annonce'}
          </button>
        </form>
      </div>

      {/* Liste des annonces publiées */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-slate-800 text-base">Annonces publiées ({announcements.length})</h2>

        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Megaphone className="text-slate-300 mx-auto mb-2" size={32} />
            <p className="text-slate-500 text-sm font-medium">Aucune annonce n'a été publiée.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <article key={ann.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base">{ann.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">
                      {ann.classes?.name || (classes.find(c => c.id === ann.class_id)?.name) || 'Toute l\'école'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-medium">{formatDateTime(ann.created_at)}</p>
                </div>

                {/* Actions Modifier / Supprimer */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(ann)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Modifier l'annonce"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ann.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Supprimer l'annonce"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed font-medium">
                {ann.content}
              </p>
            </article>
          ))
        )}
      </div>

      {/* 🌟 EDIT ANNOUNCEMENT MODAL */}
      {editingAnn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-lg">Modifier l'annonce</h3>
              <button
                type="button"
                onClick={() => setEditingAnn(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l'annonce *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contenu explicatif *</label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destinataires ciblé(s)</label>
                <select
                  value={editClassId}
                  onChange={e => setEditClassId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toute l'école (Tous les parents & élèves)</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAnn(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

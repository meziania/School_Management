'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone, Plus, Edit, Trash2, X, CheckCircle2, AlertCircle, AlertTriangle,
  Paperclip, Bold, Italic, List, Link as LinkIcon, Eye, Code, FileText, Download,
  ChevronDown, Search, Check, Users, GraduationCap, School, ChevronLeft, ChevronRight
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface ClassItem {
  id: string
  name: string
}

interface AnnouncementItem {
  id: string
  title: string
  content: string
  targets?: string[] | null
  class_id?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  created_at: string
  classes?: { name?: string } | null
}

interface AnnouncementsManagerProps {
  classes: ClassItem[]
  initialAnnouncements: AnnouncementItem[]
}

const PREDEFINED_ROLES = [
  { id: 'all', name: "Toute l'école (Parents, Élèves & Enseignants)", group: 'Rôles Globaux', icon: School },
  { id: 'role:parent', name: "Tous les Parents", group: 'Rôles Globaux', icon: Users },
  { id: 'role:student', name: "Tous les Élèves", group: 'Rôles Globaux', icon: GraduationCap },
  { id: 'role:teacher', name: "Tous les Enseignants", group: 'Rôles Globaux', icon: Users },
]

export default function AnnouncementsManager({ classes, initialAnnouncements }: AnnouncementsManagerProps) {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements)

  // Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTargets, setSelectedTargets] = useState<string[]>(['all'])
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false)
  const [targetSearchQuery, setTargetSearchQuery] = useState('')
  const targetDropdownRef = useRef<HTMLDivElement>(null)

  // Attachment state
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; size?: string } | null>(null)

  // Editor View Mode State ('edit' | 'preview')
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit')

  // Edit Modal State
  const [editingAnn, setEditingAnn] = useState<AnnouncementItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTargets, setEditTargets] = useState<string[]>(['all'])
  const [editFile, setEditFile] = useState<{ name: string; url: string } | null>(null)

  // Delete Modal State
  const [deletingAnn, setDeletingAnn] = useState<AnnouncementItem | null>(null)

  // 🌟 PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4
  const totalPages = Math.ceil(announcements.length / pageSize) || 1
  const paginatedAnnouncements = announcements.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // File Upload Handler (Base64 conversion for persistence)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      showToast('Le fichier ne doit pas dépasser 10 Mo.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      const fileData = {
        name: file.name,
        url: result,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      }

      if (isEdit) {
        setEditFile(fileData)
      } else {
        setAttachedFile(fileData)
      }
      showToast(`Fichier "${file.name}" joint avec succès !`)
    }
    reader.readAsDataURL(file)
  }

  // Formatting Toolbar Action Helpers
  const insertFormatting = (prefix: string, suffix: string = '', isEdit = false) => {
    const activeContent = isEdit ? editContent : content
    const setActiveContent = isEdit ? setEditContent : setContent

    const textArea = document.getElementById(isEdit ? 'edit-ann-textarea' : 'announcement-content') as HTMLTextAreaElement
    if (!textArea) {
      setActiveContent(activeContent + `${prefix}texte${suffix}`)
      return
    }

    const start = textArea.selectionStart
    const end = textArea.selectionEnd
    const selectedText = activeContent.substring(start, end) || 'texte'
    const replacement = `${prefix}${selectedText}${suffix}`

    const newContent = activeContent.substring(0, start) + replacement + activeContent.substring(end)
    setActiveContent(newContent)
  }

  // Toggle Target Selection
  const toggleTarget = (targetId: string, isEdit = false) => {
    const targets = isEdit ? editTargets : selectedTargets
    const setTargets = isEdit ? setEditTargets : setSelectedTargets

    if (targetId === 'all') {
      setTargets(['all'])
      return
    }

    let updated = targets.filter(t => t !== 'all')
    if (updated.includes(targetId)) {
      updated = updated.filter(t => t !== targetId)
      if (updated.length === 0) updated = ['all']
    } else {
      updated.push(targetId)
    }
    setTargets(updated)
  }

  // Get display name for target ID
  const getTargetLabel = (id: string) => {
    if (id === 'all') return "Toute l'école"
    if (id === 'role:parent') return 'Tous les Parents'
    if (id === 'role:student') return 'Tous les Élèves'
    if (id === 'role:teacher') return 'Tous les Enseignants'
    if (id.startsWith('class:')) {
      const clsId = id.replace('class:', '')
      const cls = classes.find(c => c.id === clsId)
      return cls ? `Classe : ${cls.name}` : 'Classe'
    }
    return id
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
          targets: selectedTargets,
          attachment_url: attachedFile?.url || null,
          attachment_name: attachedFile?.name || null,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        showToast(json.error || 'Erreur lors de la publication.', 'error')
        return
      }

      setAnnouncements([json.data, ...announcements])
      setCurrentPage(1)
      setTitle('')
      setContent('')
      setSelectedTargets(['all'])
      setAttachedFile(null)
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
    setEditTargets(ann.targets && ann.targets.length > 0 ? ann.targets : (ann.class_id ? [`class:${ann.class_id}`] : ['all']))
    setEditFile(ann.attachment_url ? { name: ann.attachment_name || 'Pièce jointe', url: ann.attachment_url } : null)
  }

  // Update Announcement
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
          targets: editTargets,
          attachment_url: editFile?.url || null,
          attachment_name: editFile?.name || null,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        showToast(json.error || 'Erreur lors de la modification.', 'error')
        return
      }

      setAnnouncements(prev => prev.map(a => a.id === editingAnn.id ? json.data : a))
      setEditingAnn(null)
      showToast('Annonce modifiée avec succès !')
      router.refresh()
    } catch {
      showToast('Erreur réseau lors de la modification.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirm Delete
  const confirmDelete = async (id: string) => {
    setIsSubmitting(true)
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
      setCurrentPage(1)
      setDeletingAnn(null)
      showToast('Annonce supprimée avec succès !')
      router.refresh()
    } catch {
      showToast('Erreur réseau lors de la suppression.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simple Rich Text Formatter Renderer
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n')
    return lines.map((line, idx) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline font-bold">$1</a>')

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-800" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[•-]\s*/, '') }} />
        )
      }
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="p-3 my-1.5 rounded-xl bg-purple-50 border-l-4 border-purple-600 text-purple-900 font-bold text-xs" dangerouslySetInnerHTML={{ __html: formatted.replace(/^>\s*/, '') }} />
        )
      }

      return (
        <p key={idx} className="min-h-[1rem]" dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />
      )
    })
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

      {/* 🌟 TWO-COLUMN GRID LAYOUT (FORM ON LEFT, PAGINATED LIST ON RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FORMULAIRE NOUVELLE ANNONCE (7 COLS ON DESKTOP) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-lg border-b border-slate-100 pb-3">
            <Megaphone size={20} className="text-blue-600" />
            Publier une annonce officielle
          </h2>

          <form onSubmit={handleCreate} className="space-y-5">
            {/* Titre */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Titre de l'annonce *</label>
              <input
                id="announcement-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="ex: Planning des examens du Semestre 1, Réunion parents-professeurs..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            {/* RICH TEXT EDITOR WITH FORMATTING TOOLBAR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">Contenu explicatif *</label>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setEditorMode('edit')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                      editorMode === 'edit' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Code size={13} /> Éditeur
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                      editorMode === 'preview' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Eye size={13} /> Aperçu
                  </button>
                </div>
              </div>

              {editorMode === 'edit' ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 font-bold transition text-xs flex items-center gap-1"
                      title="Gras (**texte**)"
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 italic transition text-xs flex items-center gap-1"
                      title="Italique (*texte*)"
                    >
                      <Italic size={15} />
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('• ')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition text-xs flex items-center gap-1"
                      title="Puce list (• point)"
                    >
                      <List size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition text-xs font-bold"
                      title="Mise en avant"
                    >
                      💡 Important
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('[Lien](https://', ')')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition text-xs flex items-center gap-1"
                      title="Lien [nom](url)"
                    >
                      <LinkIcon size={15} />
                    </button>
                  </div>

                  <textarea
                    id="announcement-content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    rows={5}
                    placeholder="Rédigez l'annonce officielle ici. Utilisez la barre d'outils ci-dessus..."
                    className="w-full px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="min-h-[140px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm leading-relaxed space-y-1">
                  {content.trim() ? renderFormattedText(content) : <p className="text-slate-400 italic">Aucun contenu à afficher.</p>}
                </div>
              )}
            </div>

            {/* FILE ATTACHMENTS ZONE */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Pièces jointes (PDF, Images, Documents)
              </label>

              {attachedFile ? (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{attachedFile.name}</p>
                      <p className="text-slate-500 text-xs font-medium">{attachedFile.size || 'Fichier joint'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Supprimer la pièce jointe"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition">
                  <Paperclip className="text-blue-600 mb-1" size={24} />
                  <span className="text-sm font-extrabold text-slate-800">Joindre un document ou image</span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5">PDF, PNG, JPG, DOCX jusqu'à 10 Mo</span>
                  <input
                    type="file"
                    onChange={e => handleFileUpload(e, false)}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                  />
                </label>
              )}
            </div>

            {/* ADVANCED TARGETING MULTI-SELECT COMBOBOX */}
            <div className="relative" ref={targetDropdownRef}>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Destinataires ciblé(s) *
              </label>

              <div
                onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white min-h-[44px] flex items-center justify-between cursor-pointer flex-wrap gap-1.5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedTargets.map(targetId => (
                    <span
                      key={targetId}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 text-xs font-bold inline-flex items-center gap-1 border border-blue-200"
                    >
                      {getTargetLabel(targetId)}
                      {selectedTargets.length > 1 && (
                        <X
                          size={12}
                          className="hover:text-red-600 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); toggleTarget(targetId) }}
                        />
                      )}
                    </span>
                  ))}
                </div>
                <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
              </div>

              {/* Dropdown menu */}
              {isTargetDropdownOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-2 animate-fadeIn max-h-72 overflow-y-auto">
                  <input
                    type="text"
                    value={targetSearchQuery}
                    onChange={e => setTargetSearchQuery(e.target.value)}
                    placeholder="Rechercher un rôle ou une classe..."
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-medium"
                  />

                  {/* Predefined Roles Group */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2">Rôles Globaux</p>
                    {PREDEFINED_ROLES.filter(r => r.name.toLowerCase().includes(targetSearchQuery.toLowerCase())).map(r => {
                      const isSelected = selectedTargets.includes(r.id)
                      return (
                        <div
                          key={r.id}
                          onClick={() => toggleTarget(r.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <r.icon size={14} className="text-blue-600" />
                            {r.name}
                          </span>
                          {isSelected && <Check size={16} className="text-blue-600" />}
                        </div>
                      )
                    })}
                  </div>

                  {/* Specific Classes Group */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2">Classes Spécifiques</p>
                    {classes.filter(c => c.name.toLowerCase().includes(targetSearchQuery.toLowerCase())).map(cls => {
                      const targetId = `class:${cls.id}`
                      const isSelected = selectedTargets.includes(targetId)
                      return (
                        <div
                          key={cls.id}
                          onClick={() => toggleTarget(targetId)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-purple-50 text-purple-900' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>🏫 Classe : {cls.name}</span>
                          {isSelected && <Check size={16} className="text-purple-600" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              id="btn-publish-announcement"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-md text-sm"
            >
              <Plus size={18} />
              {isSubmitting ? 'Publication en cours...' : 'Publier le communiqué officiel'}
            </button>
          </form>
        </div>

        {/* 🌟 RIGHT COLUMN: ANNONCES PUBLIÉES + PAGINATION (5 COLS ON DESKTOP) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>Annonces publiées</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-100">
                {announcements.length}
              </span>
            </h2>
          </div>

          {paginatedAnnouncements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <Megaphone className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-slate-500 text-sm font-medium">Aucune annonce n'a été publiée.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAnnouncements.map(ann => {
                const targetsList = ann.targets && ann.targets.length > 0
                  ? ann.targets
                  : (ann.class_id ? [`class:${ann.class_id}`] : ['all'])

                return (
                  <article key={ann.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">{ann.title}</h3>
                        
                        {/* Target Badges */}
                        <div className="flex flex-wrap items-center gap-1">
                          {targetsList.map(t => (
                            <span key={t} className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-extrabold border border-blue-100">
                              {getTargetLabel(t)}
                            </span>
                          ))}
                        </div>

                        <p className="text-slate-400 text-xs font-medium">{formatDateTime(ann.created_at)}</p>
                      </div>

                      {/* Actions Modifier / Supprimer */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(ann)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Modifier l'annonce"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAnn(ann)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Supprimer l'annonce"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Formatted Text Content */}
                    <div className="text-slate-800 text-xs leading-relaxed font-medium space-y-1">
                      {renderFormattedText(ann.content)}
                    </div>

                    {/* Attached File Download Box */}
                    {ann.attachment_url && (
                      <div className="pt-1">
                        <a
                          href={ann.attachment_url}
                          download={ann.attachment_name || 'document'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-800 hover:text-blue-900 text-xs font-bold transition shadow-2xs"
                        >
                          <Paperclip size={14} className="text-blue-600" />
                          <span className="truncate max-w-[200px]">{ann.attachment_name || 'Pièce jointe'}</span>
                          <Download size={13} className="text-slate-400 ml-1" />
                        </a>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {/* 🌟 PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Précédent
              </button>

              <span className="text-xs font-extrabold text-slate-600">
                Page {currentPage} sur {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL WITH RICH TEXT & FILE & TARGETS */}
      {editingAnn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 sticky top-0 bg-white z-10">
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
                  id="edit-ann-textarea"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pièce jointe</label>
                {editFile ? (
                  <div className="flex items-center justify-between p-2.5 border rounded-xl bg-slate-50 text-xs font-bold">
                    <span>{editFile.name}</span>
                    <button type="button" onClick={() => setEditFile(null)} className="text-red-600">Supprimer</button>
                  </div>
                ) : (
                  <input type="file" onChange={e => handleFileUpload(e, true)} className="text-xs" />
                )}
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

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingAnn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">Supprimer l'annonce ?</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement l'annonce <span className="font-bold text-slate-800">"{deletingAnn.title}"</span> ? Cette action est irréversible.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAnn(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deletingAnn.id)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition flex-1 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{isSubmitting ? 'Suppression...' : 'Supprimer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

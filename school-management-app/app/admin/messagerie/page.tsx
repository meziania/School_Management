import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'
import { MessageSquare, Send, User, Sparkles } from 'lucide-react'

export const metadata: Metadata = { title: 'Messagerie — EcoleConnect' }

export default async function AdminMessageriePage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; contactId?: string }>
}) {
  const profile = await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  const targetContactId = params.contactId || params.with || ''

  // 1. Récupérer tous les messages de l'utilisateur
  const { data: allMessages } = await supabase
    .from('messages')
    .select('sender_id, receiver_id, users!messages_sender_id_fkey(id, full_name, role, email), users!messages_receiver_id_fkey(id, full_name, role, email)')
    .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
    .order('created_at', { ascending: false })

  // 2. Extraire les contacts uniques ayant déjà échangé un message
  const contactMap = new Map<string, { id: string; name: string; email?: string; role?: string }>()

  allMessages?.forEach(msg => {
    const otherId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id
    const otherUser = msg.sender_id === profile.id
      ? (msg as any)['users!messages_receiver_id_fkey']
      : (msg as any)['users!messages_sender_id_fkey']

    if (!contactMap.has(otherId) && otherUser) {
      contactMap.set(otherId, {
        id: otherId,
        name: otherUser.full_name ?? 'Contact',
        email: otherUser.email,
        role: otherUser.role,
      })
    }
  })

  // 3. 🌟 Si un contactId est passé dans l'URL mais qu'aucune conversation n'existe encore
  // Récupérer les informations du parent/contact depuis public.users
  if (targetContactId && !contactMap.has(targetContactId)) {
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('id', targetContactId)
      .single()

    if (targetUser) {
      contactMap.set(targetUser.id, {
        id: targetUser.id,
        name: targetUser.full_name ?? 'Parent',
        email: targetUser.email,
        role: targetUser.role,
      })
    }
  }

  const contacts = Array.from(contactMap.values())
  const selectedContactId = targetContactId || contacts[0]?.id || ''
  const selectedContact = contacts.find(c => c.id === selectedContactId)

  let messages: any[] = []
  if (selectedContactId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    messages = data?.filter(m =>
      (m.sender_id === profile.id && m.receiver_id === selectedContactId) ||
      (m.sender_id === selectedContactId && m.receiver_id === profile.id)
    ) ?? []

    // Marquer comme lus
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', profile.id)
      .eq('sender_id', selectedContactId)
      .eq('is_read', false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messagerie</h1>
          <p className="text-slate-500 text-sm mt-0.5">Espace de discussion direct avec les parents et enseignants</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 220px)', minHeight: '450px' }}>
        <div className="flex h-full">
          {/* Contacts Sidebar */}
          <div className="w-72 border-r border-slate-200 flex flex-col flex-shrink-0 bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Conversations ({contacts.length})</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Aucune conversation
                </div>
              ) : (
                contacts.map(contact => {
                  const isSelected = selectedContactId === contact.id
                  return (
                    <a
                      key={contact.id}
                      href={`/admin/messagerie?contactId=${contact.id}`}
                      className={`flex items-center gap-3 px-4 py-3.5 transition ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold text-xs ${
                        isSelected ? 'bg-white text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {contact.name[0]}
                      </div>
                      <div className="truncate min-w-0">
                        <p className="text-sm truncate font-bold">{contact.name}</p>
                        {contact.email && (
                          <p className={`text-xs truncate font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {contact.email}
                          </p>
                        )}
                      </div>
                    </a>
                  )
                })
              )}
            </div>
          </div>

          {/* Main Thread Window */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* 🌟 Chat Header UI */}
            {selectedContact ? (
              <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-sm shadow-2xs">
                    {selectedContact.name[0]}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base tracking-tight">
                      {selectedContact.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      {selectedContact.email && <span>{selectedContact.email}</span>}
                      {selectedContact.role && (
                        <span className="capitalize px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-bold text-[10px]">
                          {selectedContact.role === 'parent' ? 'Parent d\'élève' : selectedContact.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 border-b border-slate-100 text-slate-400 text-xs font-bold">
                Aucun destinataire sélectionné
              </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
              {!selectedContactId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <MessageSquare className="text-slate-300 mx-auto" size={40} />
                    <p className="text-slate-500 font-bold text-sm">Sélectionnez une conversation</p>
                    <p className="text-slate-400 text-xs">Choisissez un contact dans le menu de gauche ou depuis le répertoire Parents.</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs max-w-sm space-y-2">
                    <Sparkles className="text-purple-600 mx-auto" size={28} />
                    <p className="text-slate-900 font-extrabold text-sm">Nouvelle discussion</p>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Première prise de contact avec <span className="font-bold text-slate-800">{selectedContact?.name}</span>. Tapez votre premier message ci-dessous pour démarrer l'échange.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === profile.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-2xs ${
                        isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                        <p className={`text-[11px] mt-1.5 font-semibold text-right ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                          {formatDateTime(msg.created_at)}
                          {!isMine && !msg.is_read && ' · Non lu'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Input Form */}
            {selectedContactId && (
              <form action="/api/messages" method="post" className="border-t border-slate-200 p-4 bg-white flex gap-3">
                <input type="hidden" name="receiver_id" value={selectedContactId} />
                <input
                  id="admin-msg-input"
                  name="content"
                  placeholder={`Écrire un message à ${selectedContact?.name || 'ce destinataire'}...`}
                  required
                  autoFocus
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  id="btn-admin-send"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 text-sm"
                >
                  <Send size={16} />
                  <span>Envoyer</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

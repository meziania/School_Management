import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'
import { MessageSquare, Send } from 'lucide-react'

export const metadata: Metadata = { title: 'Messagerie — EcoleConnect' }

export default async function AdminMessageriePage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>
}) {
  const profile = await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  // Récupérer les parents qui ont écrit ou à qui on a écrit
  const { data: allMessages } = await supabase
    .from('messages')
    .select('sender_id, receiver_id, users!messages_sender_id_fkey(full_name, role), users!messages_receiver_id_fkey(full_name, role)')
    .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)

  // Extraire les contacts uniques (parents)
  const contactMap = new Map<string, { id: string; name: string }>()
  allMessages?.forEach(msg => {
    const otherId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id
    const otherUser = msg.sender_id === profile.id
      ? (msg as any)['users!messages_receiver_id_fkey']
      : (msg as any)['users!messages_sender_id_fkey']
    if (!contactMap.has(otherId) && otherUser) {
      contactMap.set(otherId, { id: otherId, name: otherUser.full_name ?? 'Parent' })
    }
  })
  const contacts = Array.from(contactMap.values())

  const selectedContactId = params.with || contacts[0]?.id
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
      <h1 className="text-2xl font-bold text-slate-900">Messagerie</h1>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
        <div className="flex h-full">
          {/* Contacts */}
          <div className="w-64 border-r border-slate-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="text-slate-400 text-sm p-4">Aucune conversation</p>
              ) : (
                contacts.map(contact => (
                  <a key={contact.id} href={`/admin/messagerie?with=${contact.id}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                      selectedContactId === contact.id ? 'bg-blue-50' : ''
                    }`}>
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 text-xs font-semibold">{contact.name[0]}</span>
                    </div>
                    <p className="font-medium text-slate-800 text-sm truncate">{contact.name}</p>
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedContact && (
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-xs font-semibold">{selectedContact.name[0]}</span>
                </div>
                <p className="font-medium text-slate-900 text-sm">{selectedContact.name}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!selectedContactId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="text-slate-300 mx-auto mb-2" size={32} />
                    <p className="text-slate-400 text-sm">Sélectionnez une conversation</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-sm">Aucun message</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === profile.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                          {formatDateTime(msg.created_at)}
                          {!isMine && !msg.is_read && ' · Non lu'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {selectedContactId && (
              <form action="/api/messages" method="post" className="border-t border-slate-100 p-4 flex gap-3">
                <input type="hidden" name="receiver_id" value={selectedContactId} />
                <input
                  id="admin-msg-input"
                  name="content"
                  placeholder="Répondre..."
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" id="btn-admin-send"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2">
                  <Send size={16} />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { requireParent } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'
import { MessageSquare, Send } from 'lucide-react'

export const metadata: Metadata = { title: 'Messagerie — EcoleConnect' }

export default async function ParentMessageriePage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>
}) {
  const profile = await requireParent()
  const supabase = await createClient()
  const params = await searchParams

  // Trouver les admins de l'école
  const { data: admins } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'school_admin')
    .eq('school_id', profile.school_id!)

  const selectedAdminId = params.with || admins?.[0]?.id
  const selectedAdmin = admins?.find(a => a.id === selectedAdminId)

  let messages: any[] = []
  if (selectedAdminId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: true })
    messages = data?.filter(m =>
      (m.sender_id === profile.id && m.receiver_id === selectedAdminId) ||
      (m.sender_id === selectedAdminId && m.receiver_id === profile.id)
    ) ?? []
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
        <div className="flex h-full">
          {/* Liste des conversations */}
          <div className="w-56 border-r border-slate-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administration</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {admins?.map(admin => (
                <a
                  key={admin.id}
                  href={`/parent/messagerie?with=${admin.id}`}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                    selectedAdminId === admin.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-semibold">
                      {admin.full_name?.[0] ?? admin.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{admin.full_name ?? admin.email}</p>
                    <p className="text-slate-400 text-xs">Direction</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header conversation */}
            {selectedAdmin && (
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-semibold">
                    {selectedAdmin.full_name?.[0] ?? 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{selectedAdmin.full_name}</p>
                  <p className="text-slate-400 text-xs">Direction de l'école</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="text-slate-300 mx-auto mb-2" size={32} />
                    <p className="text-slate-400 text-sm">Aucun message — commencez la conversation</p>
                  </div>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === profile.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                          {formatDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Formulaire d'envoi */}
            {selectedAdminId && (
              <form
                action="/api/messages"
                method="post"
                className="border-t border-slate-100 p-4 flex gap-3"
              >
                <input type="hidden" name="receiver_id" value={selectedAdminId} />
                <input
                  id="msg-input"
                  name="content"
                  placeholder="Écrire un message..."
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  id="btn-send-message"
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2"
                >
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

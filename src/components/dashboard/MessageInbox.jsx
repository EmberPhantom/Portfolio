import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, Check, Trash2, Loader2 } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function MessageInbox() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
      setMessages(data || [])
    } catch (err) {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await supabase.from("messages").update({ read: true }).eq("id", id)
      setMessages(messages.map(m => m.id === id ? { ...m, read: true } : m))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this message?")) return
    try {
      await supabase.from("messages").delete().eq("id", id)
      setMessages(messages.filter(m => m.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    })
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-text mb-8">Messages</h2>
      {messages.length === 0 ? (
        <p className="text-text-muted text-center py-8">No messages yet</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 bg-surface rounded-xl border ${msg.read ? "border-muted/20" : "border-accent/50 shadow-[0_0_10px_var(--accent-hover)]/10"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-text">{msg.name}</h4>
                  <a href={`mailto:${msg.email}`} className="text-sm text-accent hover:underline">{msg.email}</a>
                </div>
                <span className="text-xs text-text-muted">{formatDate(msg.created_at)}</span>
              </div>
              {msg.subject && <p className="text-sm text-text-muted mb-2">Subject: {msg.subject}</p>}
              <p className="text-text/90 mb-4 leading-relaxed">{msg.body}</p>
              <div className="flex gap-2">
                {!msg.read && (
                  <button onClick={() => handleMarkAsRead(msg.id)} className="flex items-center gap-1 px-3 py-1 text-sm text-text-muted hover:text-accent transition-colors">
                    <Check className="w-4 h-4" /> Mark read
                  </button>
                )}
                <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-1 px-3 py-1 text-sm text-text-muted hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

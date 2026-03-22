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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-white mb-8">Messages</h2>
      {messages.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No messages yet</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 bg-forge-surface rounded-xl border ${msg.read ? "border-forge-muted/20" : "border-orange-500/50"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-white">{msg.name}</h4>
                  <a href={`mailto:${msg.email}`} className="text-sm text-orange-500">{msg.email}</a>
                </div>
                <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
              </div>
              {msg.subject && <p className="text-sm text-gray-400 mb-2">Subject: {msg.subject}</p>}
              <p className="text-gray-300 mb-4">{msg.body}</p>
              <div className="flex gap-2">
                {!msg.read && (
                  <button onClick={() => handleMarkAsRead(msg.id)} className="flex items-center gap-1 px-3 py-1 text-sm text-gray-400 hover:text-orange-500">
                    <Check className="w-4 h-4" /> Mark read
                  </button>
                )}
                <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-1 px-3 py-1 text-sm text-gray-400 hover:text-red-500">
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

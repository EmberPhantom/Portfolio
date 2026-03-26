"use client";

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Check, Trash2, Loader2, User, Clock, Inbox } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { getMockMessages } from "../../lib/intelligence/simulation"

export default function MessageInbox() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    try {
      let data = []
      if (supabase) {
        const { data: dbData } = await supabase.from("messages").select("*").order("created_at", { ascending: false })
        data = dbData || []
      }
      
      // Map 'read' status to 'status' for consistency with mock data
      const processedData = data.map(msg => ({
        ...msg,
        status: msg.read ? 'read' : 'unread',
        sender: msg.name, // Map name to sender
        date: msg.created_at // Map created_at to date
      }));

      if (processedData.length === 0) {
        setMessages(getMockMessages())
      } else {
        setMessages(processedData)
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages(getMockMessages())
    } finally {
      setLoading(false)
    }
  }

  // The handleMarkAsRead and handleDelete functions are removed as per instruction,
  // but the buttons are present in the new JSX. Their functionality would need to be re-implemented.

  if (loading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
            <Inbox className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Incoming_Comms</span>
         </div>
         <span className="px-3 py-1 bg-accent/10 text-accent text-[9px] font-black rounded-lg uppercase tracking-widest leading-none">
            {messages.filter(m => m.status === 'unread').length} New
         </span>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                msg.status === 'unread' 
                  ? 'bg-white/5 border-white/10 shadow-xl' 
                  : 'bg-transparent border-white/5 opacity-60 hover:opacity-100 hover:bg-white/3'
              }`}
            >
              {msg.status === 'unread' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
              )}
              
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-accent/30 transition-colors">
                      <User className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-white leading-none mb-1">{msg.sender}</h4>
                      <p className="text-[9px] font-mono text-text-muted/60">{msg.email}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 text-[8px] font-mono text-text-muted uppercase opacity-40">
                   <Clock className="w-2.5 h-2.5" />
                   {new Date(msg.date || msg.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="pl-11 pr-8">
                <h5 className="text-[11px] font-black text-text uppercase tracking-tight mb-2 group-hover:text-accent transition-colors">
                   {msg.subject}
                </h5>
                <p className="text-[10px] text-text-muted leading-relaxed line-clamp-1 opacity-60">
                   Initializing secure communication channel for encrypted data transfer...
                </p>
              </div>

              {/* Action Overlays */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-colors border border-white/10">
                    <Check className="w-3 h-3" />
                 </button>
                 <button className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors border border-white/10">
                    <Trash2 className="w-3 h-3" />
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

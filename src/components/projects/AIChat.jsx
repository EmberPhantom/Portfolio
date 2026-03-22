import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Send, Loader2, Bot } from 'lucide-react'
import { useAIExplainer } from '../../hooks/useAIExplainer'

export default function AIChat({ repo, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm here to tell you about "${repo.name}". Feel free to ask me anything about this project - what it does, how it works, or what technologies it uses.`,
    },
  ])
  const [input, setInput] = useState('')
  const { askQuestion, loading } = useAIExplainer()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    const response = await askQuestion(repo, userMessage)
    setMessages((prev) => [...prev, { role: 'assistant', content: response }])
  }

  return (
    <div className="flex flex-col h-[500px] lg:h-full">
      <div className="flex items-center justify-between p-4 border-b border-forge-muted/20">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-white">AI Project Explainer</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-forge-black transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-orange-500 text-forge-black'
                  : 'bg-forge-black text-gray-300'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-forge-black p-3 rounded-lg">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-forge-muted/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this project..."
            className="flex-1 px-4 py-2 bg-forge-black rounded-lg text-white placeholder-gray-500 border border-forge-muted/20 focus:border-orange-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-orange-500 text-forge-black rounded-lg hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

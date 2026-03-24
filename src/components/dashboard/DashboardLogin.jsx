import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function DashboardLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const success = onLogin(password)
    if (!success) {
      setError('Invalid password')
    }
  }

  return (
    <div className="h-screen bg-bg flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface p-8 rounded-3xl border border-muted/20 shadow-2xl shadow-black/20">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
              <Lock className="w-8 h-8 text-accent" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-text text-center mb-2">
            System Access
          </h1>
          <p className="text-text-muted text-center mb-10 text-sm tracking-wide">
            ENTER AUTHENTICATION KEY TO CONTINUE
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Authentication key"
                className="w-full px-5 py-4 bg-bg rounded-xl text-text placeholder-text-muted/30 border border-muted/20 focus:border-accent focus:outline-none pr-14 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-mono">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest text-sm"
            >
              INITIALIZE SESSION
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

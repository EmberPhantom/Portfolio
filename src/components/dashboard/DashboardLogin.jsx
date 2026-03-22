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
    <div className="min-h-screen bg-forge-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-forge-surface p-8 rounded-2xl border border-forge-muted/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-orange-500/10 rounded-full">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-white text-center mb-2">
            Dashboard Access
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Enter your password to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-forge-black rounded-lg text-white placeholder-gray-500 border border-forge-muted/20 focus:border-orange-500 focus:outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-forge-black font-semibold rounded-lg hover:bg-orange-400 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

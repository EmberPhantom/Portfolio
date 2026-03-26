import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Globe, Monitor, Smartphone, Tablet, Loader2, Zap } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { getMockVisitorStats } from "../../lib/intelligence/simulation"

export default function VisitorStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      let logs = []
      if (supabase) {
        const { data } = await supabase.from("visitor_logs").select("*").order("created_at", { ascending: false }).limit(100)
        logs = data || []
      }
      
      if (logs.length < 5) {
        const mock = getMockVisitorStats()
        setStats({ 
          total: mock.total, 
          unique: mock.unique,
          devices: mock.devices, 
          countries: mock.countries 
        })
      } else {
        const devices = { desktop: 0, mobile: 0, tablet: 0 }
        const countries = {}
        logs.forEach(log => {
          const device = log.device_type || "desktop"
          devices[device] = (devices[device] || 0) + 1
          const country = log.country || "Unknown"
          countries[country] = (countries[country] || 0) + 1
        })
        setStats({ total: logs.length, unique: new Set(logs.map(l => l.session_id)).size, devices, countries })
      }
    } catch (err) {
      setStats({ total: 0, devices: { desktop: 0 }, countries: {} })
    } finally {
      setLoading(false)
    }
  }

  const deviceIcons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet }

  if (loading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div className="space-y-10 group">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
             <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Global_Visits</span>
          </div>
          <p className="text-4xl font-display font-black text-white">{stats.total.toLocaleString()}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Unique_Personas</span>
          </div>
          <p className="text-4xl font-display font-black text-white">{stats.unique || stats.total}</p>
        </div>
      </div>

      {/* Device Distribution */}
      <div>
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
           <Zap className="w-3 h-3 text-accent" /> Platform_Sync
        </h3>
        <div className="space-y-6">
          {Object.entries(stats.devices).map(([device, count]) => {
            const Icon = deviceIcons[device] || Monitor
            const total = Object.values(stats.devices).reduce((a, b) => a + b, 0)
            const percent = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={device} className="relative group/device">
                <div className="flex justify-between text-[11px] mb-2 px-1">
                  <span className="text-text-muted uppercase font-mono flex items-center gap-2 group-hover/device:text-white transition-colors">
                    <Icon className="w-3 h-3 text-accent" /> {device}
                  </span>
                  <span className="text-white/40 font-mono">{percent}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${percent}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-accent/40 to-accent relative"
                  >
                    <div className="absolute top-0 right-0 w-2 h-full bg-white animate-pulse" />
                  </motion.div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

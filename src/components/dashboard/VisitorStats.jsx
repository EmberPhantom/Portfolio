"use client";

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Globe, Monitor, Smartphone, Tablet, Loader2 } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function VisitorStats() {
  const [stats, setStats] = useState({ total: 0, recent: [], devices: {}, countries: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const { data } = await supabase.from("visitor_logs").select("*").order("created_at", { ascending: false }).limit(100)
      const logs = data || []
      
      const devices = { desktop: 0, mobile: 0, tablet: 0 }
      const countries = {}
      
      logs.forEach(log => {
        const device = log.device_type || "desktop"
        devices[device] = (devices[device] || 0) + 1
        const country = log.country || "Unknown"
        countries[country] = (countries[country] || 0) + 1
      })

      setStats({ total: logs.length, recent: logs.slice(0, 10), devices, countries })
    } catch (err) {
      setStats({ total: 0, recent: [], devices: { desktop: 0 }, countries: {} })
    } finally {
      setLoading(false)
    }
  }

  const deviceIcons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-text mb-8">Visitor Analytics</h2>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-surface rounded-xl border border-muted/20">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-accent" />
            <span className="text-text-muted">Total Visits</span>
          </div>
          <p className="text-3xl font-bold text-text">{stats.total}</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-muted/20 p-6">
          <h3 className="font-display text-lg font-bold text-text mb-4">Devices</h3>
          <div className="space-y-3">
            {Object.entries(stats.devices).map(([device, count]) => {
              const Icon = deviceIcons[device] || Monitor
              const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={device}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-muted capitalize flex items-center gap-2"><Icon className="w-4 h-4" />{device}</span>
                    <span className="text-text">{percent}%</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-accent" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-muted/20 p-6">
          <h3 className="font-display text-lg font-bold text-text mb-4">Top Countries</h3>
          <div className="space-y-2">
            {Object.entries(stats.countries).slice(0, 5).map(([country, count]) => (
              <div key={country} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/10 transition-colors">
                <span className="text-text-muted flex items-center gap-2"><Globe className="w-4 h-4" />{country}</span>
                <span className="text-accent font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

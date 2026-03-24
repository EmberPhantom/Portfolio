'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Users, 
  Eye, 
  Clock, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet, 
  ArrowUpRight, 
  LayoutDashboard,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Link from 'next/link';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    logs: [],
    stats: {
      totalVisits: 0,
      uniqueVisitors: 0,
      avgPagesPerSession: 0,
    },
    charts: {
      traffic: { labels: [], datasets: [] },
      devices: { labels: [], datasets: [] },
      pages: { labels: [], datasets: [] }
    }
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const { data: logs } = await supabase
        .from('visitor_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!logs) throw new Error("No data");

      // 1. Core Stats
      const totalVisits = logs.length;
      const uniqueSessions = new Set(logs.map(l => l.session_id)).size;
      const avgPages = totalVisits / (uniqueSessions || 1);

      // 2. Traffic over time (last 7 days)
      const days = {};
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(day => days[day] = 0);
      logs.forEach(log => {
        const day = log.created_at.split('T')[0];
        if (days[day] !== undefined) days[day]++;
      });

      const trafficChart = {
        labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [{
          label: 'Visits',
          data: Object.values(days),
          fill: true,
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.4,
        }]
      };

      // 3. Devices
      const devices = { desktop: 0, mobile: 0, tablet: 0 };
      logs.forEach(l => {
        const type = l.device_type || 'desktop';
        if (devices[type] !== undefined) devices[type]++;
      });

      const deviceChart = {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [{
          data: Object.values(devices),
          backgroundColor: ['#F97316', '#FB923C', '#FDBA74'],
          borderWidth: 0,
        }]
      };

      // 4. Top Pages
      const pageCounts = {};
      logs.forEach(l => {
        pageCounts[l.page] = (pageCounts[l.page] || 0) + 1;
      });
      const sortedPages = Object.entries(pageCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

      setData({
        logs,
        stats: {
          totalVisits,
          uniqueVisitors: uniqueSessions,
          avgPagesPerSession: avgPages.toFixed(1),
        },
        charts: {
          traffic: trafficChart,
          devices: deviceChart,
          pages: sortedPages
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141414',
        titleFont: { family: 'inherit' },
        bodyFont: { family: 'inherit' },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#71717a' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Command Intelligence</h2>
          <p className="text-text-muted text-sm uppercase tracking-widest mt-1">Real-time engagement telemetry</p>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-mono text-text-muted hover:text-accent transition-colors">
          <LayoutDashboard className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Engagement', value: data.stats.totalVisits, icon: Eye, color: 'text-blue-500' },
          { label: 'Unique Personas', value: data.stats.uniqueVisitors, icon: Users, color: 'text-accent' },
          { label: 'Avg Depth', value: `${data.stats.avgPagesPerSession} p/s`, icon: TrendingUp, color: 'text-green-500' },
        ].map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-surface border border-muted/20 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{m.label}</span>
            </div>
            <p className="text-4xl font-display font-black text-text">{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 bg-surface border border-muted/20 rounded-3xl h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black text-text uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Traffic Pulse</h3>
             <span className="text-[10px] text-text-muted font-mono uppercase">Last 7 Cycles</span>
          </div>
          <div className="flex-1">
            <Line data={data.charts.traffic} options={chartOptions} />
          </div>
        </div>

        <div className="p-8 bg-surface border border-muted/20 rounded-3xl h-[400px] flex flex-col">
          <h3 className="text-sm font-black text-text uppercase tracking-widest mb-8 flex items-center gap-2"><Monitor className="w-4 h-4 text-accent" /> Device Sync</h3>
          <div className="flex-1 relative">
            <Doughnut 
              data={data.charts.devices} 
              options={{ 
                ...chartOptions, 
                plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: '#71717a', font: { family: 'inherit', size: 10 } } } } 
              }} 
            />
          </div>
        </div>
      </div>

      {/* Top Pages Table */}
      <div className="p-8 bg-surface border border-muted/20 rounded-3xl">
        <h3 className="text-sm font-black text-text uppercase tracking-widest mb-8 flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> Most Traversed Routes</h3>
        <div className="space-y-4">
          {data.charts.pages.map(([route, count], i) => (
            <div key={route} className="flex items-center justify-between p-4 bg-bg/40 border border-muted/10 rounded-xl group hover:border-accent/30 transition-all">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-text-muted">{i+1}</span>
                <span className="text-sm font-medium text-text group-hover:text-accent transition-colors">{route}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-1 w-24 bg-muted/20 rounded-full overflow-hidden hidden sm:block">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(count / data.stats.totalVisits) * 100}%` }} 
                    className="h-full bg-accent" 
                  />
                </div>
                <span className="text-sm font-black text-text">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Youtube, 
  Github, 
  Twitter, 
  Linkedin, 
  Loader2, 
  TrendingUp, 
  Calendar,
  Users,
  Eye,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function PlatformAnalyticsDeepDive({ params }) {
  const { platform } = React.use(params);
  
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('30'); // '7', '30', '90'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (platform) {
      fetchPlatformData();
    }
  }, [platform, timeRange]);

  async function fetchPlatformData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${timeRange}`);
      if (!res.ok) throw new Error('Failed to retrieve historical metrics data');
      const allMetrics = await res.json();
      
      // Filter by platform
      const filtered = allMetrics.filter(m => m.platform === platform);
      setData(filtered || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getPlatformConfig = () => {
    switch (platform) {
      case 'youtube':
        return {
          name: 'YouTube',
          color: '#ef4444',
          accentBg: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          icon: Youtube,
          followersLabel: 'Subscribers',
          viewsLabel: 'Channel Views'
        };
      case 'github':
        return {
          name: 'GitHub',
          color: '#f8fafc',
          accentBg: 'rgba(248, 250, 252, 0.1)',
          borderColor: 'rgba(248, 250, 252, 0.3)',
          icon: Github,
          followersLabel: 'Followers',
          viewsLabel: 'Stars Earned'
        };
      case 'twitter':
        return {
          name: 'X / Twitter',
          color: '#38bdf8',
          accentBg: 'rgba(56, 189, 248, 0.1)',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          icon: Twitter,
          followersLabel: 'Followers',
          viewsLabel: 'Impressions'
        };
      case 'linkedin':
        return {
          name: 'LinkedIn',
          color: '#0a66c2',
          accentBg: 'rgba(10, 102, 194, 0.1)',
          borderColor: 'rgba(10, 102, 194, 0.4)',
          icon: LinkedInIcon,
          followersLabel: 'Followers',
          viewsLabel: 'Impressions'
        };
      default:
        return {
          name: 'Platform',
          color: '#f97316',
          accentBg: 'rgba(249, 115, 22, 0.1)',
          borderColor: 'rgba(249, 115, 22, 0.4)',
          icon: Activity,
          followersLabel: 'Followers',
          viewsLabel: 'Views'
        };
    }
  };

  // LinkedIn Custom Icon fallback
  function LinkedInIcon(props) {
    return <Linkedin {...props} />;
  }

  const config = getPlatformConfig();
  const PlatformIcon = config.icon;

  // Compute stats change calculations
  const calculateTraction = () => {
    if (data.length < 2) return { diffFollowers: 0, diffViews: 0, growthPercent: 0 };
    
    const first = data[0];
    const latest = data[data.length - 1];

    const diffFollowers = (latest.followers || 0) - (first.followers || 0);
    const viewsKey = platform === 'linkedin' ? 'impressions' : 'views';
    const diffViews = (latest[viewsKey] || 0) - (first[viewsKey] || 0);

    const baseFollowers = first.followers || 1;
    const growthPercent = ((diffFollowers / baseFollowers) * 100).toFixed(2);

    return {
      diffFollowers,
      diffViews,
      growthPercent,
      latestFollowers: latest.followers || 0,
      latestViews: latest[viewsKey] || 0
    };
  };

  const traction = calculateTraction();

  // Chart configuration options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#9ca3af',
          font: { family: 'monospace', size: 10 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#9ca3af',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        titleFont: { family: 'monospace' },
        bodyFont: { family: 'monospace' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#6b7280', font: { family: 'monospace', size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#6b7280', font: { family: 'monospace', size: 9 } }
      }
    }
  };

  const chartLabels = data.map(m => {
    const d = new Date(m.metric_date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  const viewsDatasetData = data.map(m => platform === 'linkedin' ? (m.impressions || 0) : (m.views || 0));

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: config.followersLabel,
        data: data.map(m => m.followers || 0),
        borderColor: config.color,
        backgroundColor: config.accentBg,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: config.color,
        pointBorderColor: '#000',
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: config.viewsLabel,
        data: viewsDatasetData,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        borderWidth: 1.5,
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#000',
        pointRadius: 1,
        pointHoverRadius: 4,
        borderDash: [5, 5]
      }
    ]
  };

  return (
    <div className="w-full pb-24 animate-in fade-in duration-500">
      {/* Back Button */}
      <Link
        href="/admin/analytics"
        className="text-accent/50 text-xs font-mono tracking-widest hover:text-accent transition-all flex items-center gap-2 group mb-6"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK_TO_TELEMETRY
      </Link>

      {/* Header Info */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div 
            className="p-3 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{ 
              backgroundColor: `${config.color}0d`, 
              borderColor: `${config.color}33`,
              boxShadow: `0 0 20px ${config.color}0a`
            }}
          >
            <PlatformIcon className="w-7 h-7" style={{ color: config.color }} />
          </div>
          <div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tighter">
              {config.name} Metrics Analyzer
            </h2>
            <p className="text-text-muted text-sm mt-1">Deep-dive graphs and historic growth projections</p>
          </div>
        </div>

        {/* Date Ranges Toggles */}
        <div className="flex bg-surface/50 border border-muted/20 rounded-xl p-1 shrink-0 font-mono text-[10px] font-bold">
          {['7', '30', '90'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-all uppercase tracking-wider ${
                timeRange === range
                  ? 'bg-accent text-bg font-black'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {range}D
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Loading time-series database...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <Calendar className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No stats recorded for {config.name} in this timeframe.</p>
          <p className="text-xs text-text-muted/60 mt-1">Ensure metrics sync crons are running correctly.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Total Followers */}
            <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">
                Latest {config.followersLabel}
              </span>
              <span className="font-display text-4xl font-black text-white">
                {traction.latestFollowers.toLocaleString()}
              </span>
              <span className="block text-[10px] font-mono text-green-400 mt-2 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +{traction.diffFollowers.toLocaleString()} ({traction.growthPercent}%) in {timeRange}D
              </span>
            </div>

            {/* Total Views */}
            <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">
                Latest Cumulative {config.viewsLabel}
              </span>
              <span className="font-display text-4xl font-black text-white">
                {traction.latestViews.toLocaleString()}
              </span>
              <span className="block text-[10px] font-mono text-text-muted mt-2">
                +{traction.diffViews.toLocaleString()} overall change
              </span>
            </div>

            {/* Daily Avg */}
            <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">
                Daily Subscriber Velocity
              </span>
              <span className="font-display text-4xl font-black text-white">
                +{(traction.diffFollowers / parseInt(timeRange, 10)).toFixed(1)}
              </span>
              <span className="block text-[10px] font-mono text-text-muted mt-2">
                Average new followers per day
              </span>
            </div>
          </div>

          {/* Time Series Graph Viewport */}
          <div className="bg-surface border border-muted/20 rounded-[2.5rem] p-6 shadow-xl">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono mb-6 px-2">
              Time Series Analysis - Trailing {timeRange} Days
            </h3>
            <div className="h-[400px] w-full relative">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

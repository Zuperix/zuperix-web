'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Square3Stack3DIcon, 
  UsersIcon, 
  CircleStackIcon, 
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { formatBytes } from '@/lib/format';

interface OverviewStats {
  total_storage: number;
  total_assets: number;
  total_versions: number;
  total_users: number;
  active_users: number;
}

interface PerformanceData {
  date: string;
  views: string | number;
  downloads: string | number;
}

interface RecentLogin {
  id: string;
  user: {
    name: string;
    email: string;
  };
  created_at: string;
}

interface TopAsset {
  asset: {
    id: string;
    original_name: string;
    mime_type: string;
  };
  total_views: number;
  total_downloads: number;
}

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([]);
  const [topAssets, setTopAssets] = useState<TopAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewData, perfData, loginsData, topAssetsData] = await Promise.all([
          apiFetch<OverviewStats>('/admin/analytics/overview'),
          apiFetch<PerformanceData[]>('/admin/analytics/performance?days=30'),
          apiFetch<RecentLogin[]>('/admin/analytics/recent-logins?limit=5'),
          apiFetch<TopAsset[]>('/admin/analytics/top-assets?limit=5')
        ]);
        setOverview(overviewData);
        setPerformance(perfData);
        setRecentLogins(loginsData);
        setTopAssets(topAssetsData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const kpis = [
    { 
      name: 'Total Storage', 
      value: formatBytes(overview?.total_storage || 0), 
      icon: CircleStackIcon,
    },
    { 
      name: 'Total Assets', 
      value: overview?.total_assets.toLocaleString() || '0', 
      icon: Square3Stack3DIcon,
    },
    { 
      name: 'Total Users', 
      value: overview?.total_users.toLocaleString() || '0', 
      icon: UsersIcon,
    },
    { 
      name: 'Active Users (24h)', 
      value: overview?.active_users.toLocaleString() || '0', 
      icon: ArrowUpIcon,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-gray-700 transition-all">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform`}>
              <kpi.icon className="h-20 w-20" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{kpi.name}</p>
              <h3 className="mt-2 text-3xl font-bold text-white tracking-tight">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 lg:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">System Performance</h3>
              <p className="text-sm text-gray-500 mt-1">Asset views and downloads over the last 30 days</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Downloads</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performance}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#4B5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#4B5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="downloads" 
                  stroke="#6366F1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorDownloads)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Work Activity (Logins) */}
        <div className="col-span-3 lg:col-span-1 bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl flex flex-col">
          <h3 className="text-xl font-bold text-white tracking-tight mb-2">Recent Work Activity</h3>
          <p className="text-sm text-gray-500 mb-6">Latest user login sessions</p>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {recentLogins.map((login) => (
              <Link 
                key={login.id} 
                href="/admin/users"
                className="flex items-center gap-4 group hover:bg-gray-800/30 p-2 rounded-2xl transition-all block"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-950 border border-gray-700 flex items-center justify-center text-sm font-bold text-blue-400">
                  {login.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{login.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{login.user.email}</p>
                </div>
                <div className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter whitespaces-nowrap">
                  {new Date(login.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Link>
            ))}
            {recentLogins.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-600 italic text-sm">
                No recent activity logged
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Assets (Bottom Row) */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl">
        <h3 className="text-xl font-bold text-white tracking-tight mb-2">Most Popular Assets</h3>
        <p className="text-sm text-gray-500 mb-8">Assets with highest engagement across the system</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {topAssets.map((asset) => (
            <Link 
              key={asset.asset.id} 
              href={`/assets/${asset.asset.id}`}
              className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 hover:border-blue-500/50 transition-all group block"
            >
              <div className="aspect-square rounded-xl bg-gray-900 mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Square3Stack3DIcon className="h-10 w-10 text-gray-700 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-white truncate px-1">{asset.asset.original_name}</p>
              <div className="flex items-center justify-between mt-4 px-1">
                <div className="flex items-center gap-1.5">
                  <ArrowUpIcon className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-bold text-gray-400">{asset.total_views} views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowDownIcon className="h-3 w-3 text-indigo-400" />
                  <span className="text-[10px] font-bold text-gray-400">{asset.total_downloads}DL</span>
                </div>
              </div>
            </Link>
          ))}
          {topAssets.length === 0 && (
                <div className="col-span-full h-20 flex items-center justify-center text-gray-600 italic">
                    Analyzing asset popularity...
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

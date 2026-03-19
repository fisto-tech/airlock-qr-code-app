import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiBarChart2, FiTrendingUp, FiTrendingDown, FiGrid, FiActivity } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI, qrCodeAPI } from '../services/api';
import { format, subDays } from 'date-fns';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalQRCodes: 0,
    activeQRCodes: 0,
    totalScans: 0,
    recentScansData: [],
    topQRCodes: [],
  });
  const [recentQRCodes, setRecentQRCodes] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, qrCodesRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        qrCodeAPI.getAll({ limit: 5, sort: '-createdAt' }),
      ]);

      setDashboardData(dashboardRes.data.data);
      setRecentQRCodes(qrCodesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data for last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const scanData = dashboardData.recentScansData?.find(d => d._id === dateStr);
    return {
      date: format(date, 'MMM dd'),
      scans: scanData?.count || 0,
    };
  });

  const StatCard = ({ title, value, icon: Icon, change, changeType, color }) => (
    <div className="bg-white rounded-[0.75vw] p-[1.25vw] shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-[0.75vw]">
        <div className={`w-[2.75vw] h-[2.75vw] flex items-center justify-center rounded-[0.5vw]`} style={{ backgroundColor: color }}>
          <Icon className="text-white text-[1.25vw]" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-[0.25vw] text-[0.75vw] ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="text-[0.8vw] text-slate-500 mb-[0.25vw]">{title}</h3>
      <p className="text-[1.75vw] font-bold text-slate-800">{value.toLocaleString()}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-[3vw] w-[3vw]" style={{ borderBottom: '2px solid #2563eb' }} />
      </div>
    );
  }

  return (
    <div className="space-y-[1.5vw] h-full overflow-y-auto pr-1 custom-scrollbar">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-[1vw]">
        <StatCard
          title="Total QR Codes"
          value={dashboardData.totalQRCodes}
          icon={FiGrid}
          color="#3b82f6"
        />
        <StatCard
          title="Active QR Codes"
          value={dashboardData.activeQRCodes}
          icon={FiActivity}
          color="#10b981"
        />
        <StatCard
          title="Total Scans"
          value={dashboardData.totalScans}
          icon={FiBarChart2}
          change={12.5}
          changeType="up"
          color="#8b5cf6"
        />
        <StatCard
          title="This Week Scans"
          value={chartData.reduce((sum, d) => sum + d.scans, 0)}
          icon={FiTrendingUp}
          change={8.2}
          changeType="up"
          color="#f59e0b"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-[1vw]">
        {/* Scan Trends */}
        <div className="col-span-8 bg-white rounded-[0.75vw] p-[1.25vw] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-[1vw]">
            <h2 className="text-[1vw] font-semibold text-slate-800">Scan Trends</h2>
            <select className="px-[0.75vw] py-[0.4vw] text-[0.8vw] border border-slate-200 rounded-[0.4vw] focus:outline-none cursor-pointer">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[18vw]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: '0.7vw', fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: '0.7vw', fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '0.75vw',
                    borderRadius: '0.4vw',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top QR Codes */}
        <div className="col-span-4 bg-white rounded-[0.75vw] p-[1.25vw] shadow-sm border border-slate-100">
          <h2 className="text-[1vw] font-semibold text-slate-800 mb-[1vw]">Top Performing</h2>
          <div className="space-y-[0.75vw]">
            {dashboardData.topQRCodes?.slice(0, 5).map((qr, index) => (
              <div key={qr._id} className="flex items-center gap-[0.75vw]">
                <span className="w-[1.5vw] h-[1.5vw] rounded-full bg-slate-50 flex items-center justify-center text-[0.7vw] font-semibold text-slate-600">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8vw] font-medium text-slate-800 truncate">{qr.title}</p>
                  <p className="text-[0.7vw] text-slate-500">{qr.scanCount} scans</p>
                </div>
                <div
                  className="w-[4vw] h-[0.3vw] bg-slate-100 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: '#3b82f6',
                      width: `${(qr.scanCount / (dashboardData.topQRCodes[0]?.scanCount || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
            
            {dashboardData.topQRCodes?.length === 0 && (
              <div className="text-center py-[2vw] text-slate-400">
                <p className="text-[0.8vw]">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-[0.75vw] p-[1.25vw] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-[1vw]">
          <h2 className="text-[1vw] font-semibold text-slate-800">Recent Activity</h2>
          <Link
            to="/qrcodes"
            className="text-[0.8vw] text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage QR Codes →
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-[1vw]">
          {recentQRCodes.slice(0, 5).map((qr) => (
            <div
              key={qr._id}
              className="p-[0.75vw] border border-slate-100 rounded-[0.5vw] bg-slate-50/50"
            >
              <h4 className="text-[0.8vw] font-medium text-slate-800 truncate mb-1">
                {qr.title}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-[0.65vw] text-slate-400 uppercase font-semibold">{qr.type}</span>
                <span className="text-[0.7vw] font-bold text-slate-700">{qr.scanCount} scans</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { DashboardData } from '../types';
import { fetchDashboardData } from '../services/api';
import { Loader2, TrendingUp, PieChart as PieIcon, CreditCard } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">データを集計中...</p>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center space-x-2 mb-2 opacity-90">
          <CreditCard className="w-5 h-5" />
          <span className="text-sm font-medium">現在の経費総額</span>
        </div>
        <div className="text-4xl font-bold tracking-tight">
          {formatCurrency(data.totalAmount)}
        </div>
        <p className="text-sm mt-2 opacity-80">直近のデータに基づいています</p>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Monthly Trend */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-700">月次推移</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" tickFormatter={(val) => `¥${val/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <PieIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-700">勘定科目別</h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Text List */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
      >
        <h3 className="font-bold text-slate-700 mb-4">最近の登録</h3>
        <div className="space-y-3">
          {data.recentReceipts.length > 0 ? (
            data.recentReceipts.map((receipt, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="font-medium text-slate-800">{receipt.storeName}</div>
                  <div className="text-xs text-slate-500">{receipt.date} • {receipt.category}</div>
                </div>
                <div className="font-bold text-slate-700">{formatCurrency(receipt.amount)}</div>
              </div>
            ))
          ) : (
             <p className="text-slate-400 text-sm">データがありません</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
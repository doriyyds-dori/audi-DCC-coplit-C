
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis } from 'recharts';
import { SLCR_DATA, SCATTER_DATA } from '../constants';

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 h-[calc(100vh-48px)] overflow-y-auto space-y-6 bg-[#F5F4F8] custom-scrollbar">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '今日通话总数', val: '1,248', status: '↑ 12%', color: 'text-[#3F3F46]' },
          { label: '平均交互深度', val: '4.2', status: 'Optimal', color: 'text-purple-600' },
          { label: 'SLCR 转化率', val: '28.4%', status: '↑ 2%', color: 'text-emerald-600' },
          { label: '线索公海回流', val: '12', status: 'Critical', color: 'text-amber-600' }
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#E4E4E7] shadow-sm">
            <div className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">{card.label}</div>
            <div className={`text-2xl font-black ${card.color}`}>{card.val}</div>
            <div className="text-[9px] font-bold text-[#A1A1AA] mt-2 flex items-center gap-1.5 uppercase">
              <span className="w-1 h-1 bg-zinc-200 rounded-full"></span> {card.status}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 修复：添加 min-w-0 确保图表在 Grid 布局中能正确计算宽度 */}
        <div className="bg-white p-6 rounded-2xl border border-[#E4E4E7] shadow-sm min-w-0">
          <h3 className="font-bold text-sm text-[#3F3F46] mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-600 rounded-full"></span> 归因分析：交互深度 vs 转化
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
                <XAxis dataKey="x" stroke="#A1A1AA" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="y" stroke="#A1A1AA" fontSize={10} axisLine={false} tickLine={false} />
                <ZAxis dataKey="z" range={[50, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Scatter data={SCATTER_DATA} fill="#9333EA" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E4E4E7] shadow-sm min-w-0">
          <h3 className="font-bold text-sm text-[#3F3F46] mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span> 顾问 SLCR 效能排名
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={SLCR_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#A1A1AA" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#3F3F46" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

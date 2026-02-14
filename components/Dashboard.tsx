import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { SLCR_DATA, SCATTER_DATA } from '../constants';

const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs min-w-[150px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-gray-100 pb-1">{data.name}</p>
        <div className="space-y-1.5">
          <p className="text-slate-600 flex justify-between gap-4">
            <span>交互深度:</span> 
            <span className="font-mono font-bold">{data.x} 次</span>
          </p>
          <p className="text-slate-600 flex justify-between gap-4">
            <span>预约转化:</span> 
            <span className="font-mono font-bold text-red-600">{data.y}%</span>
          </p>
          <p className="text-slate-500 flex justify-between gap-4 pt-1 border-t border-dashed border-gray-100">
            <span>参与度评分:</span> 
            <span className="font-mono">{data.z}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs min-w-[120px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-gray-100 pb-1">{data.name}</p>
        <div className="flex flex-col gap-1">
          <span className="text-gray-500">SLCR 转化率</span>
          <span className="text-indigo-600 font-bold text-lg leading-none">{data.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 h-[calc(100vh-100px)] overflow-y-auto pr-2">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-sm">
          <div className="text-slate-400 text-xs font-bold uppercase mb-1">今日通话总数</div>
          <div className="text-3xl font-bold">1,248</div>
          <div className="text-green-400 text-xs mt-2 flex items-center">
            ↑ 12% 较上周
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">平均交互深度</div>
          <div className="text-3xl font-bold text-slate-800">4.2</div>
          <div className="text-xs text-gray-400 mt-2">每通点击次数</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">SLCR 转化率</div>
          <div className="text-3xl font-bold text-indigo-600">28%</div>
          <div className="text-xs text-gray-400 mt-2">话术转链接</div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">陪练通过率</div>
          <div className="text-3xl font-bold text-red-600">65%</div>
          <div className="text-xs text-gray-400 mt-2">12人待考核</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interaction vs Result Attribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
          <h3 className="font-bold text-slate-800 mb-4">归因分析：交互深度 vs 结果</h3>
          <p className="text-xs text-gray-500 mb-6">工具使用率高的顾问是否获得了更多预约？</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="交互深度" unit=" 点击" />
                <YAxis type="number" dataKey="y" name="预约率" unit="%" />
                <ZAxis type="number" dataKey="z" range={[100, 500]} name="量" />
                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="顾问" data={SCATTER_DATA} fill="#DC2626" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLCR Leaderboard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
          <h3 className="font-bold text-slate-800 mb-4">SLCR 排行榜 (链接转化)</h3>
           <p className="text-xs text-gray-500 mb-6">“信任建立”的代理指标</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SLCR_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip content={<CustomBarTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
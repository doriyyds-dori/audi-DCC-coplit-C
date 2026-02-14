import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, MessageSquareText, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white px-3 py-1 font-bold text-lg tracking-widest rounded-sm">
            AUDI
          </div>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <span className="font-semibold text-gray-700">E5 发布辅助助手</span>
        </div>

        <nav className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => onChangeView(ViewState.COPILOT)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentView === ViewState.COPILOT 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquareText size={18} />
            销售执行辅助
          </button>
          <button
            onClick={() => onChangeView(ViewState.DOJO)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentView === ViewState.DOJO 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck size={18} />
            AI 角色陪练
          </button>
          <button
            onClick={() => onChangeView(ViewState.DASHBOARD)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentView === ViewState.DASHBOARD 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard size={18} />
            数据洞察
          </button>
        </nav>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              系统就绪
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
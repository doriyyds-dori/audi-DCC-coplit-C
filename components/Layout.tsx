
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, MessageSquareText, Cpu } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F8]">
      {/* Light Premium Header - Replacing dark background with mist white/white */}
      <header className="bg-white border-b border-[#E4E4E7] h-12 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="font-black text-lg tracking-[0.3em] text-[#18181B]">
            AUDI
          </div>
          <div className="h-4 w-[1px] bg-[#E4E4E7]"></div>
          <div className="flex items-center gap-2 text-[#71717A] text-[10px] font-bold tracking-[0.2em] uppercase">
            <Cpu size={12} className="text-purple-600/60" />
            DCC Copilot <span className="text-[#E4E4E7]">|</span> 2.0.4
          </div>
        </div>

        <nav className="flex items-center gap-1 p-1 bg-[#F4F4F5] rounded-lg">
          <button
            onClick={() => onChangeView(ViewState.COPILOT)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              currentView === ViewState.COPILOT 
                ? 'bg-white text-[#18181B] shadow-sm' 
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <MessageSquareText size={14} />
            销售辅助
          </button>
          <button
            onClick={() => onChangeView(ViewState.DASHBOARD)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              currentView === ViewState.DASHBOARD 
                ? 'bg-white text-[#18181B] shadow-sm' 
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <LayoutDashboard size={14} />
            数据看板
          </button>
        </nav>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-[#F4F4F5] rounded-full text-[9px] font-mono text-[#71717A] border border-[#E4E4E7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              CORE_SYNC
           </div>
        </div>
      </header>

      {/* Main Content with misty background */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;

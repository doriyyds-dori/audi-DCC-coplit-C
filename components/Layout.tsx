import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, MessageSquareText, Cpu, ShieldCheck } from 'lucide-react';
import { SessionUser } from '../services/authService';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
  user: SessionUser;
  onLogout: () => void;
  onChangePassword: () => void;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children, user, onLogout, onChangePassword }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F8]">
      <header className="bg-white border-b border-[#E4E4E7] h-12 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="font-black text-lg tracking-[0.3em] text-[#18181B]">AUDI</div>
          <div className="h-4 w-[1px] bg-[#E4E4E7]"></div>
          <div className="flex items-center gap-2 text-[#71717A] text-[10px] font-bold tracking-[0.2em] uppercase">
            <Cpu size={12} className="text-purple-600/60" />DCC Copilot
          </div>
        </div>

        <nav className="flex items-center gap-1 p-1 bg-[#F4F4F5] rounded-lg">
          <button onClick={() => onChangeView(ViewState.COPILOT)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold ${currentView === ViewState.COPILOT ? 'bg-white' : ''}`}><MessageSquareText size={14} className="inline mr-1"/>销售辅助</button>
          <button onClick={() => onChangeView(ViewState.DASHBOARD)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold ${currentView === ViewState.DASHBOARD ? 'bg-white' : ''}`}><LayoutDashboard size={14} className="inline mr-1"/>数据看板</button>
          {user.role === 'SUPER_ADMIN' && <button onClick={() => onChangeView(ViewState.ADMIN)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold ${currentView === ViewState.ADMIN ? 'bg-white' : ''}`}><ShieldCheck size={14} className="inline mr-1"/>用户管理</button>}
        </nav>

        <div className="flex items-center gap-2 text-xs">
          <span>{user.username}</span>
          <button onClick={onChangePassword} className="px-2 py-1 border rounded">修改密码</button>
          <button onClick={onLogout} className="px-2 py-1 border rounded">退出</button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default Layout;

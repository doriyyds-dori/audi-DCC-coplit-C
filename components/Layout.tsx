import React from 'react';
import { ViewState } from '../types';
import { Mic2 } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium border border-red-200">
            手动触发模式
          </span>
        </div>

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
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Copilot from './components/Copilot';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { ViewState } from './types';
import { changePassword, getCurrentSession, initAuthSystem, login, logout, SessionUser } from './services/authService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.COPILOT);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    initAuthSystem();
    setUser(getCurrentSession());
  }, []);

  if (!user) {
    return <Login onLogin={(u, p) => {
      try { setUser(login(u, p)); } catch (e: any) { alert(e.message); }
    }} />;
  }

  const handlePasswordChange = () => {
    const oldPwd = prompt('请输入当前密码');
    if (!oldPwd) return;
    const newPwd = prompt('请输入新密码');
    if (!newPwd) return;
    try {
      changePassword(user.username, oldPwd, newPwd);
      const latest = getCurrentSession();
      if (latest) setUser(latest);
      alert('密码修改成功');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <Layout
      currentView={currentView}
      onChangeView={setCurrentView}
      user={user}
      onLogout={() => { logout(); setUser(null); }}
      onChangePassword={handlePasswordChange}
    >
      {currentView === ViewState.COPILOT && <Copilot currentUser={user} />}
      {currentView === ViewState.DASHBOARD && <Dashboard />}
      {currentView === ViewState.ADMIN && user.role === 'SUPER_ADMIN' && <AdminPanel />}
    </Layout>
  );
};

export default App;

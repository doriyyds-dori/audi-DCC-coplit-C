import React, { useState } from 'react';

interface Props {
  onLogin: (username: string, password: string) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F8]">
      <div className="w-[380px] bg-white rounded-2xl shadow p-6 space-y-4 border border-[#E4E4E7]">
        <h1 className="text-xl font-black">系统登录</h1>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" className="w-full border rounded-lg px-3 py-2" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" className="w-full border rounded-lg px-3 py-2" />
        <button className="w-full py-2 bg-black text-white rounded-lg" onClick={() => onLogin(username, password)}>登录</button>
        <p className="text-xs text-gray-500">超级管理员：SAR3 / SAR3_2026</p>
      </div>
    </div>
  );
};

export default Login;

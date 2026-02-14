import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("%c 🚀 [AUDI CORE] System ignition sequence started... ", "background: #000; color: #fff; font-weight: bold; padding: 4px;");

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);
  
  // 渲染应用
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // 渲染完成后移除加载动画（如果有的话）
  const loader = document.getElementById('initial-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => loader.remove(), 500);
    }, 300);
  }

  console.log("%c ✅ [AUDI CORE] UI Engine mounted and running ", "color: #10b981; font-weight:
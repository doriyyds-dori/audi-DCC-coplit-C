import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 Audi E5 Copilot: 应用启动中...");

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("❌ 错误：未找到 id 为 'root' 的挂载点");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ Audi E5 Copilot: 挂载成功");
  } catch (error) {
    console.error("❌ Audi E5 Copilot: 渲染过程中出错:", error);
  }
};

// 确保 DOM 加载完成后再执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
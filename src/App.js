import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 页面组件
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Transactions from './pages/Transactions';
import Clients from './pages/Clients';
import Calendar from './pages/Calendar';
import Invoices from './pages/Invoices';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import AIFeatures from './pages/AIFeatures';

// 样式
import './styles/global.css';
import './styles/layout.css';

function App() {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // 监听菜单事件
    if (window.electronAPI) {
      window.electronAPI.onMenuBackup(async () => {
        const result = await window.electronAPI.backupData();
        if (result.success) {
          toast.success('数据备份成功！');
        } else if (!result.canceled) {
          toast.error('备份失败：' + result.error);
        }
      });

      window.electronAPI.onMenuRestore(async () => {
        if (window.confirm('恢复数据将覆盖当前所有数据，是否继续？')) {
          const result = await window.electronAPI.restoreData();
          if (result.success) {
            toast.success('数据恢复成功！请刷新页面。');
            window.location.reload();
          } else if (!result.canceled) {
            toast.error('恢复失败：' + result.error);
          }
        }
      });
    }
  }, []);

  return (
    <div className="app-container">
      {/* 顶部导航栏 */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">📷</span>
            <span className="logo-text">PhotoStudio Pro</span>
          </div>
        </div>
        <nav className="header-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📊</span>
            <span>首页看板</span>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📁</span>
            <span>项目管理</span>
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">💰</span>
            <span>收支管理</span>
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">👥</span>
            <span>客户管理</span>
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📅</span>
            <span>档期日历</span>
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">🧾</span>
            <span>发票管理</span>
          </NavLink>
          <NavLink to="/statistics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📈</span>
            <span>统计分析</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">⚙️</span>
            <span>设置</span>
          </NavLink>
        </nav>
        <div className="header-right">
          <button className="ai-toggle-btn" onClick={() => setAiPanelOpen(!aiPanelOpen)}>
            <span className="ai-icon">🤖</span>
            <span>AI助手</span>
            {aiPanelOpen && <span className="toggle-indicator">▼</span>}
            {!aiPanelOpen && <span className="toggle-indicator">▲</span>}
          </button>
        </div>
      </header>

      {/* 主体内容区 */}
      <div className={`app-main ${aiPanelOpen ? 'ai-open' : ''}`}>
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard aiPanelOpen={aiPanelOpen} />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/ai-features" element={<AIFeatures />} />
          </Routes>
        </main>

        {/* AI助手面板 */}
        {aiPanelOpen && location.pathname === '/' && (
          <aside className="ai-panel">
            <AIFeatures embedded={true} />
          </aside>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;

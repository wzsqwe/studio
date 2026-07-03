import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAPI } from './utils/api';

initAPI().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<React.StrictMode><App /></React.StrictMode>);
}).catch(e => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<React.StrictMode>
    <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <h1>数据库初始化失败</h1>
      <p>请检查浏览器是否支持 IndexedDB</p>
      <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>{e.message}</p>
    </div>
  </React.StrictMode>);
});
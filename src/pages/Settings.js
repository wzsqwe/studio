import { useState, useEffect } from 'react';
import { restoreDataFromScreenshots } from '../utils/importData';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const result = await window.electronAPI.getSettings();
    if (result.success) setSettings(result.data);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await window.electronAPI.saveSettings(settings);
    setMessage('设置已保存');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBackup = async () => {
    await window.electronAPI.backupData();
    setMessage('备份已下载');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRestore = async () => {
    const result = await window.electronAPI.restoreData();
    if (result.success) setMessage('数据恢复成功');
    else if (!result.canceled) setMessage('恢复失败: ' + result.error);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRestoreFromScreenshots = async () => {
    if (!confirm('此操作将覆盖现有数据，确定继续？')) return;
    const result = await restoreDataFromScreenshots();
    if (result.success) setMessage(result.message);
    else setMessage('恢复失败: ' + result.error);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <div className="page-header"><h2>系统设置</h2></div>
      {message && <div className="card" style={{ background: '#dcfce7', color: '#16a34a', textAlign: 'center' }}>{message}</div>}
      <div className="card">
        <h3 className="card-title">数据管理</h3>
        <button className="btn btn-primary" onClick={handleBackup} style={{ marginRight: '10px', marginBottom: '10px' }}>导出数据备份</button>
        <button className="btn btn-secondary" onClick={handleRestore} style={{ marginRight: '10px', marginBottom: '10px' }}>从备份恢复数据</button>
        <button className="btn btn-secondary" onClick={handleRestoreFromScreenshots} style={{ marginBottom: '10px' }}>从截图恢复数据</button>
      </div>
      <div className="card">
        <h3 className="card-title">应用设置</h3>
        <form onSubmit={handleSaveSettings}>
          <div className="form-group"><label>工作室名称</label><input type="text" value={settings.studioName || ''} onChange={(e) => setSettings({ ...settings, studioName: e.target.value })} /></div>
          <div className="form-group"><label>联系方式</label><input type="text" value={settings.contact || ''} onChange={(e) => setSettings({ ...settings, contact: e.target.value })} /></div>
          <div className="form-group"><label>备注</label><textarea value={settings.notes || ''} onChange={(e) => setSettings({ ...settings, notes: e.target.value })} /></div>
          <button className="btn btn-primary" type="submit">保存设置</button>
        </form>
      </div>
    </div>
  );
}
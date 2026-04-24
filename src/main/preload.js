const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbGetAll: (table) => ipcRenderer.invoke('db-get-all', table),
  dbInsert: (table, data) => ipcRenderer.invoke('db-insert', table, data),
  dbUpdate: (table, data, whereClause, whereParams) => ipcRenderer.invoke('db-update', table, data, whereClause, whereParams),
  dbDelete: (table, whereClause, whereParams) => ipcRenderer.invoke('db-delete', table, whereClause, whereParams),

  // 业务数据接口
  getDashboardData: () => ipcRenderer.invoke('get-dashboard-data'),
  getProjects: (filters) => ipcRenderer.invoke('get-projects', filters),
  createProject: (data) => ipcRenderer.invoke('create-project', data),
  updateProject: (id, data) => ipcRenderer.invoke('update-project', id, data),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),
  getClients: () => ipcRenderer.invoke('get-clients'),
  getTransactions: (filters) => ipcRenderer.invoke('get-transactions', filters),
  getStatistics: (period) => ipcRenderer.invoke('get-statistics', period),
  getSchedules: (year, month) => ipcRenderer.invoke('get-schedules', year, month),
  getInvoices: () => ipcRenderer.invoke('get-invoices'),
  getEquipment: () => ipcRenderer.invoke('get-equipment'),
  getFixedCosts: () => ipcRenderer.invoke('get-fixed-costs'),

  // 数据备份恢复
  backupData: () => ipcRenderer.invoke('backup-data'),
  restoreData: () => ipcRenderer.invoke('restore-data'),

  // 菜单事件监听
  onMenuBackup: (callback) => ipcRenderer.on('menu-backup', callback),
  onMenuRestore: (callback) => ipcRenderer.on('menu-restore', callback)
});

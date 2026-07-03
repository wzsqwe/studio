import { initDB, dbInsert, dbUpdate, dbDelete, dbGetAll, dbGet, dbQuery, dbClear } from './db';

const API = {
  init: async () => { await initDB(); },
  dbInsert: async (table, data) => {
    try { const r = await dbInsert(table, data); return { success: true, data: r }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  dbUpdate: async (table, data, condition, params) => {
    try { const r = await dbUpdate(table, data, condition, params); return { success: true, data: r }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  dbDelete: async (table, condition, params) => {
    try { const r = await dbDelete(table, condition, params); return { success: true, data: r }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  dbGetAll: async (table) => {
    try { const r = await dbGetAll(table); return { success: true, data: r }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  dbGet: async (table, condition, params) => {
    try { const r = await dbGet(table, condition, params); return { success: true, data: r }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  dbQuery: async (table, options) => {
    try { const r = await dbQuery(table, options); return { success: true, data: r }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  getDashboardData: async () => {
    try {
      const [projects, transactions, clients] = await Promise.all([dbGetAll('projects'), dbGetAll('transactions'), dbGetAll('clients')]);
      const today = new Date();
      const currMonth = today.toISOString().slice(0, 7);
      const currYear = today.getFullYear().toString();
      const monthTxns = transactions.filter(t => t.date?.startsWith(currMonth));
      const yearTxns = transactions.filter(t => t.date?.startsWith(currYear));
      const monthIncome = monthTxns.filter(t => t.type === '收入').reduce((s, t) => s + t.amount, 0);
      const monthExpense = monthTxns.filter(t => t.type === '支出').reduce((s, t) => s + t.amount, 0);
      const yearIncome = yearTxns.filter(t => t.type === '收入').reduce((s, t) => s + t.amount, 0);
      const yearExpense = yearTxns.filter(t => t.type === '支出').reduce((s, t) => s + t.amount, 0);
      const completedProjects = projects.filter(p => p.status === '已完结').length;
      const pendingPayment = projects.reduce((sum, p) => {
        const paid = (p.paymentNodes || []).filter(n => n.status === '已收款').reduce((s, n) => s + n.amount, 0);
        return sum + Math.max(0, (p.total_amount || 0) - paid);
      }, 0);
      const avgProjectPrice = projects.length ? projects.reduce((s, p) => s + (p.total_amount || 0), 0) / projects.length : 0;
      const avgProfitRate = projects.length ? projects.reduce((s, p) => s + (p.profit_rate || 0), 0) / projects.length : 0;
      const overdueProjects = projects.filter(p => p.delivery_deadline && new Date(p.delivery_deadline) < today && p.status !== '已完结');
      const profitRanking = projects.filter(p => p.profit_rate !== undefined).sort((a, b) => (b.profit_rate || 0) - (a.profit_rate || 0)).slice(0, 5);
      const costMap = {};
      transactions.filter(t => t.type === '支出').forEach(t => { costMap[t.category || '其他'] = (costMap[t.category || '其他'] || 0) + t.amount; });
      const costBreakdown = Object.keys(costMap).map(cat => ({ category: cat, total: costMap[cat] })).sort((a, b) => b.total - a.total);
      const sixMonthData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const month = d.toISOString().slice(0, 7);
        const mTxns = transactions.filter(t => t.date?.startsWith(month));
        sixMonthData.push({ month: month.slice(5), income: mTxns.filter(t => t.type === '收入').reduce((s, t) => s + t.amount, 0), profit: mTxns.filter(t => t.type === '收入').reduce((s, t) => s + t.amount, 0) - mTxns.filter(t => t.type === '支出').reduce((s, t) => s + t.amount, 0) });
      }
      const typeIncome = {};
      projects.forEach(p => { typeIncome[p.type] = (typeIncome[p.type] || 0) + (p.total_amount || 0); });
      return { success: true, data: {
        projectCount: projects.length, clientCount: clients.length, completedProjects, pendingPayment, avgProjectPrice, avgProfitRate,
        monthIncome, monthExpense, monthProfit: monthIncome - monthExpense,
        yearIncome, yearExpense, yearProfit: yearIncome - yearExpense,
        totalIncome: yearIncome, totalExpense: yearExpense, netProfit: yearIncome - yearExpense,
        avgProjectAmount: avgProjectPrice, monthlyFixedCost: 0,
        profitRanking, costBreakdown, overdueProjects, paymentAnalysis: { overdue_nodes: overdueProjects.length },
        sixMonthData, typeIncome: Object.keys(typeIncome).map(type => ({ type, total: typeIncome[type] }))
      }};
    } catch (e) { return { success: false, error: e.message }; }
  },
  getProjects: async (filters = {}) => {
    try {
      let projects = await dbGetAll('projects');
      if (filters.status) projects = projects.filter(p => p.status === filters.status);
      if (filters.type) projects = projects.filter(p => p.type === filters.type);
      if (filters.client_id) projects = projects.filter(p => p.client_id === filters.client_id);
      if (filters.search) {
        const sl = filters.search.toLowerCase();
        projects = projects.filter(p => p.name.toLowerCase().includes(sl) || (p.client_name && p.client_name.toLowerCase().includes(sl)));
      }
      if (filters.sortBy === 'date') projects.sort((a, b) => new Date(b.order_date || '') - new Date(a.order_date || ''));
      else if (filters.sortBy === 'amount') projects.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
      else if (filters.sortBy === 'profit') projects.sort((a, b) => (b.profit_rate || 0) - (a.profit_rate || 0));
      return { success: true, data: projects };
    } catch (e) { return { success: false, error: e.message }; }
  },
  getClients: async () => { try { return { success: true, data: await dbGetAll('clients') }; } catch (e) { return { success: false, error: e.message }; } },
  getTransactions: async (filters = {}) => {
    try {
      let txns = await dbGetAll('transactions');
      if (filters.type) txns = txns.filter(t => t.type === filters.type);
      if (filters.category) txns = txns.filter(t => t.category === filters.category);
      if (filters.startDate) txns = txns.filter(t => t.date >= filters.startDate);
      if (filters.endDate) txns = txns.filter(t => t.date <= filters.endDate);
      txns.sort((a, b) => new Date(b.date || '') - new Date(a.date || ''));
      return { success: true, data: txns };
    } catch (e) { return { success: false, error: e.message }; }
  },
  getCalendarEvents: async (month) => {
    try {
      const projects = await dbGetAll('projects');
      const events = [];
      projects.forEach(p => {
        if (p.shoot_date?.startsWith(month)) events.push({ id: p.id, title: p.name, date: p.shoot_date, type: 'project', project_id: p.id, status: p.status });
        if (p.delivery_deadline?.startsWith(month)) events.push({ id: `deadline_${p.id}`, title: `${p.name} - 交付截止`, date: p.delivery_deadline, type: 'deadline', project_id: p.id, status: p.status });
      });
      return { success: true, data: events };
    } catch (e) { return { success: false, error: e.message }; }
  },
  getInvoices: async () => {
    try {
      const projects = await dbGetAll('projects');
      const invoices = projects.filter(p => p.total_amount > 0 && p.status !== '待确认').map(p => ({
        id: p.id, project_id: p.id, project_name: p.name, client_name: p.client_name || '',
        amount: p.total_amount, issue_date: p.order_date, due_date: p.delivery_deadline,
        status: p.status === '已完结' ? '已完成' : '待完成',
        paid_amount: (p.paymentNodes || []).filter(n => n.status === '已收款').reduce((s, n) => s + n.amount, 0),
        profit: p.profit || 0, profit_rate: p.profit_rate || 0
      }));
      return { success: true, data: invoices };
    } catch (e) { return { success: false, error: e.message }; }
  },
  getStatistics: async (period = 'month') => {
    try {
      const [projects, transactions] = await Promise.all([dbGetAll('projects'), dbGetAll('transactions')]);
      const today = new Date();
      let startDate, endDate;
      if (period === 'month') { startDate = today.toISOString().slice(0, 7) + '-01'; endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10); }
      else if (period === 'quarter') { const q = Math.floor(today.getMonth() / 3); startDate = new Date(today.getFullYear(), q * 3, 1).toISOString().slice(0, 10); endDate = new Date(today.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10); }
      else { startDate = today.getFullYear() + '-01-01'; endDate = today.getFullYear() + '-12-31'; }
      const periodProjects = projects.filter(p => p.order_date && p.order_date >= startDate && p.order_date <= endDate);
      const periodTxns = transactions.filter(t => t.date && t.date >= startDate && t.date <= endDate);
      const income = periodTxns.filter(t => t.type === '收入').reduce((s, t) => s + t.amount, 0);
      const expense = periodTxns.filter(t => t.type === '支出').reduce((s, t) => s + t.amount, 0);
      const profit = income - expense;
      const projectTypes = {};
      periodProjects.forEach(p => { projectTypes[p.type] = (projectTypes[p.type] || 0) + 1; });
      const monthlyData = [];
      for (let i = 0; i < 12; i++) {
        const month = new Date(today.getFullYear(), i, 1).toISOString().slice(0, 7);
        const mProjects = projects.filter(p => p.order_date?.startsWith(month));
        const mTxns = transactions.filter(t => t.date?.startsWith(month));
        monthlyData.push({ month: month.slice(5), projects: mProjects.length, income: mTxns.filter(t => t.type === '收入').reduce((s, t) => s + t.amount, 0), expense: mTxns.filter(t => t.type === '支出').reduce((s, t) => s + t.amount, 0) });
      }
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weeklyData = [];
      for (let i = 0; i < 7; i++) {
        const dProjects = periodProjects.filter(p => new Date(p.shoot_date || p.order_date).getDay() === i);
        const dIncome = periodTxns.filter(t => new Date(t.date).getDay() === i && t.type === '收入').reduce((s, t) => s + t.amount, 0);
        weeklyData.push({ day: weekDays[i], projects: dProjects.length, income: dIncome });
      }
      return { success: true, data: {
        period, totalProjects: periodProjects.length, totalIncome: income, totalExpense: expense, profit,
        profitRate: income > 0 ? (profit / income) * 100 : 0,
        avgProjectAmount: periodProjects.length ? periodProjects.reduce((s, p) => s + (p.total_amount || 0), 0) / periodProjects.length : 0,
        avgProfitRate: periodProjects.length ? periodProjects.reduce((s, p) => s + (p.profit_rate || 0), 0) / periodProjects.length : 0,
        projectTypes, monthlyData, weeklyData,
        completedProjects: periodProjects.filter(p => p.status === '已完结').length,
        pendingProjects: periodProjects.filter(p => p.status !== '已完结').length
      }};
    } catch (e) { return { success: false, error: e.message }; }
  },
  getSettings: async () => {
    try { const settings = await dbGetAll('settings'); const obj = {}; settings.forEach(s => { obj[s.key] = s.value; }); return { success: true, data: obj }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  saveSettings: async (settings) => {
    try { for (const [k, v] of Object.entries(settings)) await dbInsert('settings', { key: k, value: v, updated_at: new Date().toISOString() }); return { success: true }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  getFixedCosts: async () => { try { return { success: true, data: await dbGetAll('fixed_cost_configs') }; } catch (e) { return { success: false, error: e.message }; } },
  getEquipment: async () => { try { return { success: true, data: await dbGetAll('equipment') }; } catch (e) { return { success: false, error: e.message }; } },
  getProjectById: async (id) => {
    try { const projects = await dbGetAll('projects'); return { success: true, data: projects.find(p => p.id === id) || null }; }
    catch (e) { return { success: false, error: e.message }; }
  },
  backupData: async () => {
    try {
      const data = {};
      for (const table of ['clients', 'projects', 'transactions', 'invoices', 'settings', 'fixed_cost_configs', 'equipment']) data[table] = await dbGetAll(table);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photostudio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  },
  restoreData: async () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) { resolve({ success: false, canceled: true }); return; }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          for (const table of ['clients', 'projects', 'transactions', 'invoices', 'settings', 'fixed_cost_configs', 'equipment']) {
            if (data[table]) { await dbClear(table); for (const item of data[table]) await dbInsert(table, item); }
          }
          resolve({ success: true });
        } catch (e) { resolve({ success: false, error: e.message }); }
      };
      input.click();
    });
  },
  onMenuBackup: (cb) => { window.addEventListener('backup', cb); },
  onMenuRestore: (cb) => { window.addEventListener('restore', cb); }
};

export const initAPI = async () => { await API.init(); window.electronAPI = API; return API; };
export default API;
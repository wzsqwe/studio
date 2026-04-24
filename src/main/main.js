const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const log = require('electron-log');

// 配置日志
log.transports.file.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024;

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason);
});

let mainWindow;
let db;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 初始化数据库
function initDatabase() {
  const Database = require('better-sqlite3');
  const dbPath = path.join(app.getPath('userData'), 'photostudio.db');
  log.info('Database path:', dbPath);
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // 创建表结构
  db.exec(`
    -- 客户表
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      type TEXT DEFAULT '个人客户',
      tags TEXT,
      contact_person TEXT,
      is_blacklist INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 项目表
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT '商业广告拍摄',
      tags TEXT,
      client_id TEXT,
      order_date TEXT,
      shoot_date TEXT,
      delivery_deadline TEXT,
      status TEXT DEFAULT '待确认',
      total_amount REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      profit_rate REAL DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      notes TEXT,
      attachments TEXT,
      delivery_record TEXT,
      client_feedback TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    -- 收款节点表
    CREATE TABLE IF NOT EXISTS payment_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      node_name TEXT,
      amount REAL DEFAULT 0,
      due_date TEXT,
      actual_date TEXT,
      status TEXT DEFAULT '待收款',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    -- 成本明细表
    CREATE TABLE IF NOT EXISTS costs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL DEFAULT 0,
      date TEXT,
      is_fixed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    -- 收支流水表
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      project_id TEXT,
      description TEXT,
      attachments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    -- 发票表
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      amount REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      invoice_type TEXT DEFAULT '增值税普通发票',
      billing_date TEXT NOT NULL,
      recipient_name TEXT,
      recipient_info TEXT,
      file_path TEXT,
      status TEXT DEFAULT '已开票',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    -- 档期表
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      location TEXT,
      notes TEXT,
      unavailable INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    -- 器材表
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      purchase_price REAL DEFAULT 0,
      purchase_date TEXT,
      useful_years INTEGER DEFAULT 5,
      monthly_depreciation REAL DEFAULT 0,
      status TEXT DEFAULT '在用',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 提醒表
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_id TEXT,
      remind_date TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 固定成本配置表
    CREATE TABLE IF NOT EXISTS fixed_cost_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL DEFAULT 0,
      frequency TEXT DEFAULT 'monthly',
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 客户跟进记录表
    CREATE TABLE IF NOT EXISTS client_followups (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      followup_date TEXT NOT NULL,
      content TEXT NOT NULL,
      next_followup_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    -- 操作日志表
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      target_name TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 项目模板表
    CREATE TABLE IF NOT EXISTS project_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      payment_nodes TEXT,
      cost_categories TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- AI对话历史表
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 系统设置表
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // 插入默认固定成本配置
  const defaultFixedCosts = [
    { name: 'Adobe Creative Cloud', category: '软件订阅', amount: 588, frequency: 'yearly' },
    { name: '达芬奇订阅', category: '软件订阅', amount: 268, frequency: 'yearly' },
    { name: '器材保险', category: '器材保险', amount: 2000, frequency: 'yearly' },
    { name: '网络通讯费', category: '通讯网络', amount: 150, frequency: 'monthly' },
  ];

  const insertFixedCost = db.prepare(`
    INSERT OR IGNORE INTO fixed_cost_configs (id, name, category, amount, frequency)
    VALUES (?, ?, ?, ?, ?)
  `);

  defaultFixedCosts.forEach((item, index) => {
    insertFixedCost.run(
      `fixed_${index + 1}`,
      item.name,
      item.category,
      item.amount,
      item.frequency
    );
  });

  log.info('Database initialized successfully');
  return db;
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : true,
    backgroundColor: '#0f172a'
  });

  // 创建应用菜单
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        { label: '备份数据', click: () => mainWindow.webContents.send('menu-backup') },
        { label: '恢复数据', click: () => mainWindow.webContents.send('menu-restore') },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '关于 PhotoStudio Pro',
            message: 'PhotoStudio Pro v1.0.0',
            detail: '自由摄影师全流程经营管理系统\n专为独立摄影师打造的轻量化经营管理工具'
          });
        }}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log.info('Main window created');
}

// 导出数据库给渲染进程使用
function setupIpcHandlers() {
  // 通用查询
  ipcMain.handle('db-query', (event, sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return { success: true, data: stmt.all(...params) };
      } else {
        const result = stmt.run(...params);
        return { success: true, data: result };
      }
    } catch (error) {
      log.error('Database query error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取所有数据
  ipcMain.handle('db-get-all', (event, table) => {
    try {
      const stmt = db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`);
      return { success: true, data: stmt.all() };
    } catch (error) {
      log.error('Database get all error:', error);
      return { success: false, error: error.message };
    }
  });

  // 插入数据
  ipcMain.handle('db-insert', (event, table, data) => {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);
      return { success: true, data: { lastInsertRowid: result.lastInsertRowid, changes: result.changes } };
    } catch (error) {
      log.error('Database insert error:', error);
      return { success: false, error: error.message };
    }
  });

  // 更新数据
  ipcMain.handle('db-update', (event, table, data, whereClause, whereParams = []) => {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const sql = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClause}`;
      const stmt = db.prepare(sql);
      const result = stmt.run(...values, ...whereParams);
      return { success: true, data: { changes: result.changes } };
    } catch (error) {
      log.error('Database update error:', error);
      return { success: false, error: error.message };
    }
  });

  // 删除数据
  ipcMain.handle('db-delete', (event, table, whereClause, whereParams = []) => {
    try {
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      const stmt = db.prepare(sql);
      const result = stmt.run(...whereParams);
      return { success: true, data: { changes: result.changes } };
    } catch (error) {
      log.error('Database delete error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取看板数据
  ipcMain.handle('get-dashboard-data', () => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentYear = String(now.getFullYear());

      // 本月总收入
      const monthIncomeSql = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE type = '收入' AND date LIKE '${currentMonth}%'
      `;
      const monthIncome = db.prepare(monthIncomeSql).get().total;

      // 本月变动成本
      const monthCostSql = `
        SELECT COALESCE(SUM(c.total_cost), 0) as total 
        FROM projects p
        LEFT JOIN (
          SELECT project_id, SUM(amount) as total_cost FROM costs WHERE project_id IS NOT NULL GROUP BY project_id
        ) c ON p.id = c.project_id
        WHERE p.shoot_date LIKE '${currentMonth}%'
      `;
      const monthCost = db.prepare(monthCostSql).get().total;

      // 本月固定成本分摊
      const fixedCostSql = `SELECT COALESCE(SUM(
        CASE WHEN frequency = 'yearly' THEN amount / 12 ELSE amount END
      ), 0) as total FROM fixed_cost_configs WHERE is_active = 1`;
      const monthlyFixedCost = db.prepare(fixedCostSql).get().total;

      // 本月总利润
      const monthProfit = monthIncome - monthCost - monthlyFixedCost;

      // 本月完结项目数
      const completedProjectsSql = `
        SELECT COUNT(*) as count FROM projects 
        WHERE status = '已完结' AND updated_at LIKE '${currentMonth}%'
      `;
      const completedProjects = db.prepare(completedProjectsSql).get().count;

      // 待回款总金额
      const pendingPaymentSql = `
        SELECT COALESCE(SUM(pn.amount), 0) as total 
        FROM payment_nodes pn
        JOIN projects p ON pn.project_id = p.id
        WHERE pn.status != '已收款'
      `;
      const pendingPayment = db.prepare(pendingPaymentSql).get().total;

      // 本年累计总收入
      const yearIncomeSql = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE type = '收入' AND date LIKE '${currentYear}%'
      `;
      const yearIncome = db.prepare(yearIncomeSql).get().total;

      // 本年累计总成本
      const yearCostSql = `
        SELECT COALESCE(SUM(total_cost), 0) as total FROM projects WHERE shoot_date LIKE '${currentYear}%'
      `;
      const yearCost = db.prepare(yearCostSql).get().total;

      // 本年累计固定成本
      const yearFixedCost = monthlyFixedCost * (now.getMonth() + 1);

      // 本年累计总利润
      const yearProfit = yearIncome - yearCost - yearFixedCost;

      // 平均项目客单价
      const avgPriceSql = `SELECT COALESCE(AVG(total_amount), 0) as avg FROM projects WHERE total_amount > 0`;
      const avgProjectPrice = db.prepare(avgPriceSql).get().avg;

      // 平均项目利润率
      const avgProfitRateSql = `SELECT COALESCE(AVG(profit_rate), 0) as avg FROM projects WHERE total_amount > 0`;
      const avgProfitRate = db.prepare(avgProfitRateSql).get().avg;

      // 近6个月收入利润数据
      const sixMonthData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const incomeSql = `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = '收入' AND date LIKE '${monthStr}%'`;
        const income = db.prepare(incomeSql).get().total;
        
        const costSql = `SELECT COALESCE(SUM(total_cost), 0) as total FROM projects WHERE shoot_date LIKE '${monthStr}%'`;
        const cost = db.prepare(costSql).get().total;
        
        sixMonthData.push({
          month: `${d.getMonth() + 1}月`,
          income,
          profit: income - cost - monthlyFixedCost
        });
      }

      // 项目类型收入占比
      const typeIncomeSql = `
        SELECT type, SUM(total_amount) as total 
        FROM projects 
        WHERE total_amount > 0 AND shoot_date LIKE '${currentYear}%'
        GROUP BY type
      `;
      const typeIncome = db.prepare(typeIncomeSql).all();

      // 智能提醒
      const remindersSql = `
        SELECT * FROM reminders WHERE is_completed = 0 AND remind_date <= date('now', '+7 days') ORDER BY remind_date
      `;
      const reminders = db.prepare(remindersSql).all();

      // 逾期未回款
      const overdueSql = `
        SELECT p.*, pn.due_date, pn.amount as pending_amount 
        FROM projects p
        JOIN payment_nodes pn ON p.id = pn.project_id
        WHERE pn.status != '已收款' AND pn.due_date < date('now')
        LIMIT 5
      `;
      const overdueProjects = db.prepare(overdueSql).all();

      return {
        success: true,
        data: {
          monthIncome,
          monthProfit,
          completedProjects,
          pendingPayment,
          yearIncome,
          yearProfit,
          avgProjectPrice,
          avgProfitRate,
          sixMonthData,
          typeIncome,
          reminders,
          overdueProjects
        }
      };
    } catch (error) {
      log.error('Get dashboard data error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取项目列表
  ipcMain.handle('get-projects', (event, filters = {}) => {
    try {
      let sql = `
        SELECT p.*, c.name as client_name 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        sql += ` AND p.status = ?`;
        params.push(filters.status);
      }
      if (filters.type) {
        sql += ` AND p.type = ?`;
        params.push(filters.type);
      }
      if (filters.client_id) {
        sql += ` AND p.client_id = ?`;
        params.push(filters.client_id);
      }
      if (filters.startDate) {
        sql += ` AND p.order_date >= ?`;
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        sql += ` AND p.order_date <= ?`;
        params.push(filters.endDate);
      }

      sql += ` ORDER BY p.created_at DESC`;

      const stmt = db.prepare(sql);
      const projects = stmt.all(...params);

      // 获取每个项目的收款节点
      const projectsWithNodes = projects.map(project => {
        const nodesSql = `SELECT * FROM payment_nodes WHERE project_id = ? ORDER BY due_date`;
        const nodes = db.prepare(nodesSql).all(project.id);
        
        const costsSql = `SELECT * FROM costs WHERE project_id = ? ORDER BY date`;
        const costs = db.prepare(costsSql).all(project.id);

        return { ...project, paymentNodes: nodes, costs };
      });

      return { success: true, data: projectsWithNodes };
    } catch (error) {
      log.error('Get projects error:', error);
      return { success: false, error: error.message };
    }
  });

  // 创建项目
  ipcMain.handle('create-project', (event, projectData) => {
    try {
      const { v4: uuidv4 } = require('uuid');
      const projectId = uuidv4();

      // 插入项目
      const projectSql = `
        INSERT INTO projects (id, name, type, tags, client_id, order_date, shoot_date, delivery_deadline, status, total_amount, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.prepare(projectSql).run(
        projectId,
        projectData.name,
        projectData.type || '商业广告拍摄',
        projectData.tags || '',
        projectData.client_id || null,
        projectData.order_date || new Date().toISOString().split('T')[0],
        projectData.shoot_date || null,
        projectData.delivery_deadline || null,
        projectData.status || '待确认',
        projectData.total_amount || 0,
        projectData.notes || ''
      );

      // 插入收款节点
      if (projectData.paymentNodes && projectData.paymentNodes.length > 0) {
        const nodeSql = `INSERT INTO payment_nodes (id, project_id, node_name, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?)`;
        projectData.paymentNodes.forEach(node => {
          db.prepare(nodeSql).run(uuidv4(), projectId, node.node_name, node.amount, node.due_date, node.status || '待收款');
        });
      }

      // 插入成本
      if (projectData.costs && projectData.costs.length > 0) {
        const costSql = `INSERT INTO costs (id, project_id, category, description, amount, date) VALUES (?, ?, ?, ?, ?, ?)`;
        projectData.costs.forEach(cost => {
          db.prepare(costSql).run(uuidv4(), projectId, cost.category, cost.description, cost.amount, cost.date || new Date().toISOString().split('T')[0]);
        });
      }

      // 添加到档期
      if (projectData.shoot_date) {
        const scheduleSql = `INSERT INTO schedules (id, project_id, date, notes) VALUES (?, ?, ?, ?)`;
        db.prepare(scheduleSql).run(uuidv4(), projectId, projectData.shoot_date, `项目拍摄: ${projectData.name}`);
      }

      // 记录操作日志
      const logSql = `INSERT INTO operation_logs (id, module, action, target_id, target_name) VALUES (?, ?, ?, ?, ?)`;
      db.prepare(logSql).run(uuidv4(), '项目管理', '新建项目', projectId, projectData.name);

      // 更新项目成本汇总
      updateProjectSummary(projectId);

      return { success: true, data: { id: projectId } };
    } catch (error) {
      log.error('Create project error:', error);
      return { success: false, error: error.message };
    }
  });

  // 更新项目
  ipcMain.handle('update-project', (event, projectId, projectData) => {
    try {
      const updateFields = [];
      const values = [];

      Object.keys(projectData).forEach(key => {
        if (key !== 'id' && key !== 'paymentNodes' && key !== 'costs') {
          updateFields.push(`${key} = ?`);
          values.push(projectData[key]);
        }
      });

      if (updateFields.length > 0) {
        const sql = `UPDATE projects SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.prepare(sql).run(...values, projectId);
      }

      // 更新收款节点
      if (projectData.paymentNodes) {
        db.prepare(`DELETE FROM payment_nodes WHERE project_id = ?`).run(projectId);
        const { v4: uuidv4 } = require('uuid');
        const nodeSql = `INSERT INTO payment_nodes (id, project_id, node_name, amount, due_date, actual_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        projectData.paymentNodes.forEach(node => {
          db.prepare(nodeSql).run(
            node.id || uuidv4(),
            projectId,
            node.node_name,
            node.amount,
            node.due_date,
            node.actual_date || null,
            node.status || '待收款'
          );
        });
      }

      // 更新成本
      if (projectData.costs) {
        db.prepare(`DELETE FROM costs WHERE project_id = ?`).run(projectId);
        const { v4: uuidv4 } = require('uuid');
        const costSql = `INSERT INTO costs (id, project_id, category, description, amount, date) VALUES (?, ?, ?, ?, ?, ?)`;
        projectData.costs.forEach(cost => {
          db.prepare(costSql).run(
            cost.id || uuidv4(),
            projectId,
            cost.category,
            cost.description || '',
            cost.amount,
            cost.date || new Date().toISOString().split('T')[0]
          );
        });
      }

      // 记录操作日志
      const logSql = `INSERT INTO operation_logs (id, module, action, target_id, target_name) VALUES (?, ?, ?, ?, ?)`;
      const { v4: uuidv4 } = require('uuid');
      db.prepare(logSql).run(uuidv4(), '项目管理', '更新项目', projectId, projectData.name);

      // 更新项目汇总
      updateProjectSummary(projectId);

      return { success: true };
    } catch (error) {
      log.error('Update project error:', error);
      return { success: false, error: error.message };
    }
  });

  // 删除项目
  ipcMain.handle('delete-project', (event, projectId) => {
    try {
      db.prepare(`DELETE FROM payment_nodes WHERE project_id = ?`).run(projectId);
      db.prepare(`DELETE FROM costs WHERE project_id = ?`).run(projectId);
      db.prepare(`DELETE FROM schedules WHERE project_id = ?`).run(projectId);
      db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId);

      const { v4: uuidv4 } = require('uuid');
      const logSql = `INSERT INTO operation_logs (id, module, action, target_id) VALUES (?, ?, ?, ?)`;
      db.prepare(logSql).run(uuidv4(), '项目管理', '删除项目', projectId);

      return { success: true };
    } catch (error) {
      log.error('Delete project error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取客户列表
  ipcMain.handle('get-clients', () => {
    try {
      const clients = db.prepare(`SELECT * FROM clients ORDER BY created_at DESC`).all();
      
      const clientsWithStats = clients.map(client => {
        const projectCountSql = `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM projects WHERE client_id = ?`;
        const stats = db.prepare(projectCountSql).get(client.id);
        
        const lastProjectSql = `SELECT shoot_date FROM projects WHERE client_id = ? ORDER BY shoot_date DESC LIMIT 1`;
        const lastProject = db.prepare(lastProjectSql).get(client.id);

        return {
          ...client,
          projectCount: stats.count,
          totalAmount: stats.total,
          lastProjectDate: lastProject?.shoot_date || null
        };
      });

      return { success: true, data: clientsWithStats };
    } catch (error) {
      log.error('Get clients error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取收支流水
  ipcMain.handle('get-transactions', (event, filters = {}) => {
    try {
      let sql = `SELECT t.*, p.name as project_name FROM transactions t LEFT JOIN projects p ON t.project_id = p.id WHERE 1=1`;
      const params = [];

      if (filters.type) {
        sql += ` AND t.type = ?`;
        params.push(filters.type);
      }
      if (filters.category) {
        sql += ` AND t.category = ?`;
        params.push(filters.category);
      }
      if (filters.startDate) {
        sql += ` AND t.date >= ?`;
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        sql += ` AND t.date <= ?`;
        params.push(filters.endDate);
      }

      sql += ` ORDER BY t.date DESC`;

      return { success: true, data: db.prepare(sql).all(...params) };
    } catch (error) {
      log.error('Get transactions error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取统计数据
  ipcMain.handle('get-statistics', (event, period = 'month') => {
    try {
      const now = new Date();
      let startDate, endDate;
      
      if (period === 'month') {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = now.toISOString().split('T')[0];
      } else if (period === 'quarter') {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = `${now.getFullYear()}-${String(quarterStart + 1).padStart(2, '0')}-01`;
        endDate = now.toISOString().split('T')[0];
      } else {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = now.toISOString().split('T')[0];
      }

      // 收入统计
      const incomeSql = `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = '收入' AND date >= ? AND date <= ?`;
      const totalIncome = db.prepare(incomeSql).get(startDate, endDate).total;

      // 支出统计
      const expenseSql = `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = '支出' AND date >= ? AND date <= ?`;
      const totalExpense = db.prepare(expenseSql).get(startDate, endDate).total;

      // 项目统计
      const projectSql = `SELECT COUNT(*) as count, COALESCE(AVG(total_amount), 0) as avg_amount FROM projects WHERE order_date >= ? AND order_date <= ?`;
      const projectStats = db.prepare(projectSql).get(startDate, endDate);

      // 成本构成分析
      const costBreakdownSql = `SELECT category, SUM(amount) as total FROM costs WHERE date >= ? AND date <= ? GROUP BY category ORDER BY total DESC`;
      const costBreakdown = db.prepare(costBreakdownSql).all(startDate, endDate);

      // 项目盈利排行
      const profitRankingSql = `SELECT name, type, total_amount, total_cost, profit, profit_rate FROM projects WHERE order_date >= ? AND order_date <= ? ORDER BY profit DESC LIMIT 10`;
      const profitRanking = db.prepare(profitRankingSql).all(startDate, endDate);

      // 回款分析
      const paymentAnalysisSql = `
        SELECT 
          COUNT(*) as total_nodes,
          SUM(CASE WHEN status = '已收款' THEN 1 ELSE 0 END) as paid_nodes,
          SUM(CASE WHEN status = '待收款' AND due_date < date('now') THEN 1 ELSE 0 END) as overdue_nodes
        FROM payment_nodes
        WHERE due_date >= ? AND due_date <= ?
      `;
      const paymentAnalysis = db.prepare(paymentAnalysisSql).get(startDate, endDate);

      // 盈亏平衡点
      const monthlyFixedCostSql = `SELECT COALESCE(SUM(CASE WHEN frequency = 'yearly' THEN amount / 12 ELSE amount END), 0) as total FROM fixed_cost_configs WHERE is_active = 1`;
      const monthlyFixedCost = db.prepare(monthlyFixedCostSql).get().total;

      return {
        success: true,
        data: {
          totalIncome,
          totalExpense,
          netProfit: totalIncome - totalExpense,
          projectCount: projectStats.count,
          avgProjectAmount: projectStats.avg_amount,
          costBreakdown,
          profitRanking,
          paymentAnalysis,
          monthlyFixedCost,
          breakEvenPoint: monthlyFixedCost
        }
      };
    } catch (error) {
      log.error('Get statistics error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取档期日历
  ipcMain.handle('get-schedules', (event, year, month) => {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const sql = `
        SELECT s.*, p.name as project_name, p.client_id, c.name as client_name
        FROM schedules s
        LEFT JOIN projects p ON s.project_id = p.id
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE s.date >= ? AND s.date <= ?
        ORDER BY s.date
      `;
      
      return { success: true, data: db.prepare(sql).all(startDate, endDate) };
    } catch (error) {
      log.error('Get schedules error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取发票列表
  ipcMain.handle('get-invoices', () => {
    try {
      const sql = `
        SELECT i.*, p.name as project_name
        FROM invoices i
        LEFT JOIN projects p ON i.project_id = p.id
        ORDER BY i.billing_date DESC
      `;
      return { success: true, data: db.prepare(sql).all() };
    } catch (error) {
      log.error('Get invoices error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取器材列表
  ipcMain.handle('get-equipment', () => {
    try {
      return { success: true, data: db.prepare(`SELECT * FROM equipment ORDER BY created_at DESC`).all() };
    } catch (error) {
      log.error('Get equipment error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取固定成本配置
  ipcMain.handle('get-fixed-costs', () => {
    try {
      return { success: true, data: db.prepare(`SELECT * FROM fixed_cost_configs ORDER BY created_at DESC`).all() };
    } catch (error) {
      log.error('Get fixed costs error:', error);
      return { success: false, error: error.message };
    }
  });

  // 数据备份
  ipcMain.handle('backup-data', async () => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: '备份数据',
        defaultPath: `photostudio_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: '数据库文件', extensions: ['db'] }]
      });

      if (!result.canceled && result.filePath) {
        const fs = require('fs');
        const dbPath = path.join(app.getPath('userData'), 'photostudio.db');
        fs.copyFileSync(dbPath, result.filePath);
        return { success: true, path: result.filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      log.error('Backup error:', error);
      return { success: false, error: error.message };
    }
  });

  // 数据恢复
  ipcMain.handle('restore-data', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: '恢复数据',
        filters: [{ name: '数据库文件', extensions: ['db'] }],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const fs = require('fs');
        const dbPath = path.join(app.getPath('userData'), 'photostudio.db');
        
        // 关闭当前数据库连接
        db.close();
        
        // 备份当前数据
        const backupPath = dbPath + '.bak';
        fs.copyFileSync(dbPath, backupPath);
        
        // 恢复数据
        fs.copyFileSync(result.filePaths[0], dbPath);
        
        // 重新连接数据库
        initDatabase();
        
        return { success: true };
      }
      return { success: false, canceled: true };
    } catch (error) {
      log.error('Restore error:', error);
      return { success: false, error: error.message };
    }
  });

  // 辅助函数：更新项目汇总
  function updateProjectSummary(projectId) {
    try {
      const costsSql = `SELECT COALESCE(SUM(amount), 0) as total FROM costs WHERE project_id = ?`;
      const totalCost = db.prepare(costsSql).get(projectId).total;

      const projectSql = `SELECT total_amount FROM projects WHERE id = ?`;
      const project = db.prepare(projectSql).get(projectId);
      const totalAmount = project?.total_amount || 0;

      const profit = totalAmount - totalCost;
      const profitRate = totalAmount > 0 ? (profit / totalAmount * 100) : 0;

      db.prepare(`UPDATE projects SET total_cost = ?, profit = ?, profit_rate = ? WHERE id = ?`)
        .run(totalCost, profit, profitRate, projectId);
    } catch (error) {
      log.error('Update project summary error:', error);
    }
  }
}

// 应用启动
app.whenReady().then(() => {
  log.info('App starting...');
  db = initDatabase();
  setupIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
    log.info('Database closed');
  }
});

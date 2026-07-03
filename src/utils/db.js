const DB_NAME = 'PhotoStudioDB';
const DB_VERSION = 1;

let db = null;

const TABLES = [
  { name: 'clients', keyPath: 'id', indexes: [{ name: 'name', keyPath: 'name' }, { name: 'type', keyPath: 'type' }] },
  { name: 'projects', keyPath: 'id', indexes: [{ name: 'client_id', keyPath: 'client_id' }, { name: 'type', keyPath: 'type' }, { name: 'status', keyPath: 'status' }, { name: 'shoot_date', keyPath: 'shoot_date' }] },
  { name: 'transactions', keyPath: 'id', indexes: [{ name: 'type', keyPath: 'type' }, { name: 'category', keyPath: 'category' }, { name: 'project_id', keyPath: 'project_id' }, { name: 'date', keyPath: 'date' }] },
  { name: 'invoices', keyPath: 'id', indexes: [{ name: 'project_id', keyPath: 'project_id' }, { name: 'status', keyPath: 'status' }] },
  { name: 'settings', keyPath: 'key' },
  { name: 'fixed_cost_configs', keyPath: 'id', indexes: [{ name: 'category', keyPath: 'category' }, { name: 'is_active', keyPath: 'is_active' }] },
  { name: 'equipment', keyPath: 'id', indexes: [{ name: 'status', keyPath: 'status' }] }
];

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject(new Error('DB error: ' + e.target.error));
    request.onsuccess = (e) => { db = e.target.result; resolve(db); };
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      TABLES.forEach(table => {
        if (!database.objectStoreNames.contains(table.name)) {
          const store = database.createObjectStore(table.name, { keyPath: table.keyPath });
          table.indexes.forEach(index => store.createIndex(index.name, index.keyPath));
        }
      });
    };
  });
};

const getStore = (storeName, mode = 'readonly') => {
  return new Promise((resolve, reject) => {
    if (!db) {
      initDB().then(() => {
        const tx = db.transaction([storeName], mode);
        resolve(tx.objectStore(storeName));
      }).catch(reject);
    } else {
      const tx = db.transaction([storeName], mode);
      resolve(tx.objectStore(storeName));
    }
  });
};

export const dbGetAll = async (storeName) => {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error(req.error));
  });
};

export const dbGet = async (storeName, condition, params) => {
  if (!condition || !params) return dbGetAll(storeName);
  const store = await getStore(storeName);
  const match = condition.match(/(\w+)\s*=\s*\?/);
  if (match) {
    const index = store.index(match[1].trim());
    return new Promise((resolve, reject) => {
      const req = index.getAll(params[0]);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error(req.error));
    });
  }
  return dbGetAll(storeName);
};

export const dbQuery = async (storeName, options = {}) => {
  const store = await getStore(storeName);
  return new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => {
      let data = req.result;
      if (options.where) data = data.filter(item => {
        for (const [k, v] of Object.entries(options.where)) if (item[k] !== v) return false;
        return true;
      });
      if (options.orderBy) data.sort((a, b) => (a[options.orderBy] < b[options.orderBy] ? -1 : 1));
      if (options.limit) data = data.slice(0, options.limit);
      resolve(data);
    };
  });
};

export const dbInsert = async (storeName, data) => {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.add(data);
    req.onsuccess = () => resolve({ success: true, data: { lastInsertRowid: req.result, changes: 1 } });
    req.onerror = () => {
      if (req.error && req.error.name === 'ConstraintError') {
        const putReq = store.put(data);
        putReq.onsuccess = () => resolve({ success: true, data: { changes: 1 } });
        putReq.onerror = () => reject(new Error(putReq.error));
      } else {
        reject(new Error(req.error));
      }
    };
  });
};

export const dbUpdate = async (storeName, data, condition, params) => {
  const store = await getStore(storeName, 'readwrite');
  if (condition) {
    const match = condition.match(/(\w+)\s*=\s*\?/);
    if (match) {
      const index = store.index(match[1].trim());
      return new Promise((resolve, reject) => {
        const req = index.getKey(params[0]);
        req.onsuccess = () => {
          if (req.result) {
            store.get(req.result).onsuccess = (e) => {
              const item = e.target.result;
              Object.assign(item, data);
              store.put(item).onsuccess = () => resolve({ success: true, data: { changes: 1 } });
            };
          } else {
            resolve({ success: true, data: { changes: 0 } });
          }
        };
        req.onerror = () => reject(new Error(req.error));
      });
    }
  }
  return new Promise((resolve, reject) => {
    const req = store.put(data);
    req.onsuccess = () => resolve({ success: true, data: { changes: 1 } });
    req.onerror = () => reject(new Error(req.error));
  });
};

export const dbDelete = async (storeName, condition, params) => {
  const store = await getStore(storeName, 'readwrite');
  const match = condition?.match(/(\w+)\s*=\s*\?/);
  const id = match ? params?.[0] : null;
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve({ success: true, data: { changes: 1 } });
    req.onerror = () => reject(new Error(req.error));
  });
};

export const dbClear = async (storeName) => {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve) => {
    const req = store.clear();
    req.onsuccess = () => resolve({ success: true, data: { changes: 0 } });
  });
};
const SUPABASE_URL = 'https://tobjdiambtkhhbvcapmh.supabase.co';
const KEY = 'sb_publishable_0_QpigeH2snt4e9HB8QC7w_p46_7w';

const data = {
  projects: [
    {"id":"mob8f72wg10b4v99emb","name":"山东黄金矿","client":"时空数字","contract":58535,"cost":30000,"received":22000,"receivedDate":"2026-04-18","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mob8urakje86an8pjv8","name":"莱州养鸡场","client":"","contract":71000,"cost":30000,"received":71000,"receivedDate":"2026-04-17","status":"已完结","created_at":new Date().toISOString()},
    {"id":"mob9v73jvxzrsb9v8nh","name":"上海华为研发","client":"时空数字","contract":70000,"cost":30000,"received":28000,"receivedDate":"2026-02-05","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mob9vwytwhpiwodfv4","name":"嘉峪关","client":"时空数字","contract":42000,"cost":20000,"received":17600,"receivedDate":"2025-04-23","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mob9wqvjlkdvdy7lpwo","name":"北京电信","client":"时空数字","contract":73000,"cost":30000,"received":22018,"receivedDate":"2025-12-04","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobaysucd552zmkw0jm","name":"9号电动车","client":"","contract":6500,"cost":0,"received":0,"receivedDate":"2026-04-23","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobazqu0ri1frre1xhb","name":"乐道汽车","client":"","contract":22000,"cost":0,"received":0,"receivedDate":"2026-04-23","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobb3wm4afcf7vj1o0c","name":"本田摩托","client":"","contract":7000,"cost":0,"received":0,"receivedDate":"2026-03-25","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobb4sfyl0ljrian4gd","name":"星星冷链","client":"","contract":40000,"cost":20000,"received":30000,"receivedDate":"2026-02-03","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobb6xmkkvcz567slo","name":"费列罗","client":"","contract":15000,"cost":0,"received":0,"receivedDate":"2026-01-15","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobbr5dlokmnmi28r2d","name":"东芝电视","client":"","contract":18000,"cost":8000,"received":0,"receivedDate":"2026-03-11","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobbrqzr5hndxlpu1yn","name":"东芝电视2","client":"","contract":10000,"cost":0,"received":0,"receivedDate":"2026-02-05","status":"待回款","created_at":new Date().toISOString()},
    {"id":"mobbtzb3tdnxadg5mxn","name":"长虹电视","client":"","contract":10000,"cost":0,"received":0,"receivedDate":"2026-01-31","status":"已完结","created_at":new Date().toISOString()}
  ],
  clients: [
    {"id":"mob8ff65ljf1v85aiu","name":"时空数字","phone":"","email":"","created_at":new Date().toISOString()}
  ]
};

async function insert(table, records) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`
    },
    body: JSON.stringify(records)
  });
  return res.json();
}

async function main() {
  console.log('开始导入数据...');
  
  const r1 = await insert('projects', data.projects);
  console.log('Projects:', r1);
  
  const r2 = await insert('clients', data.clients);
  console.log('Clients:', r2);
  
  console.log('导入完成！');
}

main().catch(console.error);

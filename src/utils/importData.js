export const restoreDataFromScreenshots = async () => {
  const projects = [
    { id: 'p1', name: '费列罗', type: '商业拍摄', client_name: '费列罗', total_amount: 26500, status: '已完结', order_date: '2026-01-01', shoot_date: '2026-01-15', profit_rate: 60 },
    { id: 'p2', name: '上海港口', type: '商业拍摄', client_name: '上海港口', total_amount: 36000, status: '已完结', order_date: '2026-01-05', shoot_date: '2026-01-20', profit_rate: 55 },
    { id: 'p3', name: '长虹电视', type: '产品拍摄', client_name: '长虹', total_amount: 10000, status: '已完结', order_date: '2026-01-10', shoot_date: '2026-01-25', profit_rate: 45 },
    { id: 'p4', name: '星星冷链', type: '商业拍摄', client_name: '星星冷链', total_amount: 40000, status: '已完结', order_date: '2026-02-01', shoot_date: '2026-02-10', profit_rate: 50 },
    { id: 'p5', name: '东芝电视2', type: '产品拍摄', client_name: '东芝', total_amount: 10000, status: '进行中', order_date: '2026-02-05', shoot_date: '2026-02-15', profit_rate: 40 },
    { id: 'p6', name: '上海华为研发', type: '商业拍摄', client_name: '华为', total_amount: 70000, status: '进行中', order_date: '2026-02-10', shoot_date: '2026-02-20', profit_rate: 55 },
    { id: 'p7', name: '东芝电视', type: '产品拍摄', client_name: '东芝', total_amount: 18000, status: '进行中', order_date: '2026-03-01', shoot_date: '2026-03-10', profit_rate: 42 },
    { id: 'p8', name: '本田摩托', type: '产品拍摄', client_name: '本田', total_amount: 7000, status: '进行中', order_date: '2026-03-05', shoot_date: '2026-03-15', profit_rate: 38 },
    { id: 'p9', name: '9号电动车', type: '产品拍摄', client_name: '九号公司', total_amount: 9500, status: '进行中', order_date: '2026-04-01', shoot_date: '2026-04-10', profit_rate: 45 },
    { id: 'p10', name: '莱州养鸡场', type: '商业拍摄', client_name: '莱州养鸡场', total_amount: 71000, status: '已完结', order_date: '2026-04-05', shoot_date: '2026-04-15', profit_rate: 58 },
    { id: 'p11', name: '山东黄金矿', type: '商业拍摄', client_name: '山东黄金', total_amount: 58535, status: '进行中', order_date: '2026-04-10', shoot_date: '2026-04-20', profit_rate: 52 },
    { id: 'p12', name: '乐道汽车', type: '商业拍摄', client_name: '乐道汽车', total_amount: 22000, status: '已完结', order_date: '2026-04-15', shoot_date: '2026-04-25', profit_rate: 50 },
    { id: 'p13', name: '9号电动车调色', type: '后期制作', client_name: '九号公司', total_amount: 2000, status: '进行中', order_date: '2026-05-01', shoot_date: '2026-05-05', profit_rate: 80 },
    { id: 'p14', name: '一汽', type: '商业拍摄', client_name: '一汽', total_amount: 12000, status: '已完结', order_date: '2026-05-05', shoot_date: '2026-05-15', profit_rate: 48 },
    { id: 'p15', name: '9号电动车2', type: '产品拍摄', client_name: '九号公司', total_amount: 7000, status: '进行中', order_date: '2026-05-10', shoot_date: '2026-05-20', profit_rate: 45 },
    { id: 'p16', name: '山科大宣传片', type: '商业拍摄', client_name: '山东科技大学', total_amount: 25000, status: '进行中', order_date: '2026-06-01', shoot_date: '2026-06-10', profit_rate: 55 },
    { id: 'p17', name: '糯米实验', type: '实验拍摄', client_name: '糯米科技', total_amount: 9000, status: '进行中', order_date: '2026-06-05', shoot_date: '2026-06-15', profit_rate: 40 },
    { id: 'p18', name: '泡泡玛特电动车', type: '产品拍摄', client_name: '泡泡玛特', total_amount: 6000, status: '进行中', order_date: '2026-06-10', shoot_date: '2026-06-20', profit_rate: 42 },
    { id: 'p19', name: '国信三文鱼', type: '产品拍摄', client_name: '国信集团', total_amount: 7000, status: '进行中', order_date: '2026-06-15', shoot_date: '2026-06-25', profit_rate: 35 },
    { id: 'p20', name: '迪巧实验', type: '实验拍摄', client_name: '迪巧科技', total_amount: 9000, status: '进行中', order_date: '2026-06-18', shoot_date: '2026-06-28', profit_rate: 40 },
    { id: 'p21', name: '东阿阿胶', type: '产品拍摄', client_name: '东阿阿胶', total_amount: 20000, status: '进行中', order_date: '2026-06-20', shoot_date: '2026-07-01', profit_rate: 50 },
    { id: 'p22', name: '嘉峪关', type: '商业拍摄', client_name: '嘉峪关文旅', total_amount: 17600, status: '待收款', order_date: '2025-05-01', shoot_date: '2025-05-15', profit_rate: 45 },
    { id: 'p23', name: '众合摆渡', type: '商业拍摄', client_name: '众合摆渡', total_amount: 20527, status: '待收款', order_date: '2025-06-01', shoot_date: '2025-06-15', profit_rate: 48 },
    { id: 'p24', name: '山东卫视威海项目', type: '商业拍摄', client_name: '山东卫视', total_amount: 31940, status: '待收款', order_date: '2025-08-01', shoot_date: '2025-08-15', profit_rate: 52 },
    { id: 'p25', name: '黄耀辉', type: '个人写真', client_name: '黄耀辉', total_amount: 24228, status: '待收款', order_date: '2025-09-01', shoot_date: '2025-09-15', profit_rate: 60 },
    { id: 'p26', name: '张灿', type: '个人写真', client_name: '张灿', total_amount: 20120, status: '待收款', order_date: '2025-09-15', shoot_date: '2025-09-25', profit_rate: 62 },
    { id: 'p27', name: '于翔', type: '商业拍摄', client_name: '于翔工作室', total_amount: 36800, status: '待收款', order_date: '2025-10-01', shoot_date: '2025-10-15', profit_rate: 55 },
  ];

  const clients = [
    { id: 'c1', name: '费列罗', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c2', name: '上海港口', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c3', name: '长虹', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c4', name: '星星冷链', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c5', name: '东芝', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c6', name: '华为', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c7', name: '本田', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c8', name: '九号公司', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c9', name: '莱州养鸡场', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c10', name: '山东黄金', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c11', name: '乐道汽车', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c12', name: '一汽', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c13', name: '山东科技大学', type: '机构客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c14', name: '糯米科技', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c15', name: '泡泡玛特', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c16', name: '国信集团', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c17', name: '迪巧科技', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c18', name: '东阿阿胶', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c19', name: '嘉峪关文旅', type: '机构客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c20', name: '众合摆渡', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c21', name: '山东卫视', type: '媒体客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c22', name: '黄耀辉', type: '个人客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c23', name: '张灿', type: '个人客户', contact: '', phone: '', email: '', address: '', notes: '' },
    { id: 'c24', name: '于翔工作室', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' },
  ];

  const transactions = [
    { id: 't1', type: '收入', category: '项目收入', amount: 26500, date: '2026-01-15', project_id: 'p1', description: '费列罗项目收入' },
    { id: 't2', type: '收入', category: '项目收入', amount: 36000, date: '2026-01-20', project_id: 'p2', description: '上海港口项目收入' },
    { id: 't3', type: '收入', category: '项目收入', amount: 10000, date: '2026-01-25', project_id: 'p3', description: '长虹电视项目收入' },
    { id: 't4', type: '收入', category: '项目收入', amount: 40000, date: '2026-02-10', project_id: 'p4', description: '星星冷链项目收入' },
    { id: 't5', type: '收入', category: '项目收入', amount: 70000, date: '2026-02-20', project_id: 'p6', description: '上海华为研发项目收入' },
    { id: 't6', type: '收入', category: '项目收入', amount: 71000, date: '2026-04-15', project_id: 'p10', description: '莱州养鸡场项目收入' },
    { id: 't7', type: '收入', category: '项目收入', amount: 22000, date: '2026-04-25', project_id: 'p12', description: '乐道汽车项目收入' },
    { id: 't8', type: '收入', category: '项目收入', amount: 12000, date: '2026-05-15', project_id: 'p14', description: '一汽项目收入' },
    { id: 't9', type: '支出', category: '器材费用', amount: 50000, date: '2026-01-01', description: '年度器材采购' },
    { id: 't10', type: '支出', category: '场地费用', amount: 30000, date: '2026-01-01', description: '工作室租金' },
    { id: 't11', type: '支出', category: '后期制作', amount: 20000, date: '2026-01-01', description: '外包后期费用' },
    { id: 't12', type: '支出', category: '差旅费用', amount: 15000, date: '2026-01-01', description: '差旅交通费' },
    { id: 't13', type: '支出', category: '其他费用', amount: 31000, date: '2026-01-01', description: '杂项支出' },
    { id: 't14', type: '收入', category: '被动收入', amount: 10000, date: '2026-01-01', description: '月度被动收入' },
    { id: 't15', type: '收入', category: '被动收入', amount: 10000, date: '2026-02-01', description: '月度被动收入' },
    { id: 't16', type: '收入', category: '被动收入', amount: 10000, date: '2026-03-01', description: '月度被动收入' },
    { id: 't17', type: '收入', category: '被动收入', amount: 10000, date: '2026-04-01', description: '月度被动收入' },
    { id: 't18', type: '收入', category: '被动收入', amount: 10000, date: '2026-05-01', description: '月度被动收入' },
    { id: 't19', type: '收入', category: '被动收入', amount: 10000, date: '2026-06-01', description: '月度被动收入' },
    { id: 't20', type: '收入', category: '被动收入', amount: 60000, date: '2026-06-30', description: '年基准被动收入' },
  ];

  try {
    for (const client of clients) await window.electronAPI.dbInsert('clients', client);
    for (const project of projects) await window.electronAPI.dbInsert('projects', project);
    for (const transaction of transactions) await window.electronAPI.dbInsert('transactions', transaction);
    return { success: true, message: `已导入 ${clients.length} 个客户、${projects.length} 个项目、${transactions.length} 条交易记录` };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export default restoreDataFromScreenshots;
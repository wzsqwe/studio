-- 复制下面的 INSERT 语句到 Supabase SQL Editor 执行

-- 清空现有数据（如果有）
DELETE FROM projects;
DELETE FROM clients;

-- 插入项目数据
INSERT INTO projects (id, name, client, contract, cost, received, received_date, status, created_at) VALUES
('mob8f72wg10b4v99emb', '山东黄金矿', '时空数字', 58535, 30000, 22000, '2026-04-18', '待回款', NOW()),
('mob8urakje86an8pjv8', '莱州养鸡场', '', 71000, 30000, 71000, '2026-04-17', '已完结', NOW()),
('mob9v73jvxzrsb9v8nh', '上海华为研发', '时空数字', 70000, 30000, 28000, '2026-02-05', '待回款', NOW()),
('mob9vwytwhpiwodfv4', '嘉峪关', '时空数字', 42000, 20000, 17600, '2025-04-23', '待回款', NOW()),
('mob9wqvjlkdvdy7lpwo', '北京电信', '时空数字', 73000, 30000, 22018, '2025-12-04', '待回款', NOW()),
('mobaysucd552zmkw0jm', '9号电动车', '', 6500, 0, 0, '2026-04-23', '待回款', NOW()),
('mobazqu0ri1frre1xhb', '乐道汽车', '', 22000, 0, 0, '2026-04-23', '待回款', NOW()),
('mobb3wm4afcf7vj1o0c', '本田摩托', '', 7000, 0, 0, '2026-03-25', '待回款', NOW()),
('mobb4sfyl0ljrian4gd', '星星冷链', '', 40000, 20000, 30000, '2026-02-03', '待回款', NOW()),
('mobb6xmkkvcz567slo', '费列罗', '', 15000, 0, 0, '2026-01-15', '待回款', NOW()),
('mobbr5dlokmnmi28r2d', '东芝电视', '', 18000, 8000, 0, '2026-03-11', '待回款', NOW()),
('mobbrqzr5hndxlpu1yn', '东芝电视2', '', 10000, 0, 0, '2026-02-05', '待回款', NOW()),
('mobbtzb3tdnxadg5mxn', '长虹电视', '', 10000, 0, 0, '2026-01-31', '已完结', NOW());

-- 插入客户数据
INSERT INTO clients (id, name, phone, email, created_at) VALUES
('mob8ff65ljf1v85aiu', '时空数字', '', '', NOW());

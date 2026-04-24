-- 摄影师管理系统 - 器材模块数据库迁移
-- 执行此 SQL 创建器材相关表

-- 器材表
CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    purchase_price NUMERIC DEFAULT 0,
    rental_price NUMERIC DEFAULT 0,
    display_order NUMERIC DEFAULT 999,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 项目器材关联表
CREATE TABLE IF NOT EXISTS project_equipment (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    equipment_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_project_equipment_project ON project_equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_equipment ON project_equipment(equipment_id);

-- 如果表已存在但缺少 display_order 字段，执行此语句添加：
-- ALTER TABLE equipment ADD COLUMN IF NOT EXISTS display_order NUMERIC DEFAULT 999;

-- 器材使用日志表（不可逆记录，保存后不因 project_equipment 删除而丢失）
CREATE TABLE IF NOT EXISTS equipment_usage_log (
    id TEXT PRIMARY KEY,
    equipment_id TEXT,
    project_id TEXT,
    usage_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_usage_log_equipment ON equipment_usage_log(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_log_project ON equipment_usage_log(project_id);

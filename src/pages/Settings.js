import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [fixedCosts, setFixedCosts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const [fixedCostsRes, equipmentRes] = await Promise.all([
        window.electronAPI.getFixedCosts(),
        window.electronAPI.getEquipment()
      ]);

      if (fixedCostsRes.success) {
        setFixedCosts(fixedCostsRes.data);
      }
      if (equipmentRes.success) {
        setEquipment(equipmentRes.data);
      }
    } catch (error) {
      console.error('Failed to load settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!window.electronAPI) return;

    try {
      const result = await window.electronAPI.backupData();
      if (result.success) {
        toast.success('数据备份成功！');
      } else if (!result.canceled) {
        toast.error('备份失败：' + result.error);
      }
    } catch (error) {
      toast.error('备份失败');
    }
  };

  const handleRestore = async () => {
    if (!window.electronAPI) return;

    if (!window.confirm('恢复数据将覆盖当前所有数据，是否继续？')) return;

    try {
      const result = await window.electronAPI.restoreData();
      if (result.success) {
        toast.success('数据恢复成功！页面将重新加载。');
        setTimeout(() => window.location.reload(), 1500);
      } else if (!result.canceled) {
        toast.error('恢复失败：' + result.error);
      }
    } catch (error) {
      toast.error('恢复失败');
    }
  };

  const handleAddFixedCost = async () => {
    const name = window.prompt('请输入固定成本名称：');
    if (!name) return;

    const category = window.prompt('请输入分类（如：软件订阅、器材保险）：') || '其他';
    const amountStr = window.prompt('请输入金额：');
    const amount = parseFloat(amountStr) || 0;
    const frequency = window.confirm('是年度费用吗？') ? 'yearly' : 'monthly';

    try {
      const result = await window.electronAPI.dbInsert('fixed_cost_configs', {
        id: `fixed_${Date.now()}`,
        name,
        category,
        amount,
        frequency,
        is_active: 1
      });

      if (result.success) {
        toast.success('已添加固定成本');
        loadData();
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handleToggleFixedCost = async (cost) => {
    try {
      const result = await window.electronAPI.dbUpdate(
        'fixed_cost_configs',
        { is_active: cost.is_active ? 0 : 1 },
        'id = ?',
        [cost.id]
      );

      if (result.success) {
        loadData();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDeleteFixedCost = async (cost) => {
    if (!window.confirm(`确定要删除"${cost.name}"吗？`)) return;

    try {
      const result = await window.electronAPI.dbDelete('fixed_cost_configs', 'id = ?', [cost.id]);
      if (result.success) {
        toast.success('已删除');
        loadData();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleAddEquipment = async () => {
    const name = window.prompt('请输入器材名称：');
    if (!name) return;

    const priceStr = window.prompt('请输入购买价格：');
    const price = parseFloat(priceStr) || 0;
    const yearsStr = window.prompt('请输入使用年限（默认5年）：');
    const years = parseInt(yearsStr) || 5;
    const monthlyDep = price / (years * 12);

    try {
      const result = await window.electronAPI.dbInsert('equipment', {
        id: `equip_${Date.now()}`,
        name,
        purchase_price: price,
        useful_years: years,
        monthly_depreciation: monthlyDep.toFixed(2),
        purchase_date: new Date().toISOString().split('T')[0],
        status: '在用'
      });

      if (result.success) {
        toast.success('已添加器材');
        loadData();
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const tabs = [
    { id: 'general', label: '通用设置' },
    { id: 'fixed-costs', label: '固定成本' },
    { id: 'equipment', label: '器材折旧' },
    { id: 'backup', label: '数据备份' }
  ];

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '12px' }}>加载中...</span>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">⚙️ 系统设置</h1>
      </div>

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-sm)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 通用设置 */}
      {activeTab === 'general' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>📋 通用设置</h3>

          <div className="form-group">
            <label className="form-label">默认项目类型</label>
            <select className="form-input form-select" style={{ maxWidth: '300px' }}>
              <option value="商业广告拍摄">商业广告拍摄</option>
              <option value="婚礼跟拍">婚礼跟拍</option>
              <option value="写真拍摄">写真拍摄</option>
              <option value="产品摄影">产品摄影</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">默认税率（%）</label>
            <input
              type="number"
              className="form-input"
              defaultValue={6}
              style={{ maxWidth: '200px' }}
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>开启自动备份提醒</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">自动备份周期</label>
            <select className="form-input form-select" style={{ maxWidth: '200px' }}>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
            保存设置
          </button>
        </div>
      )}

      {/* 固定成本 */}
      {activeTab === 'fixed-costs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>💰 固定成本配置</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                这些成本将按月自动分摊到您的经营成本中
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleAddFixedCost}>
              ➕ 添加固定成本
            </button>
          </div>

          {fixedCosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <h3>暂无固定成本</h3>
              <p style={{ color: 'var(--text-muted)' }}>添加您的固定支出项目，如软件订阅、器材保险等</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {fixedCosts.map(cost => (
                <div key={cost.id} className="card" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  opacity: cost.is_active ? 1 : 0.6
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                      {cost.name}
                      {!cost.is_active && <span className="tag" style={{ marginLeft: '8px', background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' }}>已禁用</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      分类：{cost.category} | 周期：{cost.frequency === 'yearly' ? '年度' : '月度'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ef4444' }}>
                        ¥{cost.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {cost.frequency === 'yearly' ? `月均 ¥${(cost.amount / 12).toFixed(0)}` : '/月'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleToggleFixedCost(cost)}
                        style={{ padding: '6px 12px' }}
                      >
                        {cost.is_active ? '禁用' : '启用'}
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleDeleteFixedCost(cost)}
                        style={{ padding: '6px 12px', color: '#ef4444' }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>月度固定成本合计</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#22c55e' }}>
                    ¥{fixedCosts
                      .filter(c => c.is_active)
                      .reduce((sum, c) => sum + (c.frequency === 'yearly' ? c.amount / 12 : c.amount), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 器材折旧 */}
      {activeTab === 'equipment' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>📷 器材折旧管理</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                录入器材信息，系统自动计算月度折旧额
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleAddEquipment}>
              ➕ 添加器材
            </button>
          </div>

          {equipment.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📷</div>
              <h3>暂无器材记录</h3>
              <p style={{ color: 'var(--text-muted)' }}>添加您的器材，系统将自动计算折旧</p>
            </div>
          ) : (
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>器材名称</th>
                    <th>购买价格</th>
                    <th>使用年限</th>
                    <th>月折旧额</th>
                    <th>累计折旧</th>
                    <th>购买日期</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map(eq => {
                    const monthsUsed = eq.purchase_date
                      ? Math.floor((new Date() - new Date(eq.purchase_date)) / (30 * 24 * 60 * 60 * 1000))
                      : 0;
                    const totalDepreciation = (eq.monthly_depreciation || 0) * monthsUsed;
                    const remaining = (eq.purchase_price || 0) - totalDepreciation;

                    return (
                      <tr key={eq.id}>
                        <td style={{ fontWeight: '500' }}>{eq.name}</td>
                        <td style={{ color: '#22c55e' }}>¥{eq.purchase_price?.toLocaleString()}</td>
                        <td>{eq.useful_years} 年</td>
                        <td style={{ color: '#ef4444' }}>¥{eq.monthly_depreciation?.toFixed(0)}</td>
                        <td>¥{totalDepreciation.toFixed(0)}</td>
                        <td>{eq.purchase_date || '-'}</td>
                        <td>
                          <span className={`tag ${eq.status === '在用' ? 'tag-success' : 'tag-warning'}`}>
                            {eq.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 数据备份 */}
      {activeTab === 'backup' && (
        <div>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>💾 数据备份与恢复</h3>

          <div className="grid-2" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div className="card" style={{ cursor: 'pointer' }} onClick={handleBackup}>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📤</div>
                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>备份数据</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  将当前所有数据导出为备份文件
                </p>
              </div>
            </div>

            <div className="card" style={{ cursor: 'pointer' }} onClick={handleRestore}>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📥</div>
                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>恢复数据</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  从备份文件恢复所有数据
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <h4 style={{ marginBottom: 'var(--spacing-sm)', color: '#f59e0b' }}>注意事项</h4>
                <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: 'var(--spacing-lg)' }}>
                  <li>恢复数据将覆盖当前所有数据，操作不可逆</li>
                  <li>建议在恢复前先进行数据备份</li>
                  <li>备份文件请妥善保管，防止丢失</li>
                  <li>如遇问题，可联系技术支持</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

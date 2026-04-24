import React, { useState, useEffect } from 'react';
import { PROJECT_TYPES, COST_CATEGORIES } from '../utils/format';

const ProjectModal = ({ project, clients, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '商业广告拍摄',
    tags: '',
    client_id: '',
    order_date: new Date().toISOString().split('T')[0],
    shoot_date: '',
    delivery_deadline: '',
    status: '待确认',
    total_amount: 0,
    notes: '',
    paymentNodes: [],
    costs: []
  });

  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        type: project.type || '商业广告拍摄',
        tags: project.tags || '',
        client_id: project.client_id || '',
        order_date: project.order_date || new Date().toISOString().split('T')[0],
        shoot_date: project.shoot_date || '',
        delivery_deadline: project.delivery_deadline || '',
        status: project.status || '待确认',
        total_amount: project.total_amount || 0,
        notes: project.notes || '',
        paymentNodes: project.paymentNodes || [],
        costs: project.costs || []
      });
    }
  }, [project]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPaymentNode = () => {
    setFormData(prev => ({
      ...prev,
      paymentNodes: [
        ...prev.paymentNodes,
        { node_name: '', amount: 0, due_date: '', status: '待收款' }
      ]
    }));
  };

  const updatePaymentNode = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      paymentNodes: prev.paymentNodes.map((node, i) => 
        i === index ? { ...node, [field]: value } : node
      )
    }));
  };

  const removePaymentNode = (index) => {
    setFormData(prev => ({
      ...prev,
      paymentNodes: prev.paymentNodes.filter((_, i) => i !== index)
    }));
  };

  const addCost = () => {
    setFormData(prev => ({
      ...prev,
      costs: [
        ...prev.costs,
        { category: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0] }
      ]
    }));
  };

  const updateCost = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.map((cost, i) => 
        i === index ? { ...cost, [field]: value } : cost
      )
    }));
  };

  const removeCost = (index) => {
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.filter((_, i) => i !== index)
    }));
  };

  const getTotalCost = () => {
    return formData.costs.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入项目名称');
      return;
    }
    onSave(formData);
  };

  const tabs = [
    { id: 'basic', label: '基础信息' },
    { id: 'payment', label: '合同与回款' },
    { id: 'cost', label: '成本明细' },
    { id: 'notes', label: '备注附件' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{project ? '编辑项目' : '新建项目'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 标签页切换 */}
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-sm)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 基础信息 */}
          {activeTab === 'basic' && (
            <div>
              <div className="form-group">
                <label className="form-label">项目名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="例如：XX品牌商业广告拍摄"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">项目类型</label>
                  <select
                    className="form-input form-select"
                    value={formData.type}
                    onChange={e => handleChange('type', e.target.value)}
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">项目状态</label>
                  <select
                    className="form-input form-select"
                    value={formData.status}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    <option value="待确认">待确认</option>
                    <option value="待执行">待执行</option>
                    <option value="拍摄中">拍摄中</option>
                    <option value="交付中">交付中</option>
                    <option value="已完结">已完结</option>
                    <option value="已全额回款">已全额回款</option>
                    <option value="逾期未回款">逾期未回款</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">关联客户</label>
                <select
                  className="form-input form-select"
                  value={formData.client_id}
                  onChange={e => handleChange('client_id', e.target.value)}
                >
                  <option value="">-- 选择客户 --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">项目标签（用逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tags}
                  onChange={e => handleChange('tags', e.target.value)}
                  placeholder="例如：重要客户,高利润"
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">接单日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.order_date}
                    onChange={e => handleChange('order_date', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">拍摄日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.shoot_date}
                    onChange={e => handleChange('shoot_date', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">交付截止日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.delivery_deadline}
                    onChange={e => handleChange('delivery_deadline', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">合同总金额</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.total_amount}
                  onChange={e => handleChange('total_amount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          )}

          {/* 合同与回款 */}
          {activeTab === 'payment' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h4>收款节点</h4>
                <button className="btn btn-secondary" onClick={addPaymentNode}>
                  ➕ 添加收款节点
                </button>
              </div>

              {formData.paymentNodes.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--spacing-lg)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>暂无收款节点</p>
                  <p style={{ fontSize: '0.8rem' }}>点击上方按钮添加定金、中期款、尾款等收款节点</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {formData.paymentNodes.map((node, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px 40px', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={node.node_name}
                        onChange={e => updatePaymentNode(index, 'node_name', e.target.value)}
                        placeholder="节点名称（如：定金、中期款、尾款）"
                      />
                      <input
                        type="number"
                        className="form-input"
                        value={node.amount}
                        onChange={e => updatePaymentNode(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="金额"
                        min="0"
                      />
                      <input
                        type="date"
                        className="form-input"
                        value={node.due_date}
                        onChange={e => updatePaymentNode(index, 'due_date', e.target.value)}
                      />
                      <select
                        className="form-input form-select"
                        value={node.status}
                        onChange={e => updatePaymentNode(index, 'status', e.target.value)}
                      >
                        <option value="待收款">待收款</option>
                        <option value="已收款">已收款</option>
                      </select>
                      <button
                        className="btn btn-ghost"
                        onClick={() => removePaymentNode(index)}
                        style={{ color: '#ef4444', padding: '8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>合同总额</span>
                  <span style={{ color: '#22c55e', fontWeight: '600' }}>¥{formData.total_amount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>已收款</span>
                  <span style={{ color: '#22c55e' }}>
                    ¥{formData.paymentNodes.filter(n => n.status === '已收款').reduce((sum, n) => sum + (n.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>待收款</span>
                  <span style={{ color: '#f59e0b' }}>
                    ¥{formData.paymentNodes.filter(n => n.status !== '已收款').reduce((sum, n) => sum + (n.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 成本明细 */}
          {activeTab === 'cost' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h4>成本明细</h4>
                <button className="btn btn-secondary" onClick={addCost}>
                  ➕ 添加成本项
                </button>
              </div>

              {formData.costs.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--spacing-lg)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>暂无成本项</p>
                  <p style={{ fontSize: '0.8rem' }}>点击上方按钮添加各项成本</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {formData.costs.map((cost, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 40px', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                      <select
                        className="form-input form-select"
                        value={cost.category}
                        onChange={e => updateCost(index, 'category', e.target.value)}
                      >
                        <option value="">选择分类</option>
                        {COST_CATEGORIES.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="form-input"
                        value={cost.description}
                        onChange={e => updateCost(index, 'description', e.target.value)}
                        placeholder="备注说明"
                      />
                      <input
                        type="number"
                        className="form-input"
                        value={cost.amount}
                        onChange={e => updateCost(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="金额"
                        min="0"
                      />
                      <input
                        type="date"
                        className="form-input"
                        value={cost.date}
                        onChange={e => updateCost(index, 'date', e.target.value)}
                      />
                      <button
                        className="btn btn-ghost"
                        onClick={() => removeCost(index)}
                        style={{ color: '#ef4444', padding: '8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>合同金额</span>
                  <span style={{ color: '#22c55e', fontWeight: '600' }}>¥{formData.total_amount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>项目总成本</span>
                  <span style={{ color: '#ef4444' }}>- ¥{getTotalCost().toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '600' }}>
                  <span>项目利润</span>
                  <span style={{ color: formData.total_amount - getTotalCost() >= 0 ? '#22c55e' : '#ef4444' }}>
                    ¥{(formData.total_amount - getTotalCost()).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-sm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>利润率</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formData.total_amount > 0 ? ((formData.total_amount - getTotalCost()) / formData.total_amount * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 备注附件 */}
          {activeTab === 'notes' && (
            <div>
              <div className="form-group">
                <label className="form-label">项目备注</label>
                <textarea
                  className="form-input"
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  placeholder="输入项目相关备注信息..."
                  rows={6}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">合同/报价单附件</label>
                <div style={{ 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: 'var(--spacing-xl)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>📎</div>
                  <p>拖拽文件到此处或点击上传</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 'var(--spacing-xs)' }}>支持 PDF、图片、Word 等格式</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {project ? '保存修改' : '创建项目'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;

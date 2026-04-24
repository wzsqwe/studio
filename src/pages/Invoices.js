import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate } from '../utils/format';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadInvoices();
    loadProjects();
  }, []);

  const loadInvoices = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.getInvoices();
      if (result.success) {
        setInvoices(result.data);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!window.electronAPI) return;

    try {
      const result = await window.electronAPI.getProjects({});
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleNewInvoice = () => {
    setEditingInvoice(null);
    setShowModal(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowModal(true);
  };

  const handleSaveInvoice = async (data) => {
    try {
      let result;
      if (editingInvoice) {
        result = await window.electronAPI.dbUpdate('invoices', data, 'id = ?', [editingInvoice.id]);
      } else {
        result = await window.electronAPI.dbInsert('invoices', {
          ...data,
          id: `inv_${Date.now()}`
        });
      }

      if (result.success) {
        toast.success(editingInvoice ? '发票已更新' : '发票已添加');
        setShowModal(false);
        loadInvoices();
      } else {
        toast.error('保存失败：' + result.error);
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    if (!window.confirm('确定要删除这张发票记录吗？')) return;

    try {
      const result = await window.electronAPI.dbDelete('invoices', 'id = ?', [invoice.id]);
      if (result.success) {
        toast.success('已删除');
        loadInvoices();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 统计
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
  const thisMonth = invoices.filter(inv => {
    const invDate = new Date(inv.billing_date);
    const now = new Date();
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
  }).reduce((sum, inv) => sum + (inv.amount || 0), 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '12px' }}>加载中...</span>
      </div>
    );
  }

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1 className="page-title">🧾 发票管理</h1>
        <button className="btn btn-primary" onClick={handleNewInvoice}>
          ➕ 开具发票
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="dashboard-card">
          <div className="dashboard-card-label">累计开票金额</div>
          <div className="dashboard-card-value" style={{ color: '#3b82f6' }}>
            {formatCurrency(totalAmount)}
          </div>
          <span className="dashboard-card-icon">🧾</span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">累计税额</div>
          <div className="dashboard-card-value" style={{ color: '#f59e0b' }}>
            {formatCurrency(totalTax)}
          </div>
          <span className="dashboard-card-icon">💰</span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">本月开票</div>
          <div className="dashboard-card-value" style={{ color: '#22c55e' }}>
            {formatCurrency(thisMonth)}
          </div>
          <span className="dashboard-card-icon">📅</span>
        </div>
      </div>

      {/* 发票列表 */}
      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <h3>暂无发票记录</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
            点击右上角"开具发票"开始记录您的发票信息
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>开票日期</th>
                <th>关联项目</th>
                <th>发票金额</th>
                <th>税额</th>
                <th>发票类型</th>
                <th>受票方</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{formatDate(invoice.billing_date)}</td>
                  <td>{invoice.project_name || '-'}</td>
                  <td style={{ color: '#22c55e', fontWeight: '600' }}>
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td style={{ color: '#f59e0b' }}>
                    {formatCurrency(invoice.tax_amount)}
                  </td>
                  <td>{invoice.invoice_type || '普通发票'}</td>
                  <td>{invoice.recipient_name || '-'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEditInvoice(invoice)} style={{ padding: '4px 8px' }}>
                      编辑
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteInvoice(invoice)} style={{ padding: '4px 8px', color: '#ef4444' }}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 发票模态框 */}
      {showModal && (
        <InvoiceModal
          invoice={editingInvoice}
          projects={projects}
          onSave={handleSaveInvoice}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const InvoiceModal = ({ invoice, projects, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    amount: 0,
    tax_amount: 0,
    invoice_type: '增值税普通发票',
    billing_date: new Date().toISOString().split('T')[0],
    recipient_name: '',
    recipient_info: '',
    status: '已开票'
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        project_id: invoice.project_id || '',
        amount: invoice.amount || 0,
        tax_amount: invoice.tax_amount || 0,
        invoice_type: invoice.invoice_type || '增值税普通发票',
        billing_date: invoice.billing_date || new Date().toISOString().split('T')[0],
        recipient_name: invoice.recipient_name || '',
        recipient_info: invoice.recipient_info || '',
        status: invoice.status || '已开票'
      });
    }
  }, [invoice]);

  const handleAmountChange = (amount) => {
    const taxRate = 0.06; // 默认6%税率
    setFormData(prev => ({
      ...prev,
      amount: parseFloat(amount) || 0,
      tax_amount: parseFloat(amount) ? (parseFloat(amount) * taxRate / (1 + taxRate)).toFixed(2) : 0
    }));
  };

  const handleSubmit = () => {
    if (!formData.amount || formData.amount <= 0) {
      alert('请输入有效开票金额');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{invoice ? '编辑发票' : '开具发票'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">关联项目</label>
            <select
              className="form-input form-select"
              value={formData.project_id}
              onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
            >
              <option value="">-- 选择项目 --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">开票金额（含税）</label>
              <input
                type="number"
                className="form-input"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">税额（估算）</label>
              <input
                type="number"
                className="form-input"
                value={formData.tax_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">发票类型</label>
              <select
                className="form-input form-select"
                value={formData.invoice_type}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_type: e.target.value }))}
              >
                <option value="增值税普通发票">增值税普通发票</option>
                <option value="增值税专用发票">增值税专用发票</option>
                <option value="电子普通发票">电子普通发票</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">开票日期</label>
              <input
                type="date"
                className="form-input"
                value={formData.billing_date}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">受票方名称</label>
            <input
              type="text"
              className="form-input"
              value={formData.recipient_name}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
              placeholder="公司名称"
            />
          </div>

          <div className="form-group">
            <label className="form-label">受票方信息</label>
            <textarea
              className="form-input"
              value={formData.recipient_info}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient_info: e.target.value }))}
              placeholder="税号、地址、电话等信息"
              rows={2}
            />
          </div>

          <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>不含税金额</span>
              <span>{formatCurrency(formData.amount - formData.tax_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>税率</span>
              <span>6%</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {invoice ? '保存' : '开具发票'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoices;

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/format';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.getTransactions(filters);
      if (result.success) {
        setTransactions(result.data);
        
        // 计算汇总
        const income = result.data
          .filter(t => t.type === '收入')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = result.data
          .filter(t => t.type === '支出')
          .reduce((sum, t) => sum + t.amount, 0);
        setSummary({ income, expense, balance: income - expense });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setShowModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleSaveTransaction = async (data) => {
    try {
      const result = await window.electronAPI.dbInsert('transactions', {
        id: data.id || `txn_${Date.now()}`,
        type: data.type,
        category: data.category,
        amount: data.amount,
        date: data.date,
        project_id: data.project_id || null,
        description: data.description || ''
      });

      if (result.success) {
        toast.success(editingTransaction ? '更新成功' : '添加成功');
        setShowModal(false);
        loadTransactions();
      } else {
        toast.error('保存失败：' + result.error);
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;

    try {
      const result = await window.electronAPI.dbDelete('transactions', 'id = ?', [transaction.id]);
      if (result.success) {
        toast.success('已删除');
        loadTransactions();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '12px' }}>加载中...</span>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">💰 收支流水管理</h1>
        <button className="btn btn-primary" onClick={handleNewTransaction}>
          ➕ 录入收支
        </button>
      </div>

      {/* 汇总卡片 */}
      <div className="grid-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="dashboard-card">
          <div className="dashboard-card-label">收入总计</div>
          <div className="dashboard-card-value" style={{ color: '#22c55e' }}>
            {formatCurrency(summary.income)}
          </div>
          <span className="dashboard-card-icon">📈</span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">支出总计</div>
          <div className="dashboard-card-value" style={{ color: '#ef4444' }}>
            {formatCurrency(summary.expense)}
          </div>
          <span className="dashboard-card-icon">📉</span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">结余</div>
          <div className="dashboard-card-value" style={{ color: summary.balance >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(summary.balance)}
          </div>
          <span className="dashboard-card-icon">💵</span>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '120px' }}>
            <select
              className="form-input form-select"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">全部类型</option>
              <option value="收入">收入</option>
              <option value="支出">支出</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <select
              className="form-input form-select"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">全部分类</option>
              <option value="项目定金">项目定金</option>
              <option value="项目中期款">项目中期款</option>
              <option value="项目尾款">项目尾款</option>
              <option value="后期外包收入">后期外包收入</option>
              <option value="器材租赁收入">器材租赁收入</option>
              <option value="变动成本">变动成本</option>
              <option value="固定成本">固定成本</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <span style={{ color: 'var(--text-muted)' }}>至</span>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* 流水列表 */}
      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <h3>暂无收支记录</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
            点击右上角"录入收支"开始记录您的每一笔资金流动
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>日期</th>
                <th>类型</th>
                <th>分类</th>
                <th>金额</th>
                <th>关联项目</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id}>
                  <td>{formatDate(txn.date)}</td>
                  <td>
                    <span className={`tag ${txn.type === '收入' ? 'tag-success' : 'tag-danger'}`}>
                      {txn.type === '收入' ? '↑' : '↓'} {txn.type}
                    </span>
                  </td>
                  <td>{txn.category}</td>
                  <td style={{ color: txn.type === '收入' ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                    {txn.type === '收入' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </td>
                  <td>{txn.project_name || '-'}</td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {txn.description || '-'}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEditTransaction(txn)} style={{ padding: '4px 8px' }}>
                      编辑
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTransaction(txn)} style={{ padding: '4px 8px', color: '#ef4444' }}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 录入模态框 */}
      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const TransactionModal = ({ transaction, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    type: '收入',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description || ''
      });
    }
  }, [transaction]);

  const categories = formData.type === '收入' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = () => {
    if (!formData.amount || formData.amount <= 0) {
      alert('请输入有效金额');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{transaction ? '编辑收支' : '录入收支'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">收支类型</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="type"
                  value="收入"
                  checked={formData.type === '收入'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, category: '' }))}
                />
                <span style={{ color: '#22c55e' }}>↑ 收入</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="type"
                  value="支出"
                  checked={formData.type === '支出'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, category: '' }))}
                />
                <span style={{ color: '#ef4444' }}>↓ 支出</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">分类</label>
            <select
              className="form-input form-select"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">选择分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">金额</label>
            <input
              type="number"
              className="form-input"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">日期</label>
            <input
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">备注说明</label>
            <textarea
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="输入备注信息..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {transaction ? '保存' : '录入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;

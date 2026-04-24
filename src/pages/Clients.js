import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate, CLIENT_TYPES } from '../utils/format';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [filterBlacklist, setFilterBlacklist] = useState(false);

  useEffect(() => {
    loadClients();
  }, [filterBlacklist]);

  const loadClients = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.getClients();
      if (result.success) {
        let filteredClients = result.data;
        if (filterBlacklist) {
          filteredClients = filteredClients.filter(c => c.is_blacklist);
        } else {
          filteredClients = filteredClients.filter(c => !c.is_blacklist);
        }
        setClients(filteredClients);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleSaveClient = async (data) => {
    try {
      let result;
      if (editingClient) {
        result = await window.electronAPI.dbUpdate('clients', data, 'id = ?', [editingClient.id]);
      } else {
        result = await window.electronAPI.dbInsert('clients', {
          ...data,
          id: `client_${Date.now()}`
        });
      }

      if (result.success) {
        toast.success(editingClient ? '客户已更新' : '客户已添加');
        setShowModal(false);
        loadClients();
      } else {
        toast.error('保存失败：' + result.error);
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleToggleBlacklist = async (client) => {
    const newStatus = client.is_blacklist ? 0 : 1;
    const message = newStatus ? '确定要将该客户加入黑名单吗？' : '确定要移除该客户出黑名单吗？';

    if (!window.confirm(message)) return;

    try {
      const result = await window.electronAPI.dbUpdate('clients', { is_blacklist: newStatus }, 'id = ?', [client.id]);
      if (result.success) {
        toast.success(newStatus ? '已加入黑名单' : '已移除黑名单');
        loadClients();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`确定要删除客户"${client.name}"吗？`)) return;

    try {
      const result = await window.electronAPI.dbDelete('clients', 'id = ?', [client.id]);
      if (result.success) {
        toast.success('已删除');
        loadClients();
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
    <div className="clients-page">
      <div className="page-header">
        <h1 className="page-title">👥 客户管理</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterBlacklist}
              onChange={(e) => setFilterBlacklist(e.target.checked)}
            />
            <span>显示黑名单客户</span>
          </label>
          <button className="btn btn-primary" onClick={handleNewClient}>
            ➕ 新建客户
          </button>
        </div>
      </div>

      {/* 客户列表 */}
      {clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>{filterBlacklist ? '暂无黑名单客户' : '暂无客户'}</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
            {filterBlacklist ? '所有客户都表现良好' : '点击右上角"新建客户"开始添加您的客户档案'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-md)' }}>
          {clients.map(client => (
            <div key={client.id} className="card animate-fade-in" style={{ position: 'relative' }}>
              {client.is_blacklist && (
                <div style={{ position: 'absolute', top: 'var(--spacing-md)', right: 'var(--spacing-md)' }}>
                  <span className="tag tag-danger">⚠️ 黑名单</span>
                </div>
              )}

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                  {client.name}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                  <span className="tag tag-primary">{client.type || '个人客户'}</span>
                  {client.tags && client.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                    <span key={i} className="tag" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="project-card-info" style={{ marginBottom: 'var(--spacing-md)' }}>
                <div className="project-card-info-item">
                  <span className="info-label">累计消费</span>
                  <span className="info-value" style={{ color: '#22c55e' }}>
                    {formatCurrency(client.totalAmount)}
                  </span>
                </div>
                <div className="project-card-info-item">
                  <span className="info-label">合作项目</span>
                  <span className="info-value">{client.projectCount} 个</span>
                </div>
                <div className="project-card-info-item">
                  <span className="info-label">最近合作</span>
                  <span className="info-value">{formatDate(client.lastProjectDate)}</span>
                </div>
                <div className="project-card-info-item">
                  <span className="info-label">联系方式</span>
                  <span className="info-value">{client.contact || '-'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  创建于 {formatDate(client.created_at)}
                </span>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEditClient(client)} style={{ padding: '4px 8px' }}>
                    编辑
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleBlacklist(client)}
                    style={{ padding: '4px 8px', color: client.is_blacklist ? '#22c55e' : '#ef4444' }}
                  >
                    {client.is_blacklist ? '移除黑名单' : '拉黑'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteClient(client)} style={{ padding: '4px 8px', color: '#ef4444' }}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 客户编辑模态框 */}
      {showModal && (
        <ClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const ClientModal = ({ client, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    type: '个人客户',
    tags: '',
    contact_person: '',
    is_blacklist: 0
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        contact: client.contact || '',
        type: client.type || '个人客户',
        tags: client.tags || '',
        contact_person: client.contact_person || '',
        is_blacklist: client.is_blacklist || 0
      });
    }
  }, [client]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入客户名称');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{client ? '编辑客户' : '新建客户'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">客户名称 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="公司名/姓名"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">客户类型</label>
              <select
                className="form-input form-select"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                {CLIENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">联系方式</label>
              <input
                type="text"
                className="form-input"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="手机/微信/邮箱"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">对接人</label>
            <input
              type="text"
              className="form-input"
              value={formData.contact_person}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
              placeholder="主要联系人姓名"
            />
          </div>

          <div className="form-group">
            <label className="form-label">客户标签（用逗号分隔）</label>
            <input
              type="text"
              className="form-input"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="例如：重要客户,长期合作"
            />
          </div>

          {client && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_blacklist === 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_blacklist: e.target.checked ? 1 : 0 }))}
                />
                <span style={{ color: '#ef4444' }}>加入黑名单</span>
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                黑名单客户在新建项目时会弹出提醒
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {client ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clients;

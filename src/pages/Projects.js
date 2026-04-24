import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate, getStatusClass, getStatusColor, PROJECT_TYPES, COST_CATEGORIES } from '../utils/format';
import ProjectModal from '../components/ProjectModal';

const Projects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: '',
    client_id: '',
    startDate: '',
    endDate: ''
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadProjects();
    loadClients();
    
    if (searchParams.get('action') === 'new') {
      setShowModal(true);
    }
  }, [searchParams]);

  const loadProjects = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.getProjects(filters);
      if (result.success) {
        let sortedProjects = [...result.data];
        sortedProjects.sort((a, b) => {
          let aVal = a[sortBy];
          let bVal = b[sortBy];
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          }
          return aVal < bVal ? 1 : -1;
        });
        setProjects(sortedProjects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.getClients();
      if (result.success) {
        setClients(result.data);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadProjects();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`确定要删除项目"${project.name}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteProject(project.id);
      if (result.success) {
        toast.success('项目已删除');
        loadProjects();
      } else {
        toast.error('删除失败：' + result.error);
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleSaveProject = async (projectData) => {
    try {
      let result;
      if (editingProject) {
        result = await window.electronAPI.updateProject(editingProject.id, projectData);
      } else {
        result = await window.electronAPI.createProject(projectData);
      }

      if (result.success) {
        toast.success(editingProject ? '项目已更新' : '项目已创建');
        setShowModal(false);
        loadProjects();
      } else {
        toast.error('保存失败：' + result.error);
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-tag ${getStatusClass(status)}`}>
        {status}
      </span>
    );
  };

  const calculatePaymentStatus = (project) => {
    if (!project.paymentNodes || project.paymentNodes.length === 0) {
      return { paid: 0, total: project.total_amount || 0, progress: 0 };
    }
    const total = project.paymentNodes.reduce((sum, node) => sum + (node.amount || 0), 0);
    const paid = project.paymentNodes
      .filter(node => node.status === '已收款')
      .reduce((sum, node) => sum + (node.amount || 0), 0);
    const progress = total > 0 ? (paid / total) * 100 : 0;
    return { paid, total, progress };
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
    <div className="projects-page">
      <div className="page-header">
        <h1 className="page-title">📁 摄影项目管理</h1>
        <button className="btn btn-primary" onClick={handleNewProject}>
          ➕ 新建项目
        </button>
      </div>

      {/* 筛选器 */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <select 
              className="form-input form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="待确认">待确认</option>
              <option value="待执行">待执行</option>
              <option value="拍摄中">拍摄中</option>
              <option value="交付中">交付中</option>
              <option value="已完结">已完结</option>
              <option value="已全额回款">已全额回款</option>
              <option value="逾期未回款">逾期未回款</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <select 
              className="form-input form-select"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">全部类型</option>
              {PROJECT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <select 
              className="form-input form-select"
              value={filters.client_id}
              onChange={(e) => handleFilterChange('client_id', e.target.value)}
            >
              <option value="">全部客户</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <input 
              type="date" 
              className="form-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              placeholder="开始日期"
            />
          </div>

          <span style={{ color: 'var(--text-muted)' }}>至</span>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <input 
              type="date" 
              className="form-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              placeholder="结束日期"
            />
          </div>

          <button className="btn btn-primary" onClick={handleApplyFilters}>
            🔍 应用筛选
          </button>

          <button 
            className="btn btn-ghost"
            onClick={() => {
              setFilters({ status: '', type: '', client_id: '', startDate: '', endDate: '' });
            }}
          >
            🔄 重置
          </button>
        </div>
      </div>

      {/* 项目列表 */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>暂无项目</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
            点击右上角"新建项目"开始添加您的第一个摄影项目
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--spacing-md)' }}>
          {projects.map(project => {
            const paymentStatus = calculatePaymentStatus(project);
            return (
              <div key={project.id} className="project-card animate-fade-in" onClick={() => handleEditProject(project)}>
                <div className="project-card-header">
                  <div>
                    <div className="project-card-title">{project.name}</div>
                    <div className="project-card-client">
                      {project.client_name || '未关联客户'}
                    </div>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                  <span className="tag tag-primary">{project.type}</span>
                  {project.tags && project.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                    <span key={i} className="tag" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>

                <div className="project-card-info">
                  <div className="project-card-info-item">
                    <span className="info-label">合同金额</span>
                    <span className="info-value" style={{ color: '#22c55e' }}>
                      {formatCurrency(project.total_amount)}
                    </span>
                  </div>
                  <div className="project-card-info-item">
                    <span className="info-label">项目成本</span>
                    <span className="info-value" style={{ color: '#ef4444' }}>
                      {formatCurrency(project.total_cost)}
                    </span>
                  </div>
                  <div className="project-card-info-item">
                    <span className="info-label">项目利润</span>
                    <span className="info-value" style={{ color: project.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {formatCurrency(project.profit)}
                    </span>
                  </div>
                  <div className="project-card-info-item">
                    <span className="info-label">利润率</span>
                    <span className="info-value" style={{ color: getStatusColor(project.profit_rate >= 0 ? '已完结' : '逾期未回款') }}>
                      {project.profit_rate?.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>回款进度</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(paymentStatus.paid)} / {formatCurrency(paymentStatus.total)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${paymentStatus.progress}%` }}></div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                  <div>📅 接单日期: {formatDate(project.order_date)}</div>
                  <div>📷 拍摄日期: {formatDate(project.shoot_date)}</div>
                  <div>📦 交付截止: {formatDate(project.delivery_deadline)}</div>
                </div>

                <div className="project-card-footer">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    创建于 {formatDate(project.created_at)}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    >
                      编辑
                    </button>
                    {!project.is_locked && (
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project); }}
                        style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#ef4444' }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 项目编辑模态框 */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          clients={clients}
          onSave={handleSaveProject}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Projects;

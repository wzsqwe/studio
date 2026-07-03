import { useState, useEffect } from 'react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '', type: '商业拍摄', client_name: '', total_amount: '', status: '进行中',
    order_date: '', shoot_date: '', delivery_deadline: '', profit_rate: '', notes: ''
  });

  useEffect(() => { fetchProjects(); }, [filters]);

  const fetchProjects = async () => {
    const result = await window.electronAPI.getProjects(filters);
    if (result.success) setProjects(result.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const project = { ...projectForm, id: editingProject?.id || 'p' + Date.now(), total_amount: parseFloat(projectForm.total_amount) || 0, profit_rate: parseFloat(projectForm.profit_rate) || 0 };
    if (editingProject) await window.electronAPI.dbUpdate('projects', project, 'id = ?', [project.id]);
    else await window.electronAPI.dbInsert('projects', project);
    setShowModal(false);
    setEditingProject(null);
    setProjectForm({ name: '', type: '商业拍摄', client_name: '', total_amount: '', status: '进行中', order_date: '', shoot_date: '', delivery_deadline: '', profit_rate: '', notes: '' });
    fetchProjects();
  };

  const handleEdit = (project) => { setEditingProject(project); setProjectForm(project); setShowModal(true); };
  const handleDelete = async (id) => { if (confirm('确定删除该项目？')) { await window.electronAPI.dbDelete('projects', 'id = ?', [id]); fetchProjects(); } };

  const statusBadge = (status) => {
    const map = { '已完结': 'badge-completed', '进行中': 'badge-progress', '待收款': 'badge-pending', '待确认': 'badge-overdue' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h2>项目管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新建项目</button>
      </div>
      <div className="filter-bar">
        <input type="text" placeholder="搜索项目..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option><option value="进行中">进行中</option><option value="已完结">已完结</option><option value="待收款">待收款</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">全部类型</option><option value="商业拍摄">商业拍摄</option><option value="产品拍摄">产品拍摄</option><option value="个人写真">个人写真</option><option value="后期制作">后期制作</option>
        </select>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>项目名称</th><th>客户</th><th>类型</th><th>金额</th><th>利润率</th><th>状态</th><th>拍摄日期</th><th>操作</th></tr></thead>
          <tbody>
            {projects.map(p => <tr key={p.id}>
              <td>{p.name}</td><td>{p.client_name}</td><td>{p.type}</td><td>¥{p.total_amount?.toLocaleString()}</td><td>{p.profit_rate}%</td>
              <td>{statusBadge(p.status)}</td><td>{p.shoot_date}</td>
              <td><button className="btn btn-secondary" onClick={() => handleEdit(p)}>编辑</button><button className="btn btn-danger" onClick={() => handleDelete(p.id)}>删除</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>{editingProject ? '编辑项目' : '新建项目'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>项目名称</label><input type="text" required value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></div>
            <div className="form-group"><label>客户名称</label><input type="text" required value={projectForm.client_name} onChange={(e) => setProjectForm({ ...projectForm, client_name: e.target.value })} /></div>
            <div className="form-group"><label>项目类型</label><select value={projectForm.type} onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })}>
              <option value="商业拍摄">商业拍摄</option><option value="产品拍摄">产品拍摄</option><option value="个人写真">个人写真</option><option value="后期制作">后期制作</option><option value="实验拍摄">实验拍摄</option>
            </select></div>
            <div className="form-group"><label>总金额</label><input type="number" required value={projectForm.total_amount} onChange={(e) => setProjectForm({ ...projectForm, total_amount: e.target.value })} /></div>
            <div className="form-group"><label>利润率</label><input type="number" value={projectForm.profit_rate} onChange={(e) => setProjectForm({ ...projectForm, profit_rate: e.target.value })} /></div>
            <div className="form-group"><label>状态</label><select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>
              <option value="待确认">待确认</option><option value="进行中">进行中</option><option value="已完结">已完结</option><option value="待收款">待收款</option>
            </select></div>
            <div className="form-group"><label>下单日期</label><input type="date" value={projectForm.order_date} onChange={(e) => setProjectForm({ ...projectForm, order_date: e.target.value })} /></div>
            <div className="form-group"><label>拍摄日期</label><input type="date" value={projectForm.shoot_date} onChange={(e) => setProjectForm({ ...projectForm, shoot_date: e.target.value })} /></div>
            <div className="form-group"><label>交付截止</label><input type="date" value={projectForm.delivery_deadline} onChange={(e) => setProjectForm({ ...projectForm, delivery_deadline: e.target.value })} /></div>
            <div className="form-group"><label>备注</label><textarea value={projectForm.notes} onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })} /></div>
            <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>取消</button><button className="btn btn-primary" type="submit">保存</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
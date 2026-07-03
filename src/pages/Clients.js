import { useState, useEffect } from 'react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({ name: '', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' });

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const result = await window.electronAPI.getClients();
    if (result.success) setClients(result.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const client = { ...clientForm, id: editingClient?.id || 'c' + Date.now() };
    if (editingClient) await window.electronAPI.dbUpdate('clients', client, 'id = ?', [client.id]);
    else await window.electronAPI.dbInsert('clients', client);
    setShowModal(false);
    setEditingClient(null);
    setClientForm({ name: '', type: '企业客户', contact: '', phone: '', email: '', address: '', notes: '' });
    fetchClients();
  };

  const handleEdit = (client) => { setEditingClient(client); setClientForm(client); setShowModal(true); };
  const handleDelete = async (id) => { if (confirm('确定删除该客户？')) { await window.electronAPI.dbDelete('clients', 'id = ?', [id]); fetchClients(); } };

  return (
    <div>
      <div className="page-header">
        <h2>客户管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新建客户</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>客户名称</th><th>类型</th><th>联系人</th><th>电话</th><th>邮箱</th><th>操作</th></tr></thead>
          <tbody>
            {clients.map(c => <tr key={c.id}>
              <td>{c.name}</td><td>{c.type}</td><td>{c.contact || '-'}</td><td>{c.phone || '-'}</td><td>{c.email || '-'}</td>
              <td><button className="btn btn-secondary" onClick={() => handleEdit(c)}>编辑</button><button className="btn btn-danger" onClick={() => handleDelete(c.id)}>删除</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>{editingClient ? '编辑客户' : '新建客户'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>客户名称</label><input type="text" required value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} /></div>
            <div className="form-group"><label>客户类型</label><select value={clientForm.type} onChange={(e) => setClientForm({ ...clientForm, type: e.target.value })}>
              <option value="企业客户">企业客户</option><option value="机构客户">机构客户</option><option value="媒体客户">媒体客户</option><option value="个人客户">个人客户</option>
            </select></div>
            <div className="form-group"><label>联系人</label><input type="text" value={clientForm.contact} onChange={(e) => setClientForm({ ...clientForm, contact: e.target.value })} /></div>
            <div className="form-group"><label>电话</label><input type="tel" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} /></div>
            <div className="form-group"><label>邮箱</label><input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} /></div>
            <div className="form-group"><label>地址</label><input type="text" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} /></div>
            <div className="form-group"><label>备注</label><textarea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} /></div>
            <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>取消</button><button className="btn btn-primary" type="submit">保存</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
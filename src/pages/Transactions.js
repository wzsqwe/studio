import { useState, useEffect } from 'react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [txnForm, setTxnForm] = useState({ type: '收入', category: '项目收入', amount: '', date: new Date().toISOString().slice(0, 10), project_id: '', description: '' });

  useEffect(() => { fetchTransactions(); }, [filters]);

  const fetchTransactions = async () => {
    const result = await window.electronAPI.getTransactions(filters);
    if (result.success) setTransactions(result.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const txn = { ...txnForm, id: editingTxn?.id || 't' + Date.now(), amount: parseFloat(txnForm.amount) || 0 };
    if (editingTxn) await window.electronAPI.dbUpdate('transactions', txn, 'id = ?', [txn.id]);
    else await window.electronAPI.dbInsert('transactions', txn);
    setShowModal(false);
    setEditingTxn(null);
    setTxnForm({ type: '收入', category: '项目收入', amount: '', date: new Date().toISOString().slice(0, 10), project_id: '', description: '' });
    fetchTransactions();
  };

  const handleEdit = (txn) => { setEditingTxn(txn); setTxnForm(txn); setShowModal(true); };
  const handleDelete = async (id) => { if (confirm('确定删除该记录？')) { await window.electronAPI.dbDelete('transactions', 'id = ?', [id]); fetchTransactions(); } };

  const categories = {
    '收入': ['项目收入', '被动收入', '其他收入'],
    '支出': ['器材费用', '场地费用', '后期制作', '差旅费用', '其他费用']
  };

  return (
    <div>
      <div className="page-header">
        <h2>交易记录</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增记录</button>
      </div>
      <div className="filter-bar">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">全部类型</option><option value="收入">收入</option><option value="支出">支出</option>
        </select>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">全部类别</option>
          {filters.type && categories[filters.type]?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>日期</th><th>类型</th><th>类别</th><th>金额</th><th>项目</th><th>备注</th><th>操作</th></tr></thead>
          <tbody>
            {transactions.map(t => <tr key={t.id}>
              <td>{t.date}</td><td><span className={`badge ${t.type === '收入' ? 'badge-completed' : 'badge-overdue'}`}>{t.type}</span></td>
              <td>{t.category}</td><td className={t.type === '收入' ? 'text-green-600' : 'text-red-600'}>{t.type === '收入' ? '+' : '-'}¥{t.amount?.toLocaleString()}</td>
              <td>{t.project_id || '-'}</td><td>{t.description || '-'}</td>
              <td><button className="btn btn-secondary" onClick={() => handleEdit(t)}>编辑</button><button className="btn btn-danger" onClick={() => handleDelete(t.id)}>删除</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>{editingTxn ? '编辑记录' : '新增记录'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>类型</label><select value={txnForm.type} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value, category: categories[e.target.value][0] })}>
              <option value="收入">收入</option><option value="支出">支出</option>
            </select></div>
            <div className="form-group"><label>类别</label><select value={txnForm.category} onChange={(e) => setTxnForm({ ...txnForm, category: e.target.value })}>
              {categories[txnForm.type]?.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
            <div className="form-group"><label>金额</label><input type="number" required value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })} /></div>
            <div className="form-group"><label>日期</label><input type="date" required value={txnForm.date} onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })} /></div>
            <div className="form-group"><label>关联项目ID</label><input type="text" value={txnForm.project_id} onChange={(e) => setTxnForm({ ...txnForm, project_id: e.target.value })} /></div>
            <div className="form-group"><label>备注</label><textarea value={txnForm.description} onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })} /></div>
            <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>取消</button><button className="btn btn-primary" type="submit">保存</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
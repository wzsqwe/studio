import { useState, useEffect } from 'react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    const result = await window.electronAPI.getInvoices();
    if (result.success) setInvoices(result.data);
  };

  const statusBadge = (status) => {
    const map = { '已完成': 'badge-completed', '待完成': 'badge-progress', '待收款': 'badge-pending' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header"><h2>发票管理</h2></div>
      <div className="card">
        <table className="table">
          <thead><tr><th>项目名称</th><th>客户</th><th>金额</th><th>已收款</th><th>状态</th><th>利润率</th></tr></thead>
          <tbody>
            {invoices.map(i => <tr key={i.id}>
              <td>{i.project_name}</td><td>{i.client_name}</td><td>¥{i.amount?.toLocaleString()}</td><td>¥{i.paid_amount?.toLocaleString()}</td>
              <td>{statusBadge(i.status)}</td><td>{i.profit_rate}%</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
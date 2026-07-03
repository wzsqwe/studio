import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await window.electronAPI.getDashboardData();
      if (result.success) setData(result.data);
    };
    fetchData();
  }, []);

  if (!data) return <div className="card"><p>加载中...</p></div>;

  const lineChartData = {
    labels: data.sixMonthData.map(d => d.month),
    datasets: [{
      label: '收入', data: data.sixMonthData.map(d => d.income),
      borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4
    }, {
      label: '利润', data: data.sixMonthData.map(d => d.profit),
      borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.1)', fill: true, tension: 0.4
    }]
  };

  const doughnutData = {
    labels: data.costBreakdown.map(c => c.category),
    datasets: [{ data: data.costBreakdown.map(c => c.total), backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'] }]
  };

  const typeChartData = {
    labels: data.typeIncome.map(t => t.type),
    datasets: [{ data: data.typeIncome.map(t => t.total), backgroundColor: ['#667eea', '#22c55e', '#f97316', '#3b82f6', '#ec4899'] }]
  };

  return (
    <div>
      <div className="page-header"><h2>数据总览</h2></div>
      <div className="stats-grid">
        <div className="stat-card income"><div className="stat-label">本月收入</div><div className="stat-value">¥{data.monthIncome.toLocaleString()}</div></div>
        <div className="stat-card expense"><div className="stat-label">本月支出</div><div className="stat-value">¥{data.monthExpense.toLocaleString()}</div></div>
        <div className="stat-card profit"><div className="stat-label">本月利润</div><div className="stat-value">¥{data.monthProfit.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">项目总数</div><div className="stat-value">{data.projectCount}</div></div>
        <div className="stat-card"><div className="stat-label">客户总数</div><div className="stat-value">{data.clientCount}</div></div>
        <div className="stat-card"><div className="stat-label">待收款</div><div className="stat-value">¥{data.pendingPayment.toLocaleString()}</div></div>
      </div>
      <div className="card">
        <h3 className="card-title">近6个月收支趋势</h3>
        <div className="chart-container"><Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
      </div>
      <div className="card">
        <h3 className="card-title">成本分布</h3>
        <div className="chart-container"><Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
      </div>
      <div className="card">
        <h3 className="card-title">项目类型收入</h3>
        <div className="chart-container"><Doughnut data={typeChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
      </div>
      <div className="card">
        <h3 className="card-title">利润排名前5项目</h3>
        <table className="table">
          <thead><tr><th>项目名称</th><th>客户</th><th>金额</th><th>利润率</th></tr></thead>
          <tbody>
            {data.profitRanking.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.client_name}</td><td>¥{p.total_amount?.toLocaleString()}</td><td>{p.profit_rate}%</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
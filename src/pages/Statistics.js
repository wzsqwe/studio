import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Statistics() {
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState(null);

  useEffect(() => { fetchStats(); }, [period]);

  const fetchStats = async () => {
    const result = await window.electronAPI.getStatistics(period);
    if (result.success) setStats(result.data);
  };

  if (!stats) return <div className="card"><p>加载中...</p></div>;

  const monthlyChartData = {
    labels: stats.monthlyData.map(d => d.month),
    datasets: [{ label: '项目数', data: stats.monthlyData.map(d => d.projects), backgroundColor: '#667eea' },
               { label: '收入', data: stats.monthlyData.map(d => d.income / 1000), backgroundColor: '#22c55e' },
               { label: '支出', data: stats.monthlyData.map(d => d.expense / 1000), backgroundColor: '#ef4444' }]
  };

  const weeklyChartData = {
    labels: stats.weeklyData.map(d => d.day),
    datasets: [{ label: '项目数', data: stats.weeklyData.map(d => d.projects), backgroundColor: '#667eea' },
               { label: '收入', data: stats.weeklyData.map(d => d.income / 1000), backgroundColor: '#22c55e' }]
  };

  return (
    <div>
      <div className="page-header">
        <h2>数据统计</h2>
        <div className="filter-bar">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">本月</option><option value="quarter">本季度</option><option value="year">本年</option>
          </select>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">项目总数</div><div className="stat-value">{stats.totalProjects}</div></div>
        <div className="stat-card income"><div className="stat-label">总收入</div><div className="stat-value">¥{stats.totalIncome.toLocaleString()}</div></div>
        <div className="stat-card expense"><div className="stat-label">总支出</div><div className="stat-value">¥{stats.totalExpense.toLocaleString()}</div></div>
        <div className="stat-card profit"><div className="stat-label">净利润</div><div className="stat-value">¥{stats.profit.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">利润率</div><div className="stat-value">{stats.profitRate.toFixed(1)}%</div></div>
        <div className="stat-card"><div className="stat-label">平均项目金额</div><div className="stat-value">¥{stats.avgProjectAmount.toLocaleString()}</div></div>
      </div>
      <div className="card">
        <h3 className="card-title">月度项目与收支统计</h3>
        <div className="chart-container"><Bar data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
      </div>
      <div className="card">
        <h3 className="card-title">周工作分布统计</h3>
        <div className="chart-container"><Bar data={weeklyChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
      </div>
      <div className="card">
        <h3 className="card-title">项目类型分布</h3>
        <table className="table">
          <thead><tr><th>类型</th><th>数量</th><th>占比</th></tr></thead>
          <tbody>
            {Object.entries(stats.projectTypes).map(([type, count]) => <tr key={type}><td>{type}</td><td>{count}</td><td>{((count / stats.totalProjects) * 100).toFixed(1)}%</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
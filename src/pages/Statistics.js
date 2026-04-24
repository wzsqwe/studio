import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.getStatistics(period);
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    toast.success(`已准备导出 ${type} 报表`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '12px' }}>加载中...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📈</div>
        <h3>暂无数据</h3>
        <p style={{ color: 'var(--text-muted)' }}>录入项目数据后即可查看统计报表</p>
      </div>
    );
  }

  const periodLabel = {
    month: '本月',
    quarter: '本季度',
    year: '本年'
  };

  // 成本构成图表
  const costChartData = {
    labels: data.costBreakdown?.map(c => c.category) || [],
    datasets: [{
      data: data.costBreakdown?.map(c => c.total) || [],
      backgroundColor: [
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
        '#f59e0b',
        '#22c55e',
        '#06b6d4',
        '#ef4444',
        '#64748b'
      ],
      borderWidth: 0
    }]
  };

  const costChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          padding: 10,
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1 className="page-title">📊 经营统计分析</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <select
            className="form-input form-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="month">本月</option>
            <option value="quarter">本季度</option>
            <option value="year">本年</option>
          </select>
          <button className="btn btn-secondary" onClick={() => handleExport('Excel')}>
            📥 导出Excel
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('PDF')}>
            📄 导出PDF
          </button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="stats-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-label">{periodLabel[period]}总收入</div>
          <div className="dashboard-card-value" style={{ color: '#22c55e' }}>
            {formatCurrency(data.totalIncome)}
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">{periodLabel[period]}总支出</div>
          <div className="dashboard-card-value" style={{ color: '#ef4444' }}>
            {formatCurrency(data.totalExpense)}
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">{periodLabel[period]}净利润</div>
          <div className="dashboard-card-value" style={{ color: data.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(data.netProfit)}
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">净利润率</div>
          <div className="dashboard-card-value" style={{ color: data.totalIncome > 0 ? '#3b82f6' : '#94a3b8' }}>
            {data.totalIncome > 0 ? (data.netProfit / data.totalIncome * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* 项目统计 */}
      <div className="grid-2" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="dashboard-card">
          <div className="dashboard-card-label">{periodLabel[period]}项目数</div>
          <div className="dashboard-card-value" style={{ color: '#8b5cf6' }}>
            {data.projectCount}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '4px' }}>个</span>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">平均客单价</div>
          <div className="dashboard-card-value" style={{ color: '#06b6d4' }}>
            {formatCurrency(data.avgProjectAmount)}
          </div>
        </div>
      </div>

      {/* 盈亏平衡点 */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>⚖️ 盈亏平衡分析</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-lg)' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>月度固定成本</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {formatCurrency(data.monthlyFixedCost)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>盈亏平衡点</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
              {formatCurrency(data.breakEvenPoint)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>当前状态</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: data.totalIncome >= data.breakEvenPoint ? '#22c55e' : '#ef4444' }}>
              {data.totalIncome >= data.breakEvenPoint ? '✅ 盈利' : '❌ 亏损'}
            </p>
          </div>
        </div>
      </div>

      {/* 成本构成分析 */}
      <div className="grid-2" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="chart-container">
          <h3 className="chart-title">💸 成本构成分析</h3>
          <div className="chart-wrapper">
            {data.costBreakdown && data.costBreakdown.length > 0 ? (
              <Doughnut data={costChartData} options={costChartOptions} />
            ) : (
              <div className="empty-state">
                <p>暂无成本数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">📋 成本明细</h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {data.costBreakdown && data.costBreakdown.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>成本分类</th>
                    <th>金额</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  {data.costBreakdown.map((cost, index) => (
                    <tr key={index}>
                      <td>{cost.category}</td>
                      <td style={{ color: '#ef4444' }}>{formatCurrency(cost.total)}</td>
                      <td>
                        {data.totalExpense > 0 ? (cost.total / data.totalExpense * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>暂无成本明细</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 项目盈利排行 */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>🏆 项目盈利排行 TOP 10</h3>
        {data.profitRanking && data.profitRanking.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>排名</th>
                <th>项目名称</th>
                <th>类型</th>
                <th>合同金额</th>
                <th>成本</th>
                <th>利润</th>
                <th>利润率</th>
              </tr>
            </thead>
            <tbody>
              {data.profitRanking.map((project, index) => (
                <tr key={index}>
                  <td>
                    {index === 0 && <span style={{ color: '#fbbf24' }}>🥇</span>}
                    {index === 1 && <span style={{ color: '#94a3b8' }}>🥈</span>}
                    {index === 2 && <span style={{ color: '#cd7f32' }}>🥉</span>}
                    {index > 2 && <span>{index + 1}</span>}
                  </td>
                  <td style={{ fontWeight: '500' }}>{project.name}</td>
                  <td>{project.type}</td>
                  <td style={{ color: '#22c55e' }}>{formatCurrency(project.total_amount)}</td>
                  <td style={{ color: '#ef4444' }}>{formatCurrency(project.total_cost)}</td>
                  <td style={{ color: project.profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                    {formatCurrency(project.profit)}
                  </td>
                  <td>
                    <span style={{ 
                      color: project.profit_rate >= 30 ? '#22c55e' : project.profit_rate >= 15 ? '#f59e0b' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      {project.profit_rate?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>暂无项目数据</p>
          </div>
        )}
      </div>

      {/* 回款分析 */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>💰 回款情况分析</h3>
        <div className="grid-3" style={{ marginBottom: 'var(--spacing-md)' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>总收款节点</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.paymentAnalysis?.total_nodes || 0}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>已收款</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>{data.paymentAnalysis?.paid_nodes || 0}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>逾期未收</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>{data.paymentAnalysis?.overdue_nodes || 0}</p>
          </div>
        </div>
        {data.paymentAnalysis && data.paymentAnalysis.total_nodes > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>回款完成率</span>
              <span style={{ fontSize: '0.85rem' }}>
                {((data.paymentAnalysis.paid_nodes / data.paymentAnalysis.total_nodes) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: '10px' }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(data.paymentAnalysis.paid_nodes / data.paymentAnalysis.total_nodes) * 100}%`,
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;

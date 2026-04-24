import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { formatNumber, formatCurrency } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ aiPanelOpen }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    monthIncome: 0,
    monthProfit: 0,
    completedProjects: 0,
    pendingPayment: 0,
    yearIncome: 0,
    yearProfit: 0,
    avgProjectPrice: 0,
    avgProfitRate: 0,
    sixMonthData: [],
    typeIncome: [],
    reminders: [],
    overdueProjects: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.getDashboardData();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (index) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4'];
    return colors[index % colors.length];
  };

  const trendChartData = {
    labels: dashboardData.sixMonthData.map(d => d.month),
    datasets: [
      {
        label: '收入',
        data: dashboardData.sixMonthData.map(d => d.income),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      },
      {
        label: '利润',
        data: dashboardData.sixMonthData.map(d => d.profit),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#22c55e'
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `¥${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.5)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        grid: {
          color: 'rgba(51, 65, 85, 0.5)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          callback: (value) => '¥' + value.toLocaleString()
        }
      }
    }
  };

  const pieChartData = {
    labels: dashboardData.typeIncome.map(d => d.type),
    datasets: [{
      data: dashboardData.typeIncome.map(d => d.total),
      backgroundColor: dashboardData.typeIncome.map((_, i) => getTypeColor(i)),
      borderColor: '#1e293b',
      borderWidth: 2
    }]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ¥${context.raw.toLocaleString()} (${percentage}%)`;
          }
        }
      }
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
    <div className={`dashboard ${aiPanelOpen ? 'with-ai' : ''}`}>
      <div className="page-header">
        <h1 className="page-title">📊 经营看板</h1>
        <button className="btn btn-primary" onClick={loadDashboardData}>
          🔄 刷新数据
        </button>
      </div>

      {(dashboardData.overdueProjects?.length > 0 || dashboardData.reminders?.length > 0) && (
        <div className="reminder-bar animate-fade-in">
          <span className="reminder-icon">⚠️</span>
          <div className="reminder-content">
            <div className="reminder-title">
              待处理事项 ({dashboardData.overdueProjects?.length || 0} 个逾期 + {dashboardData.reminders?.length || 0} 个提醒)
            </div>
            <div className="reminder-list">
              {dashboardData.overdueProjects?.slice(0, 3).map((project, index) => (
                <span key={index} className="reminder-item" style={{ background: 'rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                  🔴 逾期未回款: {project.name}
                </span>
              ))}
              {dashboardData.reminders?.slice(0, 3).map((reminder, index) => (
                <span key={index} className="reminder-item" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                  📌 {reminder.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="dashboard-card" onClick={() => navigate('/transactions')}>
          <div className="dashboard-card-label">本月总收入</div>
          <div className="dashboard-card-value" style={{ color: '#22c55e' }}>
            {formatCurrency(dashboardData.monthIncome)}
          </div>
          <div className="dashboard-card-trend trend-up">
            <span>📈 点击查看收入流水</span>
          </div>
          <span className="dashboard-card-icon">💰</span>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/statistics')}>
          <div className="dashboard-card-label">本月总利润</div>
          <div className="dashboard-card-value" style={{ color: dashboardData.monthProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(dashboardData.monthProfit)}
          </div>
          <div className="dashboard-card-trend">
            <span>扣除固定成本后的净收益</span>
          </div>
          <span className="dashboard-card-icon">📈</span>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/projects')}>
          <div className="dashboard-card-label">本月完结项目</div>
          <div className="dashboard-card-value" style={{ color: '#3b82f6' }}>
            {dashboardData.completedProjects}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '4px' }}>个</span>
          </div>
          <div className="dashboard-card-trend">
            <span>📋 查看全部项目</span>
          </div>
          <span className="dashboard-card-icon">✅</span>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/projects?status=待回款')}>
          <div className="dashboard-card-label">待回款总金额</div>
          <div className="dashboard-card-value" style={{ color: '#f59e0b' }}>
            {formatCurrency(dashboardData.pendingPayment)}
          </div>
          <div className="dashboard-card-trend trend-down">
            <span>⚠️ 点击查看待回款项目</span>
          </div>
          <span className="dashboard-card-icon">⏳</span>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="dashboard-card" onClick={() => navigate('/statistics')}>
          <div className="dashboard-card-label">本年累计收入</div>
          <div className="dashboard-card-value" style={{ color: '#22c55e' }}>
            {formatCurrency(dashboardData.yearIncome)}
          </div>
          <div className="dashboard-card-trend">
            <span>📅 截至当前</span>
          </div>
          <span className="dashboard-card-icon">🏆</span>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/statistics')}>
          <div className="dashboard-card-label">本年累计利润</div>
          <div className="dashboard-card-value" style={{ color: dashboardData.yearProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(dashboardData.yearProfit)}
          </div>
          <div className="dashboard-card-trend">
            <span>全年净利润</span>
          </div>
          <span className="dashboard-card-icon">💎</span>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/projects')}>
          <div className="dashboard-card-label">平均项目客单价</div>
          <div className="dashboard-card-value" style={{ color: '#8b5cf6' }}>
            {formatCurrency(dashboardData.avgProjectPrice)}
          </div>
          <div className="dashboard-card-trend">
            <span>📊 所有项目均值</span>
          </div>
          <span className="dashboard-card-icon">🎯</span>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/statistics')}>
          <div className="dashboard-card-label">平均项目利润率</div>
          <div className="dashboard-card-value" style={{ color: '#06b6d4' }}>
            {dashboardData.avgProfitRate.toFixed(1)}%
          </div>
          <div className="dashboard-card-trend">
            <span>📈 盈利能力指标</span>
          </div>
          <span className="dashboard-card-icon">📊</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="chart-container">
          <h3 className="chart-title">📈 近6个月收入&利润趋势</h3>
          <div className="chart-wrapper">
            {dashboardData.sixMonthData.length > 0 ? (
              <Line data={trendChartData} options={trendChartOptions} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>暂无数据</p>
                <p style={{ fontSize: '0.8rem' }}>录入项目后自动展示趋势</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">🥧 项目类型收入占比</h3>
          <div className="chart-wrapper">
            {dashboardData.typeIncome.length > 0 ? (
              <Doughnut data={pieChartData} options={pieChartOptions} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🥧</div>
                <p>暂无数据</p>
                <p style={{ fontSize: '0.8rem' }}>按项目类型统计收入分布</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>⚡ 快捷操作</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/projects?action=new')}>
            ➕ 新建项目
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/transactions?action=new')}>
            💵 录入收支
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/clients?action=new')}>
            👤 新建客户
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/invoices?action=new')}>
            🧾 开具发票
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/calendar')}>
            📅 查看档期
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/statistics')}>
            📊 经营报表
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

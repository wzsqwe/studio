import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { formatDate } from '../utils/format';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadSchedules();
  }, [currentDate]);

  const loadSchedules = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.getSchedules(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      if (result.success) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // 上月剩余天数
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
    }

    // 当月天数
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }

    // 下月天数
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }

    return days;
  };

  const getSchedulesForDate = (dateStr) => {
    return schedules.filter(s => s.date === dateStr);
  };

  const getTypeColor = (type) => {
    const colors = {
      '商业广告拍摄': '#3b82f6',
      '婚礼跟拍': '#ec4899',
      '写真拍摄': '#8b5cf6',
      '产品摄影': '#f59e0b',
      '活动拍摄': '#22c55e',
      '视频拍摄': '#06b6d4',
      'unavailable': '#ef4444'
    };
    return colors[type] || '#3b82f6';
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDateStr = (date) => {
    return date.toISOString().split('T')[0];
  };

  const days = getDaysInMonth(currentDate);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // 统计
  const monthSchedules = schedules.filter(s => {
    const sDate = new Date(s.date);
    return sDate.getMonth() === currentDate.getMonth() && sDate.getFullYear() === currentDate.getFullYear();
  });

  const shootingDays = new Set(monthSchedules.filter(s => s.project_id).map(s => s.date)).size;
  const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const utilizationRate = ((shootingDays / totalDays) * 100).toFixed(1);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '12px' }}>加载中...</span>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1 className="page-title">📅 档期日历</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button className="btn btn-secondary" onClick={goToToday}>今天</button>
          <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              className={`btn ${view === 'month' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setView('month')}
              style={{ borderRadius: 0 }}
            >
              月视图
            </button>
            <button
              className={`btn ${view === 'week' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setView('week')}
              style={{ borderRadius: 0 }}
            >
              周视图
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="dashboard-card">
          <div className="dashboard-card-label">本月拍摄天数</div>
          <div className="dashboard-card-value" style={{ color: '#3b82f6' }}>
            {shootingDays}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '4px' }}>天</span>
          </div>
          <span className="dashboard-card-icon">📷</span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">档期饱和度</div>
          <div className="dashboard-card-value" style={{ color: utilizationRate > 70 ? '#22c55e' : '#f59e0b' }}>
            {utilizationRate}%
          </div>
          <span className="dashboard-card-icon">📊</span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">本月总项目</div>
          <div className="dashboard-card-value" style={{ color: '#8b5cf6' }}>
            {monthSchedules.length}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '4px' }}>个</span>
          </div>
          <span className="dashboard-card-icon">📁</span>
        </div>
      </div>

      {/* 日历 */}
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={prevMonth}>◀</button>
            <span className="calendar-month">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
            </span>
            <button className="calendar-nav-btn" onClick={nextMonth}>▶</button>
          </div>
        </div>

        <div className="calendar-grid">
          {weekdays.map((day, index) => (
            <div key={index} className="calendar-weekday">{day}</div>
          ))}

          {days.map((dayInfo, index) => {
            const dateStr = formatDateStr(dayInfo.date);
            const daySchedules = getSchedulesForDate(dateStr);

            return (
              <div
                key={index}
                className={`calendar-day ${!dayInfo.isCurrentMonth ? 'other-month' : ''} ${isToday(dayInfo.date) ? 'today' : ''}`}
                onClick={() => setSelectedDate(dateStr)}
              >
                <div className="day-number">{dayInfo.day}</div>
                {daySchedules.slice(0, 3).map((schedule, i) => (
                  <div
                    key={i}
                    className={`day-event ${schedule.unavailable ? 'unavailable' : 'project'}`}
                    style={{ background: `${getTypeColor(schedule.project_id ? (schedule.project_type || 'project') : 'unavailable')}20`, color: getTypeColor(schedule.project_id ? (schedule.project_type || 'project') : 'unavailable') }}
                    title={schedule.project_name || schedule.notes || '不可用'}
                  >
                    {schedule.project_name || (schedule.unavailable ? '不可用' : schedule.notes)}
                  </div>
                ))}
                {daySchedules.length > 3 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '6px' }}>
                    +{daySchedules.length - 3} 更多
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例 */}
      <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>商业广告拍摄</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{ width: '12px', height: '12px', background: '#ec4899', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>婚礼跟拍</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>写真拍摄</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>不可用</span>
        </div>
      </div>

      {/* 选中日期详情 */}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          schedules={getSchedulesForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};

const DayDetailModal = ({ date, schedules, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{formatDate(date)} 日程详情</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {schedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p style={{ color: 'var(--text-muted)' }}>当天没有安排</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {schedules.map((schedule, index) => (
                <div key={index} className="card" style={{ padding: 'var(--spacing-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                        {schedule.project_name || '日程安排'}
                      </h4>
                      {schedule.client_name && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          客户：{schedule.client_name}
                        </p>
                      )}
                      {schedule.location && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          地点：{schedule.location}
                        </p>
                      )}
                    </div>
                    <span className="tag tag-primary">{schedule.project_type || '拍摄'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

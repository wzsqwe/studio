import { useState, useEffect } from 'react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const fetchEvents = async () => {
    const month = currentDate.toISOString().slice(0, 7);
    const result = await window.electronAPI.getCalendarEvents(month);
    if (result.success) setEvents(result.data);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getEventsForDate = (dateStr) => events.filter(e => e.date === dateStr);

  return (
    <div>
      <div className="page-header">
        <h2>日程日历</h2>
        <div>
          <button className="btn btn-secondary" onClick={prevMonth}>上一月</button>
          <span style={{ margin: '0 15px', fontSize: '18px', fontWeight: '600' }}>{monthName}</span>
          <button className="btn btn-secondary" onClick={nextMonth}>下一月</button>
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {weekDays.map(d => <div key={d} style={{ padding: '12px', textAlign: 'center', background: '#f8f9fa', fontWeight: '600' }}>{d}</div>)}
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} style={{ padding: '12px', minHeight: '80px' }} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const date = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(dateStr);
            return <div key={date} style={{ padding: '8px', minHeight: '80px', border: '1px solid #eee', position: 'relative' }}>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{date}</div>
              {dayEvents.map((e, j) => <div key={j} style={{ fontSize: '10px', padding: '2px 4px', margin: '2px 0', background: e.type === 'deadline' ? '#fee2e2' : '#dbeafe', color: e.type === 'deadline' ? '#dc2626' : '#2563eb', borderRadius: '4px' }}>{e.title}</div>)}
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
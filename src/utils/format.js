// 格式化数字
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('zh-CN');
};

// 格式化货币
export const formatCurrency = (num) => {
  if (num === null || num === undefined) return '¥0';
  const value = Number(num);
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`;
  }
  return `¥${value.toLocaleString('zh-CN')}`;
};

// 格式化完整货币（不转换单位）
export const formatFullCurrency = (num) => {
  if (num === null || num === undefined) return '¥0.00';
  return `¥${Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 格式化日期
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 格式化日期时间
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取状态对应的样式类
export const getStatusClass = (status) => {
  const statusMap = {
    '待确认': 'status-pending',
    '待执行': 'status-processing',
    '拍摄中': 'status-processing',
    '交付中': 'status-processing',
    '已完结': 'status-completed',
    '已全额回款': 'status-paid',
    '逾期未回款': 'status-overdue',
    '待收款': 'status-pending',
    '已收款': 'status-paid'
  };
  return statusMap[status] || 'status-pending';
};

// 获取状态对应的颜色
export const getStatusColor = (status) => {
  const colorMap = {
    '待确认': '#94a3b8',
    '待执行': '#3b82f6',
    '拍摄中': '#3b82f6',
    '交付中': '#8b5cf6',
    '已完结': '#22c55e',
    '已全额回款': '#16a34a',
    '逾期未回款': '#ef4444',
    '待收款': '#f59e0b',
    '已收款': '#22c55e'
  };
  return colorMap[status] || '#94a3b8';
};

// 计算利润率颜色
export const getProfitRateColor = (rate) => {
  if (rate >= 50) return '#22c55e';
  if (rate >= 30) return '#84cc16';
  if (rate >= 15) return '#f59e0b';
  if (rate >= 0) return '#ef4444';
  return '#dc2626';
};

// 项目类型列表
export const PROJECT_TYPES = [
  '商业广告拍摄',
  '婚礼跟拍',
  '写真拍摄',
  '产品摄影',
  '活动拍摄',
  '视频拍摄',
  '航拍服务',
  '后期修图',
  '器材租赁',
  '培训服务',
  '其他'
];

// 成本分类列表
export const COST_CATEGORIES = [
  { name: '器材折旧', icon: '📷' },
  { name: '器材租赁费', icon: '🔧' },
  { name: '交通差旅', icon: '🚗' },
  { name: '场地租赁', icon: '🏠' },
  { name: '道具/服装', icon: '👗' },
  { name: '化妆造型', icon: '💄' },
  { name: '灯光设备', icon: '💡' },
  { name: '后期外包', icon: '🎨' },
  { name: '发票税费', icon: '🧾' },
  { name: '设备运输', icon: '📦' },
  { name: '助理费用', icon: '👤' },
  { name: '器材保险', icon: '🛡️' },
  { name: '软件订阅', icon: '💻' },
  { name: '学习培训', icon: '📚' },
  { name: '办公通讯', icon: '📱' },
  { name: '其他杂费', icon: '📝' }
];

// 收入分类列表
export const INCOME_CATEGORIES = [
  '项目定金',
  '项目中期款',
  '项目尾款',
  '后期外包收入',
  '器材租赁收入',
  '图片授权费',
  '培训收入',
  '其他副业收入'
];

// 支出分类列表
export const EXPENSE_CATEGORIES = [
  '变动成本',
  '固定成本',
  '器材采购',
  '器材维护',
  '场地费用',
  '差旅费用',
  '市场推广',
  '其他支出'
];

// 客户类型列表
export const CLIENT_TYPES = [
  '商业品牌方',
  '个人客户',
  '传媒公司',
  '长期合作渠道',
  '其他'
];

// 生成唯一ID
export const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 计算回款进度
export const calculatePaymentProgress = (totalAmount, paidAmount) => {
  if (!totalAmount || totalAmount === 0) return 0;
  return Math.min(100, (paidAmount / totalAmount) * 100);
};

// 计算月度折旧额
export const calculateMonthlyDepreciation = (price, usefulYears) => {
  if (!price || !usefulYears) return 0;
  return price / (usefulYears * 12);
};

// 获取本月日期范围
export const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

// 获取本年日期范围
export const getCurrentYearRange = () => {
  const now = new Date();
  return {
    start: `${now.getFullYear()}-01-01`,
    end: now.toISOString().split('T')[0]
  };
};

// 判断是否逾期
export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

// 判断是否即将到期（7天内）
export const isDueSoon = (dueDate) => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = (due - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
};

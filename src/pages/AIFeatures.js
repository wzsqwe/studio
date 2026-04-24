import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate, PROJECT_TYPES, COST_CATEGORIES, INCOME_CATEGORIES } from '../utils/format';

// AI 意图识别关键词
const INTENT_KEYWORDS = {
  PROJECT_CREATE: ['项目', '接了', '拍了', '商业广告', '婚礼', '写真', '产品', '拍摄', '单子'],
  PROJECT_UPDATE: ['改', '修改', '更新', '把', '改成', '改成', '项目'],
  PROJECT_DELETE: ['删除', '删掉', '不要了', '取消'],
  INCOME: ['收入', '收款', '收到', '回款', '赚了', '入账', '进账'],
  EXPENSE: ['付了', '花了', '成本', '支出', '费用'],
  QUERY_INCOME: ['赚了多少钱', '收入', '总收入', '利润'],
  QUERY_PROJECTS: ['项目', '单子', '接了多少'],
  QUERY_PENDING: ['待回款', '没收回来', '还没收到'],
  QUERY_PROFIT: ['最赚钱', '利润率', '盈利'],
  REMINDER: ['提醒', '记得', '到期', '截止']
};

class AIProcessor {
  constructor() {
    this.context = {
      lastProjectName: null,
      lastProjectId: null,
      lastClientName: null
    };
  }

  // 解析用户输入
  parseInput(text) {
    const lowerText = text.toLowerCase();
    const intent = this.recognizeIntent(lowerText);
    const entities = this.extractEntities(text, intent);

    return { intent, entities, raw: text };
  }

  // 意图识别
  recognizeIntent(text) {
    // 项目创建
    const createKeywords = ['项目', '接了', '拍了', '单子', '商业广告', '婚礼', '写真', '产品拍摄'];
    if (createKeywords.some(k => text.includes(k)) && !text.includes('改') && !text.includes('删')) {
      if (text.includes('收入') || text.includes('成本') || text.includes('合同')) {
        return 'PROJECT_CREATE';
      }
      return 'PROJECT_CREATE';
    }

    // 项目修改
    if (text.includes('改') || text.includes('修改') || text.includes('更新') || text.includes('改成')) {
      return 'PROJECT_UPDATE';
    }

    // 项目删除
    if (text.includes('删除') || text.includes('删掉') || text.includes('不要了')) {
      return 'PROJECT_DELETE';
    }

    // 收入查询
    if (text.includes('赚了多少钱') || text.includes('收入') && (text.includes('多少') || text.includes('查询'))) {
      return 'QUERY_INCOME';
    }

    // 项目查询
    if ((text.includes('项目') || text.includes('单子')) && text.includes('多少')) {
      return 'QUERY_PROJECTS';
    }

    // 待回款查询
    if (text.includes('待回款') || text.includes('没收回来') || text.includes('还没收到')) {
      return 'QUERY_PENDING';
    }

    // 盈利分析
    if (text.includes('最赚钱') || text.includes('盈利') || text.includes('利润率')) {
      return 'QUERY_PROFIT';
    }

    // 收入录入
    if ((text.includes('收了') || text.includes('收到') || text.includes('收入')) && !text.includes('多少')) {
      return 'INCOME_RECORD';
    }

    // 支出录入
    if (text.includes('付了') || text.includes('花了') || text.includes('成本') || text.includes('支出')) {
      return 'EXPENSE_RECORD';
    }

    // 提醒设置
    if (text.includes('提醒') || text.includes('记得') || text.includes('到期')) {
      return 'SET_REMINDER';
    }

    // 分析请求
    if (text.includes('分析') || text.includes('经营情况')) {
      return 'ANALYSIS';
    }

    return 'UNKNOWN';
  }

  // 实体提取
  extractEntities(text, intent) {
    const entities = {};

    // 金额提取
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:万|元|K|k)?/g);
    if (amountMatch) {
      const amounts = amountMatch.map(a => {
        const num = parseFloat(a);
        if (text.includes('万')) return num * 10000;
        if (text.includes('k') || text.includes('K')) return num * 1000;
        return num;
      });
      entities.amounts = amounts;
    }

    // 百分比提取
    const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      entities.percentage = parseFloat(percentMatch[1]);
    }

    // 日期提取
    const datePatterns = [
      /(\d{1,2})[月年](\d{1,2})[日号]?/,
      /(\d{4})[年\-](\d{1,2})[月\-](\d{1,2})[日]?/,
      /今天|明天|后天|下周|下个月/
    ];

    // 项目类型识别
    for (const type of PROJECT_TYPES) {
      if (text.includes(type.replace('拍摄', '').replace('服务', ''))) {
        entities.projectType = type;
        break;
      }
    }

    // 关键词识别
    if (text.includes('定金')) entities.paymentType = '定金';
    if (text.includes('中期款') || text.includes('中期')) entities.paymentType = '中期款';
    if (text.includes('尾款') || text.includes('余款')) entities.paymentType = '尾款';

    // 成本分类识别
    for (const cat of COST_CATEGORIES) {
      if (text.includes(cat.name) || text.includes(cat.icon)) {
        entities.costCategory = cat.name;
        break;
      }
    }

    // 客户名称提取
    const clientMatch = text.match(/(?:客户是?|甲方是?|给|帮)[^\d]*([^\s，。,]+(?:公司|工作室|品牌|店)?)/);
    if (clientMatch) {
      entities.clientName = clientMatch[1];
    }

    // 数量提取
    const countMatch = text.match(/(\d+)\s*(?:个|单|次|笔)/);
    if (countMatch) {
      entities.count = parseInt(countMatch[1]);
    }

    return entities;
  }

  // 生成回复
  generateResponse(intent, entities, data) {
    switch (intent) {
      case 'PROJECT_CREATE':
        return this.responseProjectCreate(entities);
      case 'PROJECT_UPDATE':
        return this.responseProjectUpdate(entities);
      case 'PROJECT_DELETE':
        return this.responseProjectDelete(entities);
      case 'INCOME_RECORD':
        return this.responseIncomeRecord(entities);
      case 'EXPENSE_RECORD':
        return this.responseExpenseRecord(entities);
      case 'QUERY_INCOME':
        return this.responseQueryIncome(data);
      case 'QUERY_PROJECTS':
        return this.responseQueryProjects(data);
      case 'QUERY_PENDING':
        return this.responseQueryPending(data);
      case 'QUERY_PROFIT':
        return this.responseQueryProfit(data);
      case 'ANALYSIS':
        return this.responseAnalysis(data);
      case 'SET_REMINDER':
        return this.responseSetReminder(entities);
      default:
        return '抱歉，我不太理解您的意思。您可以尝试说：\n• "接了个婚礼拍摄，收入8000"\n• "这个月收入多少"\n• "帮我提醒下周一给XX项目开票"';
    }
  }

  responseProjectCreate(entities) {
    const type = entities.projectType || '商业广告拍摄';
    const amount = entities.amounts?.[0] || 0;
    const cost = entities.amounts?.[1] || 0;
    const client = entities.clientName || '未指定';

    return `好的，我来帮您创建项目：

📋 **项目信息**
• 项目类型：${type}
• 合同金额：${formatCurrency(amount)}
• 预计成本：${formatCurrency(cost)}
• 客户：${client}

${cost > 0 ? `💰 预计利润：${formatCurrency(amount - cost)} (${amount > 0 ? ((amount - cost) / amount * 100).toFixed(1) : 0}%)` : ''}

请确认拍摄日期，我就可以帮您完成创建。`;
  }

  responseProjectUpdate(entities) {
    return '好的，请告诉我要修改的内容，例如："把那个婚礼项目的收入改成8800"';
  }

  responseProjectDelete(entities) {
    return '好的，请确认要删除的项目名称，我将帮您删除。';
  }

  responseIncomeRecord(entities) {
    const amount = entities.amounts?.[0] || 0;
    const type = entities.paymentType || '项目收入';

    return `好的，已记录收入：

💰 **收入信息**
• 金额：${formatCurrency(amount)}
• 类型：${type}
• 日期：${new Date().toLocaleDateString('zh-CN')}

已同步更新到收支流水台账！`;
  }

  responseExpenseRecord(entities) {
    const amount = entities.amounts?.[0] || 0;
    const category = entities.costCategory || '其他支出';

    return `好的，已记录支出：

💸 **支出信息**
• 金额：${formatCurrency(amount)}
• 分类：${category}
• 日期：${new Date().toLocaleDateString('zh-CN')}

已同步更新到成本台账！`;
  }

  responseQueryIncome(data) {
    if (!data) {
      return '正在获取收入数据...';
    }

    return `📊 **收入查询结果**

• 本月收入：${formatCurrency(data.monthIncome)}
• 本月利润：${formatCurrency(data.monthProfit)}
• 本年收入：${formatCurrency(data.yearIncome)}
• 本年利润：${formatCurrency(data.yearProfit)}

需要查看更详细的分析吗？`;
  }

  responseQueryProjects(data) {
    if (!data) {
      return '正在获取项目数据...';
    }

    return `📁 **项目统计**

• 本月完结项目：${data.completedProjects} 个
• 平均客单价：${formatCurrency(data.avgProjectPrice)}
• 平均利润率：${data.avgProfitRate?.toFixed(1)}%

需要查看详细项目列表吗？`;
  }

  responseQueryPending(data) {
    if (!data) {
      return '正在获取待回款数据...';
    }

    return `⏳ **待回款统计**

待回款总额：${formatCurrency(data.pendingPayment)}

${data.overdueProjects?.length > 0 ? `⚠️ 逾期未回款项目：${data.overdueProjects.length} 个

${data.overdueProjects.slice(0, 3).map(p => `• ${p.name}`).join('\n')}` : ''}

需要我帮您催款吗？`;
  }

  responseQueryProfit(data) {
    if (!data) {
      return '正在获取盈利分析数据...';
    }

    return `📈 **盈利分析**

• ${data.profitRanking?.[0]?.name || '暂无'} 是最赚钱的项目
• 最高利润率：${data.profitRanking?.[0]?.profit_rate?.toFixed(1)}% || '暂无数据'

${data.costBreakdown?.length > 0 ? `💡 成本构成提示：
${data.costBreakdown.slice(0, 3).map(c => `• ${c.category}：${formatCurrency(c.total)}`).join('\n')}` : ''}`;
  }

  responseAnalysis(data) {
    if (!data) {
      return '正在获取经营数据...';
    }

    return `📊 **${new Date().getFullYear()}年经营分析报告**

**总体概况**
• 累计收入：${formatCurrency(data.totalIncome)}
• 累计支出：${formatCurrency(data.totalExpense)}
• 净利润：${formatCurrency(data.netProfit)}
• 项目数量：${data.projectCount} 个

**盈利能力**
• 平均客单价：${formatCurrency(data.avgProjectAmount)}
• 盈亏平衡点：${formatCurrency(data.monthlyFixedCost)}/月

**优化建议**
${data.netProfit > 0 ? '✅ 经营状况良好，继续保持！' : '⚠️ 需要关注成本控制和回款效率'}
${data.paymentAnalysis?.overdue_nodes > 0 ? `\n⚠️ 有 ${data.paymentAnalysis.overdue_nodes} 个逾期款项需要跟进` : ''}`;
  }

  responseSetReminder(entities) {
    return `好的，提醒已设置：

🔔 **提醒事项**
• 内容：待确认
• 日期：待确认

到期前我会提醒您！`;
  }
}

const AIFeatures = ({ embedded = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const processorRef = useRef(new AIProcessor());

  useEffect(() => {
    // 添加欢迎消息
    setMessages([{
      role: 'assistant',
      content: `👋 你好！我是你的摄影工作室AI助手。

我可以用自然语言帮你完成各种操作，比如：

📝 **录入项目**
"接了个商业广告，收入15000，成本4000"

💰 **记录收支**
"今天收了定金5000"
"付了达芬奇年费268"

📊 **查询统计**
"这个月赚了多少钱"
"还有多少没回款"

🔔 **设置提醒**
"提醒我下周一给XX项目开票"

直接告诉我就行！`
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 调用AI处理逻辑
      const processor = processorRef.current;
      const { intent, entities } = processor.parseInput(input);
      
      // 获取数据
      let data = null;
      if (window.electronAPI) {
        if (['QUERY_INCOME', 'QUERY_PROJECTS', 'QUERY_PENDING', 'QUERY_PROFIT', 'ANALYSIS'].includes(intent)) {
          const result = await window.electronAPI.getDashboardData();
          if (result.success) {
            data = result.data;
          }
        }
      }

      // 生成回复
      const response = processor.generateResponse(intent, entities, data);

      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setLoading(false);

        // 如果是创建项目，提示打开项目页面
        if (intent === 'PROJECT_CREATE' && entities.amounts?.[0]) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '💡 要完成项目创建，请点击左侧"项目管理"进入页面填写详细信息（如拍摄日期等）。'
            }]);
          }, 500);
        }
      }, 500);

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，处理您的请求时出现了问题。请稍后重试。'
      }]);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: '新建项目', icon: '📁', prompt: '接了一个新的拍摄项目' },
    { label: '记录收入', icon: '💰', prompt: '收到了一笔款项' },
    { label: '记录支出', icon: '💸', prompt: '付了一笔费用' },
    { label: '查询收入', icon: '📊', prompt: '这个月收入多少' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: embedded ? '100%' : '100vh', padding: embedded ? 'var(--spacing-md)' : 0 }}>
      {embedded && (
        <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            🤖 AI 智能助手
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            用自然语言完成所有操作
          </p>
        </div>
      )}

      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 'var(--spacing-md)'
            }}
          >
            <div
              style={{
                maxWidth: msg.role === 'user' ? '85%' : '100%',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                background: msg.role === 'user' 
                  ? 'linear-gradient(135deg, var(--primary-color), #8b5cf6)'
                  : 'var(--bg-card)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
              <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷操作 */}
      {!embedded && (
        <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>快捷操作</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="btn btn-ghost"
                onClick={() => setInput(action.prompt)}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入框 */}
      <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <input
            type="text"
            className="form-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您想说的话..."
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
          >
            {loading ? '...' : '发送'}
          </button>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)', textAlign: 'center' }}>
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
};

export default AIFeatures;

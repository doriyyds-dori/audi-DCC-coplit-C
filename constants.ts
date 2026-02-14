import { CallStage, CallStageConfig, NeedQuestion, ScriptButton, QuickResponseItem } from './types';
import { Smile, Search, Zap, Gift, CalendarCheck } from 'lucide-react';

export const CAR_SERIES = ['Audi E5', 'Audi E7X', 'A7L', 'A5L', 'Q6'];

// --- Template for File Import ---
export const IMPORT_TEMPLATE = {
  "flow": [
    {
      "stage": "OPENING",
      "title": "新的开场阶段",
      "icon": "Smile", 
      "colorTheme": "bg-blue-50 border-blue-200 text-blue-800",
      "items": [
        {
          "id": "new_script_1",
          "label": "👋 自定义开场",
          "content": "您好{Name}，我是...（在此输入话术）",
          "logSummary": "自定义开场",
          "models": ["通用"]
        }
      ]
    }
  ],
  "quickResponses": [
    {
      "id": "q_price",
      "category": "PRICE",
      "question": "这也太贵了吧",
      "answer": "一分钱一分货...",
      "models": ["Audi E5", "Q6"]
    }
  ]
};

// --- 1. 急救包数据 (Quick Response / Objections) ---
export const QUICK_RESPONSES: QuickResponseItem[] = [
  {
    id: 'price_high',
    category: 'PRICE',
    question: '价格太贵了',
    answer: '姐/哥，E5这次是跟中国顶级供应链合作的，成本其实都在看不见的三电和智驾上。而且现在的预售权益折算下来，光是终身免费充电这就省了小几万呢！',
    models: ['Audi E5']
  },
  {
    id: 'price_bottom',
    category: 'PRICE',
    question: '最低多少钱落地？',
    answer: '电话里报不准，因为每个配置的补贴政策不一样。您要是这周末能来，我可以直接申请店总的"见面礼金"，肯定比电话里报给您的合适！',
    models: [] // Universal
  },
  {
    id: 'comp_bmw',
    category: 'COMPETITOR',
    question: '在看宝马i5',
    answer: 'i5也是好车，但它毕竟是油改电平台。E5是奥迪全新的800V平台，充电速度快一倍，而且咱们这个59寸大屏和Momenta智驾，您体验过就知道已经是两个时代的产品了。',
    models: ['Audi E5']
  },
  {
    id: 'comp_nio',
    category: 'COMPETITOR',
    question: '在看蔚来ET7',
    answer: '蔚来服务确实好。但咱们买车首先是买个"好开"和"安全"对吧？奥迪百年的底盘调教，那种过弯的吸地感，是新势力一时半会学不来的。',
    models: ['Audi E5', 'A7L']
  },
  {
    id: 'brand_logo',
    category: 'BRAND',
    question: '为什么没四环标？',
    answer: '这个AUDI字母标是奥迪专门给"智能电动"划分的高端序列。就像阿玛尼也有黑标白标一样，这个标代表的是奥迪最前沿的科技。',
    models: ['Audi E5', 'Audi E7X']
  }
];

// --- 2. 流程配置 (The Flow) ---

// STAGE 1: 破冰
const STAGE_OPENING_SCRIPTS: ScriptButton[] = [
  {
    id: 'op_standard',
    label: '👋 标准开场',
    content: '喂，您好，是{Name}吗？我是奥迪中心的体验官小王。打扰您一分钟，主要是想通知您，您关注已久的奥迪E5实车到店了！',
    logSummary: '标准开场',
    models: ['Audi E5']
  },
  {
    id: 'op_old_cust',
    label: '🚗 老车主回访',
    content: '{Name}您好，我是奥迪小王。您现在的A4开了有几年了吧？现在E5有个针对老车主的"原值置换"活动，特别划算，我必须得第一时间告诉您。',
    logSummary: '老车主置换开场',
    tags: ['热'],
    models: []
  },
  {
    id: 'op_activity',
    label: '🎁 活动邀约',
    content: '{Name}您好，这周末我们店里有"E5赛道日"活动，现场有专业赛车手带您体验3.4秒加速，还有冷餐会，想邀请您带家人一起来玩。',
    logSummary: '活动邀约开场',
    models: ['Audi E5']
  }
];

// STAGE 2: 需求探测 (这里复用之前的结构，但归类到Stage)
const STAGE_DISCOVERY_QUESTIONS: NeedQuestion[] = [
  {
    id: 'q_comp',
    question: '看过别家吗？',
    scriptHint: '那您最近有看过像蔚来、宝马这些品牌的电车吗？还是主要看奥迪？',
    options: [
      { label: '首看本品', value: '首看本品牌' },
      { label: '对比BBA', value: '对比宝马/奔驰' },
      { label: '对比新势力', value: '对比蔚来/理想' }
    ],
    isProfile: true
  },
  {
    id: 'q_usage',
    question: '谁开/怎么用？',
    scriptHint: '这车买回去主要是您自己上下班代步，还是周末带家里人出去玩多一些？',
    options: [
      { label: '通勤代步', value: '通勤代步' },
      { label: '家庭出游', value: '家庭出游' },
      { label: '商务接待', value: '商务接待' }
    ],
    isProfile: true
  },
  {
    id: 'q_pain',
    question: '最在意什么？',
    scriptHint: '您买电车最担心什么？是续航充电，还是怕车机不好用？',
    options: [
      { label: '续航焦虑', value: '在意续航' },
      { label: '智能化', value: '在意智能/车机' },
      { label: '操控/安全', value: '在意操控安全' }
    ],
    isProfile: true
  }
];

// STAGE 3: 卖点抛出
const STAGE_PITCH_SCRIPTS: ScriptButton[] = [
  {
    id: 'pt_screen',
    label: '🖥️ 59寸大屏 (针对科技控/家庭)',
    content: '那您一定得看看E5这个59寸的5K大屏，贯穿整个仪表台。副驾看电影完全不影响主驾，孩子在后排也能投屏打游戏，简直是个移动的家庭影院。',
    logSummary: '推介：59寸大屏',
    models: ['Audi E5', 'Audi E7X']
  },
  {
    id: 'pt_drive',
    label: '🏎️ 3.4秒加速 (针对操控控)',
    content: 'E5的性能特别猛，双电机四驱，零百加速只要3.4秒！而且底盘是保时捷同款团队调教的，那种过弯的支撑性，您试一次就上瘾。',
    logSummary: '推介：操控性能',
    models: ['Audi E5']
  },
  {
    id: 'pt_charge',
    label: '⚡ 800V超充 (针对续航焦虑)',
    content: '您担心的充电完全不是问题。E5是800V平台的，充电10分钟就能跑370公里，基本上您去服务区上个洗手间买瓶水的功夫，电就充好了。',
    logSummary: '推介：800V超充',
    models: ['Audi E5', 'Audi E7X', 'Q6']
  },
  {
    id: 'pt_momenta',
    label: '🧠 顶级智驾 (针对新手/拥堵)',
    content: '咱们这车配的是国内第一梯队的Momenta智驾。上下班堵车它能自动跟车，连无保护左转这种高难度动作它都能自己搞定，开着特轻松。',
    logSummary: '推介：智驾系统',
    models: ['Audi E5', 'Audi E7X']
  }
];

// STAGE 4: 权益/逼单
const STAGE_OFFER_SCRIPTS: ScriptButton[] = [
  {
    id: 'off_urgent',
    label: '🔥 限时权益 (紧迫感)',
    content: '王先生，我得提醒您一下，首批车主的"终身免费质保"权益名额只剩最后几百个了，也就是这一两周的事。我觉得您既然喜欢，不如先把这个名额占上。',
    logSummary: '逼单：限时权益',
    models: []
  },
  {
    id: 'off_gift',
    label: '🎁 试驾礼 (诱惑)',
    content: '咱们这周末有个试驾活动，只要人来试驾，不管买不买，都送一份奥迪原厂的露营套装，特别精致，您可以顺便带一套回去。',
    logSummary: '逼单：试驾礼',
    models: []
  }
];

// STAGE 5: 邀约/收尾
const STAGE_CLOSING_SCRIPTS: ScriptButton[] = [
  {
    id: 'cl_time',
    label: '📅 二选一邀约 (必杀)',
    content: '那您看您是周六上午有空，还是周日下午方便一点？我好提前把车洗干净，把最好的试驾时段留给您。',
    logSummary: '动作：二选一邀约',
    models: []
  },
  {
    id: 'cl_wechat',
    label: '💬 加微话术',
    content: '具体的配置表和去店里的定位，我通过微信发给您吧？我手机号就是微信号，我现在加您，您通过一下。',
    logSummary: '动作：加微信',
    models: []
  },
  {
    id: 'cl_bye',
    label: '👋 礼貌挂机',
    content: '好的好的，那我不打扰您工作了。期待这周末见到您，祝您生活愉快，再见！',
    logSummary: '结束通话',
    models: []
  }
];

// --- 汇总配置 ---
export const CALL_FLOW_CONFIG: CallStageConfig[] = [
  {
    stage: CallStage.OPENING,
    title: '第一步：破冰开场',
    icon: 'Smile', // Changed to string for serialization support
    colorTheme: 'bg-blue-50 border-blue-200 text-blue-800',
    items: STAGE_OPENING_SCRIPTS
  },
  {
    stage: CallStage.DISCOVERY,
    title: '第二步：需求摸底',
    icon: 'Search',
    colorTheme: 'bg-purple-50 border-purple-200 text-purple-800',
    items: STAGE_DISCOVERY_QUESTIONS
  },
  {
    stage: CallStage.PITCH,
    title: '第三步：卖点出击',
    icon: 'Zap',
    colorTheme: 'bg-amber-50 border-amber-200 text-amber-800',
    items: STAGE_PITCH_SCRIPTS
  },
  {
    stage: CallStage.OFFER,
    title: '第四步：权益逼单',
    icon: 'Gift',
    colorTheme: 'bg-rose-50 border-rose-200 text-rose-800',
    items: STAGE_OFFER_SCRIPTS
  },
  {
    stage: CallStage.CLOSING,
    title: '第五步：邀约锁定',
    icon: 'CalendarCheck',
    colorTheme: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    items: STAGE_CLOSING_SCRIPTS
  }
];

export const DOJO_SYSTEM_INSTRUCTION = `
你扮演陈先生，一位45岁的宝马5系车主。
你对新款奥迪E5持怀疑态度，认为没有四环标就不是奥迪。
保持对话口语化，略带挑剔但有礼貌，回复简短（50字以内）。
`;

// --- Dashboard Data ---
export const SCATTER_DATA = [
  { x: 10, y: 30, z: 200, name: '张顾问' },
  { x: 25, y: 50, z: 260, name: '李顾问' },
  { x: 30, y: 45, z: 400, name: '王顾问' },
  { x: 50, y: 80, z: 280, name: '赵顾问' },
  { x: 8, y: 20, z: 150, name: '钱顾问' },
  { x: 40, y: 70, z: 310, name: '孙顾问' },
];

export const SLCR_DATA = [
  { name: '赵顾问', value: 85 },
  { name: '孙顾问', value: 72 },
  { name: '李顾问', value: 64 },
  { name: '王顾问', value: 58 },
  { name: '张顾问', value: 45 },
  { name: '钱顾问', value: 30 },
];
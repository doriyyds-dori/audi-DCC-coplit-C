import React, { useState, useRef, useEffect } from 'react';
import { CALL_FLOW_CONFIG, CAR_SERIES, QUICK_RESPONSES, IMPORT_TEMPLATE } from '../constants';
import { CallStage, CustomerProfile, NeedQuestion, ScriptButton, QuickCategory, CallStageConfig, QuickResponseItem } from '../types';
import { generateSummaryEnhancement } from '../services/geminiService';
import { 
  Phone, User, Car, Copy, RotateCcw, MessageCircle, 
  HelpCircle, AlertTriangle, DollarSign, Shield, Loader2, Sparkles, Upload, FileJson, X, Download,
  Smile, Search, Zap, Gift, CalendarCheck, Table as TableIcon, Plus, Trash2, Save, FileSpreadsheet
} from 'lucide-react';

// Icon mapping for JSON hydration
const ICON_MAP: Record<string, any> = {
  'Smile': Smile,
  'Search': Search,
  'Zap': Zap,
  'Gift': Gift,
  'CalendarCheck': CalendarCheck,
  'HelpCircle': HelpCircle
};

// Stage Name Mapping for UI
const STAGE_NAMES: Record<string, string> = {
  [CallStage.OPENING]: '1. 破冰开场',
  [CallStage.DISCOVERY]: '2. 需求探测 (复杂配置)',
  [CallStage.PITCH]: '3. 卖点出击',
  [CallStage.OFFER]: '4. 权益逼单',
  [CallStage.CLOSING]: '5. 邀约锁定'
};

const CATEGORY_NAMES: Record<string, string> = {
  'PRICE': '💰 价格/权益',
  'COMPETITOR': '🆚 竞品对比',
  'BRAND': '🛡️ 品牌疑虑',
  'OBJECTION': '🛑 其他异议'
};

// Helper to check if a stage has simple ScriptButtons
const isScriptStage = (stage: CallStage) => stage !== CallStage.DISCOVERY;

const Copilot: React.FC = () => {
  // --- Configuration State ---
  const [callFlow, setCallFlow] = useState<CallStageConfig[]>(CALL_FLOW_CONFIG);
  const [quickResponses, setQuickResponses] = useState<QuickResponseItem[]>(QUICK_RESPONSES);

  // --- Customer Data ---
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'先生'|'女士'|'未知'>('先生');
  const [series, setSeries] = useState('');
  const [needs, setNeeds] = useState<Record<string, string>>({});

  // --- UI State ---
  const [activeScript, setActiveScript] = useState<string>('👋 准备拨号... 请先填写顶部客户信息，然后点击下方开场白。');
  const [logs, setLogs] = useState<string>('');
  const [quickTab, setQuickTab] = useState<QuickCategory>('PRICE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // --- Table Editor State ---
  const [editMode, setEditMode] = useState<'TABLE' | 'JSON'>('TABLE');
  const [activeTableTab, setActiveTableTab] = useState<'FLOW' | 'QUICK'>('FLOW');
  
  // Flattened data for table editing
  const [flatScripts, setFlatScripts] = useState<{stage: CallStage, id: string, label: string, content: string, logSummary: string, models: string}[]>([]);
  const [flatQuick, setFlatQuick] = useState<{id: string, category: QuickCategory, question: string, answer: string, models: string}[]>([]);

  // Auto-scroll log
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Sync state when opening modal
  useEffect(() => {
    if (showImportModal) {
      // Flatten Scripts (excluding Discovery)
      const scripts: any[] = [];
      callFlow.forEach(stage => {
        if (isScriptStage(stage.stage)) {
          (stage.items as ScriptButton[]).forEach(item => {
            scripts.push({
              stage: stage.stage,
              id: item.id,
              label: item.label,
              content: item.content,
              logSummary: item.logSummary,
              models: item.models?.join(', ') || ''
            });
          });
        }
      });
      setFlatScripts(scripts);

      // Flatten Quick Responses
      const quick = quickResponses.map(q => ({
        ...q,
        models: q.models?.join(', ') || ''
      }));
      setFlatQuick(quick);
    }
  }, [showImportModal, callFlow, quickResponses]);

  // --- Filtering Logic ---
  const shouldShowItem = (itemModels?: string[]) => {
    if (!series) return true; // Show all if no series selected
    if (!itemModels || itemModels.length === 0) return true; // Universal script
    const universal = itemModels.some(m => m.includes('通用') || m === '');
    if (universal) return true;
    return itemModels.includes(series);
  };

  // --- Helpers ---
  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => prev + `[${time}] ${text}\n`);
  };

  const handleScriptClick = (script: ScriptButton) => {
    // Replace placeholder with name
    const finalContent = script.content.replace(/{Name}/g, name ? `${name}${gender}` : '先生/女士');
    setActiveScript(finalContent);
    addLog(script.logSummary);
  };

  const handleNeedSelect = (q: NeedQuestion, val: string) => {
    setNeeds(prev => ({ ...prev, [q.id]: val }));
    addLog(`【画像】${q.question} -> ${val}`);
  };

  const handleQuickResponse = (answer: string, question: string) => {
    setActiveScript(answer);
    addLog(`【急救】回答问题：${question}`);
  };

  const handleReset = () => {
    if(confirm('重置所有信息？')) {
      setPhone(''); setName(''); setSeries(''); setNeeds({}); setLogs('');
      setActiveScript('👋 准备就绪。');
    }
  };

  const handleGenerate = async () => {
    if (!phone) { alert('没填电话怎么生成记录呀？😅'); return; }
    setIsGenerating(true);
    const profile: CustomerProfile = { phone, gender, carSeries: series, needs };
    const result = await generateSummaryEnhancement(JSON.stringify({ profile, interactionLog: logs }));
    setLogs(prev => prev + `\n--- 🌟 智能跟进记录 ---\n${result}\n------------------\n`);
    navigator.clipboard.writeText(result);
    setIsGenerating(false);
  };

  // --- Table Editor Logic ---
  
  const handleSaveTable = () => {
    // 1. Reconstruct Call Flow
    const newFlow = callFlow.map(stage => {
      if (!isScriptStage(stage.stage)) return stage;
      const stageScripts = flatScripts
        .filter(s => s.stage === stage.stage)
        .map(s => ({
          id: s.id || Math.random().toString(36).substr(2, 9),
          label: s.label,
          content: s.content,
          logSummary: s.logSummary,
          models: s.models.split(/,|，/).map(m => m.trim()).filter(Boolean),
          tags: []
        }));
      return { ...stage, items: stageScripts };
    });

    // 2. Reconstruct Quick Responses
    const newQuick = flatQuick.map(q => ({
       id: q.id || Math.random().toString(36).substr(2, 9),
       category: q.category,
       question: q.question,
       answer: q.answer,
       models: q.models.split(/,|，/).map(m => m.trim()).filter(Boolean)
    }));

    setCallFlow(newFlow);
    setQuickResponses(newQuick);
    alert('✅ 数据已保存！');
    setShowImportModal(false);
  };

  const updateScriptRow = (idx: number, field: string, val: string) => {
    const next = [...flatScripts];
    (next[idx] as any)[field] = val;
    setFlatScripts(next);
  };
  
  const updateQuickRow = (idx: number, field: string, val: string) => {
    const next = [...flatQuick];
    (next[idx] as any)[field] = val;
    setFlatQuick(next);
  };

  // --- File Import/Export Logic ---

  const handleDownloadCsvTemplate = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel Chinese support
    csvContent += "类型,分组ID (如 PITCH/PRICE),标题_问题,内容_回答,日志摘要,适用车型\n";
    csvContent += "话术,PITCH,59寸大屏,那您一定得看看...,推介大屏,Audi E5\n";
    csvContent += "急救包,PRICE,太贵了,一分钱一分货...,,通用\n";
    csvContent += "话术,OFFER,限时权益,权益只剩最后几名了...,逼单权益,Audi E5\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audi_copilot_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    // Robust CSV parser state machine
    const rows = text.split(/\r\n|\n/).filter(r => r.trim() !== '');
    // Skip header row
    return rows.slice(1).map(row => {
      const values = [];
      let current = '';
      let inQuote = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        // Handle quotes (if not escaped)
        if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
           inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
           values.push(current);
           current = '';
        } else {
           current += char;
        }
      }
      values.push(current);
      // Clean up quotes from Excel: "" -> " and remove surrounding "
      return values.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      if (file.name.endsWith('.csv')) {
        try {
          const rows = parseCSV(content);
          const newScripts: any[] = [];
          const newQuick: any[] = [];
          
          rows.forEach((row: string[]) => {
            if (row.length < 3) return; // Skip empty/malformed

            // Row Structure: [0:Type, 1:Group, 2:Title, 3:Content, 4:Log, 5:Models]
            const typeRaw = row[0]?.toLowerCase() || '';
            const isFlow = typeRaw.includes('flow') || typeRaw.includes('话术') || typeRaw.includes('流程');
            const isQuick = typeRaw.includes('quick') || typeRaw.includes('急救') || typeRaw.includes('包');

            if (isFlow) {
               newScripts.push({
                 stage: row[1]?.trim() as CallStage, // Assumes user provides correct code (PITCH, OFFER etc)
                 id: Math.random().toString(36).substr(2, 9),
                 label: row[2],
                 content: row[3],
                 logSummary: row[4],
                 models: row[5] || ''
               });
            } else if (isQuick) {
               newQuick.push({
                 id: Math.random().toString(36).substr(2, 9),
                 category: row[1]?.trim() as QuickCategory, // Assumes code (PRICE, BRAND etc)
                 question: row[2],
                 answer: row[3],
                 models: row[5] || ''
               });
            }
          });

          if (newScripts.length > 0) setFlatScripts(prev => [...prev, ...newScripts]);
          if (newQuick.length > 0) setFlatQuick(prev => [...prev, ...newQuick]);
          
          alert(`✅ 成功读取 CSV！\n已添加 ${newScripts.length} 条话术和 ${newQuick.length} 条急救包。\n请点击底部的“保存”以生效。`);
          setEditMode('TABLE'); // Switch to table to review

        } catch (err) {
          alert('❌ CSV 解析出错，请确保使用模板格式。');
          console.error(err);
        }
      } else {
        // JSON Import (Legacy)
        try {
          const json = JSON.parse(content);
          if (json.flow) setCallFlow(json.flow);
          if (json.quickResponses) setQuickResponses(json.quickResponses);
          alert('✅ JSON 配置已导入！');
          setShowImportModal(false);
        } catch (err) {
          alert('❌ JSON 解析失败');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadJsonTemplate = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(IMPORT_TEMPLATE, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = "audi_copilot_template.json";
    link.click();
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || HelpCircle;
    return <IconComponent size={20} className="mr-2" />;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 p-4 overflow-hidden bg-slate-50 font-sans relative">
      
      {/* ================= LEFT: THE CALL FLOW (65%) ================= */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* 1. Cockpit (Customer Info) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-200 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl text-slate-500">
            <User size={18} />
            <input 
              className="bg-transparent w-16 outline-none font-bold text-slate-700" 
              placeholder="姓氏" 
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
             {['先生', '女士'].map((g: any) => (
               <button 
                 key={g}
                 onClick={() => setGender(g)}
                 className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                   gender === g ? 'bg-indigo-500 text-white shadow-md transform scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                 }`}
               >
                 {g}
               </button>
             ))}
          </div>
          <div className="h-8 w-0.5 bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl text-slate-500 flex-1">
            <Phone size={18} />
            <input 
              className="bg-transparent w-full outline-none font-mono font-bold text-slate-700" 
              placeholder="输入客户电话..." 
              value={phone} onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div className="h-8 w-0.5 bg-slate-200 mx-2"></div>
          <select 
            value={series} 
            onChange={e => setSeries(e.target.value)}
            className="bg-amber-100 text-amber-800 font-bold px-4 py-2 rounded-xl outline-none cursor-pointer hover:bg-amber-200 transition-colors"
          >
            <option value="">选择咨询车系 ▾</option>
            {CAR_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 2. The Scrollable Flow */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-10">
          {callFlow.map((stage, idx) => {
            // --- FILTERING LOGIC ---
            // Only filter if it's a script stage (Discovery usually contains standard questions)
            let visibleItems = stage.items;
            if (isScriptStage(stage.stage)) {
               visibleItems = (stage.items as ScriptButton[]).filter(item => shouldShowItem(item.models));
            }
            // -----------------------

            if (visibleItems.length === 0 && isScriptStage(stage.stage)) return null; // Hide empty stages

            return (
              <div key={stage.stage} className={`rounded-3xl border-2 shadow-sm overflow-hidden ${stage.colorTheme.replace('text-', 'border-').split(' ')[1]} bg-white`}>
                <div className={`px-5 py-3 flex items-center font-black text-lg ${stage.colorTheme}`}>
                  {renderIcon(stage.icon)}
                  {stage.title}
                  {series && isScriptStage(stage.stage) && (
                    <span className="ml-auto text-xs font-normal opacity-70 bg-white/30 px-2 py-0.5 rounded">
                      当前筛选: {series}
                    </span>
                  )}
                </div>
                
                <div className="p-5">
                  {stage.stage === CallStage.DISCOVERY ? (
                    <div className="space-y-4">
                      {(visibleItems as NeedQuestion[]).map(q => (
                        <div key={q.id}>
                          <div className="text-sm text-slate-400 font-bold mb-2 ml-1 flex justify-between">
                            <span>{q.question}</span>
                            <span className="text-[10px] font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              话术：{q.scriptHint.substring(0, 15)}...
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  handleNeedSelect(q, opt.value);
                                  setActiveScript(q.scriptHint);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border-b-2 active:border-b-0 active:translate-y-[2px] transition-all ${
                                  needs[q.id] === opt.value
                                    ? 'bg-purple-500 border-purple-700 text-white'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(visibleItems as ScriptButton[]).map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => handleScriptClick(btn)}
                          className="group relative p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left shadow-sm hover:shadow-md active:scale-95 flex flex-col justify-between min-h-[80px]"
                        >
                           <span className="font-bold text-slate-700 group-hover:text-indigo-700 text-base mb-1 block">
                             {btn.label}
                           </span>
                           <span className="text-xs text-slate-400 font-light line-clamp-2 leading-relaxed">
                             {btn.content}
                           </span>
                           {btn.tags && (
                             <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-bounce">
                               {btn.tags[0]}
                             </span>
                           )}
                           {btn.models && btn.models.length > 0 && !btn.models.join('').includes('通用') && (
                              <span className="absolute bottom-2 right-2 text-[10px] text-indigo-400 font-mono bg-indigo-50 px-1 rounded border border-indigo-100">
                                {btn.models[0]}
                              </span>
                           )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="text-center text-slate-300 text-sm font-bold pb-4">
             🎉 完美，流程结束！别忘了生成记录哦
          </div>
        </div>
      </div>

      {/* ================= RIGHT: SUPPORT & LOGS (35%) ================= */}
      <div className="w-[420px] flex flex-col gap-4">
        
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">智能辅助面板</span>
            <span className="text-[10px] text-slate-300">AI Copilot & Support</span>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95"
          >
            <Upload size={14} />
            配置中心 (CSV/JSON)
          </button>
        </div>

        {/* 1. Teleprompter */}
        <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200 relative overflow-hidden shrink-0 min-h-[160px] flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MessageCircle size={100} />
          </div>
          <div className="flex items-center gap-2 text-indigo-200 font-bold uppercase text-xs tracking-wider mb-2">
            <Sparkles size={14} /> 
            当前话术指引
          </div>
          <div className="text-lg font-medium leading-relaxed overflow-y-auto custom-scrollbar pr-2 flex-1">
             "{activeScript}"
          </div>
        </div>

        {/* 2. Quick Response Module */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col overflow-hidden h-[300px] shrink-0">
          <div className="flex border-b-2 border-slate-100 bg-slate-50">
            {[
              { id: 'PRICE', icon: DollarSign, label: '问价' },
              { id: 'COMPETITOR', icon: AlertTriangle, label: '竞品' },
              { id: 'BRAND', icon: Shield, label: '品牌' },
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setQuickTab(tab.id)}
                className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                  quickTab === tab.id 
                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
            {quickResponses
              .filter(i => i.category === quickTab && shouldShowItem(i.models))
              .map(item => (
              <div 
                key={item.id} 
                onClick={() => handleQuickResponse(item.answer, item.question)}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all active:scale-98"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-slate-700">❓ {item.question}</span>
                  {item.models && item.models.length > 0 && (
                    <span className="text-[9px] bg-slate-200 px-1.5 rounded text-slate-500 font-mono scale-90 origin-right">
                      {item.models[0].substring(0,4)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 leading-normal">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Log & Actions */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col overflow-hidden">
           <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-400 uppercase">通话轨迹</span>
             <button onClick={handleReset} className="text-slate-300 hover:text-red-400 transition-colors p-1" title="重置会话">
               <RotateCcw size={14} />
             </button>
           </div>
           <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 font-mono text-xs text-slate-600 space-y-1">
             <pre className="whitespace-pre-wrap">{logs || <span className="text-slate-300 italic">等待开始...</span>}</pre>
             <div ref={logEndRef} />
           </div>
           <div className="p-3 bg-white border-t border-slate-100">
             <button 
               onClick={handleGenerate}
               disabled={isGenerating}
               className={`w-full py-3 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:translate-y-1 ${
                 isGenerating 
                  ? 'bg-slate-300 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
               }`}
             >
               {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
               {isGenerating ? 'AI 正在总结...' : '一键生成 CRM 记录'}
             </button>
           </div>
        </div>
      </div>

      {/* ================= MODAL: IMPORT / EDIT CONFIG ================= */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl shadow-2xl w-full flex flex-col max-h-[90vh] transition-all duration-300 ${editMode === 'TABLE' ? 'max-w-7xl' : 'max-w-2xl'}`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                  {editMode === 'TABLE' ? <TableIcon size={24} /> : <FileJson size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">配置中心</h3>
                  <div className="flex gap-4 text-sm mt-1">
                    <button 
                      onClick={() => setEditMode('TABLE')}
                      className={`pb-1 font-bold transition-colors ${editMode === 'TABLE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      📄 表格 / CSV
                    </button>
                    <button 
                      onClick={() => setEditMode('JSON')}
                      className={`pb-1 font-bold transition-colors ${editMode === 'JSON' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {`{ } JSON 源码`}
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-hidden relative bg-slate-50">
              
              {/* === MODE: TABLE EDITOR === */}
              {editMode === 'TABLE' && (
                <div className="h-full flex flex-col">
                  {/* CSV Actions Toolbar */}
                  <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex justify-between items-center shrink-0">
                     <div className="text-xs text-indigo-700 flex gap-4">
                        <span className="flex items-center gap-1 font-bold">
                          <FileSpreadsheet size={14}/> Excel / CSV 模式
                        </span>
                        <span>1. 下载模板 &rarr; 2. Excel编辑 &rarr; 3. 上传更新</span>
                     </div>
                     <div className="flex gap-2">
                        <button 
                           onClick={handleDownloadCsvTemplate}
                           className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center gap-1"
                        >
                           <Download size={14} /> 下载中文 CSV 模板
                        </button>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept=".csv,.json"
                            onChange={handleFileUpload}
                            className="hidden" 
                            id="csv-upload-btn"
                          />
                          <label 
                             htmlFor="csv-upload-btn"
                             className="cursor-pointer bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-sm"
                          >
                             <Upload size={14} /> 上传 CSV
                          </label>
                        </div>
                     </div>
                  </div>

                  {/* Table Tabs */}
                  <div className="flex gap-2 px-6 pt-4 shrink-0">
                    <button 
                      onClick={() => setActiveTableTab('FLOW')}
                      className={`px-4 py-2 rounded-t-xl text-sm font-bold transition-colors ${activeTableTab === 'FLOW' ? 'bg-white text-indigo-700 shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                    >
                      🗣️ 流程话术 (Flow)
                    </button>
                    <button 
                      onClick={() => setActiveTableTab('QUICK')}
                      className={`px-4 py-2 rounded-t-xl text-sm font-bold transition-colors ${activeTableTab === 'QUICK' ? 'bg-white text-emerald-700 shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                    >
                      🚑 急救包 (Q&A)
                    </button>
                  </div>

                  {/* Table Content */}
                  <div className="flex-1 overflow-y-auto p-6 pt-0">
                     <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                        
                        {/* 1. FLOW TABLE */}
                        {activeTableTab === 'FLOW' && (
                          <table className="w-full text-left text-sm">
                            <thead className="bg-indigo-50 text-indigo-900 font-bold border-b border-indigo-100 sticky top-0 z-10">
                              <tr>
                                <th className="p-3 w-32">阶段 (Stage)</th>
                                <th className="p-3 w-40">标题 (Label)</th>
                                <th className="p-3">话术内容 (Content)</th>
                                <th className="p-3 w-32">日志 (Log)</th>
                                <th className="p-3 w-32">适用车型 (Models)</th>
                                <th className="p-3 w-12 text-center">X</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {flatScripts.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 group">
                                  <td className="p-2 align-top">
                                    <select 
                                      value={row.stage} 
                                      onChange={e => updateScriptRow(idx, 'stage', e.target.value)}
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-indigo-500 outline-none"
                                    >
                                      {Object.entries(STAGE_NAMES).filter(([k]) => isScriptStage(k as CallStage)).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-2 align-top">
                                    <input 
                                      value={row.label} 
                                      onChange={e => updateScriptRow(idx, 'label', e.target.value)}
                                      className="w-full p-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-medium"
                                      placeholder="标题..."
                                    />
                                  </td>
                                  <td className="p-2 align-top">
                                    <textarea 
                                      value={row.content} 
                                      onChange={e => updateScriptRow(idx, 'content', e.target.value)}
                                      className="w-full p-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-xs leading-relaxed min-h-[60px] resize-y"
                                      placeholder="内容..."
                                    />
                                  </td>
                                  <td className="p-2 align-top">
                                    <input 
                                      value={row.logSummary} 
                                      onChange={e => updateScriptRow(idx, 'logSummary', e.target.value)}
                                      className="w-full p-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-xs text-slate-500"
                                      placeholder="日志简语"
                                    />
                                  </td>
                                  <td className="p-2 align-top">
                                    <input 
                                      value={row.models} 
                                      onChange={e => updateScriptRow(idx, 'models', e.target.value)}
                                      className="w-full p-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-xs text-indigo-600 font-mono"
                                      placeholder="Audi E5, 通用..."
                                    />
                                  </td>
                                  <td className="p-2 align-top text-center">
                                    <button onClick={() => {
                                       const next = [...flatScripts]; next.splice(idx, 1); setFlatScripts(next);
                                    }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* 2. QUICK TABLE */}
                        {activeTableTab === 'QUICK' && (
                          <table className="w-full text-left text-sm">
                            <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-emerald-100 sticky top-0 z-10">
                              <tr>
                                <th className="p-3 w-32">分类</th>
                                <th className="p-3 w-56">问题 (Question)</th>
                                <th className="p-3">标准回答 (Answer)</th>
                                <th className="p-3 w-32">适用车型</th>
                                <th className="p-3 w-12 text-center">X</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {flatQuick.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 group">
                                  <td className="p-2 align-top">
                                    <select 
                                      value={row.category} 
                                      onChange={e => updateQuickRow(idx, 'category', e.target.value)}
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-emerald-500 outline-none"
                                    >
                                      {Object.entries(CATEGORY_NAMES).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-2 align-top">
                                    <input 
                                      value={row.question} 
                                      onChange={e => updateQuickRow(idx, 'question', e.target.value)}
                                      className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none font-medium"
                                      placeholder="问题..."
                                    />
                                  </td>
                                  <td className="p-2 align-top">
                                    <textarea 
                                      value={row.answer} 
                                      onChange={e => updateQuickRow(idx, 'answer', e.target.value)}
                                      className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-xs leading-relaxed min-h-[60px] resize-y"
                                      placeholder="回答..."
                                    />
                                  </td>
                                  <td className="p-2 align-top">
                                    <input 
                                      value={row.models} 
                                      onChange={e => updateQuickRow(idx, 'models', e.target.value)}
                                      className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-xs text-indigo-600 font-mono"
                                      placeholder="Audi E5..."
                                    />
                                  </td>
                                  <td className="p-2 align-top text-center">
                                    <button onClick={() => {
                                        const next = [...flatQuick]; next.splice(idx, 1); setFlatQuick(next);
                                    }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center">
                          <button 
                            onClick={() => {
                              if (activeTableTab === 'FLOW') {
                                setFlatScripts([...flatScripts, { stage: CallStage.PITCH, id: '', label: '新', content: '', logSummary: '', models: '' }]);
                              } else {
                                setFlatQuick([...flatQuick, { id: '', category: 'PRICE', question: '新问题', answer: '', models: '' }]);
                              }
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-white border border-slate-300 hover:border-indigo-400 px-4 py-2 rounded-full transition-all shadow-sm active:scale-95"
                          >
                            <Plus size={14} /> 
                            添加一行
                          </button>
                        </div>
                     </div>
                  </div>

                  <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                     <span className="text-xs text-slate-400 self-center mr-auto">
                       💡 提示：在 Excel 编辑好后，保存为 CSV 并上传即可覆盖。车型填 "通用" 或留空则全车系显示。
                     </span>
                     <button 
                       onClick={() => setShowImportModal(false)}
                       className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                     >
                       取消
                     </button>
                     <button 
                       onClick={handleSaveTable}
                       className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:translate-y-0.5 flex items-center gap-2"
                     >
                       <Save size={18} />
                       保存并生效
                     </button>
                  </div>
                </div>
              )}

              {/* === MODE: JSON SOURCE === */}
              {editMode === 'JSON' && (
                <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 relative">
                    <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle size={14} /> 
                      JSON 高级模式
                    </h4>
                    <p className="text-xs text-amber-700 mb-2 max-w-[80%]">
                      高级用户可以直接编辑 JSON 结构。
                    </p>
                    <button 
                      onClick={handleDownloadJsonTemplate}
                      className="absolute top-4 right-4 text-xs bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1 font-bold shadow-sm"
                    >
                      <Download size={14} /> 下载 JSON
                    </button>
                    <div className="bg-slate-800 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-[10px] text-green-400 font-mono">
                        {JSON.stringify(IMPORT_TEMPLATE, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex justify-center items-center border-2 border-dashed border-slate-300 rounded-2xl p-10 bg-slate-50 hover:bg-white hover:border-indigo-400 transition-all group">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="json-upload"
                    />
                    <label htmlFor="json-upload" className="cursor-pointer text-center">
                      <Upload size={48} className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-4 transition-colors" />
                      <span className="block font-bold text-slate-600 group-hover:text-indigo-600">点击上传 JSON</span>
                    </label>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Copilot;
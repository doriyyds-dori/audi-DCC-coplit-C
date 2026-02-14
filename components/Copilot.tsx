
import React, { useState, useRef, useEffect } from 'react';
import { CALL_FLOW_CONFIG, CAR_SERIES, QUICK_RESPONSES, ABNORMAL_SCENARIOS, CallOutcome } from '../constants';
import { CallStage, ScriptButton, QuickCategory, CallStageConfig, NeedQuestion } from '../types';
import { generateSummaryEnhancement } from '../services/geminiService';
import { 
  Phone, User, RotateCcw, MessageCircle, 
  HelpCircle, Loader2, Sparkles, 
  Smile, Search, Zap, CalendarCheck, 
  History, ClipboardCheck, Target, ChevronLeft, Copy, Check, AlertCircle, Calendar, UserX
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'Smile': Smile, 'Search': Search, 'Zap': Zap, 'CalendarCheck': CalendarCheck, 'HelpCircle': HelpCircle
};

const Copilot: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'先生'|'女士'|'未知'>('先生');
  const [series, setSeries] = useState('');
  const [needs, setNeeds] = useState<Record<string, string>>({});
  const [activeScript, setActiveScript] = useState<string>('👋 准备就绪...');
  const [logs, setLogs] = useState<string>('');
  const [quickTab, setQuickTab] = useState<QuickCategory>('PRICE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [amsResult, setAmsResult] = useState<{profile: string, record: string, plan: string} | null>(null);
  const [viewMode, setViewMode] = useState<'LOG' | 'AMS'>('LOG');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CallOutcome>('UNDECIDED');

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => prev + `[${time}] ${text}\n`);
  };

  const handleQuickExit = (scen: typeof ABNORMAL_SCENARIOS[0]) => {
    addLog(`[异常结案快速标记] ${scen.log}`);
    setOutcome('NONE');
    setActiveScript(`⚠️ 通话异常结束：${scen.label}`);
    // 视觉反馈，提示专员可以点击生成记录了
    if (viewMode === 'LOG') {
      setTimeout(() => alert(`已记录：${scen.label}。您可以直接点击右下角生成记录。`), 200);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed');
    }
  };

  const handleGenerateAMS = async () => {
    if (!logs.trim()) { alert('当前没有操作轨迹，请先进行话术或异常点击'); return; }
    if (!phone.trim()) { alert('请输入客户电话以便存档'); return; }

    setIsGenerating(true);
    try {
      const result = await generateSummaryEnhancement({ 
        phone, name, gender, series, needs, logs, outcome 
      });
      setAmsResult(result);
      setViewMode('AMS');
      addLog(`[系统记录生成] 结果判定：${outcome === 'APPOINTED' ? '已约进店' : '未定/异常'}`);
    } catch (err) {
      alert('生成记录时遇到问题，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 p-4 overflow-hidden bg-slate-50 font-sans">
      
      {/* 左侧：话术流 & 异常处理 */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* 顶部：客户基础资料 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-200 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl flex-1 max-w-[120px]">
            <User size={18} className="text-slate-400" />
            <input className="bg-transparent w-full outline-none font-bold text-slate-800" placeholder="姓氏" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex gap-1">
             {['先生', '女士'].map((g: any) => (
               <button key={g} onClick={() => setGender(g)} className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${gender === g ? 'bg-zinc-800 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{g}</button>
             ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl flex-1">
            <Phone size={18} className="text-slate-400" />
            <input className="bg-transparent w-full outline-none font-mono font-bold text-slate-800" placeholder="电话..." value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <select value={series} onChange={e => setSeries(e.target.value)} className="bg-amber-100 text-amber-900 font-bold px-4 py-2 rounded-xl outline-none cursor-pointer">
            <option value="">咨询车型 ▾</option>
            {CAR_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 核心：异常结案区 (紧邻开场，适配现实拨打) */}
        <div className="bg-red-50 p-4 rounded-3xl border-2 border-red-100 shadow-sm flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black text-red-800 uppercase flex items-center gap-1.5 tracking-wider">
               <AlertCircle size={14} /> 现实结案快捷键 (出现异常立即点击)
            </div>
            <span className="text-[10px] text-red-300 italic">点击后自动结案并记录日志</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {ABNORMAL_SCENARIOS.map(scen => (
              <button 
                key={scen.id} 
                onClick={() => handleQuickExit(scen)} 
                className="bg-white border-2 border-red-50 py-3 rounded-2xl text-xs font-black text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <UserX size={14} /> {scen.label}
              </button>
            ))}
          </div>
        </div>

        {/* 话术流主列表 */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-10 custom-scrollbar">
          {CALL_FLOW_CONFIG.map((stage) => (
            <div key={stage.stage} className={`rounded-3xl border-2 bg-white shadow-sm overflow-hidden ${stage.colorTheme.replace('text-', 'border-').split(' ')[1]}`}>
              <div className={`px-5 py-3 flex items-center font-black text-lg ${stage.colorTheme}`}>
                {Object.entries(ICON_MAP).find(([k]) => k === stage.icon)?.[1] ? React.createElement(ICON_MAP[stage.icon as string], { size: 20, className: "mr-2" }) : <HelpCircle size={20} className="mr-2" />}
                {stage.title}
              </div>
              <div className="p-5">
                {stage.stage === CallStage.DISCOVERY ? (
                  <div className="space-y-4">
                    {(stage.items as NeedQuestion[]).map(q => (
                      <div key={q.id}>
                        <p className="text-sm font-bold text-slate-400 mb-2">{q.question}</p>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map(opt => (
                            <button key={opt.value} onClick={() => { setNeeds({...needs, [q.id]: opt.value}); setActiveScript(q.scriptHint); addLog(`画像确认: ${opt.label}`); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-b-2 ${needs[q.id] === opt.value ? 'bg-indigo-600 border-indigo-800 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(stage.items as ScriptButton[]).map(btn => (
                      <button key={btn.id} onClick={() => { setActiveScript(btn.content.replace(/{Name}/g, name||'客户')); addLog(btn.logSummary); }} className="group p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left shadow-sm">
                         <span className="font-bold text-slate-700 group-hover:text-indigo-700 text-base mb-1 block">{btn.label}</span>
                         <span className="text-xs text-slate-400 line-clamp-1">{btn.content}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：提词器、结果判定 & AMS 记录生成 */}
      <div className="w-[420px] flex flex-col gap-4">
        
        {/* 提词器 */}
        <div className="bg-zinc-900 rounded-3xl p-5 text-white shadow-xl min-h-[120px] flex flex-col border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] mb-2 tracking-widest">
            <Sparkles size={14} className="text-amber-400" /> LIVE PROMPTER
          </div>
          <div className="text-lg font-medium leading-relaxed italic text-zinc-100">"{activeScript}"</div>
        </div>

        {/* 重点：通话结果判定 (结案前必选) */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-sm flex flex-col gap-3">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Calendar size={12} /> 通话最终判定 (核心统计维度)
           </div>
           <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
             <button 
               onClick={() => { setOutcome('APPOINTED'); addLog('[结果判定] 成功预约进店'); }} 
               className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${outcome === 'APPOINTED' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {outcome === 'APPOINTED' && <Check size={14} />} 已约大致进店
             </button>
             <button 
               onClick={() => { setOutcome('UNDECIDED'); addLog('[结果判定] 意向不明确/再看看'); }} 
               className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${outcome === 'UNDECIDED' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {outcome === 'UNDECIDED' && <Check size={14} />} 无法确定时间
             </button>
           </div>
        </div>

        {/* AMS 系统记录展示区 (移除分段按钮) */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col overflow-hidden">
           <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-2">
               {viewMode === 'AMS' ? (
                 <button onClick={() => setViewMode('LOG')} className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors">
                   <ChevronLeft size={16} />
                 </button>
               ) : null}
               <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${viewMode === 'AMS' ? 'text-indigo-600' : 'text-slate-400'}`}>
                 {viewMode === 'AMS' ? <ClipboardCheck size={16} /> : <History size={16} />}
                 {viewMode === 'AMS' ? 'AMS 系统标准记录' : '通话实时日志轨迹'}
               </span>
             </div>
             {viewMode === 'LOG' && (
               <button onClick={() => { if(confirm('清空当前日志？')) setLogs(''); }} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
                 <RotateCcw size={14} />
               </button>
             )}
           </div>

           <div className="flex-1 overflow-y-auto p-4 bg-slate-50/20 custom-scrollbar">
             {viewMode === 'LOG' ? (
               <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-500 leading-relaxed italic">
                 {logs || '等待拨打记录录入...'}
                 <div ref={logEndRef} />
               </pre>
             ) : (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 {/* 三大结构化模块 - 每个都带复制按钮 */}
                 {[
                   { id: 'profile', title: '客户画像 (标签)', icon: User, color: 'indigo', val: amsResult?.profile },
                   { id: 'record', title: '通话总结 (核心异议)', icon: MessageCircle, color: 'emerald', val: amsResult?.record },
                   { id: 'plan', title: '跟进计划 (下一步动作)', icon: Target, color: 'rose', val: amsResult?.plan }
                 ].map(card => (
                   <div key={card.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`text-[10px] font-black text-${card.color}-500 uppercase flex items-center gap-1.5 tracking-widest`}>
                          <card.icon size={12} /> {card.title}
                        </h4>
                        <button 
                          onClick={() => copyToClipboard(card.val || '', card.id)}
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="一键复制到 AMS"
                        >
                          {copiedId === card.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{card.val}</p>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* 核心生成按钮 */}
           <div className="p-4 bg-white border-t border-slate-100">
             <button 
               onClick={handleGenerateAMS}
               disabled={isGenerating}
               className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                 isGenerating 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-zinc-900 text-white hover:bg-black ring-offset-2 hover:ring-2 ring-zinc-400'
               }`}
             >
               {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="text-amber-400" />}
               {isGenerating ? 'AI 正在提炼 AMS 记录...' : '一键生成 AMS 记录'}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Copilot;

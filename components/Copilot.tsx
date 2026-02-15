
import React, { useState, useRef, useEffect } from 'react';
import { CALL_FLOW_CONFIG, CAR_SERIES, ABNORMAL_SCENARIOS, CallOutcome } from '../constants';
import { CallStage, ScriptButton, QuickCategory, NeedQuestion } from '../types';
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
  const [activeScript, setActiveScript] = useState<string>('👋 已连接，等待拨号指令...');
  const [logs, setLogs] = useState<string>('');
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
    addLog(`[结案记录] ${scen.log}`);
    setOutcome('NONE');
    setActiveScript(`⚠️ ${scen.label}`);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) { console.error('Copy failed'); }
  };

  const handleGenerateAMS = async () => {
    if (!logs.trim()) { alert('当前没有操作轨迹'); return; }
    if (!phone.trim()) { alert('请输入客户电话'); return; }
    setIsGenerating(true);
    try {
      const result = await generateSummaryEnhancement({ phone, name, gender, series, needs, logs, outcome });
      setAmsResult(result);
      setViewMode('AMS');
    } catch (err) { alert('生成失败'); } finally { setIsGenerating(false); }
  };

  return (
    <div className="h-[calc(100vh-48px)] flex gap-4 p-4 overflow-hidden bg-[#F5F4F8] text-[#3F3F46]">
      
      {/* 左侧：话术流 & 异常处理 */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* 1. 基础资料 - 纯白卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E4E4E7] flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-[#F4F4F5] px-3 py-2 rounded-xl flex-1 max-w-[120px]">
            <User size={16} className="text-[#A1A1AA]" />
            <input className="bg-transparent w-full outline-none font-bold text-[#3F3F46]" placeholder="姓氏" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex gap-1 p-1 bg-[#F4F4F5] rounded-xl">
             {['先生', '女士'].map((g: any) => (
               <button key={g} onClick={() => setGender(g)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${gender === g ? 'bg-white text-[#3F3F46] shadow-sm' : 'text-[#A1A1AA]'}`}>{g}</button>
             ))}
          </div>
          <div className="flex items-center gap-2 bg-[#F4F4F5] px-3 py-2 rounded-xl flex-1">
            <Phone size={16} className="text-[#A1A1AA]" />
            <input className="bg-transparent w-full outline-none font-mono font-bold text-[#3F3F46]" placeholder="电话..." value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <select value={series} onChange={e => setSeries(e.target.value)} className="bg-purple-50 text-purple-700 font-bold px-4 py-2 rounded-xl outline-none border border-purple-100">
            <option value="">咨询车型 ▾</option>
            {CAR_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 2. 异常快速结案 - 明快状态色 */}
        <div className="bg-[#FEF2F2] p-4 rounded-2xl border border-[#FEE2E2] shadow-sm flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between px-1">
            <div className="text-[10px] font-black text-[#EF4444] uppercase flex items-center gap-1.5 tracking-widest">
               <AlertCircle size={14} /> 拨打异常反馈
            </div>
            <span className="text-[9px] text-[#FDA4AF] italic font-medium">点击后自动记录并结案</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {ABNORMAL_SCENARIOS.map(scen => (
              <button 
                key={scen.id} 
                onClick={() => handleQuickExit(scen)} 
                className="bg-white border border-[#FEE2E2] py-2.5 rounded-xl text-xs font-bold text-[#DC2626] hover:bg-[#EF4444] hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <UserX size={14} /> {scen.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 话术流主列表 */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
          {CALL_FLOW_CONFIG.map((stage) => (
            <div key={stage.stage} className="rounded-2xl border border-[#E4E4E7] bg-white shadow-sm overflow-hidden transition-all hover:border-purple-200">
              <div className="px-5 py-2.5 bg-[#FAF9F6] border-b border-[#E4E4E7] flex items-center justify-between">
                <div className="flex items-center font-bold text-sm text-[#3F3F46]">
                  {Object.entries(ICON_MAP).find(([k]) => k === stage.icon)?.[1] ? React.createElement(ICON_MAP[stage.icon as string], { size: 16, className: "mr-2 text-purple-600" }) : <HelpCircle size={16} className="mr-2" />}
                  {stage.title}
                </div>
              </div>
              <div className="p-4">
                {stage.stage === CallStage.DISCOVERY ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(stage.items as NeedQuestion[]).map(q => (
                      <div key={q.id}>
                        <p className="text-[10px] font-black text-[#A1A1AA] uppercase mb-2 tracking-wider">{q.question}</p>
                        <div className="flex gap-2">
                          {q.options.map(opt => (
                            <button key={opt.value} onClick={() => { setNeeds({...needs, [q.id]: opt.value}); setActiveScript(q.scriptHint); addLog(`[画像] ${opt.label}`); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${needs[q.id] === opt.value ? 'bg-purple-600 border-purple-700 text-white' : 'bg-white border-[#E4E4E7] text-[#71717A] hover:bg-[#F4F4F5]'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(stage.items as ScriptButton[]).map(btn => (
                      <button key={btn.id} onClick={() => { setActiveScript(btn.content.replace(/{Name}/g, name||'客户')); addLog(`[动作] ${btn.label}`); }} className="group p-3 rounded-xl bg-white border border-[#E4E4E7] hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left">
                         <span className="font-bold text-[#3F3F46] group-hover:text-purple-700 text-xs mb-1 block">{btn.label}</span>
                         <span className="text-[10px] text-[#A1A1AA] line-clamp-1">{btn.content}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：提词器 & AMS 生成 */}
      <div className="w-[380px] flex flex-col gap-4">
        
        {/* 提词器 - 雾白底色带紫边 */}
        <div className="bg-white rounded-2xl p-5 text-[#3F3F46] shadow-sm flex flex-col border-l-4 border-l-purple-500 border-y border-r border-[#E4E4E7]">
          <div className="flex items-center gap-2 text-purple-500 font-black uppercase text-[9px] mb-3 tracking-[0.2em]">
            <Sparkles size={12} /> Live Prompter
          </div>
          <div className="text-base font-medium leading-relaxed italic">"{activeScript}"</div>
        </div>

        {/* 结果判定 - 使用明快状态色 */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 shadow-sm flex flex-col gap-3">
           <div className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-[0.2em] flex items-center gap-2">
             <Calendar size={12} /> 通话结果判定
           </div>
           <div className="flex gap-2 p-1 bg-[#FAF9F6] rounded-xl">
             <button 
               onClick={() => { setOutcome('APPOINTED'); addLog('[判定] 成功预约'); }} 
               className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${outcome === 'APPOINTED' ? 'bg-[#10B981] text-white shadow-md' : 'text-[#71717A] hover:bg-[#F4F4F5]'}`}
             >
               {outcome === 'APPOINTED' && <Check size={14} />} 已约进店
             </button>
             <button 
               onClick={() => { setOutcome('UNDECIDED'); addLog('[判定] 待跟进'); }} 
               className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${outcome === 'UNDECIDED' ? 'bg-[#F59E0B] text-white shadow-md' : 'text-[#71717A] hover:bg-[#F4F4F5]'}`}
             >
               {outcome === 'UNDECIDED' && <Check size={14} />} 再看看
             </button>
           </div>
        </div>

        {/* AMS 记录区 */}
        <div className="flex-1 bg-white rounded-2xl border border-[#E4E4E7] shadow-sm flex flex-col overflow-hidden">
           <div className="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E4E4E7] flex justify-between items-center">
             <div className="flex items-center gap-2">
               {viewMode === 'AMS' && (
                 <button onClick={() => setViewMode('LOG')} className="p-1 hover:bg-[#F4F4F5] rounded text-[#A1A1AA]">
                   <ChevronLeft size={16} />
                 </button>
               )}
               <span className="text-[10px] font-black uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
                 {viewMode === 'AMS' ? <ClipboardCheck size={14} /> : <History size={14} />}
                 {viewMode === 'AMS' ? 'AMS Standard' : 'Call Logic'}
               </span>
             </div>
             {viewMode === 'LOG' && (
               <button onClick={() => { if(confirm('清空日志？')) setLogs(''); }} className="text-[#D4D4D8] hover:text-[#EF4444] transition-colors">
                  <RotateCcw size={12} />
               </button>
             )}
           </div>

           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {viewMode === 'LOG' ? (
               <pre className="whitespace-pre-wrap font-mono text-[10px] text-[#A1A1AA] leading-loose italic">
                 {logs || '等待记录生成...'}
                 <div ref={logEndRef} />
               </pre>
             ) : (
               <div className="space-y-4">
                 {[
                   { id: 'profile', title: '画像', val: amsResult?.profile },
                   { id: 'record', title: '总结', val: amsResult?.record },
                   { id: 'plan', title: '计划', val: amsResult?.plan }
                 ].map(card => (
                   <div key={card.id} className="bg-white p-3 rounded-xl border border-[#F4F4F5] relative group hover:border-purple-200">
                      <div className="flex justify-between items-center mb-1.5">
                        <h4 className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-wider">{card.title}</h4>
                        <button onClick={() => copyToClipboard(card.val || '', card.id)} className="p-1 text-[#D4D4D8] hover:text-purple-600 transition-all">
                          {copiedId === card.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                      <p className="text-xs text-[#52525B] leading-relaxed">{card.val}</p>
                   </div>
                 ))}
               </div>
             )}
           </div>

           <div className="p-4 bg-white border-t border-[#F4F4F5]">
             <button 
               onClick={handleGenerateAMS}
               disabled={isGenerating}
               className={`w-full py-3.5 rounded-xl font-black text-xs tracking-widest uppercase shadow-sm flex items-center justify-center gap-2 transition-all ${
                 isGenerating 
                  ? 'bg-[#F4F4F5] text-[#D4D4D8]'
                  : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'
               }`}
             >
               {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-purple-200" />}
               一键生成AMS记录
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Copilot;

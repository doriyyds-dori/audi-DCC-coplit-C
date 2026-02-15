
import React, { useState, useRef, useEffect } from 'react';
import { CALL_FLOW_CONFIG as INITIAL_FLOW, CAR_SERIES, ABNORMAL_SCENARIOS, CallOutcome, QUICK_RESPONSES as INITIAL_QUICK } from '../constants';
import { CallStage, ScriptButton, NeedQuestion } from '../types';
import { generateSummaryEnhancement } from '../services/geminiService';
import { 
  Phone, User, RotateCcw, MessageCircle, 
  HelpCircle, Loader2, Sparkles, 
  Smile, Search, Zap, CalendarCheck, 
  History, ClipboardCheck, ChevronLeft, Copy, Check, AlertCircle, Calendar, UserX, Settings, Upload, FileText, X, Download
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'Smile': Smile, 'Search': Search, 'Zap': Zap, 'CalendarCheck': CalendarCheck, 'HelpCircle': HelpCircle
};

const Copilot: React.FC = () => {
  // --- 状态管理 ---
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'先生'|'女士'|'未知'>('先生');
  const [series, setSeries] = useState('');
  const [needs, setNeeds] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [amsResult, setAmsResult] = useState<{profile: string, record: string, plan: string} | null>(null);
  const [viewMode, setViewMode] = useState<'LOG' | 'AMS' | 'CONFIG'>('LOG');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CallOutcome>('UNDECIDED');
  
  const [dynamicFlow, setDynamicFlow] = useState(INITIAL_FLOW);
  const [dynamicQuick, setDynamicQuick] = useState(INITIAL_QUICK);
  const [csvContent, setCsvContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [activeScript, setActiveScript] = useState('');

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  useEffect(() => {
    const firstStage = dynamicFlow[currentStageIdx] || dynamicFlow[0];
    if (firstStage) {
      if (firstStage.stage === CallStage.DISCOVERY) {
        const firstItem = firstStage.items[0] as NeedQuestion;
        if (firstItem) setActiveScript(firstItem.scriptHint);
      } else {
        const firstItem = firstStage.items[0] as ScriptButton;
        if (firstItem) setActiveScript(firstItem.content.replace(/{Name}/g, name || '客户'));
      }
    }
  }, [dynamicFlow, name, currentStageIdx]);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => prev + `[${time}] ${text}\n`);
  };

  const handleDownloadTemplate = () => {
    const headers = "类型,分组ID,标题_问题,内容_回答,日志摘要,适用车型\n";
    const examples = [
      "话术,OPENING,标准开场,您好{Name}，我是奥迪体验官。E5实车到店了特邀您品鉴。,执行：标准开场,Audi E5",
      "话术,DISCOVERY,谁开/怎么用?,(引导语)这车买回去主要是您自己代步还是全家出行?,询问：用车场景,通用",
      "话术,PITCH,59寸大屏,那您一定得看看这个59寸5K大屏，副驾娱乐主驾互不干扰。,推介：59寸大屏,Audi E5",
      "话术,OFFER,限时权益,现在的预售权益只剩最后几名了，建议您尽快锁定。,执行：权益逼单,Audi E5",
      "急救包,PRICE,太贵了,一分钱一分货。E5是原生纯电平台，核心成本都在三电系统上。,异议处理：价格太贵,通用"
    ].join("\n");
    
    const blob = new Blob(["\uFEFF" + headers + examples], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "话术导入模板_AudiCopilot.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseAndApplyCSV = (content: string) => {
    if (!content.trim()) return;
    try {
      const lines = content.trim().split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) return;

      const newQuick: any[] = [];
      const updatedFlow = JSON.parse(JSON.stringify(dynamicFlow));

      // 默认清空旧动态话术以便重新加载（可选）
      updatedFlow.forEach((stage: any) => {
        if (stage.stage !== CallStage.DISCOVERY) {
          stage.items = []; 
        }
      });

      lines.forEach((line, index) => {
        if (index === 0) return; // 跳过表头
        
        const cols = line.split(',').map(s => s?.trim());
        if (cols.length < 4) return;

        const [type, groupId, title, scriptText, logText, carModel] = cols;
        
        if (type === '急救包') {
          newQuick.push({
            id: `csv_q_${index}`,
            category: groupId,
            question: title,
            answer: scriptText,
            models: carModel ? [carModel] : []
          });
        } else if (type === '话术') {
          const targetStage = groupId.toUpperCase();
          const stageIdx = updatedFlow.findIndex((s: any) => 
            s.stage === targetStage || 
            (targetStage === 'PITCH' && s.stage === CallStage.PITCH) || 
            (targetStage === 'OFFER' && s.stage === CallStage.OFFER) ||
            (targetStage === 'OPENING' && s.stage === CallStage.OPENING) ||
            (targetStage === 'DISCOVERY' && s.stage === CallStage.DISCOVERY) ||
            (targetStage === 'CLOSING' && s.stage === CallStage.CLOSING)
          );

          if (stageIdx > -1) {
            const currentStage = updatedFlow[stageIdx];
            if (currentStage.stage === CallStage.DISCOVERY) {
               // 需求探测特殊处理：如果是CSV进来的且是探测，通常是更新引导话术
               const existingQuestion = currentStage.items[0] as NeedQuestion;
               if (existingQuestion) {
                 existingQuestion.scriptHint = scriptText;
                 existingQuestion.question = title;
               }
            } else {
              currentStage.items.push({
                id: `csv_s_${index}`,
                label: title,
                content: scriptText,
                logSummary: logText || `推介：${title}`
              });
            }
          }
        }
      });

      setDynamicFlow(updatedFlow);
      if (newQuick.length > 0) setDynamicQuick(newQuick);
      setViewMode('LOG');
      alert('话术库更新成功！已根据您的 CSV 调整了引导逻辑。');
    } catch (e) {
      console.error(e);
      alert('导入失败，请检查 CSV 格式。');
    }
  };

  const handleImportText = () => parseAndApplyCSV(csvContent);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseAndApplyCSV(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStepClick = (stageIdx: number, item: any, isFeedback: boolean = false) => {
    setCurrentStageIdx(stageIdx);
    if (isFeedback) {
      addLog(`[反馈] ${item.label || item.question}`);
      if (stageIdx < dynamicFlow.length - 1) {
        const nextStage = dynamicFlow[stageIdx + 1];
        if (nextStage.stage === CallStage.DISCOVERY) {
           setActiveScript((nextStage.items[0] as NeedQuestion).scriptHint);
        } else {
           setActiveScript((nextStage.items[0] as ScriptButton).content.replace(/{Name}/g, name || '客户'));
        }
      }
    } else {
      setActiveScript(item.content.replace(/{Name}/g, name || '客户'));
      addLog(`[使用话术] ${item.label}`);
    }
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

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col p-4 bg-[#F5F4F8] text-[#3F3F46] overflow-hidden">
      
      {/* 1. 顶部巨型提词器 */}
      <div className="w-full max-w-5xl mx-auto mb-4">
        <div className="bg-white rounded-2xl p-6 shadow-md border-l-[6px] border-l-purple-600 border-y border-r border-[#E4E4E7] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-purple-600 font-black uppercase text-[10px] tracking-[0.3em]">
              <MessageCircle size={14} /> 实时推荐引导话术
            </div>
            <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold">
              {dynamicFlow[currentStageIdx]?.title || '准备就绪'}
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold leading-snug text-[#18181B] italic transition-all duration-300">
            "{activeScript || '等待呼叫开始...'}"
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 text-purple-50 size-24 opacity-50" />
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* 左侧：话术交互 */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E4E4E7] flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 bg-[#F4F4F5] px-3 py-2 rounded-xl flex-1 max-w-[140px]">
              <User size={16} className="text-[#A1A1AA]" />
              <input className="bg-transparent w-full outline-none font-bold text-[#3F3F46]" placeholder="客户姓氏" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex gap-1 p-1 bg-[#F4F4F5] rounded-xl">
               {['先生', '女士'].map((g: any) => (
                 <button key={g} onClick={() => setGender(g)} className={`px-5 py-1.5 rounded-lg text-xs font-black transition-all ${gender === g ? 'bg-white text-purple-600 shadow-sm' : 'text-[#A1A1AA]'}`}>{g}</button>
               ))}
            </div>
            <div className="flex items-center gap-2 bg-[#F4F4F5] px-3 py-2 rounded-xl flex-1">
              <Phone size={16} className="text-[#A1A1AA]" />
              <input className="bg-transparent w-full outline-none font-mono font-bold text-[#3F3F46]" placeholder="电话号码..." value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <select value={series} onChange={e => setSeries(e.target.value)} className="bg-purple-50 text-purple-700 font-bold px-4 py-2 rounded-xl outline-none border border-purple-100 cursor-pointer">
              <option value="">咨询车型</option>
              {CAR_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
            {dynamicFlow.map((stage, sIdx) => (
              <div key={stage.stage} className={`rounded-2xl border transition-all ${currentStageIdx === sIdx ? 'border-purple-300 bg-white shadow-md scale-[1.01]' : 'border-[#E4E4E7] bg-white opacity-60'}`}>
                <div className="px-5 py-3 border-b border-[#E4E4E7] flex items-center justify-between">
                  <div className="flex items-center font-bold text-sm text-[#18181B]">
                    {React.createElement(ICON_MAP[stage.icon as string] || HelpCircle, { size: 18, className: `mr-3 ${currentStageIdx === sIdx ? 'text-purple-600' : 'text-[#A1A1AA]'}` })}
                    {stage.title}
                  </div>
                </div>
                <div className="p-5">
                  {stage.stage === CallStage.DISCOVERY ? (
                    <div className="space-y-4">
                      {(stage.items as NeedQuestion[]).map(q => (
                        <div key={q.id} className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E4E4E7]/50">
                          <p className="text-xs font-bold text-[#3F3F46] mb-3 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> 询问反馈：{q.question}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map(opt => (
                              <button 
                                key={opt.value} 
                                onClick={() => {
                                  setNeeds({...needs, [q.id]: opt.value});
                                  handleStepClick(sIdx, { label: `${q.question}:${opt.label}` }, true);
                                }} 
                                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${needs[q.id] === opt.value ? 'bg-purple-600 border-purple-700 text-white shadow-sm' : 'bg-white border-[#E4E4E7] text-[#71717A] hover:border-purple-300'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {(stage.items as ScriptButton[]).map(btn => (
                        <button 
                          key={btn.id} 
                          onClick={() => handleStepClick(sIdx, btn)} 
                          className={`group p-4 rounded-xl text-left transition-all border ${activeScript.includes(btn.content.substring(0,8)) ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-100' : 'bg-white border-[#E4E4E7] hover:bg-[#F4F4F5]'}`}
                        >
                           <div className="font-bold text-[#3F3F46] text-xs mb-1 truncate">{btn.label}</div>
                           <div className="text-[10px] text-[#A1A1AA] line-clamp-2 italic">"{btn.content}"</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-[360px] flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-sm flex flex-col overflow-hidden flex-1">
             <div className="px-4 py-3 bg-[#FAF9F6] border-b border-[#E4E4E7] flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
                  {viewMode === 'AMS' ? <ClipboardCheck size={14} /> : viewMode === 'CONFIG' ? <Settings size={14} /> : <History size={14} />}
                  {viewMode === 'AMS' ? 'AI 智能生成' : viewMode === 'CONFIG' ? '配置话术库' : '实时操作日志'}
                </span>
                <div className="flex gap-2">
                   {viewMode === 'CONFIG' && (
                     <button onClick={() => setViewMode('LOG')} className="p-1.5 text-[#A1A1AA] hover:bg-white rounded transition-all"><X size={14} /></button>
                   )}
                   <button onClick={() => setViewMode('CONFIG')} className={`p-1.5 rounded transition-all ${viewMode === 'CONFIG' ? 'bg-purple-100 text-purple-600 shadow-sm' : 'text-[#A1A1AA] hover:bg-[#F4F4F5]'}`}>
                      <Upload size={14} />
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {viewMode === 'CONFIG' ? (
                  <div className="h-full flex flex-col gap-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-purple-50 transition-all group"
                    >
                      <div className="bg-purple-100 text-purple-600 p-3 rounded-full group-hover:scale-110 transition-transform shadow-sm">
                        <FileText size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-[#3F3F46]">上传 CSV 话术文件</p>
                        <p className="text-[10px] text-[#A1A1AA] mt-1">请遵循模板定义的列名规范</p>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                    </div>

                    <button 
                      onClick={handleDownloadTemplate}
                      className="flex items-center justify-center gap-2 py-2 border border-[#E4E4E7] rounded-xl text-[10px] font-bold text-[#71717A] hover:bg-white hover:text-purple-600 transition-all shadow-sm"
                    >
                      <Download size={14} /> 下载话术导入模板
                    </button>

                    <div className="flex flex-col gap-2 flex-1 min-h-0">
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">手动粘贴配置文本</p>
                      <textarea 
                        value={csvContent} 
                        onChange={e => setCsvContent(e.target.value)}
                        placeholder="类型,分组ID,标题_问题,内容_回答,日志摘要,适用车型..."
                        className="flex-1 w-full p-3 bg-[#F4F4F5] rounded-xl text-[10px] font-mono outline-none border border-[#E4E4E7] focus:border-purple-300 resize-none"
                      />
                      <button onClick={handleImportText} className="w-full py-2.5 bg-[#18181B] text-white rounded-xl text-xs font-bold hover:bg-purple-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                         <Zap size={14} /> 立即应用
                      </button>
                    </div>
                  </div>
                ) : viewMode === 'LOG' ? (
                  <pre className="whitespace-pre-wrap font-mono text-[10px] text-[#A1A1AA] leading-loose italic">
                    {logs || '等待通话触发记录...'}
                    <div ref={logEndRef} />
                  </pre>
                ) : (
                  <div className="space-y-4">
                    {amsResult && [
                      { id: 'profile', title: '客户画像', val: amsResult.profile },
                      { id: 'record', title: '通话总结', val: amsResult.record },
                      { id: 'plan', title: '跟进计划', val: amsResult.plan }
                    ].map(card => (
                      <div key={card.id} className="bg-white p-3 rounded-xl border border-[#F4F4F5] relative group hover:border-purple-200 transition-all">
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

             <div className="p-4 bg-white border-t border-[#F4F4F5] space-y-3">
                <div className="flex gap-2">
                   <button onClick={() => { setOutcome('APPOINTED'); addLog('[结果] 预约进店'); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${outcome === 'APPOINTED' ? 'bg-[#10B981] border-[#059669] text-white shadow-sm' : 'bg-[#F4F4F5] text-[#71717A]'}`}>已约进店</button>
                   <button onClick={() => { setOutcome('UNDECIDED'); addLog('[结果] 待跟进'); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${outcome === 'UNDECIDED' ? 'bg-[#F59E0B] border-[#D97706] text-white shadow-sm' : 'bg-[#F4F4F5] text-[#71717A]'}`}>再看看</button>
                </div>
                <button 
                  onClick={handleGenerateAMS}
                  disabled={isGenerating}
                  className={`w-full py-3.5 rounded-xl font-black text-xs tracking-widest uppercase shadow-md flex items-center justify-center gap-2 transition-all ${
                    isGenerating ? 'bg-[#F4F4F5] text-[#D4D4D8]' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                  }`}
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-purple-200" />}
                  智能生成 AMS 记录
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Copilot;

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { startDojoSession, sendDojoMessage } from '../services/geminiService';
import { Mic, Send, Play, RefreshCw, Trophy } from 'lucide-react';

const AIDojo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0); // Simulated score
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStart = async () => {
    setIsPlaying(true);
    setIsLoading(true);
    setMessages([]);
    setScore(0);
    const initialResponse = await startDojoSession();
    setMessages([{ role: 'model', text: initialResponse }]);
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Simulate score increase for activity
    setScore(prev => Math.min(prev + 15, 100));

    const aiResponseText = await sendDojoMessage(input);
    const aiMsg: Message = { role: 'model', text: aiResponseText };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <div className="text-center max-w-lg p-8">
          <div className="bg-red-100 text-red-600 p-4 rounded-full inline-block mb-6">
            <Trophy size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">AI 陪练场：品牌质疑者</h2>
          <p className="text-slate-600 mb-8">
            场景：你正在与"陈先生"通话，他是一位45岁的宝马5系车主。
            他对没有四环标的奥迪 E5 持怀疑态度，认为这是"假奥迪"。
            <br/><br/>
            <strong>目标：</strong> 使用"传承 + 创新"的策略说服他。
          </p>
          <button 
            onClick={handleStart}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <Play size={20} />
            开始模拟
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6">
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
             <div>
               <h3 className="font-bold">陈先生 (宝马车主)</h3>
               <p className="text-xs text-slate-400">场景：品牌异议</p>
             </div>
          </div>
          <button onClick={handleStart} className="p-2 hover:bg-slate-700 rounded-full text-slate-300" title="重新开始">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-red-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-gray-200 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-200">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入您的回复... (例如：'陈先生，奥迪的历史始于1909年...')"
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              autoFocus
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Score Panel */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
           <h4 className="text-gray-500 uppercase text-xs font-bold mb-2">当前会话评分</h4>
           <div className="text-5xl font-bold text-slate-800 mb-2">{score}</div>
           <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${score}%` }}></div>
           </div>
           <p className="text-xs text-gray-400">及格：需达到80分</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
           <h4 className="text-blue-800 font-bold mb-2 text-sm">教练提示</h4>
           <p className="text-blue-700 text-xs leading-relaxed">
             不要只列参数。先认可他对品牌的感受。使用"Feel, Felt, Found"（感受-感觉-发现）法则。提到"AUDI"字母标代表新的智能专用平台，区别于经典的机械quattro平台。
           </p>
        </div>
      </div>
    </div>
  );
};

export default AIDojo;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  MessageSquareCode, 
  Trash2, 
  AlertCircle,
  TrendingDown,
  LineChart
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Dataset, ChatMessage } from '../types';

interface AiAnalystProps {
  dataset: Dataset;
  filteredRows: any[];
}

const QUICK_PROMPTS = [
  "Summarize key trends in this data",
  "Are there any unusual outliers/anomalies?",
  "Analyze correlations between key columns",
  "Which 3 chart types would represent this best?"
];

export default function AiAnalyst({ dataset, filteredRows }: AiAnalystProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const endOfChatRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  // Reset chat if the loaded dataset changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Hello! I am your server-side **Gemini AI Data Analyst**. I've synchronized with **"${dataset.name}"** containing **${dataset.rows.length} rows**.\n\nAsk me queries, statistical summaries, trends, or visual layout recommendations! Click a general prompt below to quick-start.`,
        timestamp: new Date()
      }
    ]);
    setErrorMsg(null);
  }, [dataset.id]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isPending) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsPending(true);
    setErrorMsg(null);

    try {
      // Aggregate column schemas and a slice of rows for the AI
      // Send max 15 rows to keep payload size efficient and super fast
      const first15Rows = filteredRows.slice(0, 15);
      
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName: dataset.name,
          columns: dataset.columns,
          rowsPreview: first15Rows,
          question: textToSend
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error analyzed status.');
      }

      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Network loss or missing server gateway connection.');
    } finally {
      setIsPending(false);
    }
  };

  const clearChatHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Chat thread cleared! Loaded context matches **"${dataset.name}"**. Feel free to ask questions.`,
        timestamp: new Date()
      }
    ]);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[500px]" id="ai-analyst-panel">
      {/* Messages Thread panel (75% width) */}
      <div className="flex-1 border border-slate-200 rounded-2xl bg-white flex flex-col overflow-hidden justify-between h-full shadow-sm" id="ai-thread-pane">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50" id="ai-thread-header">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-lg" id="ai-chip">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-850">AI Analyst Assistant</h4>
              <p className="text-[10px] text-indigo-600 font-bold">Synchronized &#8226; Gemini Intellect</p>
            </div>
          </div>
          
          <button
            id="btn-clear-chat"
            onClick={clearChatHistory}
            className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
            title="Clear Chat history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Conversation flow */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[340px]" id="ai-chat-thread-scroller">
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                id={`chat-msg-${msg.id}`}
              >
                <div className={`p-2 h-8 w-8 rounded-full flex items-center justify-center shrink-0 border select-none ${
                   isModel 
                     ? 'bg-slate-50 border-slate-200 text-slate-600 font-bold' 
                     : 'bg-indigo-600 border-indigo-700 text-white font-bold'
                }`}>
                  {isModel ? <Bot className="h-4 w-4" /> : <span className="text-[10px] font-extrabold">ME</span>}
                </div>
                
                <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                  isModel 
                    ? 'bg-slate-50/50 border-slate-200 text-slate-800 shadow-3xs' 
                    : 'bg-indigo-600 border-indigo-700 text-white'
                }`}>
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isPending && (
            <div className="flex gap-3 max-w-[80%]" id="analyst-thinking-box">
              <div className="p-2 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="p-3 rounded-2xl text-xs leading-normal bg-slate-50 border border-slate-200 text-slate-500 flex items-center gap-2">
                <span>Gemini is reading aggregates and scanning calculations...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs leading-normal flex gap-2" id="analyst-error-row">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">AI Retrieval Failure</p>
                <p className="text-[11px] opacity-90 mt-0.5">{errorMsg}</p>
                <p className="text-[10px] mt-2 font-medium opacity-85 text-slate-500">
                  Configure your API key in settings or `.env` and rebuild.
                </p>
              </div>
            </div>
          )}
          <div ref={endOfChatRef} />
        </div>

        {/* Input box */}
        <form 
          id="ai-analyst-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="p-3 border-t border-slate-100"
        >
          <div className="relative flex items-center" id="ai-form-container">
            <input
              type="text"
              id="input-ai-prompt"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isPending}
              placeholder="Ask a question about outliers, schemas, totals, or chart designs..."
              className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10.5 py-3 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              id="btn-submit-ai-prompt"
              disabled={!inputText.trim() || isPending}
              className="absolute right-1.5 p-2 bg-indigo-600 border border-indigo-700 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Quick Click Prompts Sidebar (25% width) */}
      <div className="w-full lg:w-64 p-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col justify-start gap-4" id="ai-quick-panel">
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
            <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
            <span>Preset Questions</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">Tap standard prompts to explore patterns instanteneously.</p>
        </div>

        <div className="space-y-2" id="ai-preset-list">
          {QUICK_PROMPTS.map((promptText, pIdx) => (
            <button
              key={pIdx}
              id={`btn-quick-prompt-${pIdx}`}
              onClick={() => handleSendMessage(promptText)}
              disabled={isPending}
              className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-650 hover:shadow-3xs transition active:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

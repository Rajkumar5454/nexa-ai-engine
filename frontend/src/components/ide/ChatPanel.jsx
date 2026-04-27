import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Sparkles, Loader2, Zap, MessageSquare, X, Mic, Trash2, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

// Simple markdown-like renderer for structured AI responses
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      // Bold heading
      elements.push(
        <h4 key={key++} className="text-sm font-bold text-blue-400 mt-3 mb-1">
          {trimmed.replace(/\*\*/g, '')}
        </h4>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={key++} className="flex items-start space-x-2 ml-2 my-0.5">
          <span className="text-blue-400 mt-1 text-xs">&#9679;</span>
          <span className="text-sm text-gray-200">{trimmed.slice(2)}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)[1];
      elements.push(
        <div key={key++} className="flex items-start space-x-2 ml-2 my-0.5">
          <span className="text-blue-400 text-xs font-bold min-w-[16px]">{num}.</span>
          <span className="text-sm text-gray-200">{trimmed.replace(/^\d+\.\s*/, '')}</span>
        </div>
      );
    } else if (trimmed === '') {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm text-gray-200 my-0.5">{trimmed}</p>
      );
    }
  }

  return <div className="space-y-0">{elements}</div>;
};

const ChatPanel = ({ messages, onSendMessage, onChatMessage, isGenerating = false, onNewProject, streamingText = '', projectId, onAnalyze, onClearChat, onStop }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('build'); // 'build' or 'chat'
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const progressMessages = [
    "Preparing the workspace...",
    "Writing JS and HTML code now...",
    "Assembling the premium design...",
    "Optimizing responsive layouts...",
    "Injecting smart logic...",
    "Finalizing your website..."
  ];

  useEffect(() => {
    let interval;
    if (isGenerating) {
      setProgressStep(0);
      interval = setInterval(() => {
        setProgressStep(prev => (prev + 1) % progressMessages.length);
      }, 3500); // Change every 3.5 seconds
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const credits = user?.credits ?? null;
  const showLowCreditsNudge =
    credits !== null && credits > 0 && credits < 15 && !nudgeDismissed;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (input.trim() && !isGenerating) {
      if (mode === 'chat' && onChatMessage) {
        onChatMessage(input);
      } else {
        onSendMessage(input);
      }
      setInput('');
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input is not supported in your browser.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleStop = (e) => {
    e.preventDefault();
    if (onStop) onStop();
  };

  const charCount = streamingText.length;

  return (
    <div className="w-96 border-r border-gray-800 flex flex-col bg-[#0f0f0f]" data-testid="chat-panel">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-gray-400">Nexa AI</h2>
          <div className="flex items-center space-x-1">
            {projectId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 h-7 px-2 text-xs"
                onClick={onAnalyze}
                disabled={isGenerating}
              >
                <Zap className="w-3 h-3 mr-1" />
                Audit
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-400 h-7 px-2" title="Clear Chat" onClick={onClearChat}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 px-2" onClick={onNewProject}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex bg-gray-900 rounded-lg p-0.5">
          <button onClick={() => setMode('build')} className={`flex-1 text-xs py-1.5 rounded-md flex items-center justify-center space-x-1 transition-all ${mode === 'build' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <Sparkles className="w-3 h-3" />
            <span>Build</span>
          </button>
          <button onClick={() => setMode('chat')} className={`flex-1 text-xs py-1.5 rounded-md flex items-center justify-center space-x-1 transition-all ${mode === 'chat' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* Credits Nudge */}
      {showLowCreditsNudge && (
        <div className="mx-3 mt-3 p-3 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-amber-100 font-semibold">{credits} credits left</p>
            <button onClick={() => navigate('/pricing')} className="text-xs text-white underline underline-offset-2 mt-0.5">Buy credits →</button>
          </div>
          <button onClick={() => setNudgeDismissed(true)} className="text-amber-300/60 hover:text-amber-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-4">
            <div className="text-center mb-6">
              <Sparkles className="w-7 h-7 text-blue-500/40 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{mode === 'build' ? 'What do you want to build?' : 'Ask about your project'}</p>
            </div>
            {mode === 'build' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Portfolio', prompt: 'portfolio website with gallery, skills, timeline', icon: '🎨' },
                  { label: 'E-Commerce', prompt: 'e-commerce store with products, cart, checkout', icon: '🛒' },
                  { label: 'SaaS Landing', prompt: 'SaaS landing page with pricing, features', icon: '🚀' },
                  { label: 'Blog Platform', prompt: 'blog platform with articles, categories', icon: '📝' },
                ].map((t) => (
                  <button key={t.label} onClick={() => onSendMessage(t.prompt)} disabled={isGenerating} className="text-left p-3 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all group">
                    <span className="text-lg">{t.icon}</span>
                    <p className="text-xs font-medium text-gray-300 mt-1 group-hover:text-white">{t.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl p-3 ${message.type === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : message.isAnalysis ? 'bg-gradient-to-br from-orange-900/30 to-amber-900/20 border border-orange-800/30 text-gray-100 rounded-bl-sm' : 'bg-gray-800/80 text-gray-100 rounded-bl-sm'}`}>
              {message.type === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className={`w-3.5 h-3.5 ${message.isAnalysis ? 'text-orange-400' : 'text-blue-400'}`} />
                  <span className="text-[11px] text-gray-400">{message.isAnalysis ? 'Project Audit' : 'Nexa AI'}</span>
                </div>
              )}
              {message.isStreaming && streamingText ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span className="text-xs text-blue-400 font-medium">{progressMessages[progressStep]}</span>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2 max-h-24 overflow-hidden border border-gray-800/50">
                    <div className="flex justify-between items-center mb-1 px-1">
                      <span className="text-[10px] text-gray-500 font-mono">Stream: {streamingText.length} chars</span>
                    </div>
                    <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap break-all">{streamingText.slice(-150)}</pre>
                  </div>
                </div>
              ) : message.isStreaming ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-gray-400">{progressMessages[progressStep]}</span>
                </div>
              ) : (
                <FormattedMessage content={message.content} />
              )}
              {message.actions && !message.isStreaming && (
                <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
                  {message.actions.map((action, idx) => (
                    <div key={idx} className="text-xs text-gray-400 flex items-center space-x-2">
                      <span className="text-green-400">&#10003;</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'build' ? 'Describe the app you want to build...' : 'Ask about your project...'}
            className="w-full bg-gray-900 text-white placeholder-gray-600 rounded-lg px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-600 resize-none text-sm min-h-[100px]"
            disabled={isGenerating}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
          />
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            <input type="file" id="chat-upload" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files[0]) alert(`Screenshot "${e.target.files[0].name}" attached!`); }} />
            <button type="button" className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-300" title="Upload" onClick={() => document.getElementById('chat-upload').click()} disabled={isGenerating}>
              <Plus className="w-4 h-4" />
            </button>
            <button type="button" onClick={startVoiceInput} className={`p-1.5 rounded-md transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`} disabled={isGenerating}>
              <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
            </button>
            {isGenerating ? (
              <button type="button" onClick={handleStop} className="p-1.5 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/30 transition-colors" title="Stop">
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button type="submit" className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center space-x-3">
             <span className="text-[10px] text-gray-600 uppercase font-medium tracking-wider">{mode === 'build' ? 'Build Mode' : 'AI Partner Mode'}</span>
          </div>
          <span className="text-[10px] text-gray-600">Shift + Enter for newline</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

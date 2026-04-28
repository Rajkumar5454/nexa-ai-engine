import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, Check, Sparkles } from 'lucide-react';
import { AI_MODELS, getModelById } from '../lib/aiModels';

/**
 * Brand-specific icons for AI providers
 */
const ModelIcon = ({ provider, className = "w-4 h-4" }) => {
  if (provider === 'OpenAI') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </svg>
    );
  }
  if (provider === 'Google') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="url(#gemini_grad)" />
        <defs>
          <linearGradient id="gemini_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4E93ED" />
            <stop offset="1" stopColor="#B47DF3" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (provider === 'Anthropic') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16.48 3.52c-.44-.44-1.16-.44-1.6 0l-9.12 9.12c-.44.44-.44 1.16 0 1.6l9.12 9.12c.44.44 1.16.44 1.6 0l.96-.96c.44-.44.44-1.16 0-1.6L10.56 12l6.88-6.88c.44-.44.44-1.16 0-1.6l-.96-.96z" />
      </svg>
    );
  }
  if (provider === 'NVIDIA') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M8.948 8.798v-1.43a6.7 6.7 0 0 0 1.424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.457 0 10.457l2.456 1.708c1.372-1.13 2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" />
      </svg>
    );
  }
  return <Sparkles className={className} />;
};

/**
 * Premium AI model selector — pill button + popover.
 * Used on Home page (next to prompt input) and IDE chat panel.
 */
const ModelSelector = ({ value, onChange, align = 'left', size = 'md', testId = 'model-selector' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = getModelById(value);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const sizeClasses = size === 'sm'
    ? 'h-8 px-3 text-xs rounded-full gap-1.5'
    : 'h-10 px-4 text-sm rounded-full gap-2';

  const alignClasses = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        data-testid={`${testId}-toggle`}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center ${sizeClasses} bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-violet-500/40 text-white font-medium transition-all backdrop-blur-sm`}
      >
        <ModelIcon provider={current.provider} className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-violet-300`} />
        <span className="truncate max-w-[140px]">{current.name}</span>
        <ChevronUp className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-gray-400 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>

      {open && (
        <div
          data-testid={`${testId}-popover`}
          className={`absolute bottom-full mb-2 ${alignClasses} w-[320px] rounded-2xl border border-white/10 bg-[#0c0a1a]/95 backdrop-blur-xl shadow-2xl shadow-violet-900/30 p-2 z-50 animate-in fade-in slide-in-from-bottom-2`}
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Choose your AI model
          </div>

          <div className="space-y-0.5 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
            {AI_MODELS.map((m) => {
              const selected = m.id === value;
              return (
                <button
                  type="button"
                  key={m.id}
                  data-testid={`${testId}-option-${m.id}`}
                  onClick={() => { 
                    if (!m.comingSoon) {
                      onChange(m.id); 
                      setOpen(false); 
                    }
                  }}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-all flex items-start gap-3 ${
                    m.comingSoon ? 'opacity-50 cursor-not-allowed' : 
                    selected
                      ? 'bg-gradient-to-br from-violet-500/15 to-blue-500/10 border border-violet-500/30'
                      : 'hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 w-7 h-7 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0 shadow-md`}>
                    <ModelIcon provider={m.provider} className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{m.name}</span>
                      {m.badge && (
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${
                          m.comingSoon 
                            ? 'text-gray-300 bg-white/10' 
                            : 'text-violet-200 bg-violet-500/20'
                        }`}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span>{m.provider} · {m.tagline}</span>
                    </div>
                    {!m.comingSoon && (
                      <div className="text-[10px] text-violet-300/80 mt-1 font-medium">
                        {m.cost} credits / generation
                      </div>
                    )}
                  </div>
                  {selected && !m.comingSoon && <Check className="w-4 h-4 text-violet-300 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;


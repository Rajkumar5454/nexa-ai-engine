import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Zap, X, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Global low-credits modal, triggered by a browser `low-credits` custom event.
 * Axios interceptor (see services/api.js) dispatches the event on HTTP 402 responses.
 */
const LowCreditsModal = () => {
  const [state, setState] = React.useState(null); // { required, available } | null
  const navigate = useNavigate();

  React.useEffect(() => {
    const handler = (e) => setState(e.detail || { required: 0, available: 0 });
    window.addEventListener('low-credits', handler);
    return () => window.removeEventListener('low-credits', handler);
  }, []);

  if (!state) return null;

  const close = () => setState(null);
  const goToPricing = () => {
    close();
    navigate('/pricing');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      data-testid="low-credits-modal"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-violet-500/40 bg-gradient-to-br from-[#14102a] to-[#0c0a1a] p-8 shadow-2xl shadow-violet-900/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          onClick={close}
          data-testid="low-credits-close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-5 shadow-lg shadow-violet-600/30">
          <Zap className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">You're low on credits</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          This action needs <span className="text-white font-semibold">{state.required}</span> credits, but you only have{' '}
          <span className="text-white font-semibold">{state.available}</span>. Recharge now to keep building without interruptions.
        </p>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Your balance</span>
            <span className="text-white font-semibold">{state.available} credits</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(4, (state.available / (state.required || 1)) * 100))}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={goToPricing}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold rounded-xl py-3 shadow-lg shadow-violet-600/25"
            data-testid="low-credits-recharge-btn"
          >
            Recharge and continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <button
            onClick={close}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            data-testid="low-credits-dismiss-btn"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LowCreditsModal;

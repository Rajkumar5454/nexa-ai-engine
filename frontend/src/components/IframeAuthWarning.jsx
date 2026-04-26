import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

/**
 * Google Sign-In refuses to run inside an iframe (security policy).
 * When the app is viewed inside the Emergent preview iframe (or any iframe),
 * Google's popup returns ERR_BLOCKED_BY_RESPONSE / invalid_client.
 * This banner detects that and guides the user to open the URL in a new tab.
 */
const IframeAuthWarning = () => {
  const [isIframe, setIsIframe] = React.useState(false);

  React.useEffect(() => {
    try {
      if (window.self !== window.top) setIsIframe(true);
    } catch {
      // Cross-origin frame access throws — that also means we're in an iframe
      setIsIframe(true);
    }
  }, []);

  if (!isIframe) return null;

  const currentUrl = window.location.href;

  return (
    <div
      className="mb-4 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3"
      data-testid="iframe-auth-warning"
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
      <div className="text-xs text-amber-100 leading-relaxed">
        <p className="font-medium text-amber-200 mb-1">Google Sign-In needs a new tab</p>
        <p>
          Google blocks sign-in inside preview iframes.{' '}
          <a
            href={currentUrl}
            target="_top"
            className="underline inline-flex items-center gap-1 font-medium text-amber-200 hover:text-white"
          >
            Open this page in a new tab <ExternalLink className="w-3 h-3" />
          </a>{' '}
          to use Google. Email/password works fine here.
        </p>
      </div>
    </div>
  );
};

export default IframeAuthWarning;

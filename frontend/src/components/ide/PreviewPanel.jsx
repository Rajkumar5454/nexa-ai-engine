import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

const PreviewPanel = ({ files = [], isGenerating = false }) => {
  const [deviceMode, setDeviceMode] = useState('desktop');
  const [previewHtml, setPreviewHtml] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (files && files.length > 0) {
      // ── Helper 1: Find a specific file by name, prioritizing the order of names provided ──
      const findFileByPriority = (fileList, names) => {
        // Flatten the file tree for easier searching
        const flatten = (files) => {
          let flat = [];
          for (const f of files) {
            if (f.type === 'file') flat.push(f);
            if (f.children) flat = flat.concat(flatten(f.children));
          }
          return flat;
        };
        const flatFiles = flatten(fileList);
        
        // Search by priority
        for (const name of names) {
          const found = flatFiles.find(f => f.name === name || f.path?.includes(name));
          if (found) return found;
        }
        return null;
      };

      // ── Helper 2: Collect all JS/JSX files recursively ──────────────────
      // EXCLUDE: config files, boilerplate stubs, and files already polyfilled as globals
      // EXCLUDE: Only infrastructure/config files. 
      // We MUST NOT exclude lib/utils or hooks/ if the AI writes logic there.
      const EXCLUDED_PATHS = ['main.jsx', 'main.js', 'vite.config', 'tailwind.config', 'postcss.config'];
      const getAllJsFiles = (fileList) => {
        let results = [];
        for (const file of fileList) {
          const p = file.path || file.name || '';
          const isExcluded = EXCLUDED_PATHS.some(ex => p.includes(ex));
          const isCodeFile = p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.tsx') || p.endsWith('.ts');
          if (isCodeFile && !isExcluded && file.content && file.content.trim().length > 10) {
            results.push(file);
          }
          if (file.children) results = [...results, ...getAllJsFiles(file.children)];
        }
        return results;
      };

      const appNames = ['App.jsx', 'App.js', 'App.tsx', 'App.ts', 'index.jsx', 'index.js', 'index.tsx', 'index.ts', 'main.jsx', 'main.js', 'main.tsx', 'main.ts'];
      const appFile = findFileByPriority(files, appNames);
      const cssFile = findFileByPriority(files, ['index.css', 'App.css', 'styles.css', 'global.css']);
      const allJsFiles = getAllJsFiles(files);

      // If no explicit App file, pick the largest JS file as potential entry point
      let entryFile = appFile;
      if (!entryFile && allJsFiles.length > 0) {
        entryFile = allJsFiles.reduce((prev, current) => 
          (prev.content?.length || 0) > (current.content?.length || 0) ? prev : current
        );
      }

      if (entryFile?.content) {
        // ── Virtual Multi-File Merge: strip imports/exports, concat all files ──
        let virtualFilesCode = '';
        allJsFiles.forEach(file => {
          const p = file.path || file.name || '';
          if (p.includes('App.jsx') || p.includes('App.js')) return;
          let content = file.content || '';
          // Strip import statements entirely
          content = content.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?\n?/g, '');
          content = content.replace(/import\s+['"].*?['"];?\n?/g, '');
          // --- ROBUST EXPORT STRIPPING ---
          // Just remove the `export` keyword so they become local variables in the shared script scope.
          content = content.replace(/export\s+(const|let|var|function|async\s+function|class)\s+/g, '$1 ');
          content = content.replace(/export\s+{[^}]+}\s*;?/g, '');
          content = content.replace(/export\s+default\s+function\s+(\w+)\s*\(/g, 'function $1(');
          content = content.replace(/export\s+default\s+(\w+)\s*;?/g, '');
          content = content.replace(/export\s+default\s+/g, '');
          content = content.replace(/^export\s+/gm, '');
          
          // Strip dangerous self-rendering calls from virtual files
          content = content.replace(/ReactDOM\.createRoot[\s\S]*?\.render\([\s\S]*?\);?/g, '');
          content = content.replace(/ReactDOM\.render\([\s\S]*?\);?/g, '');
          
          // Do NOT wrap in `{ try/catch }` block, otherwise `const` and `let` are block-scoped 
          // and invisible to App.jsx!
          virtualFilesCode += `\n/* Virtual File: ${p} */\n${content.trim()}\n`;

        });

        // ── Detect main component name ────────────────────────────────────
        let mainComponentName = 'App';
        const exportDefaultMatch = entryFile.content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
        if (exportDefaultMatch) mainComponentName = exportDefaultMatch[1];

        // ── Clean Entry File: strip imports/markdown, fix export ────────────
        let rawContent = entryFile.content;
        const codeBlockMatch = rawContent.match(/```(?:jsx|javascript|js)?\s*([\s\S]*?)```/i);
        if (codeBlockMatch) {
          rawContent = codeBlockMatch[1];
        } else if (rawContent.includes('import ') || rawContent.includes('export ') || rawContent.includes('const ')) {
          // If no markdown but looks like code, use as is but strip potential prefix text
          const firstCodeStart = rawContent.search(/(?:import|export|const|function|class)\s+/);
          if (firstCodeStart > -1) {
            rawContent = rawContent.substring(firstCodeStart);
            // We do NOT aggressively strip trailing text here anymore, because locating the "end" of an export default 
            // is dangerous if it's an inline function/class block.
          }
        }

        let cleanCode = rawContent
          .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '')
          .replace(/import\s+['"].*?['"];?/g, '')
        // ── Handle exports safely to prevent Babel SyntaxErrors ────────────
        // 1. export default function App
        cleanCode = cleanCode.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
        
        // 2. export default App; (strip completely, including trailing semicolon)
        cleanCode = cleanCode.replace(/export\s+default\s+[A-Za-z0-9_]+\s*;?/g, '');
        
        // 3. export default () => ... (convert anonymous default arrow to named const)
        cleanCode = cleanCode.replace(/export\s+default\s+(?=\()/g, 'const ' + mainComponentName + ' = ');
        
        // 4. Any remaining export defaults
        cleanCode = cleanCode.replace(/export\s+default\s+/g, '');
        
        // 5. Strip other exports
        cleanCode = cleanCode.replace(/export\s+(const|let|var|function|async\s+function|class)\s+/g, '$1 ');
        cleanCode = cleanCode.replace(/export\s+{[^}]+}\s*;?/g, ''); // Consume semicolon
        cleanCode = cleanCode.replace(/^export\s+/gm, '');

        // Strip dangerous self-rendering calls from the entry file
        cleanCode = cleanCode.replace(/ReactDOM\.createRoot[\s\S]*?\.render\([\s\S]*?\);?/g, '');
        cleanCode = cleanCode.replace(/ReactDOM\.render\([\s\S]*?\);?/g, '');

        // JSX adjacent element auto-fix
        cleanCode = cleanCode.replace(
          /(\w+\s*:\s*)(<[a-zA-Z][^>]*\/>)(\s*<[a-zA-Z][^>]*\/>)/g,
          '$1<>$2$3</>'
        );

        const extraCss = cssFile?.content || '';

        const html = `<!DOCTYPE html>
<html lang="en" translate="no" class="notranslate">
<head>
  <meta charset="UTF-8">
  <meta name="google" content="notranslate">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/lucide-react@0.292.0/dist/umd/lucide-react.min.js"></script>
  <script>
    // --- Live Sandbox Protections (Hardened) ---
    (function() {
      // Disable React DevTools probe
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
      
      // Bulletproof Map/Set patches to prevent React internal context crashes
      const fixProto = (Obj, method) => {
        if (Obj && Obj.prototype && Obj.prototype[method]) {
          const original = Obj.prototype[method];
          Obj.prototype[method] = function() {
            try { return original.apply(this, arguments); } catch(e) { return this; }
          };
        }
      };
      fixProto(Map, 'set'); fixProto(Map, 'forEach'); fixProto(Map, 'delete');
      fixProto(Set, 'add'); fixProto(Set, 'forEach'); fixProto(Set, 'delete');

      // NOTE: onerror is set in the final script block to avoid being overwritten
    })();

    // Polyfill Lucide Icons for standalone usage
    window.Lucide = window.lucide;
  </script>
  <style>
    .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); }
    .glow-violet { box-shadow: 0 0 40px rgba(139,92,246,0.4); }
    .gradient-text { background: linear-gradient(135deg, #fff 0%, #a78bfa 50%, #60a5fa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  </style>
  <style>${extraCss}</style>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #030712; color: white; }
    #root { min-height: 100vh; }
    html { scroll-behavior: smooth; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f0f1a; } ::-webkit-scrollbar-thumb { background: #4c1d95; border-radius: 3px; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
    @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-20px); } }
    @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(139,92,246,0.3); } 50% { box-shadow: 0 0 60px rgba(139,92,246,0.7); } }
    @keyframes orb { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(60px,-40px) scale(1.1); } 66% { transform:translate(-40px,30px) scale(0.9); } }
    .animate-fade-in-up { animation: fadeInUp 0.7s ease-out forwards; }
    .animate-float { animation: float 4s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
    .animate-orb { animation: orb 8s ease-in-out infinite; }
    .error-overlay { position:fixed; inset:0; background:#1a1a2e; color:#e94560; display:flex; align-items:center; justify-content:center; font-family:monospace; padding:2rem; text-align:left; }
    .error-overlay pre { white-space:pre-wrap; word-break:break-word; max-width:600px; font-size:14px; line-height:1.6; }
  </style>
</head>
<body data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false">
  <div id="root"></div>
  <script type="text/babel">
    // DOM patches, polyfills, and globals are defined here (OUTER scope).
    // ALL AI-generated code runs inside try{} below (INNER scope).
    // This means AI can freely use const/let/var without EVER conflicting with polyfills.

    // ─── Ultimate DOM Shield ─────────────────────────────────────────────────
    // Some AI-generated code or browser extensions can cause React to get out 
    // of sync with the DOM, leading to "removeChild" crashes. 
    // We monkey-patch Node.prototype.removeChild to fail SILENTLY instead of crashing.
    const _nativeRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child) {
      if (child.parentNode !== this) {
        // Silently ignore if node is already removed or not a child.
        // This prevents the "The node to be removed is not a child of this node" fatal error.
        return child;
      }
      return _nativeRemoveChild.apply(this, arguments);
    };

    // Handle Promise rejections that escape the local try/catch (e.g. async components)
    window.addEventListener('unhandledrejection', (event) => {
      // If it's the removeChild error, ignore it entirely as we already patched it above
      if (event.reason && event.reason.toString().includes('removeChild')) {
        event.preventDefault();
        return;
      }
      console.error('Unhandled Promise Rejection:', event.reason);
      const rootNode = document.getElementById('root');
      if (rootNode) {
        rootNode.innerHTML = '<div style="padding: 2rem; color: #ff6b6b; background: #111; min-height: 100vh; font-family: monospace; border: 2px solid #ff6b6b;">' +
            '<h2 style="color: white; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 2px;">Unhandled Rejection</h2>' +
            '<p style="color: #ff6b6b; font-weight: bold; font-size: 16px;">' + (event.reason ? event.reason.toString() : 'Unknown Error') + '</p>' +
            '<hr style="border: 0; border-top: 1px solid #333; margin: 1.5rem 0;" />' +
            '<p style="color: #888; font-size: 14px;">Take a screenshot of this error for the AI agent to fix.</p>' +
          '</div>';
      }
    });
    // ─────────────────────────────────────────────────────────────────────────

    // React hooks and utilities
    const { useState, useEffect, useReducer, useCallback, useMemo, useRef, useContext, createContext, Fragment, forwardRef, memo, lazy, Suspense } = React;

    // --- PERMANENT POLYFILLS (window-based, zero-conflict) ---
    // Assigned to window so they NEVER conflict with ANY declaration.
    // AI code or other polyfills can freely use const/let/var/function with same names.
    window._nexaDataService = function(endpoint) {
      var _d = React.useState([]); var _l = React.useState(false); var _e = React.useState(null);
      React.useEffect(function() {
        _l[1](true);
        setTimeout(function() {
          var u = String(endpoint || '').toLowerCase(); var m = [];
          if (u.includes('user')) m = [{ id: 1, name: 'Alex Demo', email: 'demo@nexaai.live', role: 'admin' }, { id: 2, name: 'Jane Smith', email: 'jane@nexaai.live', role: 'user' }];
          else if (u.includes('product') || u.includes('item')) m = [{ id: 1, name: 'Premium Headphones', price: 299.99, status: 'Active' }, { id: 2, name: 'Smartwatch Pro', price: 199.50, status: 'Active' }];
          else if (u.includes('order')) m = [{ id: 'ORD-001', total: 299.99, status: 'Processing', date: '2026-05-06' }];
          else if (u.includes('post') || u.includes('article')) m = [{ id: 1, title: 'Getting Started', content: 'Welcome!', author: 'Admin' }];
          else if (u.includes('stat') || u.includes('analytic') || u.includes('dash')) m = { users: 1240, revenue: 45200, sessions: 8301, growth: 12.4 };
          else m = [{ id: 1, name: 'Sample Item', status: 'Active' }];
          _d[1](m); _l[1](false);
        }, 300);
      }, [endpoint]);
      return { data: _d[0], loading: _l[0], error: _e[0], createItem: function(item) { _d[1](function(p) { return Array.isArray(p) ? p.concat([Object.assign({ id: Date.now() }, item)]) : p; }); }, updateItem: function(id, up) { _d[1](function(p) { return Array.isArray(p) ? p.map(function(i) { return i.id === id ? Object.assign({}, i, up) : i; }) : p; }); }, deleteItem: function(id) { _d[1](function(p) { return Array.isArray(p) ? p.filter(function(i) { return i.id !== id; }) : p; }); } };
    };
    window.useDataService = window.useDataService || window._nexaDataService;
    window.useApi = window.useApi || window._nexaDataService;
    window.useBackend = window.useBackend || window._nexaDataService;
    window.useFetch = window.useFetch || window._nexaDataService;
    window.useStore = window.useStore || window._nexaDataService;
    window.useAuth = window.useAuth || function() { return { user: { id: 'usr_demo', name: 'Alex Demo', email: 'demo@nexaai.live', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=demo' }, isAuthenticated: true, login: function() {}, logout: function() {}, register: function() {} }; };
    window.useUser = window.useUser || window.useAuth;
    window.useToast = window.useToast || function() { return { toast: function(m) { console.log('Toast:', m); }, success: function(m) { console.log('Success:', m); }, error: function(m) { console.log('Error:', m); } }; };
    window.useNotification = window.useNotification || window.useToast;
    window.useTheme = window.useTheme || function() { return { theme: 'dark', toggleTheme: function() {} }; };
    window.useModal = window.useModal || function() { return { isOpen: false, open: function() {}, close: function() {} }; };
    window.cn = window.cn || function() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); };
    // ---



    // ─── Global Mocks (Axios) ────────────────────────────────────────────────
    // Provide a dummy axios so if AI uses it, it doesn't crash from missing import.
    // It shares the same mock logic as our safe fetch.
    const mockAxiosImpl = async (url) => {
       const u = String(url).toLowerCase();
       let data = {};
       if (u.includes('auth/me') || u.includes('/me') || u.includes('profile')) data = { id: 'usr_demo', name: 'Alex Demo', email: 'demo@nexaai.live', role: 'admin' };
       else if (u.includes('auth') || u.includes('login') || u.includes('token')) data = { token: 'mock-token', user: { id: 'usr_demo', name: 'Alex Demo' } };
       else if (u.includes('product') || u.includes('item')) data = [
          { id: 1, name: 'Premium Wireless Headphones', price: 299.99, description: 'High-fidelity audio.', image: 'https://loremflickr.com/400/400/headphones' },
          { id: 2, name: 'Minimalist Smartwatch', price: 199.50, description: 'Track your fitness.', image: 'https://loremflickr.com/400/400/smartwatch' },
          { id: 3, name: 'Ergonomic Desk Chair', price: 149.00, description: 'All-day comfort.', image: 'https://loremflickr.com/400/400/chair' }
       ];
       else if (u.includes('cart') || u.includes('order')) data = [ { id: 'ORD-6632', date: '2026-05-05', total: 299.99, status: 'Processing', items: [] } ];
       else if (u.includes('post') || u.includes('article')) data = [ { id: 101, title: 'Mock Post', content: 'Mock content', author: 'Jane Doe' } ];
       else if (u.includes('dash') || u.includes('stat')) data = { users: 1240, revenue: 45200, sessions: 8301, growth: 12.4 };
       else if (u.endsWith('s') || u.includes('logs') || u.includes('list') || u.includes('all') || u.includes('items')) data = [];
       return { data, status: 200, statusText: 'OK', headers: {} };
    };
    window.axios = {
      get: mockAxiosImpl, post: mockAxiosImpl, put: mockAxiosImpl, delete: mockAxiosImpl, patch: mockAxiosImpl,
      create: () => window.axios, defaults: { headers: { common: {} } }, interceptors: { request: { use: ()=>{} }, response: { use: ()=>{} } }
    };
    // ─────────────────────────────────────────────────────────────────────────

    // ─── Safe Fetch Wrapper ──────────────────────────────────────────────────
    // Intercept all fetch calls so 404/500 responses and HTML error pages
    // never cause "Cannot read properties of undefined" crashes in the preview.
    const _nativeFetch = window.fetch.bind(window);
    window.fetch = async (url, options) => {
      try {
        const res = await _nativeFetch(url, options);
        // Wrap the response to make .json() safe
        const safeRes = Object.create(res);
        safeRes.json = async () => {
          try {
            const text = await res.clone().text();
            return JSON.parse(text);
          } catch (_) {
            // Return sensible empty fallback keyed by common patterns
            const u = String(url).toLowerCase();
            if (u.includes('auth/me') || u.includes('/me') || u.includes('profile') || u.includes('current-user') || u.includes('whoami'))
              return { id: 'usr_demo', name: 'Alex Demo', email: 'demo@nexaai.live', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=demo' };
            if (u.includes('auth') || u.includes('login') || u.includes('signin') || u.includes('token'))
              return { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.preview', user: { id: 'usr_demo', name: 'Alex Demo', email: 'demo@nexaai.live', role: 'admin' } };
            if (u.includes('user')) return { id: 1, name: 'Demo User', email: 'demo@example.com', role: 'admin' };
            if (u.includes('product') || u.includes('item')) return [
              { id: 1, name: 'Premium Wireless Headphones', price: 299.99, description: 'High-fidelity audio with active noise cancellation.', image: 'https://loremflickr.com/400/400/headphones', category: 'Electronics', stock: 15 },
              { id: 2, name: 'Minimalist Smartwatch', price: 199.50, description: 'Track your fitness and stay connected in style.', image: 'https://loremflickr.com/400/400/smartwatch', category: 'Wearables', stock: 8 },
              { id: 3, name: 'Ergonomic Desk Chair', price: 149.00, description: 'All-day comfort for your home office setup.', image: 'https://loremflickr.com/400/400/chair', category: 'Furniture', stock: 24 }
            ];
            if (u.includes('post') || u.includes('comment') || u.includes('article') || u.includes('feed')) return [
              { id: 101, title: 'Getting Started with React 18', content: 'React 18 introduces concurrent rendering...', author: 'Jane Doe', likes: 42, date: '2026-05-01' },
              { id: 102, title: 'Mastering Tailwind CSS', content: 'Utility-first CSS is the modern way to style...', author: 'John Smith', likes: 89, date: '2026-05-03' },
              { id: 103, title: 'Why Fast APIs matter', content: 'Building high performance endpoints...', author: 'Alice Johnson', likes: 120, date: '2026-05-04' }
            ];
            if (u.includes('cart') || u.includes('order')) return [
               { id: 'ORD-6632', date: '2026-05-05', total: 299.99, status: 'Processing', items: [{name: 'Premium Wireless Headphones', qty: 1, price: 299.99}] }
            ];
            if (u.includes('dashboard') || u.includes('analytic') || u.includes('stat')) return { users: 1240, revenue: 45200, sessions: 8301, growth: 12.4 };
            if (u.includes('health')) return { status: 'ok' };
            if (u.endsWith('s') || u.includes('logs') || u.includes('list') || u.includes('all') || u.includes('items')) return [];
            return {};
          }
        };
        return safeRes;
      } catch (netErr) {
        // Network failure — return a fake ok response with empty JSON
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    };
    // ─────────────────────────────────────────────────────────────────────────

    // ─── Backend Config Injection ───────────────────────────────────────────
    // Inject user-provided keys if they exist in localStorage
    window.NEXA_BACKEND_CONFIG = {
      supabaseUrl: localStorage.getItem('NEXA_V2_SUPABASE_URL') || '',
      supabaseAnonKey: localStorage.getItem('NEXA_V2_SUPABASE_ANON_KEY') || '',
      firebaseConfig: localStorage.getItem('NEXA_V2_FIREBASE_CONFIG') || '',
      googleClientId: localStorage.getItem('NEXA_V2_GOOGLE_CLIENT_ID') || '',
    };
    
    // Polyfill for process.env so common library checks don't crash
    window.process = { env: { 
      NEXT_PUBLIC_SUPABASE_URL: window.NEXA_BACKEND_CONFIG.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: window.NEXA_BACKEND_CONFIG.supabaseAnonKey,
      ...window.NEXA_BACKEND_CONFIG 
    } };

    // ─── Mock Auth Session ────────────────────────────────────────────────────
    // Pre-seed localStorage/sessionStorage with a fake logged-in session so
    // that auth-gated apps (that redirect to /login) show the dashboard directly.
    const _mockUser = { id: 'usr_demo', name: 'Alex Demo', email: 'demo@nexaai.live', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=demo' };
    const _mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.preview';
    const _authSeeds = {
      token: _mockToken, access_token: _mockToken, authToken: _mockToken, id_token: _mockToken,
      user: JSON.stringify(_mockUser), currentUser: JSON.stringify(_mockUser),
      session: JSON.stringify({ user: _mockUser, token: _mockToken, expires: new Date(Date.now() + 86400000).toISOString() }),
      supabase_session: JSON.stringify({ user: _mockUser, access_token: _mockToken }),
      google_auth_token: _mockToken,
      google_user: JSON.stringify(_mockUser),
      userInfo: JSON.stringify(_mockUser), userData: JSON.stringify(_mockUser),
      isLoggedIn: 'true', isAuthenticated: 'true', loggedIn: 'true',
      'sb-auth-token': JSON.stringify({ access_token: _mockToken, user: _mockUser }),
    };
    Object.entries(_authSeeds).forEach(([k, v]) => {
      try { localStorage.setItem(k, v); } catch(_) {}
      try { sessionStorage.setItem(k, v); } catch(_) {}
    });
    // ─────────────────────────────────────────────────────────────────────────


    // Simple hash-based router (no CDN needed)
    const RouterContext = createContext({ path: '/', navigate: () => {}, params: {} });

    function BrowserRouter({ children }) {
      // Auto-redirect: if the initial route is a login/auth page and user is "logged in", go to dashboard
      const _authPages = ['/login', '/signin', '/sign-in', '/auth', '/auth/login'];
      const _isAuthed = localStorage.getItem('isLoggedIn') === 'true' || !!localStorage.getItem('token');
      const _rawInitial = window.location.hash.slice(1) || '/';
      const _safeInitial = (_isAuthed && _authPages.some(p => _rawInitial.startsWith(p))) ? '/dashboard' : _rawInitial;

      const [path, setPath] = useState(_safeInitial);
      useEffect(() => {
        const onHash = () => {
          const newPath = window.location.hash.slice(1) || '/';
          setPath(newPath);
        };
        window.addEventListener('hashchange', onHash);
        if (!window.location.hash) window.location.hash = '/';
        return () => window.removeEventListener('hashchange', onHash);
      }, []);
      const navigate = (to) => {
        if (typeof to === 'number') {
          window.history.go(to);
          return;
        }
        window.location.hash = to;
      };
      return <RouterContext.Provider value={{ path, navigate, params: {} }}>{children}</RouterContext.Provider>;
    }

    function Routes({ children }) {
      const { path } = useContext(RouterContext);
      const routes = React.Children.toArray(children).filter(Boolean);
      
      const getElement = (route) => {
        if (route.props.element) return route.props.element;
        // v5 compat: component={Component}
        if (route.props.component) {
          const Comp = route.props.component;
          return <Comp />;
        }
        return route.props.children || null;
      };
      
      // Exact match first
      for (const route of routes) {
        const rp = route.props?.path;
        const exact = route.props?.exact;
        if (rp === path || (!exact && rp === path)) {
          return getElement(route);
        }
      }
      // Wildcard / catch-all
      for (const route of routes) {
        if (route.props && route.props.path === '*') {
          return getElement(route);
        }
      }
      // Default to first route
      const first = routes[0];
      return first ? getElement(first) : null;
    }

    function Route() { return null; }

    function Link({ to, children, className, style, onClick, ...rest }) {
      const { navigate } = useContext(RouterContext);
      const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick(e);
        navigate(to);
      };
      return <a href={"#" + to} className={className} style={{cursor:'pointer',...(style||{})}} onClick={handleClick} {...rest}>{children}</a>;
    }

    function useNavigate() {
      const { navigate } = useContext(RouterContext);
      return (to) => {
        if (typeof to === 'number') { window.history.go(to); return; }
        navigate(to);
      };
    }

    function useLocation() {
      const { path } = useContext(RouterContext);
      return { pathname: path, hash: '', search: '', state: null };
    }

    function useParams() { return {}; }
    function Navigate({ to, replace }) { const nav = useNavigate(); useEffect(() => { nav(to); }, []); return null; }
    // v5 compat
    function useHistory() { const nav = useNavigate(); return { push: nav, replace: nav, goBack: () => window.history.back() }; }
    function Redirect({ to }) { return <Navigate to={to} />; }
    function NavLink({ to, children, className, style, activeClassName, ...rest }) {
      const { path } = useContext(RouterContext);
      const isActive = path === to;
      const cls = typeof className === 'function' ? className({ isActive }) : (isActive && activeClassName ? activeClassName + ' ' + (className||'') : className);
      return <Link to={to} className={cls} style={typeof style === 'function' ? style({ isActive }) : style} {...rest}>{children}</Link>;
    }
    function Outlet() { return null; }
    function useSearchParams() { return [new URLSearchParams(), () => {}]; }

    // Common aliases the AI generates
    const Router = BrowserRouter;
    const HashRouter = BrowserRouter;
    const MemoryRouter = BrowserRouter;
    const Switch = Routes;

    // ===== STUBS FOR COMMON EXTERNAL LIBRARIES =====

    // react-modal
    function Modal({ isOpen, onRequestClose, children, className }) {
      if (!isOpen) return null;
      return (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }} onClick={onRequestClose}>
          <div style={{ background:'white',borderRadius:'12px',padding:'24px',maxWidth:'500px',width:'90%',maxHeight:'80vh',overflow:'auto' }} className={className} onClick={e=>e.stopPropagation()}>{children}</div>
        </div>
      );
    }
    Modal.setAppElement = () => {};

    // react-toastify
    function ToastContainer() { return null; }
    const toast = Object.assign(
      (msg) => { console.log('Toast:', msg); },
      { success: (m) => console.log('Toast success:', m), error: (m) => console.log('Toast error:', m), info: (m) => console.log('Toast info:', m), warn: (m) => console.log('Toast warn:', m), warning: (m) => console.log('Toast warn:', m) }
    );
    const Toaster = () => null;

    // react-hot-toast
    const hotToast = toast;

    // framer-motion
    const motion = new Proxy({}, { get: (_, tag) => {
      return forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, whileInView, viewport, variants, layoutId, layout, custom, ...props }, ref) => {
        return React.createElement(typeof tag === 'string' ? tag : 'div', { ...props, ref }, children);
      });
    }});
    const AnimatePresence = ({ children, mode, initial, onExitComplete, custom }) => <>{children}</>;

    // react-icons stubs
    const FaIcon = (props) => <span style={{display:'inline-block',width:props.size||16,height:props.size||16}} className={props.className}></span>;
    const iconHandler = { get: (_, name) => (props) => <span className={props?.className} style={{display:'inline-flex',alignItems:'center',fontSize:props?.size||16}}>{props?.children}</span> };
    const FaIcons = new Proxy({}, iconHandler);
    const FiIcons = new Proxy({}, iconHandler);
    const AiIcons = new Proxy({}, iconHandler);
    const BiIcons = new Proxy({}, iconHandler);
    const BsIcons = new Proxy({}, iconHandler);
    const MdIcons = new Proxy({}, iconHandler);
    const HiIcons = new Proxy({}, iconHandler);
    const RiIcons = new Proxy({}, iconHandler);
    const IoIcons = new Proxy({}, iconHandler);
    const TbIcons = new Proxy({}, iconHandler);
    const LuIcons = new Proxy({}, iconHandler);
    const GrIcons = new Proxy({}, iconHandler);
    const SiIcons = new Proxy({}, iconHandler);

    // Destructure common icon names as stubs
    const iconStub = (props) => <span className={props?.className} style={{display:'inline-flex',alignItems:'center'}}></span>;
    const FaHome = iconStub, FaUser = iconStub, FaCog = iconStub, FaSearch = iconStub, FaPlus = iconStub, FaMinus = iconStub, FaTrash = iconStub, FaEdit = iconStub, FaCheck = iconStub, FaTimes = iconStub, FaStar = iconStub, FaHeart = iconStub, FaShoppingCart = iconStub, FaBars = iconStub, FaArrowRight = iconStub, FaArrowLeft = iconStub, FaGithub = iconStub, FaGoogle = iconStub, FaFacebook = iconStub, FaTwitter = iconStub, FaLinkedin = iconStub, FaInstagram = iconStub, FaEnvelope = iconStub, FaPhone = iconStub, FaMapMarkerAlt = iconStub, FaCalendar = iconStub, FaClock = iconStub, FaDownload = iconStub, FaUpload = iconStub, FaChartBar = iconStub, FaChartLine = iconStub, FaChartPie = iconStub, FaMoneyBillWave = iconStub, FaDollarSign = iconStub, FaLock = iconStub, FaUnlock = iconStub, FaEye = iconStub, FaEyeSlash = iconStub, FaBell = iconStub, FaComment = iconStub, FaShare = iconStub, FaSave = iconStub, FaSignOutAlt = iconStub, FaSignInAlt = iconStub;

    // Lucide-react stubs - Extended
    const Sun = iconStub, Moon = iconStub, Star = iconStub, Heart = iconStub, Search = iconStub, Menu = iconStub, X = iconStub, Plus = iconStub, Minus = iconStub, Check = iconStub, ChevronDown = iconStub, ChevronUp = iconStub, ChevronLeft = iconStub, ChevronRight = iconStub, ArrowRight = iconStub, ArrowLeft = iconStub, Home = iconStub, User = iconStub, Settings = iconStub, LogOut = iconStub, Trash = iconStub, Edit = iconStub, Eye = iconStub, EyeOff = iconStub, Mail = iconStub, Phone = iconStub, MapPin = iconStub, Calendar = iconStub, Clock = iconStub, Download = iconStub, Upload = iconStub, Share = iconStub, Copy = iconStub, ExternalLink = iconStub, Github = iconStub, Twitter = iconStub, Facebook = iconStub, Linkedin = iconStub, Instagram = iconStub, Youtube = iconStub, Bell = iconStub, ShoppingCart = iconStub, CreditCard = iconStub, DollarSign = iconStub, BarChart = iconStub, TrendingUp = iconStub, Activity = iconStub, Zap = iconStub, Shield = iconStub, Lock = iconStub, Unlock = iconStub, Globe = iconStub, Bookmark = iconStub, Tag = iconStub, Filter = iconStub, Layers = iconStub, Grid = iconStub, List = iconStub, AlertCircle = iconStub, Info = iconStub, HelpCircle = iconStub, AlertTriangle = iconStub, CheckCircle = iconStub, XCircle = iconStub, Loader = iconStub, RefreshCw = iconStub, RotateCw = iconStub, Save = iconStub, FileText = iconStub, Image = iconStub, Video = iconStub, Music = iconStub, Mic = iconStub, Camera = iconStub, Wifi = iconStub, Battery = iconStub, Monitor = iconStub, Smartphone = iconStub, Tablet = iconStub, Laptop = iconStub, Code = iconStub, Terminal = iconStub, Database = iconStub, Server = iconStub, Cloud = iconStub, CloudUpload = iconStub, CloudDownload = iconStub, Folder = iconStub, FolderOpen = iconStub, File = iconStub, Paperclip = iconStub, Send = iconStub, MessageSquare = iconStub, MessageCircle = iconStub, Users = iconStub, UserPlus = iconStub, UserMinus = iconStub, Award = iconStub, Gift = iconStub, Target = iconStub, Crosshair = iconStub, Navigation = iconStub, Compass = iconStub, Map = iconStub, Flag = iconStub, Briefcase = iconStub, Package = iconStub, Box = iconStub, Truck = iconStub, Sparkles = iconStub, Layout = iconStub, Sidebar = iconStub, PanelLeft = iconStub, PanelRight = iconStub, Columns = iconStub, Rows = iconStub, Table = iconStub, Clipboard = iconStub, CheckSquare = iconStub, Square = iconStub, Circle = iconStub, Triangle = iconStub, Hexagon = iconStub;

    // recharts stubs
    const ResponsiveContainer = ({children}) => <div style={{width:'100%',height:'300px'}}>{children}</div>;
    const LineChart = ({children}) => <div style={{textAlign:'center',padding:'40px',color:'#999'}}>Chart Preview</div>;
    const BarChart2 = LineChart, PieChart = LineChart, AreaChart = LineChart, RadarChart = LineChart, ScatterChart = LineChart;
    const CartesianGrid = () => null, XAxis = () => null, YAxis = () => null, Tooltip = ({children}) => <>{children}</>, Legend = () => null;
    const Line = () => null, Bar = () => null, Pie = () => null, Cell = () => null, Area = () => null;
    const Radar = () => null, RadialBarChart = LineChart, RadialBar = () => null, Treemap = LineChart;

    // axios stub
    const axios = { 
      get: async (url) => { console.log('Mock GET:', url); return {data:[]}; }, 
      post: async (url, data) => { console.log('Mock POST:', url, data); return {data:{success:true}}; }, 
      put: async (url, data) => { console.log('Mock PUT:', url, data); return {data:{success:true}}; }, 
      delete: async (url) => { console.log('Mock DELETE:', url); return {data:{success:true}}; } 
    };

    // uuid stub
    const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c === 'x' ? r : (r&0x3|0x8)).toString(16); });
    const v4 = uuidv4;

    // date-fns stubs
    const format = (d, f) => new Date(d).toLocaleDateString();
    const formatDistance = () => 'a few seconds ago';
    const formatDistanceToNow = () => 'just now';
    const parseISO = (s) => new Date(s);
    const isValid = (d) => d instanceof Date && !isNaN(d);
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
    const subDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() - n); return r; };
    const startOfDay = (d) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
    const endOfDay = (d) => { const r = new Date(d); r.setHours(23,59,59,999); return r; };

    // chart.js / react-chartjs-2 stubs
    const Chart = () => null;
    const Doughnut = Pie;

    // clsx / classnames
    const clsx = (...args) => args.flat().filter(Boolean).join(' ');
    const classNames = clsx;
    const cn = clsx;
    const twMerge = (...args) => args.flat().filter(Boolean).join(' ');

    try {
      // --- ALL AI CODE (Virtual Files + App.jsx) runs in this inner scope ---
      // Safe: const/let/var inside here can NEVER conflict with outer polyfills.
      ${virtualFilesCode}

      ${cleanCode}

      // Auto-detect main component
      let MainComponent = typeof ${mainComponentName} !== 'undefined' ? ${mainComponentName} : null;
      if (!MainComponent) {
        // Try to find the first component defined in the script
        const defined = Object.keys(window).filter(k => /^[A-Z]/.test(k) && typeof window[k] === 'function');
        if (defined.length > 0) MainComponent = window[defined[0]];
      }

      if (!MainComponent) throw new Error('No React component found in the generated code.');

      // Use stable React 17 legacy render to prevent concurrent-mode 'a.set is not a function' crash
      const rootElement = document.getElementById('root');
      ReactDOM.render(
        React.createElement(BrowserRouter, null, React.createElement(MainComponent)),
        rootElement
      );
    } catch (err) {
      console.error('Preview render error:', err);
      var rootNode = document.getElementById('root');
      if (rootNode) {
        rootNode.innerHTML = '<div style="padding: 2rem; color: #ff6b6b; background: #1a1a1a; min-height: 100vh; font-family: monospace;">' +
          '<h2 style="color: white; margin-bottom: 1rem;">Compilation Error</h2>' +
          '<pre style="white-space: pre-wrap; font-size: 14px;">' + err.toString() + '</pre>' +
          '<p style="margin-top: 1rem; color: #888;">Take a screenshot of this error for the AI agent to fix.</p>' +
        '</div>';
      } else {
        document.body.innerHTML = '<h2 style="color:red;font-family:sans-serif;padding:20px;">Critical Render Error: Check Console</h2>';
      }
    }
  </script>
  <script>
    // No fallback loading function needed.

    // Known React 17 internal errors to silently suppress (not real app errors)
    var SUPPRESS_ERRORS = [
      'a.set is not a function',
      'b.set is not a function',
      'pendingLegacyContextWarning',
      'unstable_runWithPriority',
      'The node to be removed is not a child',
    ];
    function isSuppressed(msg) {
      if (!msg) return false;
      var s = msg.toString();
      return SUPPRESS_ERRORS.some(function(e) { return s.includes(e); });
    }

    window.onerror = function(msg, url, line, col, err) {
      if (isSuppressed(msg)) {
        console.warn('[Sandbox] Suppressed React internal error:', msg);
        return true; // Prevent the error from being shown
      }
      var rootNode = document.getElementById('root');
      if (rootNode) {
        rootNode.innerHTML = '<div style="padding: 2rem; color: #ff6b6b; background: #1a1a1a; min-height: 100vh; font-family: monospace;">' +
          '<h2 style="color: white; margin-bottom: 1rem;">Compilation Error (Global)</h2>' +
          '<pre style="white-space: pre-wrap; font-size: 14px;">' + msg + '\n' + (err ? err.stack : '') + '</pre>' +
          '<p style="margin-top: 1rem; color: #888;">Take a screenshot of this error for the AI agent to fix.</p>' +
        '</div>';
      }
      return true;
    };
    window.addEventListener('unhandledrejection', function(e) {
      if (isSuppressed(e.reason)) {
        e.preventDefault();
        console.warn('[Sandbox] Suppressed React internal rejection:', e.reason);
        return;
      }
      var rootNode = document.getElementById('root');
      if (rootNode) {
        rootNode.innerHTML = '<div style="padding: 2rem; color: #ff6b6b; background: #1a1a1a; min-height: 100vh; font-family: monospace;">' +
          '<h2 style="color: white; margin-bottom: 1rem;">Unhandled Rejection</h2>' +
          '<pre style="white-space: pre-wrap; font-size: 14px;">' + (e.reason ? e.reason.toString() : 'Unknown Error') + '</pre>' +
          '<p style="margin-top: 1rem; color: #888;">Take a screenshot of this error for the AI agent to fix.</p>' +
        '</div>';
      }
    });
  </script>
</body>
</html>`;

        setPreviewHtml(html);
      } else if (files.length > 0) {
        // Fallback if files exist but no valid JS/TS entry point was found
        setPreviewHtml(`
          <div style="padding: 2rem; color: #ff6b6b; background: #1a1a1a; min-height: 100vh; font-family: monospace;">
            <h2 style="color: white;">Code Generation Complete</h2>
            <p style="margin-top: 1rem; color: #888;">However, no valid React entry file (App.jsx, main.jsx, etc.) could be found to render.</p>
            <p style="color: #888;">Please ask the AI to "ensure the main React component is exported properly".</p>
          </div>
        `);
      }
    }
  }, [files]);

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a]" data-testid="preview-panel">
      {/* Preview Header */}
      <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Preview</span>
          <div className="h-4 w-px bg-gray-800" />
          <div className="flex items-center space-x-1 bg-gray-900 rounded-lg p-1">
            <button
              data-testid="device-desktop-btn"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded transition-all ${
                deviceMode === 'desktop' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              data-testid="device-tablet-btn"
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded transition-all ${
                deviceMode === 'tablet' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              data-testid="device-mobile-btn"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded transition-all ${
                deviceMode === 'mobile' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            data-testid="refresh-preview-btn"
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => {
              if (iframeRef.current) {
                const src = iframeRef.current.srcdoc;
                iframeRef.current.srcdoc = '';
                setTimeout(() => { iframeRef.current.srcdoc = src; }, 50);
              }
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        {previewHtml ? (
          <div
            data-testid="preview-container"
            className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
              deviceMode === 'mobile'
                ? 'w-[375px] h-[667px]'
                : deviceMode === 'tablet'
                ? 'w-[768px] h-[600px]'
                : 'w-full h-full'
            }`}
            style={{ minHeight: deviceMode === 'desktop' ? 'calc(100vh - 140px)' : undefined }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              style={{ minHeight: deviceMode === 'desktop' ? 'calc(100vh - 140px)' : '600px' }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title="App Preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-center relative overflow-hidden" data-testid="preview-empty">
            {/* Ambient Background Lights */}
            <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-violet-900/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[20%] w-[30vw] h-[30vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center mt-[-60px]">
              <div className="relative mb-12 flex justify-center items-center">
              {/* Outer Counter-Spinning Rings */}
              <div className="absolute inset-[-30px] rounded-full border-t-2 border-r-2 border-violet-500/40 animate-spin" style={{ animationDuration: '4s' }}></div>
              <div className="absolute inset-[-15px] rounded-full border-b-2 border-l-2 border-blue-500/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '5s' }}></div>
              
              {/* Glowing animated orb */}
              <div className="absolute bg-violet-600/30 blur-[40px] rounded-full w-40 h-40 animate-pulse" style={{ animationDuration: '3s' }}></div>
              
              {/* Inner Full Circle */}
              <div className="relative bg-[#0a0a0a]/90 w-32 h-32 flex flex-col items-center justify-center rounded-full border border-violet-500/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-xl">
                <svg className="w-10 h-10 text-violet-400 animate-pulse" style={{ animationDuration: '2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-gray-400 mb-3 tracking-tight">
              {isGenerating ? "Building something incredible..." : "Awaiting your vision."}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
              {isGenerating 
                ? "The V2 Engine is architecting your Full-Stack application. This may take a moment." 
                : "Describe your app in the chat. The V2 Engine will architect, code, and compile it right here."}
            </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;

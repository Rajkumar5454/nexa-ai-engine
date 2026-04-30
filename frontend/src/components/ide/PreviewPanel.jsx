import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

const PreviewPanel = ({ files = [] }) => {
  const [deviceMode, setDeviceMode] = useState('desktop');
  const [previewHtml, setPreviewHtml] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (files && files.length > 0) {
      const findFile = (fileList, names) => {
        for (const file of fileList) {
          if (file.type === 'file') {
            for (const name of names) {
              if (file.path?.includes(name) || file.name === name) {
                return file;
              }
            }
          }
          if (file.children) {
            const found = findFile(file.children, names);
            if (found) return found;
          }
        }
        return null;
      };

      const appFile = findFile(files, ['App.jsx', 'App.js']);
      const cssFile = findFile(files, ['index.css', 'App.css', 'styles.css']);

      if (appFile?.content) {
        // Robust component detection
        let mainComponentName = 'App';
        const exportDefaultMatch = appFile.content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
        if (exportDefaultMatch) {
          mainComponentName = exportDefaultMatch[1];
        }

        // Strict code extraction: strip conversational text and markdown fences
        let rawContent = appFile.content;
        const codeBlockMatch = rawContent.match(/```(?:jsx|javascript|js)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          rawContent = codeBlockMatch[1];
        } else {
          // If no markdown, try to find the first meaningful code start
          const firstCodeStart = rawContent.search(/(?:import|export|const|function|class)\s+/);
          if (firstCodeStart > -1) {
            rawContent = rawContent.substring(firstCodeStart);
          }
        }

        let cleanCode = rawContent
          .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '')
          .replace(/export\s+default\s+(?:function\s+)?\w+\s*\(?/g, (match) => {
             if (match.includes('function')) return 'function ' + mainComponentName + ' (';
             return '';
          });

        const extraCss = cssFile?.content || '';

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          animation: {
            'fade-in': 'fadeIn 0.5s ease-in',
            'slide-up': 'slideUp 0.6s ease-out',
            'bounce-in': 'bounceIn 0.6s ease-out',
          },
          keyframes: {
            fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
            slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
            bounceIn: { '0%': { transform: 'scale(0.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
          },
        },
      },
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style type="text/tailwindcss">
    @layer utilities {
      .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); }
      .glow-violet { box-shadow: 0 0 40px rgba(139,92,246,0.4); }
      .gradient-text { background: linear-gradient(135deg, #fff 0%, #a78bfa 50%, #60a5fa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    }
    ${extraCss}
  </style>
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
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    // React hooks and utilities
    const { useState, useEffect, useReducer, useCallback, useMemo, useRef, useContext, createContext, Fragment, forwardRef, memo, lazy, Suspense } = React;

    // Simple hash-based router (no CDN needed)
    const RouterContext = createContext({ path: '/', navigate: () => {}, params: {} });

    function BrowserRouter({ children }) {
      const [path, setPath] = useState(window.location.hash.slice(1) || '/');
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
      return forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, variants, ...props }, ref) => {
        return React.createElement(tag, { ...props, ref }, children);
      });
    }});
    const AnimatePresence = ({ children }) => <>{children}</>;

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

    // Lucide-react stubs
    const Sun = iconStub, Moon = iconStub, Star = iconStub, Heart = iconStub, Search = iconStub, Menu = iconStub, X = iconStub, Plus = iconStub, Minus = iconStub, Check = iconStub, ChevronDown = iconStub, ChevronUp = iconStub, ChevronLeft = iconStub, ChevronRight = iconStub, ArrowRight = iconStub, ArrowLeft = iconStub, Home = iconStub, User = iconStub, Settings = iconStub, LogOut = iconStub, Trash = iconStub, Edit = iconStub, Eye = iconStub, EyeOff = iconStub, Mail = iconStub, Phone = iconStub, MapPin = iconStub, Calendar = iconStub, Clock = iconStub, Download = iconStub, Upload = iconStub, Share = iconStub, Copy = iconStub, ExternalLink = iconStub, Github = iconStub, Twitter = iconStub, Facebook = iconStub, Linkedin = iconStub, Instagram = iconStub, Youtube = iconStub, Bell = iconStub, ShoppingCart = iconStub, CreditCard = iconStub, DollarSign = iconStub, BarChart = iconStub, TrendingUp = iconStub, Activity = iconStub, Zap = iconStub, Shield = iconStub, Lock = iconStub, Unlock = iconStub, Globe = iconStub, Bookmark = iconStub, Tag = iconStub, Filter = iconStub, Layers = iconStub, Grid = iconStub, List = iconStub, AlertCircle = iconStub, Info = iconStub, HelpCircle = iconStub, AlertTriangle = iconStub, CheckCircle = iconStub, XCircle = iconStub, Loader = iconStub, RefreshCw = iconStub, RotateCw = iconStub, Save = iconStub, FileText = iconStub, Image = iconStub, Video = iconStub, Music = iconStub, Mic = iconStub, Camera = iconStub, Wifi = iconStub, Battery = iconStub, Monitor = iconStub, Smartphone = iconStub, Tablet = iconStub, Laptop = iconStub, Code = iconStub, Terminal = iconStub, Database = iconStub, Server = iconStub, Cloud = iconStub, CloudUpload = iconStub, CloudDownload = iconStub, Folder = iconStub, FolderOpen = iconStub, File = iconStub, Paperclip = iconStub, Send = iconStub, MessageSquare = iconStub, MessageCircle = iconStub, Users = iconStub, UserPlus = iconStub, UserMinus = iconStub, Award = iconStub, Gift = iconStub, Target = iconStub, Crosshair = iconStub, Navigation = iconStub, Compass = iconStub, Map = iconStub, Flag = iconStub, Briefcase = iconStub, Package = iconStub, Box = iconStub, Truck = iconStub, Sparkles = iconStub;

    // recharts stubs
    const ResponsiveContainer = ({children}) => <div style={{width:'100%',height:'300px'}}>{children}</div>;
    const LineChart = ({children}) => <div style={{textAlign:'center',padding:'40px',color:'#999'}}>Chart Preview</div>;
    const BarChart2 = LineChart, PieChart = LineChart, AreaChart = LineChart, RadarChart = LineChart, ScatterChart = LineChart;
    const CartesianGrid = () => null, XAxis = () => null, YAxis = () => null, Tooltip = ({children}) => <>{children}</>, Legend = () => null;
    const Line = () => null, Bar = () => null, Pie = () => null, Cell = () => null, Area = () => null;
    const Radar = () => null, RadialBarChart = LineChart, RadialBar = () => null, Treemap = LineChart;

    // axios stub
    const axios = { get: async () => ({data:{}}), post: async () => ({data:{}}), put: async () => ({data:{}}), delete: async () => ({data:{}}) };

    // uuid stub
    const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c === 'x' ? r : (r&0x3|0x8)).toString(16); });
    const v4 = uuidv4;

    // date-fns stubs
    const format = (d) => new Date(d).toLocaleDateString();
    const formatDistance = () => 'a few seconds ago';
    const parseISO = (s) => new Date(s);

    // clsx / classnames
    const clsx = (...args) => args.flat().filter(Boolean).join(' ');
    const classNames = clsx;
    const cn = clsx;
    const twMerge = (...args) => args.flat().filter(Boolean).join(' ');

    try {
      ${cleanCode}

      // Auto-detect main component
      let MainComponent = typeof ${mainComponentName} !== 'undefined' ? ${mainComponentName} : null;
      if (!MainComponent) {
        // Try to find the first component defined in the script
        const defined = Object.keys(window).filter(k => /^[A-Z]/.test(k) && typeof window[k] === 'function');
        if (defined.length > 0) MainComponent = window[defined[0]];
      }

      if (!MainComponent) throw new Error('No React component found in the generated code.');

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<BrowserRouter><MainComponent /></BrowserRouter>);
    } catch (err) {
      document.getElementById('root').innerHTML = '<div class="error-overlay"><pre>Preview Error:\\n\\n' + err.message + '</pre></div>';
      console.error('Preview render error:', err);
    }
  </script>
  <script>
    window.onerror = function(msg, url, line, col, err) {
      var root = document.getElementById('root');
      if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
        root.innerHTML = '<div class="error-overlay"><pre>Runtime Error:\n\n' + msg + '\n\nSource: ' + url + '\nLine: ' + line + (err ? '\n\nStack: ' + err.stack : '') + '</pre></div>';
      }
      return true;
    };
    window.addEventListener('unhandledrejection', function(e) {
      var root = document.getElementById('root');
      if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
        root.innerHTML = '<div class="error-overlay"><pre>Async Error:\n\n' + (e.reason?.message || e.reason || 'Unknown async error') + '</pre></div>';
      }
    });
  </script>
</body>
</html>`;

        setPreviewHtml(html);
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
          <div className="text-center text-gray-500 mt-20" data-testid="preview-empty">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-lg mb-2">No preview available yet</p>
            <p className="text-sm">Generate an app to see it running here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;

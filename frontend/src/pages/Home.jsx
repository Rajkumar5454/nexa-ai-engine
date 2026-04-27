import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, ArrowRight, Zap, Globe, Layers, ChevronDown, Rocket, Database, Lock, Cloud, Webhook, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import ModelSelector from '../components/ModelSelector';
import { getStoredModel, setStoredModel } from '../lib/aiModels';

const COMING_SOON_FEATURES = [
  { icon: Rocket,    title: 'One-Click Deploy',    desc: 'Push apps to Vercel, Netlify, or your own domain in seconds.' },
  { icon: Database,  title: 'Built-in Database',   desc: 'Provision Postgres / Mongo with zero config — auto-wired to your generated app.' },
  { icon: Lock,      title: 'Auth & User Management', desc: 'Drop-in Google, GitHub, email auth + roles, all generated for you.' },
  { icon: Cloud,     title: 'Cloud Storage',       desc: 'S3-compatible file uploads with signed URLs out of the box.' },
  { icon: Webhook,   title: 'Webhooks & Cron',     desc: 'Schedule background jobs and listen for external events.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time usage, conversion, and credit consumption metrics.' },
];

const Home = () => {
  const [prompt, setPrompt] = useState('');
  const [importModal, setImportModal] = useState(null); // 'github' or 'figma'
  const [importUrl, setImportUrl] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredModel());
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleModelChange = (id) => {
    setSelectedModel(id);
    setStoredModel(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      if (user) {
        navigate('/ide', { state: { initialPrompt: prompt } });
      } else {
        navigate('/signup');
      }
    }
  };

  const handleImport = () => {
    if (!importUrl.trim()) return;
    const importPrompt = importModal === 'github'
      ? `Import and rebuild this GitHub project: ${importUrl}`
      : `Import and rebuild this Figma design: ${importUrl}`;
    if (user) {
      navigate('/ide', { state: { initialPrompt: importPrompt } });
    } else {
      navigate('/signup');
    }
    setImportModal(null);
    setImportUrl('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1a] via-[#0f0d24] to-[#0a0a1a] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#0c0a1a]/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-10 w-auto object-contain" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">Nexa</span>
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent"> AI</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Features dropdown */}
              <div className="relative hidden md:block">
                <button
                  data-testid="nav-features-btn"
                  onMouseEnter={() => setShowFeatures(true)}
                  onMouseLeave={() => setShowFeatures(false)}
                  onClick={() => setShowFeatures((v) => !v)}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors px-3 py-2"
                >
                  Features
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
                </button>
                {showFeatures && (
                  <div
                    data-testid="features-dropdown"
                    onMouseEnter={() => setShowFeatures(true)}
                    onMouseLeave={() => setShowFeatures(false)}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] rounded-2xl border border-white/10 bg-[#0c0a1a]/95 backdrop-blur-xl shadow-2xl shadow-violet-900/20 p-2"
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Roadmap</span>
                      <span className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold bg-violet-500/15 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {COMING_SOON_FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                          <div
                            key={f.title}
                            data-testid={`feature-soon-${f.title.toLowerCase().replace(/\W+/g, '-')}`}
                            className="group p-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-not-allowed"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-violet-300" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white group-hover:text-violet-200 transition-colors">{f.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{f.desc}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 px-3 py-2 border-t border-white/5 text-[11px] text-gray-500 text-center">
                      Want one of these now? <button onClick={() => navigate('/pricing')} className="text-violet-300 hover:text-white font-medium">Upgrade →</button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white transition-colors hidden sm:inline-flex"
                onClick={() => navigate('/pricing')}
                data-testid="nav-pricing-btn"
              >
                Pricing
              </Button>
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-300">{user.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-full px-5 shadow-lg shadow-violet-600/20"
                    onClick={() => navigate('/signup')}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Announcement Badge */}
          <div className="flex justify-center mb-8 animate-fade-in-up-delay-1">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Website Builder</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Scrolling Ticker */}
          <div className="flex justify-center mb-10 overflow-hidden">
            <div className="relative flex items-center w-full max-w-2xl py-3 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm rounded-lg">
              <div className="whitespace-nowrap animate-marquee flex items-center">
                <span className="mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Backend integration coming soon
                </span>
                <span className="text-violet-500/50">•</span>
                <span className="mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Database support coming soon
                </span>
                <span className="text-violet-500/50">•</span>
                <span className="mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Authentication features coming soon
                </span>
                <span className="text-violet-500/50">•</span>
                <span className="mx-4 text-[10px] font-bold text-violet-400/70 uppercase tracking-[0.2em]">
                  Currently providing high-performance Frontend generation
                </span>
                <span className="text-violet-500/50">•</span>
                {/* Duplicate for seamless loop */}
                <span className="mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Backend integration coming soon
                </span>
                <span className="text-violet-500/50">•</span>
                <span className="mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Database support coming soon
                </span>
                <span className="text-violet-500/50">•</span>
                <span className="mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Authentication features coming soon
                </span>
                <span className="text-violet-500/50">•</span>
              </div>
            </div>
          </div>

          {/* Hero Text */}
          <div className="text-center mb-8 animate-fade-in-up-delay-1">
            <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight leading-[1.1]">
              What Will You{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Build</span>{' '}
              Today?
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Build your dream website within minutes with AI. Just describe what you want and watch it come to life.
            </p>
          </div>

          {/* Prompt Input */}
          <form onSubmit={handleSubmit} className="mb-6 animate-fade-in-up-delay-2">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/30 via-blue-600/30 to-cyan-600/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#12101f] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all duration-300">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Describe the website you want to build..."
                  className="w-full bg-transparent text-white placeholder-gray-600 outline-none resize-none text-lg"
                  rows="2"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="image-upload-home"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          alert(`Screenshot "${file.name}" selected! Vision support coming soon.`);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('image-upload-home').click()}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/plus"
                      title="Upload Screenshot"
                    >
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                    <ModelSelector
                      value={selectedModel}
                      onChange={handleModelChange}
                      size="sm"
                      align="left"
                      testId="home-model-selector"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-full px-6 shadow-lg shadow-violet-600/25 hover:scale-[1.02] transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Import Options */}
          <div className="text-center mb-16 animate-fade-in-up-delay-3">
            <p className="text-gray-600 text-sm mb-3">or import from</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setImportModal('github')}
                className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center space-x-2"
                data-testid="import-github-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.3 9.4 7.8 11 .6.1.8-.2.8-.5v-2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.2-1.3-5.2-5.6 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-3 0 0 .9-.3 3 1.1.9-.2 1.8-.3 2.7-.3s1.9.1 2.7.3c2.1-1.4 3-1.1 3-1.1.6 1.6.2 2.7.1 3 .7.8 1.1 1.8 1.1 3 0 4.3-2.7 5.3-5.2 5.6.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5C20.7 21.4 24 17.1 24 12 24 5.4 18.6 0 12 0z"/>
                </svg>
                <span>GitHub</span>
              </button>
              <button
                onClick={() => setImportModal('figma')}
                className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center space-x-2"
                data-testid="import-figma-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019 3.019-1.355 3.019-3.019V16.49H8.148zm7.704 0h-.784c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.784c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.784-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h.784c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.784z"/>
                </svg>
                <span>Figma</span>
              </button>
            </div>
          </div>

          {/* Import Modal */}
          {importModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setImportModal(null)}>
              <div className="bg-[#12101f] border border-white/10 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="import-modal">
                <h3 className="text-xl font-bold text-white mb-2">
                  Import from {importModal === 'github' ? 'GitHub' : 'Figma'}
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  {importModal === 'github'
                    ? 'Paste a GitHub repository URL and AI will analyze and rebuild it.'
                    : 'Paste a Figma file URL and AI will convert the design into code.'}
                </p>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder={importModal === 'github' ? 'https://github.com/user/repo' : 'https://figma.com/file/...'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors mb-4"
                  data-testid="import-url-input"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={() => { setImportModal(null); setImportUrl(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-full px-6 shadow-lg shadow-violet-600/25"
                    onClick={handleImport}
                    disabled={!importUrl.trim()}
                    data-testid="import-submit-btn"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Import & Build
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="animate-fade-in-up-delay-4">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-widest text-violet-400 mb-3">Why Nexa.AI</p>
              <h2 className="text-3xl md:text-4xl font-bold">
                Build <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Faster</span> Than Ever
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-violet-500/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-5">
                  <Zap className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Describe your vision and AI builds it. Multi-page websites with real functionality in minutes.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-5">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Multi-Page</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Real separate routes, working navigation, login, dashboard — not just a landing page.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-5">
                  <Layers className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Niche-Specific</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Every project gets unique layouts — fitness apps, portfolios, e-commerce all look different.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-24 border-t border-white/5 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-6 w-auto opacity-50" />
            <p className="text-sm text-gray-500">© 2026 Nexa.AI. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/pricing" className="text-sm text-gray-500 hover:text-white transition-colors">Pricing</Link>
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

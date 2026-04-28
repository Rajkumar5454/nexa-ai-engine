import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
          <div className="text-center mb-12 animate-fade-in-up-delay-1 pt-10">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.05]">
              Build <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Stunning Websites</span> <br className="hidden md:block" /> from a Single Prompt
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Describe your idea and instantly generate a fully designed website. 
              Professional layouts, working routes, and immersive UI in seconds.
            </p>
          </div>

          {/* Prompt Input Area */}
          <div className="mb-20">
            <form onSubmit={handleSubmit} className="mb-6 animate-fade-in-up-delay-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative bg-[#12101f]/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 hover:border-violet-500/40 transition-all duration-500 shadow-2xl shadow-black/50">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Describe the website you want to build (e.g. 'A luxury fitness brand landing page with high-contrast neon design')..."
                    className="w-full bg-transparent text-white placeholder-gray-600 outline-none resize-none text-xl font-light"
                    rows="3"
                  />
                  <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
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
                        className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/plus active:scale-95"
                        title="Upload Screenshot"
                      >
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                      </button>
                      <ModelSelector
                        value={selectedModel}
                        onChange={handleModelChange}
                        size="lg"
                        align="left"
                        testId="home-model-selector"
                      />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button
                        type="submit"
                        className="w-full md:w-auto bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-2xl px-8 py-6 h-auto text-lg font-semibold shadow-xl shadow-violet-600/30 hover:scale-[1.03] active:scale-95 transition-all"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="flex flex-col items-center gap-4 animate-fade-in-up-delay-3">
              <p className="text-gray-500 text-sm">No credit card required to start</p>
              <Button 
                variant="outline" 
                className="rounded-full px-8 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 h-12"
                onClick={() => navigate('/signup')}
              >
                Start Building Now
              </Button>
            </div>
          </div>

          {/* Example Websites Section */}
          <div className="mb-32 animate-fade-in-up-delay-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Example Websites</h2>
              <p className="text-gray-400">See what others are creating with Nexa AI</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "FitLife Pro", niche: "Fitness & Gym", color: "from-orange-500 to-red-500" },
                { title: "Quantum SaaS", niche: "Tech & Software", color: "from-blue-500 to-indigo-500" },
                { title: "Luxe Decor", niche: "Interior Design", color: "from-emerald-500 to-teal-500" }
              ].map((site, i) => (
                <div key={i} className="group relative">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${site.color} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500`}></div>
                  <div className="relative bg-[#12101f] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300">
                    <div className={`h-40 bg-gradient-to-br ${site.color} opacity-40 flex items-center justify-center`}>
                       <Globe className="w-12 h-12 text-white/50" />
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">{site.niche}</p>
                      <h3 className="text-lg font-bold text-white mb-2">{site.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">Generated in 14 seconds with customized layout and assets.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="animate-fade-in-up-delay-4 mb-20">
            <div className="text-center mb-20">
              <p className="text-xs uppercase tracking-widest text-violet-400 mb-4 font-bold">The Nexa Advantage</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Built for <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Scale & Speed</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-10 hover:bg-white/[0.05] hover:border-violet-500/30 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-8 border border-violet-500/20 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Instant Generation</h3>
                <p className="text-gray-400 leading-relaxed text-lg">Your entire website architecture is ready in seconds, not hours. Real code, real fast.</p>
              </div>
              <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-10 hover:bg-white/[0.05] hover:border-blue-500/30 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-8 border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <Layers className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Modern UI Design</h3>
                <p className="text-gray-400 leading-relaxed text-lg">Every generated site uses the latest design trends—glassmorphism, neon, and sleek grids.</p>
              </div>
              <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-10 hover:bg-white/[0.05] hover:border-cyan-500/30 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-8 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Mobile Responsive</h3>
                <p className="text-gray-400 leading-relaxed text-lg">Your websites look perfect on every device. Fully adaptive layouts generated automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-12 border-t border-white/5 py-12 bg-black/20">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-6 w-auto opacity-50" />
            <p className="text-sm text-gray-500">© 2026 Nexa.AI. Professional AI Website Generation.</p>
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

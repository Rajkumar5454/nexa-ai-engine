import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Sparkles, ArrowRight, Zap, Globe, Layers, ChevronDown, Rocket, Database, Lock, Cloud, Webhook, BarChart3, Users, Cpu, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import ModelSelector from '../components/ModelSelector';
import { getStoredModel, setStoredModel } from '../lib/aiModels';
import ParticleBackground from '../components/ParticleBackground';

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
  const [showFeatures, setShowFeatures] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredModel());
  const [previewSite, setPreviewSite] = useState(null);
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

  return (
    <div className="min-h-screen bg-[#06040d] text-white relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ParticleBackground />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-grid-white opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06040d]/50 to-[#06040d]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#06040d]/60">
        {/* Announcement Marquee */}
        <div className="bg-gradient-to-r from-violet-900/40 via-blue-900/40 to-violet-900/40 border-b border-white/5 py-1.5 overflow-hidden flex items-center text-xs font-medium tracking-wide">
          <div className="animate-marquee whitespace-nowrap flex w-max">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="mx-8 text-violet-200 flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="font-bold text-white">GPT-5.4</span> &amp; <span className="font-bold text-white">GPT-5.5</span> are LIVE
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-white opacity-80">Claude 4.7 Opus</span> &amp; <span className="font-bold text-white opacity-80">Claude 4.6 Sonnet</span> coming soon ⚡️
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
              <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-10 w-auto object-contain transition-transform group-hover:scale-110" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">Nexa</span>
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent"> AI</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <button
                  onMouseEnter={() => setShowFeatures(true)}
                  onMouseLeave={() => setShowFeatures(false)}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors px-3 py-2"
                >
                  Features
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
                </button>
                {showFeatures && (
                  <div
                    onMouseEnter={() => setShowFeatures(true)}
                    onMouseLeave={() => setShowFeatures(false)}
                    className="absolute top-full right-0 mt-2 w-[480px] bg-[#0A0710]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl shadow-violet-900/40 p-2 animate-fade-in-up"
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Roadmap</span>
                      <span className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold bg-violet-500/15 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {COMING_SOON_FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                          <div key={f.title} className="group p-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-not-allowed">
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
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all hidden sm:inline-flex"
                onClick={() => navigate('/pricing')}
              >
                Pricing
              </Button>
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all" 
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold ring-2 ring-violet-500/20">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all" 
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-full px-6 py-2 shadow-lg shadow-violet-600/20 transition-all hover:scale-105 active:scale-95 border-none"
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
      <main className="pt-24 pb-20 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-morphism text-sm text-violet-300 mb-6 animate-fade-in-up border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="font-medium">Next-Gen AI Website Generation</span>
              <div className="w-1 h-1 rounded-full bg-violet-400 mx-1" />
              <span className="text-white font-bold bg-violet-600/20 px-2 py-0.5 rounded-md">v2.0 Beta</span>
            </div>

            {/* Scrolling Ticker */}
            <div className="w-full max-w-lg overflow-hidden mb-6 relative">
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#06040d] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#06040d] to-transparent z-10" />
              <div className="flex whitespace-nowrap animate-marquee">
                {[
                  "Full-Stack Generation", "Backend Logic", "Postgres Integration", 
                  "Custom Auth Flows", "One-Click Deploy", "Live Collaboration"
                ].map((text, i) => (
                  <div key={i} className="flex items-center px-10">
                    <span className="text-lg md:text-xl font-black uppercase tracking-tighter text-white whitespace-nowrap">{text}</span>
                    <span className="ml-4 text-[10px] font-bold text-white bg-violet-600/40 border border-violet-500/30 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(139,92,246,0.2)]">In Development</span>
                    <div className="w-2 h-2 rounded-full bg-white/20 mx-8" />
                  </div>
                ))}
                {/* Duplicate for seamless scroll */}
                {[
                  "Full-Stack Generation", "Backend Logic", "Postgres Integration", 
                  "Custom Auth Flows", "One-Click Deploy", "Live Collaboration"
                ].map((text, i) => (
                  <div key={i + 10} className="flex items-center px-10">
                    <span className="text-lg md:text-xl font-black uppercase tracking-tighter text-white whitespace-nowrap">{text}</span>
                    <span className="ml-4 text-[10px] font-bold text-white bg-violet-600/40 border border-violet-500/30 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(139,92,246,0.2)]">In Development</span>
                    <div className="w-2 h-2 rounded-full bg-white/20 mx-8" />
                  </div>
                ))}
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-[-0.05em] leading-[0.95] animate-fade-in-up-delay-1">
              Build <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">Fast.</span> <br />
              Ship <span className="relative inline-block text-white">
                Smarter.
                <div className="absolute -bottom-1 left-0 w-full h-2 bg-violet-600/40 blur-lg animate-pulse" />
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up-delay-2 mb-6">
              Transform your vision into a professional, multi-page website in seconds. 
              Powered by the world's most capable AI models.
            </p>

            {/* Premium Prompt Input */}
            <div className="w-full max-w-4xl mx-auto mb-10 animate-fade-in-up-delay-3">
              <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                <div className="relative glass-morphism rounded-[2rem] p-5 md:p-7 shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-full bg-grid-white opacity-[0.02] pointer-events-none rounded-[2rem]" />
                  <div className="flex items-start gap-4">
                    <div className="hidden md:flex w-12 h-12 shrink-0 rounded-2xl bg-violet-600/10 items-center justify-center border border-violet-500/20">
                      <Sparkles className="w-6 h-6 text-violet-400" />
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the website of your dreams..."
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none resize-none text-xl md:text-2xl font-light mt-1"
                      rows="2"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-6 border-t border-white/10 gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => document.getElementById('image-upload-home').click()}
                        className="flex items-center justify-center w-10 h-10 rounded-full glass-morphism border border-white/20 hover:bg-white/20 hover:border-violet-500/50 transition-all cursor-pointer text-white"
                        title="Upload Image"
                      >
                        <Plus className="w-4 h-4" />
                        <input type="file" id="image-upload-home" className="hidden" accept="image/*" />
                      </button>
                      <ModelSelector
                        value={selectedModel}
                        onChange={(modelId) => {
                          setSelectedModel(modelId);
                          setStoredModel(modelId);
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 hidden md:flex">
                      {['SaaS Platform', 'E-commerce', 'Portfolio'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setPrompt(`Create a professional ${tag.toLowerCase()} website for...`)}
                          className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-md bg-white/5 border border-white/5"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="submit"
                      className="w-full md:w-auto bg-gradient-to-r from-violet-600 to-blue-600 hover:scale-105 active:scale-95 text-white rounded-2xl px-6 py-3.5 h-auto text-base font-bold shadow-xl shadow-violet-600/30 transition-all group border-none"
                    >
                      <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                      Generate Now
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Trust Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 animate-fade-in-up-delay-4 border-y border-white/5 py-12 glass-morphism rounded-[2rem] px-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">250+</div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Websites Built</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center gap-2 text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">
                <Cpu className="w-6 h-6 text-violet-400" />
                4 Engines
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Gemini, GPT, Claude, Llama</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">Multi-Page</div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Full Architecture</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center gap-2 text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                100% Secure
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Clean & Scalable Code</div>
            </div>
          </div>

          {/* Showcase Section */}
          <div className="mb-40">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">Masterpiece Gallery</h2>
              <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">Explore high-performance websites generated in under 60 seconds.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "FitLife Pro", niche: "Fitness & Gym", img: "/previews/fitness.png", model: "Gemini 3.1 Pro", time: "42s" },
                { title: "Quantum AI", niche: "SaaS Dashboard", img: "/previews/saas.png", model: "GPT-4o", time: "38s" },
                { title: "Luxe Decor", niche: "Interior Design", img: "/previews/interior.png", model: "Llama 3.3 70B", time: "45s" },
                { title: "Chronos", niche: "Luxury E-commerce", img: "/previews/ecommerce.png", model: "Claude 3.5 Sonnet", time: "41s" }
              ].map((site, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/40 to-blue-600/40 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative glass-morphism rounded-[2rem] overflow-hidden transition-all duration-500 h-full">
                    <div className="h-56 overflow-hidden relative">
                      <img src={site.img} alt={site.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06040d] via-transparent to-transparent opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button 
                          onClick={() => setPreviewSite(site)}
                          className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-bold"
                        >
                          Preview Website
                        </Button>
                      </div>
                      <div className="absolute bottom-4 left-5">
                        <span className="text-[10px] font-black text-white bg-violet-600/90 backdrop-blur-md px-3 py-1.5 rounded-full uppercase tracking-tighter ring-1 ring-white/20">
                          {site.model}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">{site.niche}</p>
                          <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">{site.title}</h3>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold glass-morphism px-3 py-1 rounded-full border border-white/10">
                          {site.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advantage Section */}
          <div className="mb-40">
            <div className="text-center mb-20">
              <span className="text-xs uppercase tracking-[0.4em] text-violet-400 font-black mb-4 block">Nexa Advantage</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Engineered for <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Greatness</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, color: "violet", title: "Instant Velocity", desc: "From blank canvas to production-ready code in under 60 seconds. No more development bottlenecks." },
                { icon: Layers, color: "blue", title: "Elite Aesthetics", desc: "Our AI is trained on premium design systems, ensuring your site looks like a million-dollar startup." },
                { icon: Globe, color: "cyan", title: "Universal Response", desc: "Flawless performance across all viewports. Every layout is meticulously crafted for mobile, tablet, and desktop." }
              ].map((item, i) => (
                <div key={i} className="group glass-morphism rounded-[2.5rem] p-10 hover:bg-white/[0.05] hover:-translate-y-2 transition-all duration-500 shadow-2xl">
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center mb-8 border border-${item.color}-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                    <item.icon className={`w-8 h-8 text-${item.color}-400`} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-lg font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="relative group rounded-[3rem] overflow-hidden p-1 bg-gradient-to-r from-violet-600/50 via-blue-600/50 to-cyan-600/50 animate-fade-in-up">
            <div className="relative bg-[#080611] rounded-[2.9rem] py-24 px-8 text-center overflow-hidden">
              <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-violet-600/10 rounded-full blur-[120px] -translate-y-1/2" />
              
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter relative z-10">
                Ready to Build Your <br />
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Dream Website?</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-light relative z-10">
                Join the future of web development. Generate, customize, and ship stunning websites instantly with Nexa.AI.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                <Button 
                  onClick={() => navigate('/signup')}
                  className="bg-white text-black hover:bg-gray-200 rounded-full px-12 py-8 text-2xl font-black shadow-2xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
                >
                  Get Started for Free
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/pricing')}
                  className="text-white hover:bg-white/5 rounded-full px-10 py-8 text-xl font-bold border border-white/10"
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/20 py-16 bg-[#040208] relative z-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-6">
                <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-8 w-auto opacity-100" />
                <span className="text-xl font-bold tracking-tight text-white">Nexa AI</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed font-light">
                Empowering creators to build the web of tomorrow, one prompt at a time. Professional-grade AI generation for modern teams.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              <div>
                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
                <ul className="space-y-4 text-white/70 text-sm font-light">
                  <li><Link to="/ide" className="hover:text-white transition-colors">AI Builder</Link></li>
                  <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Legal</h4>
                <ul className="space-y-4 text-white/70 text-sm font-light">
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.3em]">© 2026 Nexa AI. Built with precision.</p>
            <div className="flex gap-6">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <div className="w-4 h-4 bg-gray-200 rounded-sm" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <div className="w-4 h-4 bg-gray-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Preview Modal */}
      {previewSite && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setPreviewSite(null)}
        >
          <div className="relative max-w-5xl w-full h-[80vh] bg-[#0c0a1a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
              onClick={() => setPreviewSite(null)}
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>
            <div className="w-full h-full overflow-y-auto">
              <img src={previewSite.img} alt="Website Preview" className="w-full h-auto" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent flex justify-center">
              <Button 
                onClick={() => {
                  const siteData = previewSite;
                  setPreviewSite(null);
                  if (user) {
                    navigate('/ide', { 
                      state: { 
                        initialPrompt: `Create a professional website like ${siteData.title} for ${siteData.niche}. Ensure a high-end, premium aesthetic with deep integration of visuals and modern layout.` 
                      } 
                    });
                  } else {
                    navigate('/signup', { state: { redirectTo: '/ide', initialPrompt: `Create a professional website like ${siteData.title} for ${siteData.niche}.` } });
                  }
                }}
                className="bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full px-8 py-4 font-bold"
              >
                Generate a Site Like This
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

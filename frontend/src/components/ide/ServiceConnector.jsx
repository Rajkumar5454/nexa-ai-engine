import React, { useState } from 'react';
import { Database, Shield, Lock, ExternalLink, X, CheckCircle2 } from 'lucide-react';

const ServiceConnector = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('supabase');
  const [config, setConfig] = useState({
    supabaseUrl: localStorage.getItem('NEXA_V2_SUPABASE_URL') || '',
    supabaseAnonKey: localStorage.getItem('NEXA_V2_SUPABASE_ANON_KEY') || '',
    firebaseConfig: localStorage.getItem('NEXA_V2_FIREBASE_CONFIG') || '',
    googleClientId: localStorage.getItem('NEXA_V2_GOOGLE_CLIENT_ID') || '',
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('NEXA_V2_SUPABASE_URL', config.supabaseUrl);
    localStorage.setItem('NEXA_V2_SUPABASE_ANON_KEY', config.supabaseAnonKey);
    localStorage.setItem('NEXA_V2_FIREBASE_CONFIG', config.firebaseConfig);
    localStorage.setItem('NEXA_V2_GOOGLE_CLIENT_ID', config.googleClientId);
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSave(config);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#121212] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Connect Your Backend</h3>
              <p className="text-xs text-gray-400">Your keys stay local and are never sent to our servers.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {['supabase', 'firebase', 'google'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-500 bg-blue-500/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-[300px]">
          {activeTab === 'supabase' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-start space-x-3 p-3 bg-blue-900/10 border border-blue-900/20 rounded-lg mb-4">
                <Database className="w-5 h-5 text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  Connect to your Supabase project to enable real-time database and authentication.
                </p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">SUPABASE URL</label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  value={config.supabaseUrl}
                  onChange={(e) => setConfig({...config, supabaseUrl: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">SUPABASE ANON KEY</label>
                <input
                  type="password"
                  placeholder="your-anon-key"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  value={config.supabaseAnonKey}
                  onChange={(e) => setConfig({...config, supabaseAnonKey: e.target.value})}
                />
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">FIREBASE CONFIG (JSON)</label>
                <textarea
                  placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all min-h-[150px] font-mono"
                  value={config.firebaseConfig}
                  onChange={(e) => setConfig({...config, firebaseConfig: e.target.value})}
                />
              </div>
            </div>
          )}

          {activeTab === 'google' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">GOOGLE CLIENT ID</label>
                <input
                  type="text"
                  placeholder="your-client-id.apps.googleusercontent.com"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  value={config.googleClientId}
                  onChange={(e) => setConfig({...config, googleClientId: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800 flex items-center justify-between">
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-blue-400 flex items-center space-x-1 transition-colors"
          >
            <span>Where do I find my keys?</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
              isSaved 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected!</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Save Credentials</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceConnector;

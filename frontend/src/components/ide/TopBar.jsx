import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Share2, Settings, Monitor, Code2, Columns, Plus, LayoutDashboard, FolderOpen, Download, Zap, X, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';

const TopBar = ({ activeView, setActiveView, projectName = 'New Project', onNewProject, projectId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const credits = user?.credits ?? 0;
  const low = credits < 20;

  const handleDownload = async () => {
    if (!projectId) {
      toast({ title: 'No project yet', description: 'Generate something first, then export.', variant: 'destructive' });
      return;
    }
    setDownloading(true);
    try {
      await chatAPI.downloadProject(projectId);
      toast({ title: 'Downloading project', description: 'Your ZIP is on the way.' });
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err.message || 'Could not download project',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!projectId) {
      toast({ title: 'Nothing to share yet', description: 'Generate a project first.', variant: 'destructive' });
      return;
    }
    const url = `${window.location.origin}/ide?project=${projectId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: projectName, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied!', description: 'Project URL copied to clipboard.' });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast({ title: 'Share failed', description: err.message || 'Try again', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="h-14 border-b border-gray-800/50 backdrop-blur-xl flex items-center justify-between px-4 relative z-50">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button
          data-testid="topbar-logo"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-7 w-auto object-contain" />
          <span className="font-bold text-base tracking-tight">
            <span className="text-white">Nexa</span>
            <span className="text-gray-500"> AI</span>
          </span>
        </button>
        <div className="h-6 w-px bg-gray-800" />
        <div className="relative">
          <button
            data-testid="project-dropdown-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-gray-800/50"
          >
            <span className="max-w-[200px] truncate">{projectName}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden" data-testid="project-dropdown-menu">
                <button
                  data-testid="new-project-dropdown-btn"
                  onClick={() => { onNewProject(); setShowDropdown(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
                <button
                  data-testid="goto-dashboard-btn"
                  onClick={() => { navigate('/dashboard'); setShowDropdown(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  data-testid="all-projects-btn"
                  onClick={() => { navigate('/dashboard'); setShowDropdown(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-t border-gray-700/50"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>All Projects</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center Section - View Toggle */}
      <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-1">
        <button
          data-testid="view-preview-btn"
          onClick={() => setActiveView('preview')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeView === 'preview' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="text-sm">Preview</span>
        </button>
        <button
          data-testid="view-code-btn"
          onClick={() => setActiveView('code')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeView === 'code' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span className="text-sm">Code</span>
        </button>
        <button
          data-testid="view-split-btn"
          onClick={() => setActiveView('split')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeView === 'split' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Columns className="w-4 h-4" />
          <span className="text-sm">Split</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {user && (
          <button
            data-testid="topbar-credits-pill"
            onClick={() => navigate('/pricing')}
            title="Click to buy more credits"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              low
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                : 'border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {credits.toLocaleString()} credits
          </button>
        )}
        <Button
          data-testid="topbar-buy-credits-btn"
          size="sm"
          onClick={() => navigate('/pricing')}
          className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-full h-8 px-3 text-xs font-semibold shadow-md shadow-violet-600/20"
        >
          Buy Credits
        </Button>
        {projectId && (
          <Button
            data-testid="download-btn"
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Exporting…' : 'Export'}
          </Button>
        )}
        <Button
          data-testid="share-btn"
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={handleShare}
          title="Copy project link"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          data-testid="settings-btn"
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
          data-testid="settings-modal"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#14102a] to-[#0c0a1a] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-white transition-colors"
                data-testid="settings-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {user && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'N'}
                      </div>
                    )}
                    <div>
                      <div className="text-white font-semibold">{user.name}</div>
                      <div className="text-gray-400 text-xs">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Plan</span>
                    <span className="text-white font-medium capitalize">{user.plan || 'free'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-gray-400">Credits</span>
                    <span className="text-violet-300 font-semibold">{credits.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setShowSettings(false); navigate('/pricing'); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-blue-600/20 border border-violet-500/30 text-white font-medium hover:from-violet-600/30 hover:to-blue-600/30 transition-all"
                data-testid="settings-buy-credits-btn"
              >
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-violet-300" /> Buy more credits</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>

              <button
                onClick={() => { setShowSettings(false); navigate('/dashboard'); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors"
              >
                <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>

              <button
                onClick={() => { logout(); setShowSettings(false); navigate('/'); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/15 transition-colors"
                data-testid="settings-logout-btn"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;

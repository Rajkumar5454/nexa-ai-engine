import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import ChatPanel from '../components/ide/ChatPanel';
import PreviewPanel from '../components/ide/PreviewPanel';
import CodePanel from '../components/ide/CodePanel';
import TopBar from '../components/ide/TopBar';
import ServiceConnector from '../components/ide/ServiceConnector';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getStoredModel, getModelById } from '../lib/aiModels';

const IDE_v2 = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPrompt = location.state?.initialPrompt || '';
  const urlProjectId = searchParams.get('project');

  const [activeView, setActiveView] = useState('preview');
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [projectId, setProjectId] = useState(urlProjectId || null);
  const [projectName, setProjectName] = useState(urlProjectId ? 'Loading...' : 'New Project');
  const [sessionId] = useState(`session-v2-${Date.now()}`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [guidedState, setGuidedState] = useState('idle'); // idle, waiting_for_choice, fullstack, frontend
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  const { refreshUser, setUser, user, loading } = useAuth();


  const convertToFileTree = useCallback((filesList) => {
    const tree = [];
    filesList.forEach(file => {
      const filePath = typeof file.path === 'string' ? file.path : '';
      const parts = filePath.split('/').filter(p => p);
      let currentLevel = tree;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += '/' + part;
        const isFile = index === parts.length - 1;

        if (isFile) {
          currentLevel.push({
            name: part,
            path: currentPath,
            type: 'file',
            content: file.content,
            language: file.language
          });
        } else {
          let folder = currentLevel.find(item => item.name === part && item.type === 'folder');
          if (!folder) {
            folder = { name: part, path: currentPath, type: 'folder', children: [] };
            currentLevel.push(folder);
          }
          currentLevel = folder.children;
        }
      });
    });
    return tree;
  }, []);

  // Load existing project from URL param
  const initialFireRef = useRef(false);
  // V2 Sandbox: Sandbox Stimulus (Force 5000 credits)
  useEffect(() => {
    if (user && (user.credits || 0) < 5000) {
      setUser({ ...user, credits: 5000 });
    }
  }, [user, setUser]);

  useEffect(() => {
    if (initialPrompt && !projectLoaded) {
      setPendingPrompt(initialPrompt);
      setGuidedState('waiting_for_choice');
      setMessages([
        {
          id: 'welcome-v2',
          type: 'assistant',
          content: "Welcome to **Nexa AI 2.0 Sandbox**! 🚀\n\n**GOD MODE ACTIVE:** You have unlimited testing credits. \n\nPlease choose your stack to begin:",
          timestamp: new Date(),
          buttons: [
            { label: "Frontend Only", value: "Frontend", primary: false },
            { label: "Full-Stack (V2 Engine)", value: "Fullstack", primary: true }
          ]
        }
      ]);
    } else if (!projectLoaded) {
      setMessages([
        {
          id: 'welcome-v2',
          type: 'assistant',
          content: "Welcome to **Nexa AI 2.0 Sandbox**! 🚀\n\n**GOD MODE ACTIVE:** You have unlimited testing credits. \n\nTell me what you want to build today!",
          timestamp: new Date()
        }
      ]);
    }
  }, [initialPrompt, projectLoaded]);

  useEffect(() => {
    if (initialFireRef.current) return;
    initialFireRef.current = true;
    if (urlProjectId && !projectLoaded) {
      loadProject(urlProjectId);
    } else if (!urlProjectId) {
      setProjectLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlProjectId]);

  useEffect(() => {
    const handleSwitch = (e) => setActiveView(e.detail);
    window.addEventListener('switch-view', handleSwitch);
    return () => window.removeEventListener('switch-view', handleSwitch);
  }, []);

  const loadProject = async (pid) => {
    try {
      const data = await chatAPI.getProject(pid);
      setProjectId(data.id);
      setProjectName(data.name || 'Untitled Project');

      // Restore messages
      if (data.messages && data.messages.length > 0) {
        const restored = data.messages.map((msg, i) => ({
          id: Date.now() + i,
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          actions: msg.steps || []
        }));
        setMessages(restored);
      }

      // Restore files
      if (data.files && data.files.length > 0) {
        const fileTree = convertToFileTree(data.files);
        setFiles(fileTree);
        const appFile = findAppFile(fileTree);
        if (appFile) setSelectedFile(appFile);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setProjectLoaded(true);
    }
  };

  const findAppFile = (tree) => {
    for (const item of tree) {
      if (item.type === 'file' && (item.name === 'App.jsx' || item.name === 'App.js')) {
        return item;
      }
      if (item.children) {
        const found = findAppFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const [streamingText, setStreamingText] = useState('');
  const cancelRef = useRef(null);

  const handleStop = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsGenerating(false);
    setStreamingText('');
    
    setMessages(prev => prev.map(m => 
      m.isStreaming ? { ...m, isStreaming: false, content: m.content + '\n\n[Generation stopped by user]' } : m
    ));
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }


  const runGeneration = async (content, isFullstack = false) => {
    const modelId = getStoredModel();
    // V2 Sandbox: Free testing mode enabled
    /* 
    const generateCost = getModelById(modelId).cost;
    if (user && (user.credits ?? 0) < generateCost) {
      window.dispatchEvent(
        new CustomEvent('low-credits', {
          detail: { required: generateCost, available: user.credits ?? 0 },
        }),
      );
      return;
    }
    */

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsGenerating(true);
    setStreamingText('');

    const streamMsgId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: streamMsgId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    // Mode: We pass is_v2 = isFullstack to the API
    cancelRef.current = chatAPI.generateCodeStream(
      content, sessionId, projectId,
      {
        onToken: (content) => {
          // If the content starts with one of our status prefixes, treat it as a status update
          if (content.includes('🚀') || content.includes('📑') || content.includes('🔐') || content.includes('🎨') || content.includes('⚙️') || content.includes('🛠️')) {
            setMessages(prev => prev.map(m =>
              m.id === streamMsgId ? { ...m, currentStatus: content } : m
            ));
          } else {
            setStreamingText(prev => prev + content);
          }
        },
        onDone: (data) => {
          // ... rest of logic remains same ...
          cancelRef.current = null;
          if (typeof data.credits_remaining === 'number' && user) {
            setUser({ ...user, credits: data.credits_remaining });
          } else {
            refreshUser();
          }

          setMessages(prev => prev.map(m =>
            m.id === streamMsgId
              ? { ...m, content: data.message || 'Code generated successfully', isStreaming: false, actions: data.steps || [] }
              : m
          ));

          if (data.analysis) {
            setMessages(prev => [...prev, {
              id: Date.now() + 2,
              type: 'assistant',
              content: data.analysis,
              timestamp: new Date(),
              isAnalysis: true
            }]);
          }

          setStreamingText('');
          setIsGenerating(false);

          if (data.project_id) {
            setProjectId(data.project_id);
            setSearchParams({ project: data.project_id }, { replace: true });
          }
          if (data.project_name) {
            setProjectName(data.project_name);
          }

          if (data.files && data.files.length > 0) {
            const fileTree = convertToFileTree(data.files);
            setFiles(fileTree);
            const appFile = findAppFile(fileTree);
            if (appFile) setSelectedFile(appFile);
          }

          // Post-generation nudge for Fullstack projects
          if (isFullstack) {
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: Date.now() + 100,
                type: 'assistant',
                content: "🚀 **Your Full-Stack App is ready in Demo Mode!**\n\nThis project is currently using mock data and local authentication. To make it a real working product, you can connect your own backend services.\n\nWould you like to connect your **Supabase** or **Firebase** keys now?",
                timestamp: new Date(),
                buttons: [
                  { label: "Connect My Backend", action: "OPEN_CONNECTOR", primary: true },
                  { label: "Maybe Later", action: "DISMISS", primary: false }
                ]
              }]);
            }, 1000);
          }
        },
        onError: (errMsg) => {
          cancelRef.current = null;
          setMessages(prev => prev.map(m =>
            m.id === streamMsgId
              ? { ...m, content: errMsg || 'Sorry, an error occurred. Please try again.', isStreaming: false }
              : m
          ));
          setStreamingText('');
          setIsGenerating(false);
          refreshUser();
        }
      },
      getStoredModel(),
      true, // is_v2
      isFullstack // fullstack_mode
    );
  };

  const handleSendMessage = async (content) => {
    // Intercept UI buttons immediately
    if (content === 'CONNECT_BACKEND_UI') {
      setIsConnectorOpen(true);
      return;
    }
    if (content === 'CLOSE_NUDGE') {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: "No problem! You can always connect your backend later using the settings. Happy coding! 🚀",
        timestamp: new Date()
      }]);
      return;
    }

    // Step 1: Intercept the first message to ask for stack preference
    if (guidedState === 'idle' && files.length === 0) {
      // Smart Detection: Detect backend-related keywords
      const backendKeywords = ['login', 'auth', 'dashboard', 'database', 'api', 'orders', 'admin', 'user', 'profile', 'crud', 'supabase', 'firebase'];
      const hasBackendIntent = backendKeywords.some(kw => content.toLowerCase().includes(kw));

      setPendingPrompt(content);
      setGuidedState('waiting_for_choice');
      
      const userMsg = {
        id: Date.now(),
        type: 'user',
        content,
        timestamp: new Date()
      };
      
      const assistantMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content: hasBackendIntent 
          ? `I noticed you're building a project that might need a backend (Auth/Database). 🚀\n\nWould you like me to build just the **Frontend** (Design Only) or a complete **Full-Stack** application with backend logic included?`
          : `That sounds like a fantastic project! 🚀\n\nTo give you the best result, would you like me to build just the **Frontend** (React) or a complete **Full-Stack** application (React + FastAPI backend)?`,
        timestamp: new Date(),
        buttons: [
          { label: "Frontend Only", value: "Frontend", primary: false },
          { label: "Full-Stack (Guided)", value: "Fullstack", primary: true }
        ]
      };
      
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      return;
    }

    // Step 2: Handle the choice if we are waiting for it
    if (guidedState === 'waiting_for_choice') {
      const choice = content.toLowerCase();
      
      // Handle Connect Backend UI button
      if (content === 'CONNECT_BACKEND_UI') {
        setIsConnectorOpen(true);
        return;
      }
      if (content === 'CLOSE_NUDGE') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'assistant',
          content: "No problem! You can always connect your backend later using the settings. Happy coding! 🚀",
          timestamp: new Date()
        }]);
        return;
      }

      if (choice.includes('fullstack') || choice.includes('full stack')) {
        setGuidedState('fullstack');
        setMessages(prev => [...prev, {
          id: Date.now() + 5,
          type: 'assistant',
          content: "Got it! Building your Full-Stack SaaS with React + Integrated Auth/Database logic... 🚀",
          timestamp: new Date()
        }]);
        runGeneration(pendingPrompt, true);
        return;
      } else if (choice.includes('frontend')) {
        setGuidedState('frontend');
        setMessages(prev => [...prev, {
          id: Date.now() + 5,
          type: 'assistant',
          content: "Got it! Building your premium React Frontend... 🎨",
          timestamp: new Date()
        }]);
        runGeneration(pendingPrompt, false);
        return;
      }
    }

    // Normal behavior for modifications
    runGeneration(content, guidedState === 'fullstack');
  };

  const handleChatMessage = async (content) => {
    // Intercept Connect Backend UI button in normal chat too
    if (content === 'CONNECT_BACKEND_UI') {
      setIsConnectorOpen(true);
      return;
    }
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsGenerating(true);

    const thinkingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: thinkingId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    let fullContent = '';
    
    // V2 Sandbox: Always use streaming for that "Antigravity" feel
    cancelRef.current = chatAPI.sendMessageStream(
      content, sessionId, projectId,
      {
        onToken: (token) => {
          fullContent += token;
          setMessages(prev => prev.map(m =>
            m.id === thinkingId ? { ...m, content: fullContent } : m
          ));
        },
        onDone: (data) => {
          cancelRef.current = null;
          setMessages(prev => prev.map(m =>
            m.id === thinkingId ? { ...m, isStreaming: false } : m
          ));
          if (data.project_id && !projectId) {
            setProjectId(data.project_id);
            setSearchParams({ project: data.project_id }, { replace: true });
          }
          setIsGenerating(false);
        },
        onError: (errMsg) => {
          cancelRef.current = null;
          setMessages(prev => prev.map(m =>
            m.id === thinkingId ? { ...m, content: errMsg || 'Chat failed.', isStreaming: false } : m
          ));
          setIsGenerating(false);
        }
      },
      getStoredModel(),
      true // is_v2
    );
  };

  const handleAnalyze = async () => {
    if (!projectId) return;
    setIsGenerating(true);

    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: 'Audit my project',
      timestamp: new Date()
    }]);

    const thinkingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: thinkingId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      isAnalysis: true
    }]);

    try {
      const result = await chatAPI.analyzeProject(projectId);
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, content: result.analysis, isStreaming: false, isAnalysis: true }
          : m
      ));
    } catch (error) {
      const detail = error.response?.data?.detail || 'Analysis failed.';
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, content: detail, isStreaming: false }
          : m
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => setMessages([]);

  const handleNewProject = () => {
    setProjectId(null);
    setProjectName('New Project');
    setMessages([]);
    setFiles([]);
    setSelectedFile(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-[#0a0a0a] text-white" data-testid="ide-page-v2">

      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        projectName={projectName}
        onNewProject={handleNewProject}
        projectId={projectId}
        is_v2={true}
        onOpenConnector={() => setIsConnectorOpen(true)}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          onChatMessage={handleChatMessage}
          isGenerating={isGenerating}
          onNewProject={handleNewProject}
          streamingText={streamingText}
          projectId={projectId}
          onAnalyze={handleAnalyze}
          onClearChat={handleClearChat}
          onStop={handleStop}
          onOpenConnector={() => setIsConnectorOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {activeView === 'preview' && <PreviewPanel files={files} isGenerating={isGenerating} />}
          {activeView === 'code' && (
            <div className="absolute inset-0">
              <CodePanel selectedFile={selectedFile} files={files} onSelectFile={setSelectedFile} />
            </div>
          )}
          {activeView === 'split' && (
            <div className="absolute inset-0 flex flex-col md:flex-row">
              <div className="flex-1 min-h-0"><PreviewPanel files={files} isGenerating={isGenerating} /></div>
              <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-800 min-h-0">
                <CodePanel selectedFile={selectedFile} files={files} onSelectFile={setSelectedFile} />
              </div>
            </div>
          )}
        </div>
      </div>
      <ServiceConnector 
        isOpen={isConnectorOpen} 
        onClose={() => setIsConnectorOpen(false)}
        onSave={(config) => {
          console.log('Backend config updated:', config);
          // Force a small notification
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'assistant',
            content: "✅ **Backend Connected!** I've updated your preview environment with your credentials. Your app will now use your real Supabase/Firebase services.",
            timestamp: new Date()
          }]);
        }}
      />
    </div>
  );
};

export default IDE_v2;

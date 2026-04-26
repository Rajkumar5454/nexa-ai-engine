import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import ChatPanel from '../components/ide/ChatPanel';
import PreviewPanel from '../components/ide/PreviewPanel';
import CodePanel from '../components/ide/CodePanel';
import TopBar from '../components/ide/TopBar';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getStoredModel, getModelById } from '../lib/aiModels';

const IDE = () => {
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
  const [sessionId] = useState(`session-${Date.now()}`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const { refreshUser, setUser, user } = useAuth();

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
  useEffect(() => {
    if (initialFireRef.current) return;
    initialFireRef.current = true;
    if (urlProjectId && !projectLoaded) {
      loadProject(urlProjectId);
    } else if (!urlProjectId && initialPrompt && !projectLoaded) {
      setProjectLoaded(true);
      handleSendMessage(initialPrompt);
    } else if (!urlProjectId) {
      setProjectLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlProjectId]);

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

  const handleSendMessage = async (content) => {
    // Pre-flight credit check — avoids streaming body-parse issues with 4xx + shows modal immediately
    const modelId = getStoredModel();
    const generateCost = getModelById(modelId).cost;
    if (user && (user.credits ?? 0) < generateCost) {
      window.dispatchEvent(
        new CustomEvent('low-credits', {
          detail: { required: generateCost, available: user.credits ?? 0 },
        }),
      );
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
    setStreamingText('');

    // Add a placeholder streaming message
    const streamMsgId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: streamMsgId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    const cancelStream = chatAPI.generateCodeStream(
      content, sessionId, projectId,
      {
        onToken: (token) => {
          setStreamingText(prev => prev + token);
        },
        onDone: (data) => {
          // Update credit balance in the top bar immediately
          if (typeof data.credits_remaining === 'number' && user) {
            setUser({ ...user, credits: data.credits_remaining });
          } else {
            refreshUser();
          }

          // Replace streaming message with final message
          setMessages(prev => prev.map(m =>
            m.id === streamMsgId
              ? { ...m, content: data.message || 'Code generated successfully', isStreaming: false, actions: data.steps || [] }
              : m
          ));

          // Add analysis message if available
          if (data.analysis) {
            const analysisMsg = {
              id: Date.now() + 2,
              type: 'assistant',
              content: data.analysis,
              timestamp: new Date(),
              isAnalysis: true
            };
            setMessages(prev => [...prev, analysisMsg]);
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
        },
        onError: (errMsg) => {
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
      getStoredModel()
    );
  };

  const handleChatMessage = async (content) => {
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

    try {
      const result = await chatAPI.sendMessage(content, sessionId, projectId);
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, content: result.message.content || result.message, isStreaming: false }
          : m
      ));
      if (result.project_id && !projectId) {
        setProjectId(result.project_id);
        setSearchParams({ project: result.project_id }, { replace: true });
      }
    } catch (error) {
      const detail = error.response?.data?.detail || 'Something went wrong.';
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, content: detail, isStreaming: false }
          : m
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!projectId) return;
    setIsGenerating(true);

    const analyzeMsg = {
      id: Date.now(),
      type: 'user',
      content: 'Audit my project',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, analyzeMsg]);

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

  const handleNewProject = () => {
    setProjectId(null);
    setProjectName('New Project');
    setMessages([]);
    setFiles([]);
    setSelectedFile(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white" data-testid="ide-page">
      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        projectName={projectName}
        onNewProject={handleNewProject}
        projectId={projectId}
      />

      <div className="flex-1 flex overflow-hidden">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          onChatMessage={handleChatMessage}
          isGenerating={isGenerating}
          onNewProject={handleNewProject}
          streamingText={streamingText}
          projectId={projectId}
          onAnalyze={handleAnalyze}
        />

        <div className="flex-1 flex overflow-hidden">
          {activeView === 'preview' && (
            <PreviewPanel files={files} />
          )}

          {activeView === 'code' && (
            <CodePanel selectedFile={selectedFile} files={files} onSelectFile={setSelectedFile} />
          )}

          {activeView === 'split' && (
            <>
              <div className="flex-1">
                <PreviewPanel files={files} />
              </div>
              <div className="flex-1 border-l border-gray-800">
                <CodePanel selectedFile={selectedFile} files={files} onSelectFile={setSelectedFile} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IDE;

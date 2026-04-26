import React, { useMemo } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Editor from '@monaco-editor/react';

const getLanguageFromFile = (filename) => {
  if (!filename) return 'plaintext';
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    jsx: 'javascript', js: 'javascript', tsx: 'typescript', ts: 'typescript',
    css: 'css', html: 'html', json: 'json', md: 'markdown',
    py: 'python', xml: 'xml', svg: 'xml', yml: 'yaml', yaml: 'yaml',
  };
  return map[ext] || 'plaintext';
};

const CodePanel = ({ selectedFile, files, onSelectFile }) => {
  const [expandedFolders, setExpandedFolders] = useState({ '/src': true });
  const [copied, setCopied] = useState(false);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCopy = async () => {
    if (selectedFile?.content) {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const language = useMemo(() => getLanguageFromFile(selectedFile?.name), [selectedFile?.name]);

  const renderFileTree = (fileList, level = 0) => {
    return fileList.map((file) => {
      const isFolder = file.type === 'folder';
      const isExpanded = expandedFolders[file.path];
      const isSelected = selectedFile?.path === file.path;

      return (
        <div key={file.path}>
          <div
            data-testid={`file-item-${file.name}`}
            className={`flex items-center space-x-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800/50 transition-colors ${
              isSelected ? 'bg-blue-900/30 border-r-2 border-blue-500' : ''
            }`}
            style={{ paddingLeft: `${(level + 1) * 12}px` }}
            onClick={() => {
              if (isFolder) {
                toggleFolder(file.path);
              } else {
                onSelectFile(file);
              }
            }}
          >
            {isFolder ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              )
            ) : (
              <div className="w-3.5" />
            )}
            {isFolder ? (
              <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
            ) : (
              <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <span className="text-[13px] text-gray-300 truncate">{file.name}</span>
          </div>
          {isFolder && isExpanded && file.children && (
            <div>{renderFileTree(file.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full bg-[#0a0a0a]" data-testid="code-panel">
      {files && files.length > 0 && (
        <div className="w-56 border-r border-gray-800 overflow-y-auto bg-[#111]">
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Explorer</h3>
          </div>
          <div className="py-1">
            {renderFileTree(files)}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile ? (
          <>
            <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-[#1e1e1e]">
              <div className="flex items-center space-x-2">
                <File className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[13px] text-gray-300">{selectedFile.name}</span>
                <span className="text-[11px] text-gray-600 ml-2">{language}</span>
              </div>
              <button
                data-testid="copy-code-btn"
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={language}
                value={selectedFile.content || ''}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: 20,
                  padding: { top: 12 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  renderLineHighlight: 'none',
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500" data-testid="code-empty">
            <File className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Select a file to view code</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePanel;

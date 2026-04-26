import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';

const FileExplorer = ({ files, selectedFile, onSelectFile }) => {
  // Initialize with all folders open
  const [openFolders, setOpenFolders] = useState(() => {
    const initOpen = {};
    const markOpen = (fileList) => {
      fileList.forEach(file => {
        if (file.type === 'folder') {
          initOpen[file.path] = true;
          if (file.children) {
            markOpen(file.children);
          }
        }
      });
    };
    markOpen(files);
    return initOpen;
  });

  const toggleFolder = (path) => {
    setOpenFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderFileTree = (file, level = 0) => {
    const isFolder = file.type === 'folder';
    const isOpen = openFolders[file.path] || false;

    return (
      <div key={file.path}>
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-800/50 cursor-pointer transition-colors ${
            selectedFile?.path === file.path ? 'bg-gray-800' : ''
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
            isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}
          {isFolder ? (
            <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
          ) : (
            <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-300 truncate">{file.name}</span>
        </div>
        {isFolder && isOpen && file.children && (
          <div>
            {file.children.map((child) => renderFileTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-gray-800 bg-[#0f0f0f] overflow-y-auto">
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400">Files</h3>
      </div>
      <div className="py-2">
        {files.map((file) => renderFileTree(file))}
      </div>
    </div>
  );
};

export default FileExplorer;
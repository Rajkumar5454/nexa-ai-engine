import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut, FolderOpen, Clock, Trash2, MessageSquare, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await axios.delete(`${API}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1a] via-[#0f0d24] to-[#0a0a1a]" data-testid="dashboard-page">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2" data-testid="dashboard-logo">
            <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-9 w-auto object-contain" />
            <span className="text-xl font-bold">
              <span className="text-white">Nexa</span>
              <span className="text-gray-400"> AI</span>
            </span>
          </button>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white" data-testid="user-name">{user?.name}</p>
              <p className="text-xs text-gray-400" data-testid="user-credits">{user?.credits} credits</p>
            </div>
            {(user?.email === 'admin@nexaai.live' || user?.email === 'rajkumar@nexaai.live') && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hidden md:flex"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button
              data-testid="logout-btn"
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3" data-testid="projects-heading">
              Your Projects
            </h2>
            <p className="text-gray-400">Build amazing apps with AI</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="new-project-btn"
              onClick={() => navigate('/ide')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full px-8 shadow-lg shadow-purple-600/25 border-0"
            >
              <Zap className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
              New Project
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-projects">
            <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-8">Ready to build the future? Start your first advanced project with Nexa.</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => navigate('/ide')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full px-10 py-6 text-lg shadow-xl shadow-purple-600/30 border-0"
              >
                <Zap className="w-5 h-5 mr-2 text-yellow-400 fill-yellow-400" />
                Start Building
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                data-testid={`project-card-${project.id}`}
                onClick={() => navigate(`/ide?project=${project.id}`)}
                className="bg-white/5 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-white/10 hover:border-violet-500/30 group"
              >
                <div className={`h-32 bg-gradient-to-br ${project.is_v2 ? 'from-purple-600/40 to-blue-600/40' : 'from-violet-600/30 to-blue-600/30'} relative`}>
                  <button
                    data-testid={`delete-project-${project.id}`}
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/20 text-white/70 hover:bg-red-500/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-white mb-2 truncate">{project.name || 'Untitled Project'}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(project.updated_at)}
                    </div>
                    {project.messages && (
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {project.messages.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

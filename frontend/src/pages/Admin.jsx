import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, ArrowLeft, Search, Mail, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { authAPI } from '../services/api';

const Admin = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getAdminUsers();
      setUsers(data.users || []);
      setTotalUsers(data.total_users || 0);
      setError(null);
    } catch (err) {
      console.error('Admin access failed', err);
      setError(err.response?.data?.detail || 'Unauthorized Access');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = (users || []).filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline" className="text-white border-white/20 hover:bg-white/10">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-500" />
              <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full text-[10px] font-bold border border-violet-500/20 uppercase tracking-widest">
                {totalUsers} TOTAL USERS
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-all group">
              <div className="flex items-center gap-3 text-gray-400 mb-2">
                 <Users className="w-4 h-4 group-hover:text-violet-400" />
                 <span className="text-xs font-semibold uppercase tracking-wider">Platform Growth</span>
              </div>
              <div className="text-4xl font-black text-white">{totalUsers}</div>
              <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Total Registered Accounts</div>
           </div>
        </div>

        {/* Search & Table */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
           <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
              <Search className="w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search by name or email..."
                className="bg-transparent border-none focus:ring-0 text-sm flex-1 outline-none text-white placeholder:text-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-black/40 text-gray-500 font-bold uppercase tracking-widest text-[10px] border-b border-white/5">
                    <tr>
                       <th className="px-6 py-4">User Details</th>
                       <th className="px-6 py-4 text-center">Wallet</th>
                       <th className="px-6 py-4">Active Since</th>
                       <th className="px-6 py-4 text-right">Method</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {loading ? (
                       <tr>
                          <td colSpan="4" className="px-6 py-20 text-center">
                             <div className="flex flex-col items-center gap-3">
                                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Fetching user database...</span>
                             </div>
                          </td>
                       </tr>
                    ) : filteredUsers.length === 0 ? (
                       <tr>
                          <td colSpan="4" className="px-6 py-20 text-center text-gray-600 font-medium italic">
                             No users found matching "{searchTerm}"
                          </td>
                       </tr>
                    ) : filteredUsers.map((u, idx) => (
                       <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-700 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-violet-900/20">
                                   {u.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                   <div className="font-bold text-white text-base tracking-tight">{u.name || 'Anonymous User'}</div>
                                   <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                                      <Mail className="w-3 h-3" />
                                      {u.email}
                                   </div>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                <span className="text-amber-500 text-xs">🪙</span>
                                <span className={`font-bold ${u.credits > 0 ? "text-amber-400" : "text-gray-600"}`}>{u.credits}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-2 text-gray-400 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                {u.last_login ? new Date(u.last_login).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                {u.auth_provider || 'Email'}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;

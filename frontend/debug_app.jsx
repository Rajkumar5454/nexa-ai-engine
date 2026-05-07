import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:8000";

const Icon = ({ path, size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const ICONS = {
  overview: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  calendar: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18",
  analytics: "M18 20V10M12 20V4M6 20v-6",
  settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
  sparkles: "M12 3l1.912 5.886H20.1l-4.994 3.635 1.912 5.886L12 14.772l-5.018 3.635 1.912-5.886-4.994-3.635h6.188L12 3z",
  plus: "M12 5v14M5 12h14"
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <motion.div
    whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      borderRadius: '12px',
      cursor: 'pointer',
      color: active ? '#fff' : '#94a3b8',
      background: active ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, transparent 100%)' : 'transparent',
      marginBottom: '8px',
      transition: 'all 0.3s ease'
    }}
  >
    <Icon path={icon} size={20} color={active ? '#6366f1' : '#94a3b8'} />
    <span style={{ fontWeight: active ? '600' : '400', fontSize: '15px' }}>{label}</span>
  </motion.div>
);

const StatCard = ({ label, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      flex: 1,
      background: 'rgba(30, 41, 59, 0.5)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '24px',
      minWidth: '240px'
    }}
  >
    <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
      <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>{value}</div>
      <div style={{ color: color, fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>{trend}</div>
    </div>
  </motion.div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [analytics, setAnalytics] = useState({ followers: 0, engagement: 0, reach: 0 });
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [topic, setTopic] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchScheduled();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      setAnalytics({ followers: "12.5K", engagement: "4.2%", reach: "84.2K" });
    }
  };

  const fetchScheduled = async () => {
    try {
      const res = await fetch(`${API_BASE}/scheduled`);
      const data = await res.json();
      setScheduledPosts(data);
    } catch (e) {
      setScheduledPosts([
        { id: 1, date: 'Today, 4:00 PM', content: 'Top 5 AI tools for designers in 2024...', platform: 'Twitter' },
        { id: 2, date: 'Tomorrow, 10:00 AM', content: 'Why React is still king of the frontend.', platform: 'LinkedIn' },
        { id: 3, date: 'Oct 15, 2:00 PM', content: 'Modern CSS techniques you should know.', platform: 'Instagram' }
      ]);
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      setAiResult(data.content);
    } catch (e) {
      setAiResult(`🚀 Excited to share our latest thoughts on ${topic}! The future is looking bright for innovation. #Tech #Innovation #2024`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '48px', 
          padding: '0 12px' 
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Icon path={ICONS.sparkles} size={20} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>LUMINA AI</span>
        </div>

        <SidebarItem icon={ICONS.overview} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
        <SidebarItem icon={ICONS.calendar} label="Scheduled Posts" active={activeTab === 'Scheduled'} onClick={() => setActiveTab('Scheduled')} />
        <SidebarItem icon={ICONS.analytics} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
        <SidebarItem icon={ICONS.settings} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />

        <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Pro Plan Active</div>
          <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', background: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '8px', fontWeight: '600' }}>750 / 1000 AI Credits</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Welcome back, Alex</h1>
            <p style={{ color: '#94a3b8' }}>Your social presence is growing 12% faster this week.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Icon path={ICONS.plus} size={18} /> New Campaign
          </motion.button>
        </header>

        {/* Stats Grid */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <StatCard label="Total Followers" value={analytics.followers} trend="+2.4%" color="#10b981" />
          <StatCard label="Avg. Engagement" value={analytics.engagement} trend="+0.8%" color="#10b981" />
          <StatCard label="Weekly Reach" value={analytics.reach} trend="-1.2%" color="#ef4444" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
          {/* AI Generator Section */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon path={ICONS.sparkles} size={20} color="#6366f1" /> AI Post Generator
            </h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Topic or Keyword</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Sustainable Fashion Trends 2024"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '24px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Generating Magic...' : 'Generate Premium Content'}
            </motion.button>

            <AnimatePresence>
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    border: '1px dashed rgba(99, 102, 241, 0.3)',
                    position: 'relative'
                  }}
                >
                  <div style={{ color: '#6366f1', fontSize: '12px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>AI Suggestion</div>
                  <p style={{ lineHeight: '1.6', color: '#e2e8f0', margin: 0 }}>{aiResult}</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button style={{ background: 'transparent', border: '1px solid #334155', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
                    <button style={{ background: '#fff', border: 'none', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Schedule Post</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Calendar/Upcoming Section */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Upcoming</h2>
              <span style={{ color: '#6366f1', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>View Calendar</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {scheduledPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>{post.platform}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{post.date}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </p>
                </motion.div>
              ))}
            </div>

            <div style={{ 
              marginTop: '24px', 
              padding: '20px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Weekly Goal</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>8 / 12 Posts</div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '66%' }}
                  transition={{ duration: 1 }}
                  style={{ height: '100%', background: '#6366f1' }} 
                />
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default App;
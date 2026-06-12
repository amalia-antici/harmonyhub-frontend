import { useState } from 'react';
import Navbar from '../components/Navbar';
import AdminActivityDashboard from '../components/AdminActivityDashboard';
import AdminChallengeDashboard from '../components/AdminChallengeDashboard';

const TABS = ['Activity & Logs', 'Challenge of the Week'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh'}}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>

        <h1 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h1>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '0' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid #c9a84c' : '2px solid transparent',
                color: activeTab === i ? '#c9a84c' : '#888',
                fontWeight: activeTab === i ? '700' : '400',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
                marginBottom: '-1px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && <AdminActivityDashboard />}
        {activeTab === 1 && <AdminChallengeDashboard />}
      </div>
    </div>
  );
}
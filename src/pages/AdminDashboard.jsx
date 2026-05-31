import { useEffect, useState } from 'react';
import { getAuditLogs, getObservationList, getAiAnalysis } from '../services/eventServices.jsx';

const AdminDashboard = () => {
  const [logsData, setLogsData] = useState([]);
  const [obsData, setObsData] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [logsResponse, obsResponse] = await Promise.all([
          getAuditLogs(),
          getObservationList(),
        ]);
        if (!mounted) return;
        setLogsData(logsResponse?.allLogs || logsResponse || []);
        setObsData(obsResponse?.observationList || obsResponse || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load admin dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAdminData();
    const interval = setInterval(loadAdminData, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const result = await getAiAnalysis();
      setAiAnalysis(result);
    } catch (err) {
      setAiAnalysis({ analysis: 'AI analysis failed: ' + err.message, totalFlags: 0 });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <p style={{ padding: '20px' }}>Loading admin data...</p>;
  if (error) return <p style={{ padding: '20px', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>

      {/* AI Threat Analysis Section */}
      <div style={{
        marginBottom: '40px', padding: '24px',
        border: '2px solid #722ed1', borderRadius: '8px',
        backgroundColor: '#f9f0ff'
      }}>
        <h2 style={{ color: '#531dab', marginTop: 0 }}>🤖 AI Threat Analysis</h2>
        <p style={{ color: '#555' }}>Click to run an AI-powered analysis of suspicious activity using a local LLM.</p>

        <button
          onClick={handleAiAnalysis}
          disabled={aiLoading}
          style={{
            backgroundColor: '#722ed1', color: 'white',
            border: 'none', padding: '10px 24px',
            borderRadius: '6px', cursor: aiLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px', marginBottom: '16px'
          }}
        >
          {aiLoading ? '🔄 Analyzing...' : '🧠 Run AI Analysis'}
        </button>

        {aiAnalysis && (
          <div style={{
            backgroundColor: 'white', padding: '16px',
            borderRadius: '8px', border: '1px solid #d3adf7'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#531dab' }}>
              Total Flags: {aiAnalysis.totalFlags}
            </p>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
              {aiAnalysis.analysis}
            </p>
          </div>
        )}
      </div>

      {/* Observation List */}
      <div style={{ marginBottom: '50px', padding: '20px', border: '2px solid #ff4d4f', borderRadius: '8px', backgroundColor: '#fff2f0' }}>
        <h2 style={{ color: '#cf1322', marginTop: 0 }}>⚠️ Security Observation List</h2>
        <p style={{ color: '#555' }}>Users flagged for suspicious behavioral patterns (Mass deletions).</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#ff4d4f', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>USER ID</th>
              <th style={{ padding: '12px' }}>DETECTION REASON</th>
              <th style={{ padding: '12px' }}>SEVERITY</th>
              <th style={{ padding: '12px' }}>FLAGGED AT</th>
            </tr>
          </thead>
          <tbody>
            {obsData.map((user) => (
              <tr key={user.id || `${user.userId}-${user.timestamp}`} style={{ borderBottom: '1px solid #ffccc7' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{user.userId}</td>
                <td style={{ padding: '12px' }}>{user.reason}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    color: 'white',
                    backgroundColor: user.severity === 'HIGH' ? '#d4380d' : '#fa8c16',
                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.75em'
                  }}>
                    {user.severity}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  {new Date(user.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {obsData.length === 0 && (
          <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No suspicious activity detected.</p>
        )}
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #eee', marginBottom: '40px' }} />

      {/* Audit Logs */}
      <h2 style={{ color: '#333' }}>System Audit Logs</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        <strong>Infrastructure Status:</strong> Connected to Database Logging Table
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#333', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>USER_ID</th>
            <th style={{ padding: '12px' }}>ROLE</th>
            <th style={{ padding: '12px' }}>ACTION_INFORMATION</th>
            <th style={{ padding: '12px' }}>TIMESTAMP</th>
          </tr>
        </thead>
        <tbody>
          {logsData.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>{log.id}</td>
              <td style={{ padding: '12px' }}>{log.userId}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em',
                  backgroundColor: log.userRole === 'ADMIN' ? '#ffebee' : '#e3f2fd',
                  color: log.userRole === 'ADMIN' ? '#c62828' : '#1565c0'
                }}>
                  {log.userRole}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{log.action}</td>
              <td style={{ padding: '12px', color: '#666', fontSize: '0.9em' }}>
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
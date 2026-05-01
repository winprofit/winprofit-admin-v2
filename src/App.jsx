import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://winprofit-backend-production.up.railway.app/api/admin';

function getHeaders(password) {
  return { 'x-admin-password': password };
}

function fmt(n) { return '$' + Math.round(n || 0).toLocaleString(); }
function pct(n) { return (parseFloat(n) || 0).toFixed(1) + '%'; }

function metricClass(val, goodMax, warnMax) {
  if (!val) return 'metric-na';
  if (val <= goodMax) return 'metric-ok';
  if (val <= warnMax) return 'metric-warn';
  return 'metric-bad';
}

function statusBadge(sub) {
  if (!sub) return <span className="badge badge-trial">No sub</span>;
  if (sub.plan === 'trial' && sub.status === 'active') {
    return <span className="badge badge-trial">Trial {sub.days_left}d left</span>;
  }
  if (sub.plan === 'monthly' && sub.status === 'active') {
    return <span className="badge badge-monthly">Monthly</span>;
  }
  if (sub.plan === 'yearly' && sub.status === 'active') {
    return <span className="badge badge-yearly">Yearly</span>;
  }
  if (sub.status === 'expired') {
    return <span className="badge badge-expired">Expired</span>;
  }
  return <span className="badge badge-trial">{sub.plan}</span>;
}

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.get(`${API_URL}/dashboard`, { headers: getHeaders(password) });
      localStorage.setItem('admin_password', password);
      onLogin(password);
    } catch (err) {
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Win<span>Profit</span></div>
        <div className="auth-sub">Admin dashboard — restricted access</div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Admin password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Access dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ password, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { loadData(selectedMonth); }, []); // eslint-disable-line

  async function loadData(month) {
    const m = month || selectedMonth;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/dashboard?month=${m}`, { headers: getHeaders(password) });
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="app">
      <nav className="topnav">
        <div className="brand">Win<span>Profit</span> <span className="brand-sub">Admin</span></div>
      </nav>
      <div className="loading">Loading dashboard data...</div>
    </div>
  );

  const { summary, restaurants } = data;

  return (
    <div className="app">
      <nav className="topnav">
        <div className="brand">Win<span>Profit</span> <span className="brand-sub">Admin</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: '#444' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button className="refresh-btn" onClick={loadData}>Refresh</button>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      <div className="content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Dashboard</div>
            <div className="topbar-sub">
              {new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="month"
              value={selectedMonth}
              max={new Date().toISOString().slice(0, 7)}
              onChange={e => { setSelectedMonth(e.target.value); loadData(e.target.value); }}
              style={{ background: '#222', border: '1px solid #333', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#ccc', cursor: 'pointer' }}
            />
            {selectedMonth !== new Date().toISOString().slice(0, 7) && (
              <button
                onClick={() => { const m = new Date().toISOString().slice(0, 7); setSelectedMonth(m); loadData(m); }}
                style={{ background: '#222', border: '1px solid #333', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}
              >
                Current month
              </button>
            )}
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">MRR</div>
            <div className="summary-value mrr-value">{fmt(summary.mrr)}</div>
            <div className="summary-sub">Monthly recurring</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total users</div>
            <div className="summary-value">{summary.total_users}</div>
            <div className="summary-sub">All time</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">On trial</div>
            <div className="summary-value">{summary.trial_users}</div>
            <div className="summary-sub">Active trials</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Paid users</div>
            <div className="summary-value">{summary.paid_users}</div>
            <div className="summary-sub">Monthly + yearly</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Expired</div>
            <div className="summary-value">{summary.expired_users}</div>
            <div className="summary-sub">Trial ended</div>
          </div>
        </div>

        <div className="section-title">All restaurants</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Revenue</th>
                <th>Food cost</th>
                <th>Labor</th>
                <th>Net margin</th>
                <th>Days tracked</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }} className="no-data">No users yet</td></tr>
              ) : restaurants.map(r => (
                <tr key={r.id}>
                  <td style={{ color: '#fff', fontWeight: 500 }}>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>{statusBadge(r.subscription)}</td>
                  <td>{r.metrics.total_revenue > 0 ? fmt(r.metrics.total_revenue) : <span className="no-data">No data</span>}</td>
                  <td>
                    {r.metrics.food_cost_pct > 0
                      ? <span className={metricClass(r.metrics.food_cost_pct, 32, 36)}>{pct(r.metrics.food_cost_pct)}</span>
                      : <span className="no-data">--</span>
                    }
                  </td>
                  <td>
                    {r.metrics.labor_pct > 0
                      ? <span className={metricClass(r.metrics.labor_pct, 35, 40)}>{pct(r.metrics.labor_pct)}</span>
                      : <span className="no-data">--</span>
                    }
                  </td>
                  <td>
                    {r.metrics.net_margin_pct !== 0
                      ? <span className={r.metrics.net_margin_pct >= 10 ? 'metric-ok' : r.metrics.net_margin_pct >= 5 ? 'metric-warn' : 'metric-bad'}>{pct(r.metrics.net_margin_pct)}</span>
                      : <span className="no-data">--</span>
                    }
                  </td>
                  <td>{r.metrics.days_tracked > 0 ? r.metrics.days_tracked : <span className="no-data">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [password, setPassword] = useState(() => localStorage.getItem('admin_password') || '');

  function handleLogin(pwd) { setPassword(pwd); }
  function handleLogout() {
    localStorage.removeItem('admin_password');
    setPassword('');
  }

  if (!password) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard password={password} onLogout={handleLogout} />;
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, authService } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, userData] = await Promise.all([
        dashboardService.getStats(),
        authService.getCurrentUser()
      ]);
      setStats(statsData);
      setUser(userData);
    } catch (err) {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!stats) return <div className="container">Carregando...</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>Dashboard - FeedAz</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={toggleDarkMode} 
            className="btn btn-secondary"
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <span style={{ color: '#6c757d' }}>Olá, <strong>{user?.nome}</strong></span>
          <button onClick={handleLogout} className="btn btn-danger">Sair</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {user?.perfil === 'admin' && (
          <>
            <button onClick={() => navigate('/users')} className="btn btn-warning">👥 Usuários</button>
            <button onClick={() => navigate('/areas')} className="btn" style={{ background: '#6f42c1', color: 'white' }}>📍 Áreas</button>
          </>
        )}
        <button onClick={() => navigate('/employees')} className="btn btn-primary">👤 Funcionários</button>
        <button onClick={() => navigate('/indicators')} className="btn btn-success">📊 Indicadores</button>
        <button onClick={() => navigate('/feedbacks')} className="btn btn-info">📝 Feedbacks</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #0066cc' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total de Funcionários</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0066cc', margin: 0 }}>{stats.total_employees}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #28a745' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total de Feedbacks</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#28a745', margin: 0 }}>{stats.total_feedbacks}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ffc107' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Pendentes de Assinatura</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ffc107', margin: 0 }}>{stats.pending_signatures}</p>
        </div>
      </div>

      {stats.employees_without_feedback_this_month.length > 0 && (
        <div style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ffc107', borderLeft: '4px solid #ffc107' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Alertas - Funcionários sem feedback este mês
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {stats.employees_without_feedback_this_month.map((emp: any) => (
              <li key={emp.id} style={{ marginBottom: '0.5rem', color: '#856404' }}>
                <strong>{emp.nome}</strong> - {emp.area}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

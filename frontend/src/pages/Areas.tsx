import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Areas() {
  const [areas, setAreas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [areasData, userData] = await Promise.all([
        api.get('/areas'),
        api.get('/me')
      ]);
      setAreas(areasData.data);
      setCurrentUser(userData.data);
      
      if (userData.data.perfil !== 'admin') {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/areas', formData);
      setShowForm(false);
      setFormData({ nome: '', descricao: '' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao criar área');
    }
  };

  const handleDelete = async (areaId: number) => {
    if (confirm('Deseja realmente excluir esta área?')) {
      try {
        await api.delete(`/areas/${areaId}`);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Erro ao excluir área');
      }
    }
  };

  if (!currentUser || currentUser.perfil !== 'admin') {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Gerenciar Áreas</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Voltar</button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-success">
            {showForm ? 'Cancelar' : '+ Nova Área'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Cadastrar Nova Área</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome da Área</label>
              <input 
                type="text" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                className="form-control" 
                placeholder="Ex: CS, Suporte, Implantação"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea 
                value={formData.descricao} 
                onChange={(e) => setFormData({...formData, descricao: e.target.value})} 
                className="form-control" 
                style={{ minHeight: '80px' }}
                placeholder="Descrição opcional da área"
              />
            </div>
            <button type="submit" className="btn btn-primary">Criar Área</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Áreas Cadastradas</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id}>
                <td><strong>{area.nome}</strong></td>
                <td>{area.descricao || '-'}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(area.id)} 
                    className="btn btn-danger" 
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {areas.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  Nenhuma área cadastrada. Clique em "Nova Área" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

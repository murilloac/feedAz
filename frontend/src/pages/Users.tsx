import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PERGUNTAS_SECRETAS = [
  'Qual foi o nome do seu primeiro animal de estimação?',
  'Em que cidade sua mãe nasceu?',
  'Qual era o apelido que sua família usava para você na infância?',
  'Qual foi o modelo do seu primeiro carro ou moto?',
  'Qual era o nome da sua escola no ensino fundamental?'
];

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', area: [] as string[], pergunta_secreta: '', resposta_secreta: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, userData, areasData] = await Promise.all([
        api.get('/users'),
        api.get('/me'),
        api.get('/areas')
      ]);
      setUsers(usersData.data);
      setCurrentUser(userData.data);
      setAreas(areasData.data);
      
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
      const userData = {
        nome: formData.nome,
        email: formData.email,
        area: formData.area.join(', '),
        ...(formData.senha && { senha: formData.senha }),
        ...(formData.pergunta_secreta && { pergunta_secreta: formData.pergunta_secreta }),
        ...(formData.resposta_secreta && { resposta_secreta: formData.resposta_secreta })
      };
      
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userData);
      } else {
        await api.post('/users', { ...userData, senha: formData.senha });
      }
      
      setShowForm(false);
      setEditingUser(null);
      setFormData({ nome: '', email: '', senha: '', area: [], pergunta_secreta: '', resposta_secreta: '' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    const userAreas = user.area ? user.area.split(',').map((a: string) => a.trim()) : [];
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      area: userAreas,
      pergunta_secreta: user.pergunta_secreta || '',
      resposta_secreta: ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ nome: '', email: '', senha: '', area: [], pergunta_secreta: '', resposta_secreta: '' });
  };

  const handleAreaToggle = (areaName: string) => {
    setFormData(prev => ({
      ...prev,
      area: prev.area.includes(areaName)
        ? prev.area.filter(a => a !== areaName)
        : [...prev.area, areaName]
    }));
  };

  const handleDelete = async (userId: number) => {
    if (confirm('Deseja realmente excluir este usuário?')) {
      try {
        await api.delete(`/users/${userId}`);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Erro ao excluir usuário');
      }
    }
  };

  if (!currentUser || currentUser.perfil !== 'admin') {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Gerenciar Usuários</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Voltar</button>
          <button onClick={() => { setShowForm(!showForm); setEditingUser(null); setFormData({ nome: '', email: '', senha: '', area: [], pergunta_secreta: '', resposta_secreta: '' }); }} className="btn btn-success">
            {showForm ? 'Cancelar' : '+ Novo Usuário'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>{editingUser ? 'Editar Líder' : 'Criar Novo Líder'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Áreas (selecione uma ou mais)</label>
              <div style={{ border: '1px solid #dee2e6', borderRadius: '6px', padding: '1rem', background: '#f8f9fa' }}>
                {areas.map((area) => (
                  <div key={area.id} style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.area.includes(area.nome)}
                        onChange={() => handleAreaToggle(area.nome)}
                        style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>{area.nome}</span>
                      {area.descricao && <span style={{ marginLeft: '0.5rem', color: '#6c757d', fontSize: '0.875rem' }}>- {area.descricao}</span>}
                    </label>
                  </div>
                ))}
                {areas.length === 0 && (
                  <p style={{ color: '#6c757d', margin: 0 }}>Nenhuma área cadastrada. <a href="/areas" style={{ color: '#0066cc' }}>Cadastre áreas primeiro</a>.</p>
                )}
              </div>
              {formData.area.length === 0 && (
                <small style={{ color: '#dc3545', fontSize: '0.875rem' }}>Selecione pelo menos uma área</small>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Senha {editingUser && '(deixe em branco para manter a atual)'}</label>
              <input type="password" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} className="form-control" required={!editingUser} />
            </div>
            <div className="form-group">
              <label className="form-label">Pergunta Secreta (para recuperação de senha)</label>
              <select 
                value={formData.pergunta_secreta} 
                onChange={(e) => setFormData({...formData, pergunta_secreta: e.target.value})} 
                className="form-control"
              >
                <option value="">Selecione uma pergunta</option>
                {PERGUNTAS_SECRETAS.map((pergunta, index) => (
                  <option key={index} value={pergunta}>{pergunta}</option>
                ))}
              </select>
              <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>Esta pergunta será usada para recuperar a senha</small>
            </div>
            <div className="form-group">
              <label className="form-label">Resposta Secreta {editingUser && '(deixe em branco para manter a atual)'}</label>
              <input type="password" value={formData.resposta_secreta} onChange={(e) => setFormData({...formData, resposta_secreta: e.target.value})} className="form-control" placeholder="Digite a resposta da pergunta secreta" />
              <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>A resposta será criptografada e usada para validar a recuperação de senha</small>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={formData.area.length === 0}>Salvar</button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Usuários Cadastrados</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Área</th>
              <th>Perfil</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.nome}</td>
                <td>{user.email}</td>
                <td>{user.area ? <span className="badge badge-info">{user.area}</span> : '-'}</td>
                <td>
                  <span className={user.perfil === 'admin' ? 'badge badge-warning' : 'badge badge-success'}>
                    {user.perfil === 'admin' ? 'Administrador' : 'Líder'}
                  </span>
                </td>
                <td>
                  {user.perfil !== 'admin' && (
                    <>
                      <button onClick={() => handleEdit(user)} className="btn btn-warning" style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>Editar</button>
                      <button onClick={() => handleDelete(user.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>Excluir</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

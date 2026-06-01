import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService, authService } from '../services/api';
import api from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Toast from '../components/Toast';
import Tooltip from '../components/Tooltip';
import { useToast } from '../hooks/useToast';

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: '', area: '', cargo: '', data_admissao: '', senha_assinatura: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'nome' | 'area' | 'cargo' | 'data_admissao'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toasts, showToast, removeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, userData, areasData] = await Promise.all([
        employeeService.list(),
        authService.getCurrentUser(),
        api.get('/areas')
      ]);
      setEmployees(employeesData);
      setCurrentUser(userData);
      setAreas(areasData.data);
      
      // Se for líder, pré-seleciona sua área
      if (userData.perfil === 'lider' && userData.area) {
        const userAreas = userData.area.split(',').map((a: string) => a.trim());
        if (userAreas.length === 1) {
          setFormData(prev => ({ ...prev, area: userAreas[0] }));
        }
      }
    } catch (err) {
      showToast('Erro ao carregar dados', 'error');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, formData);
      } else {
        await employeeService.create(formData);
      }
      setShowForm(false);
      setEditingEmployee(null);
      setFormData({ nome: '', area: currentUser?.perfil === 'lider' ? currentUser.area : '', cargo: '', data_admissao: '', senha_assinatura: '' });
      loadData();
      showToast(editingEmployee ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erro ao salvar funcionário', 'error');
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      nome: employee.nome,
      area: employee.area,
      cargo: employee.cargo || '',
      data_admissao: employee.data_admissao || '',
      senha_assinatura: ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    const defaultArea = currentUser?.perfil === 'lider' && currentUser.area ? currentUser.area.split(',').map((a: string) => a.trim())[0] : '';
    setFormData({ nome: '', area: defaultArea, cargo: '', data_admissao: '', senha_assinatura: '' });
  };

  const handleDelete = async (employeeId: number) => {
    if (confirm('Deseja realmente excluir este funcionário?')) {
      try {
        await employeeService.delete(employeeId);
        loadData();
        showToast('Funcionário excluído com sucesso!', 'success');
      } catch (err: any) {
        showToast(err.response?.data?.detail || 'Erro ao excluir funcionário', 'error');
      }
    }
  };

  const handleSort = (field: 'nome' | 'area' | 'cargo' | 'data_admissao') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter(emp => 
      emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.cargo && emp.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'data_admissao') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, searchTerm, sortField, sortOrder]);

  const isAreaDisabled = currentUser?.perfil === 'lider';
  
  const getAvailableAreas = () => {
    if (currentUser?.perfil === 'admin') {
      return areas;
    }
    if (currentUser?.perfil === 'lider' && currentUser.area) {
      const userAreaNames = currentUser.area.split(',').map((a: string) => a.trim());
      return areas.filter(area => userAreaNames.includes(area.nome));
    }
    return [];
  };

  return (
    <div className="container">
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <Breadcrumbs items={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Funcionários' }
      ]} />

      <div className="header">
        <h1>Funcionários</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Voltar</button>
          <button onClick={() => { setShowForm(!showForm); setEditingEmployee(null); setFormData({ nome: '', area: '', cargo: '', senha_assinatura: '' }); }} className="btn btn-success">
            {showForm ? 'Cancelar' : '+ Novo Funcionário'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>{editingEmployee ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Área</label>
              <select 
                value={formData.area} 
                onChange={(e) => setFormData({...formData, area: e.target.value})} 
                className="form-control" 
                required
              >
                <option value="">Selecione</option>
                {getAvailableAreas().map((area) => (
                  <option key={area.id} value={area.nome}>{area.nome}</option>
                ))}
              </select>
              {isAreaDisabled && (
                <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>Você só pode cadastrar funcionários das suas áreas</small>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <input type="text" value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Admissão</label>
              <input type="date" value={formData.data_admissao} onChange={(e) => setFormData({...formData, data_admissao: e.target.value})} className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Senha de Assinatura {editingEmployee && '(deixe em branco para manter a atual)'}</label>
              <input type="password" value={formData.senha_assinatura} onChange={(e) => setFormData({...formData, senha_assinatura: e.target.value})} className="form-control" required={!editingEmployee} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Salvar</button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#0066cc', margin: 0 }}>Lista de Funcionários</h2>
          <div className="search-box" style={{ width: '300px' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nome, área ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th className={`sortable ${sortField === 'nome' ? sortOrder : ''}`} onClick={() => handleSort('nome')}>
                Nome
              </th>
              <th className={`sortable ${sortField === 'area' ? sortOrder : ''}`} onClick={() => handleSort('area')}>
                Área
              </th>
              <th className={`sortable ${sortField === 'cargo' ? sortOrder : ''}`} onClick={() => handleSort('cargo')}>
                Cargo
              </th>
              <th className={`sortable ${sortField === 'data_admissao' ? sortOrder : ''}`} onClick={() => handleSort('data_admissao')}>
                Data Admissão
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                </td>
              </tr>
            ) : (
              filteredAndSortedEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.nome}</td>
                  <td><span className="badge badge-info">{emp.area}</span></td>
                  <td>{emp.cargo || '-'}</td>
                  <td>{emp.data_admissao ? new Date(emp.data_admissao).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>
                    <Tooltip text="Editar informações do funcionário">
                      <button onClick={() => handleEdit(emp)} className="btn btn-warning" style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>Editar</button>
                    </Tooltip>
                    <Tooltip text="Ver feedbacks do funcionário">
                      <button onClick={() => navigate(`/feedbacks?employee=${emp.id}`)} className="btn btn-info" style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>Feedbacks</button>
                    </Tooltip>
                    <Tooltip text="Excluir funcionário">
                      <button onClick={() => handleDelete(emp.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>Excluir</button>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { indicatorService } from '../services/api';
import api from '../services/api';

export default function Indicators() {
  const [indicators, setIndicators] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: '', area: '', descricao: '', meta: '', campo_vinculado: 'INDICADORES' });
  const [filterArea, setFilterArea] = useState('');
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadIndicators();
    loadAreas();
  }, [filterArea]);

  const loadAreas = async () => {
    try {
      const response = await api.get('/areas');
      setAreas(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadIndicators = async () => {
    try {
      const data = await indicatorService.list(filterArea || undefined);
      setIndicators(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        area: selectedAreas.join(', ')
      };
      
      if (editingIndicator) {
        await indicatorService.update(editingIndicator.id, dataToSend);
      } else {
        await indicatorService.create(dataToSend);
      }
      setShowForm(false);
      setEditingIndicator(null);
      setFormData({ nome: '', area: '', descricao: '', meta: '', campo_vinculado: 'INDICADORES' });
      setSelectedAreas([]);
      loadIndicators();
    } catch (err) {
      alert('Erro ao salvar indicador');
    }
  };

  const handleEdit = (indicator: any) => {
    setEditingIndicator(indicator);
    setFormData({
      nome: indicator.nome,
      area: indicator.area,
      descricao: indicator.descricao || '',
      meta: indicator.meta || '',
      campo_vinculado: indicator.campo_vinculado || 'INDICADORES'
    });
    // Separar áreas para edição
    const areasArray = indicator.area ? indicator.area.split(',').map((a: string) => a.trim()) : [];
    setSelectedAreas(areasArray);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este indicador?')) {
      try {
        await indicatorService.delete(id);
        loadIndicators();
      } catch (err) {
        alert('Erro ao excluir indicador');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIndicator(null);
    setFormData({ nome: '', area: '', descricao: '', meta: '', campo_vinculado: 'INDICADORES' });
    setSelectedAreas([]);
  };

  const toggleArea = (areaName: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaName) 
        ? prev.filter(a => a !== areaName)
        : [...prev, areaName]
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Indicadores</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Voltar</button>
          <button onClick={() => { setShowForm(!showForm); setEditingIndicator(null); setFormData({ nome: '', area: '', descricao: '', meta: '', campo_vinculado: 'INDICADORES' }); setSelectedAreas([]); }} className="btn btn-success">
            {showForm ? 'Cancelar' : '+ Novo Indicador'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Filtrar por área:</label>
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="form-control" style={{ maxWidth: '300px' }}>
          <option value="">Todas as áreas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.nome}>{area.nome}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>{editingIndicator ? 'Editar Indicador' : 'Cadastrar Indicador'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome do Indicador</label>
              <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Áreas (selecione uma ou mais)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {areas.map((area) => (
                  <label key={area.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: selectedAreas.includes(area.nome) ? '#0066cc' : 'white', color: selectedAreas.includes(area.nome) ? 'white' : 'black' }}>
                    <input
                      type="checkbox"
                      checked={selectedAreas.includes(area.nome)}
                      onChange={() => toggleArea(area.nome)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {area.nome}
                  </label>
                ))}
              </div>
              {selectedAreas.length === 0 && (
                <small style={{ color: '#dc3545', fontSize: '0.875rem' }}>Selecione pelo menos uma área</small>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Meta</label>
              <input type="text" value={formData.meta} onChange={(e) => setFormData({...formData, meta: e.target.value})} className="form-control" placeholder="Ex: 95%, 100 tickets, etc." />
            </div>
            <div className="form-group">
              <label className="form-label">Campo Vinculado no Feedback</label>
              <select 
                value={formData.campo_vinculado} 
                onChange={(e) => setFormData({...formData, campo_vinculado: e.target.value})} 
                className="form-control" 
                required
              >
                <option value="INDICADORES">Indicadores (padrão)</option>
                <option value="ASSIDUIDADE">Assiduidade</option>
                <option value="ADERENCIA">Aderência</option>
              </select>
              <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                Define em qual campo do feedback este indicador será exibido
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="form-control" style={{ minHeight: '100px' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={selectedAreas.length === 0}>Salvar</button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Lista de Indicadores</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Área</th>
              <th>Meta</th>
              <th>Campo Vinculado</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind) => (
              <tr key={ind.id}>
                <td><strong>{ind.nome}</strong></td>
                <td><span className="badge badge-info">{ind.area}</span></td>
                <td>{ind.meta ? <span className="badge badge-success">{ind.meta}</span> : '-'}</td>
                <td>
                  <span className="badge" style={{ 
                    background: ind.campo_vinculado === 'ASSIDUIDADE' ? '#ffc107' : 
                               ind.campo_vinculado === 'ADERENCIA' ? '#17a2b8' : '#28a745' 
                  }}>
                    {ind.campo_vinculado || 'INDICADORES'}
                  </span>
                </td>
                <td>{ind.descricao}</td>
                <td>
                  <button onClick={() => handleEdit(ind)} className="btn btn-warning" style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>Editar</button>
                  <button onClick={() => handleDelete(ind.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

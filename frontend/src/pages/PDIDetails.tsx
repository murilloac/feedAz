import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

export default function PDIDetails() {
  const { pdiId } = useParams()
  const [pdi, setPdi] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    objetivo: '',
    prazo: '',
    status: '',
    progresso: 0,
    observacoes: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadPDI()
  }, [pdiId])

  const loadPDI = async () => {
    try {
      const response = await api.get(`/pdis/${pdiId}`)
      setPdi(response.data)
      setFormData({
        titulo: response.data.titulo,
        descricao: response.data.descricao || '',
        objetivo: response.data.objetivo || '',
        prazo: response.data.prazo || '',
        status: response.data.status,
        progresso: response.data.progresso,
        observacoes: response.data.observacoes || ''
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert('PDI não encontrado')
        navigate('/dashboard')
      }
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put(`/pdis/${pdiId}`, formData)
      setEditMode(false)
      loadPDI()
      alert('PDI atualizado com sucesso!')
    } catch (err) {
      alert('Erro ao atualizar PDI')
    }
  }

  const toggleAction = async (actionId: number, concluida: boolean) => {
    try {
      await api.put(`/pdis/actions/${actionId}?concluida=${!concluida}`)
      loadPDI()
    } catch (err) {
      alert('Erro ao atualizar ação')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      EM_ANDAMENTO: { class: 'badge-warning', text: '⏳ Em Andamento' },
      CONCLUIDO: { class: 'badge-success', text: '✓ Concluído' },
      CANCELADO: { class: 'badge', text: '✗ Cancelado' }
    }
    const badge = badges[status] || { class: 'badge', text: status }
    return <span className={badge.class}>{badge.text}</span>
  }

  const getProgressColor = (progresso: number) => {
    if (progresso >= 80) return '#28a745'
    if (progresso >= 50) return '#ffc107'
    return '#dc3545'
  }

  if (!pdi) return <div className="container">Carregando...</div>

  return (
    <div className="container">
      <div className="header">
        <h1>📋 Detalhes do PDI</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate(`/performance/evolution/${pdi.employee_id}`)} className="btn btn-secondary">
            Voltar
          </button>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn btn-primary">
              ✎ Editar
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ color: '#0066cc', margin: 0 }}>{pdi.titulo}</h2>
            <p style={{ color: '#6c757d', margin: '0.5rem 0 0 0' }}>
              Colaborador: <strong>{pdi.employee_nome}</strong>
            </p>
          </div>
          {getStatusBadge(pdi.status)}
        </div>

        {!editMode ? (
          <>
            {pdi.descricao && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#0066cc', marginBottom: '0.5rem' }}>Descrição</h3>
                <p style={{ margin: 0, color: '#6c757d' }}>{pdi.descricao}</p>
              </div>
            )}

            {pdi.objetivo && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#0066cc', marginBottom: '0.5rem' }}>Objetivo</h3>
                <p style={{ margin: 0, color: '#6c757d' }}>{pdi.objetivo}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {pdi.prazo && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Prazo</h3>
                  <p style={{ margin: 0, fontWeight: '600' }}>
                    {new Date(pdi.prazo).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Criado em</h3>
                <p style={{ margin: 0, fontWeight: '600' }}>
                  {new Date(pdi.data_criacao).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {pdi.data_conclusao && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Concluído em</h3>
                  <p style={{ margin: 0, fontWeight: '600' }}>
                    {new Date(pdi.data_conclusao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#0066cc', marginBottom: '0.5rem' }}>
                Progresso: {pdi.progresso}%
              </h3>
              <div style={{ width: '100%', height: '20px', background: '#e9ecef', borderRadius: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pdi.progresso}%`,
                    height: '100%',
                    background: getProgressColor(pdi.progresso),
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {pdi.observacoes && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#0066cc', marginBottom: '0.5rem' }}>Observações</h3>
                <p style={{ margin: 0, color: '#6c757d' }}>{pdi.observacoes}</p>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="form-control"
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Objetivo</label>
              <textarea
                value={formData.objetivo}
                onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                className="form-control"
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prazo</label>
              <input
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-control"
              >
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Progresso (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progresso}
                onChange={(e) => setFormData({ ...formData, progresso: parseInt(e.target.value) })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="form-control"
                style={{ minHeight: '100px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-success">
                Salvar Alterações
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Ações do PDI</h2>
        {!pdi.acoes || pdi.acoes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
            Nenhuma ação definida
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pdi.acoes.map((acao: any) => (
              <div
                key={acao.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  background: acao.concluida ? '#d4edda' : '#fff'
                }}
              >
                <input
                  type="checkbox"
                  checked={acao.concluida}
                  onChange={() => toggleAction(acao.id, acao.concluida)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, textDecoration: acao.concluida ? 'line-through' : 'none' }}>
                    {acao.acao}
                  </p>
                  {acao.descricao && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
                      {acao.descricao}
                    </p>
                  )}
                  {acao.data_conclusao && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#28a745' }}>
                      ✓ Concluída em {new Date(acao.data_conclusao).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

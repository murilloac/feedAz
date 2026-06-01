import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

export default function PerformanceEvolution() {
  const { employeeId } = useParams()
  const [data, setData] = useState<any>(null)
  const [showPDIForm, setShowPDIForm] = useState(false)
  const [pdis, setPdis] = useState<any[]>([])
  const [pdiForm, setPdiForm] = useState({
    titulo: '',
    descricao: '',
    objetivo: '',
    prazo: '',
    acoes: ['']
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [employeeId])

  const loadData = async () => {
    try {
      const [evolutionData, pdisData] = await Promise.all([
        api.get(`/performance/evolution/${employeeId}`).then(r => r.data),
        api.get(`/pdis?employee_id=${employeeId}`).then(r => r.data)
      ])
      setData(evolutionData)
      setPdis(pdisData)
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert('Funcionário não encontrado')
        navigate('/employees')
      }
    }
  }

  const handleCreatePDI = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/pdis', {
        employee_id: parseInt(employeeId!),
        titulo: pdiForm.titulo,
        descricao: pdiForm.descricao,
        objetivo: pdiForm.objetivo,
        prazo: pdiForm.prazo || null,
        acoes: pdiForm.acoes.filter(a => a.trim()).map(a => ({ acao: a }))
      })
      setShowPDIForm(false)
      setPdiForm({ titulo: '', descricao: '', objetivo: '', prazo: '', acoes: [''] })
      loadData()
      alert('PDI criado com sucesso!')
    } catch (err) {
      alert('Erro ao criar PDI')
    }
  }

  const addAcao = () => {
    setPdiForm({ ...pdiForm, acoes: [...pdiForm.acoes, ''] })
  }

  const updateAcao = (index: number, value: string) => {
    const newAcoes = [...pdiForm.acoes]
    newAcoes[index] = value
    setPdiForm({ ...pdiForm, acoes: newAcoes })
  }

  const removeAcao = (index: number) => {
    setPdiForm({ ...pdiForm, acoes: pdiForm.acoes.filter((_, i) => i !== index) })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#28a745'
    if (score >= 70) return '#ffc107'
    return '#dc3545'
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

  if (!data) return <div className="container">Carregando...</div>

  return (
    <div className="container">
      <div className="header">
        <h1>📈 Evolução de Performance</h1>
        <button onClick={() => navigate('/employees')} className="btn btn-secondary">
          Voltar
        </button>
      </div>

      <div className="card">
        <h2 style={{ color: '#0066cc', marginBottom: '0.5rem' }}>{data.nome}</h2>
        <p style={{ color: '#6c757d', margin: 0 }}>
          {data.cargo || 'Sem cargo'} • {data.area}
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#0066cc', margin: 0 }}>Histórico de Performance</h2>
          <button onClick={() => setShowPDIForm(!showPDIForm)} className="btn btn-success">
            {showPDIForm ? 'Cancelar' : '+ Criar PDI'}
          </button>
        </div>

        {data.evolution.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
            Nenhum feedback com indicadores encontrado
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.evolution.map((item: any) => (
              <div
                key={item.feedback_id}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '1rem',
                  background: '#f8f9fa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#0066cc' }}>
                      {new Date(item.data_feedback).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
                      {new Date(item.data_feedback).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: getScoreColor(item.score_medio) }}>
                      {item.score_medio || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>score médio</div>
                  </div>
                </div>

                <table className="table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Valor</th>
                      <th>Meta</th>
                      <th>Atingimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.indicadores.map((ind: any, idx: number) => (
                      <tr key={idx}>
                        <td>{ind.nome}</td>
                        <td>{ind.valor}</td>
                        <td>{ind.meta || '-'}</td>
                        <td>
                          {ind.percentual ? (
                            <span style={{ color: getScoreColor(ind.percentual), fontWeight: '600' }}>
                              {ind.percentual}%
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPDIForm && (
        <div className="card" style={{ background: '#e7f3ff', border: '2px solid #0066cc' }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Criar PDI</h2>
          <form onSubmit={handleCreatePDI}>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input
                type="text"
                value={pdiForm.titulo}
                onChange={(e) => setPdiForm({ ...pdiForm, titulo: e.target.value })}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea
                value={pdiForm.descricao}
                onChange={(e) => setPdiForm({ ...pdiForm, descricao: e.target.value })}
                className="form-control"
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Objetivo</label>
              <textarea
                value={pdiForm.objetivo}
                onChange={(e) => setPdiForm({ ...pdiForm, objetivo: e.target.value })}
                className="form-control"
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prazo</label>
              <input
                type="date"
                value={pdiForm.prazo}
                onChange={(e) => setPdiForm({ ...pdiForm, prazo: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ações</label>
              {pdiForm.acoes.map((acao, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={acao}
                    onChange={(e) => updateAcao(index, e.target.value)}
                    className="form-control"
                    placeholder="Descreva uma ação..."
                  />
                  {pdiForm.acoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAcao(index)}
                      className="btn btn-danger"
                      style={{ padding: '0.625rem 1rem' }}
                    >
                      ✗
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addAcao} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                + Adicionar Ação
              </button>
            </div>

            <button type="submit" className="btn btn-primary">
              Criar PDI
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>PDIs (Planos de Desenvolvimento)</h2>
        {pdis.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
            Nenhum PDI criado ainda
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pdis.map((pdi: any) => (
              <div
                key={pdi.id}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/pdis/${pdi.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{pdi.titulo}</h3>
                  {getStatusBadge(pdi.status)}
                </div>
                {pdi.descricao && (
                  <p style={{ margin: '0.5rem 0', color: '#6c757d', fontSize: '0.875rem' }}>
                    {pdi.descricao}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
                  {pdi.prazo && (
                    <span>📅 Prazo: {new Date(pdi.prazo).toLocaleDateString('pt-BR')}</span>
                  )}
                  <span>📊 Progresso: {pdi.progresso}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

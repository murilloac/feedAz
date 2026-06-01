import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { feedbackService, employeeService, indicatorService, authService } from '../services/api'
import api from '../services/api'

export default function Feedbacks() {
  const [searchParams] = useSearchParams()
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [indicators, setIndicators] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [signPassword, setSignPassword] = useState('')
  const [signComment, setSignComment] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [indicatorValues, setIndicatorValues] = useState<{ [key: number]: string }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [formData, setFormData] = useState({
    funcionario_id: 0,
    data_feedback: new Date().toISOString().split('T')[0],
    tipo_feedback: 'MENSAL',
    periodo_avaliado: '',
    motivo_feedback: '',
    descricao_feedback: '',
    assiduidade: '',
    aderencia: '',
    pontos_positivos: '',
    melhorias: '',
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [searchParams])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterStatus, feedbacks])

  const applyFilters = () => {
    let filtered = [...feedbacks]

    if (searchTerm) {
      filtered = filtered.filter((fb) => {
        const employee = employees.find((e) => e.id === fb.funcionario_id)
        return employee?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    if (filterStatus === 'assinado') {
      filtered = filtered.filter((fb) => fb.assinado)
    } else if (filterStatus === 'pendente') {
      filtered = filtered.filter((fb) => !fb.assinado)
    }

    setFilteredFeedbacks(filtered)
  }

  const loadData = async () => {
    try {
      const employeeId = searchParams.get('employee')
      const [feedbacksData, employeesData, userData] = await Promise.all([
        feedbackService.list(employeeId ? parseInt(employeeId) : undefined),
        employeeService.list(),
        authService.getCurrentUser()
      ])
      setFeedbacks(feedbacksData)
      setFilteredFeedbacks(feedbacksData)
      setEmployees(employeesData)
      setCurrentUser(userData)
      if (employeeId) {
        const emp = employeesData.find((e: any) => e.id === parseInt(employeeId))
        if (emp) {
          handleEmployeeChange(parseInt(employeeId), employeesData)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEmployeeChange = async (employeeId: number, employeesList?: any[]) => {
    const empList = employeesList || employees
    const employee = empList.find((e: any) => e.id === employeeId)
    if (employee) {
      setSelectedEmployee(employee)
      setFormData({ ...formData, funcionario_id: employeeId })

      try {
        const indicatorsData = await indicatorService.list(employee.area)
        setIndicators(indicatorsData)
        const initialValues: { [key: number]: string } = {}
        indicatorsData.forEach((ind: any) => {
          initialValues[ind.id] = ''
        })
        setIndicatorValues(initialValues)
        
        // Preencher campos de assiduidade e aderência com indicadores vinculados
        const assiduidadeIndicators = indicatorsData.filter((ind: any) => ind.campo_vinculado === 'ASSIDUIDADE')
        const aderenciaIndicators = indicatorsData.filter((ind: any) => ind.campo_vinculado === 'ADERENCIA')
        
        if (assiduidadeIndicators.length > 0) {
          const assiduidadeText = assiduidadeIndicators.map((ind: any) => 
            `${ind.nome}${ind.meta ? ` (Meta: ${ind.meta})` : ''}: `
          ).join('\n')
          setFormData(prev => ({ ...prev, assiduidade: assiduidadeText }))
        }
        
        if (aderenciaIndicators.length > 0) {
          const aderenciaText = aderenciaIndicators.map((ind: any) => 
            `${ind.nome}${ind.meta ? ` (Meta: ${ind.meta})` : ''}: `
          ).join('\n')
          setFormData(prev => ({ ...prev, aderencia: aderenciaText }))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let feedbackData: any = {
        funcionario_id: formData.funcionario_id,
        data_feedback: formData.data_feedback,
        tipo_feedback: formData.tipo_feedback,
      }

      if (formData.tipo_feedback === 'PONTUAL') {
        // Feedback Pontual: apenas motivo, descrição e comentário
        feedbackData.motivo_feedback = formData.motivo_feedback
        feedbackData.descricao_feedback = formData.descricao_feedback
        feedbackData.indicadores_valores = JSON.stringify([])
        feedbackData.periodo_avaliado = ''
        feedbackData.assiduidade = ''
        feedbackData.aderencia = ''
        feedbackData.pontos_positivos = ''
        feedbackData.melhorias = ''
      } else {
        // Feedback Mensal: campos completos
        feedbackData.periodo_avaliado = formData.periodo_avaliado
        feedbackData.motivo_feedback = ''
        feedbackData.descricao_feedback = ''
        feedbackData.assiduidade = formData.assiduidade
        feedbackData.aderencia = formData.aderencia
        feedbackData.pontos_positivos = formData.pontos_positivos
        feedbackData.melhorias = formData.melhorias
        
        let indicadoresValoresJson = ''
        if (indicators.length > 0) {
          indicadoresValoresJson = JSON.stringify(
            indicators.map((ind) => ({
              indicator_id: ind.id,
              indicator_nome: ind.nome,
              indicator_meta: ind.meta,
              valor: indicatorValues[ind.id] || '',
            })),
          )
        } else {
          indicadoresValoresJson = JSON.stringify([{
            indicator_id: 0,
            indicator_nome: 'Indicadores Gerais',
            indicator_meta: '',
            valor: indicatorValues[0] || ''
          }])
        }
        feedbackData.indicadores_valores = indicadoresValoresJson
      }

      await feedbackService.create(feedbackData)

      setShowForm(false)
      setSelectedEmployee(null)
      setIndicators([])
      setIndicatorValues({})
      setFormData({
        funcionario_id: 0,
        data_feedback: new Date().toISOString().split('T')[0],
        tipo_feedback: 'MENSAL',
        periodo_avaliado: '',
        motivo_feedback: '',
        descricao_feedback: '',
        assiduidade: '',
        aderencia: '',
        pontos_positivos: '',
        melhorias: '',
      })
      loadData()
      alert('Feedback criado com sucesso!')
    } catch (err) {
      alert('Erro ao criar feedback')
    }
  }

  const handleSign = async () => {
    try {
      await feedbackService.sign(selectedFeedback.id, {
        senha_assinatura: signPassword,
        comentario_colaborador: signComment,
      })
      setShowSignModal(false)
      setSignPassword('')
      setSignComment('')
      setSelectedFeedback(null)
      loadData()
      alert('Feedback assinado com sucesso!')
    } catch (err) {
      alert('Senha incorreta')
    }
  }

  const handleDownloadPDF = async (id: number) => {
    try {
      await feedbackService.downloadPDF(id)
    } catch (err) {
      alert('Erro ao baixar PDF')
    }
  }

  const handleDelete = async (feedbackId: number) => {
    if (confirm('Deseja realmente excluir este feedback?')) {
      try {
        await api.delete(`/feedbacks/${feedbackId}`)
        loadData()
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Erro ao excluir feedback')
      }
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Feedbacks</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Voltar
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-success">
            {showForm ? 'Cancelar' : '+ Novo Feedback'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ backgroundColor: '#fff3cd', border: '3px solid #ff0000' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#ff0000', textAlign: 'center' }}>CRIAR NOVO FEEDBACK - VERSÃO ATUALIZADA</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ border: '2px solid red', padding: '1rem' }}>
              <label className="form-label" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Tipo de Feedback</label>
              <select
                value={formData.tipo_feedback}
                onChange={(e) => {
                  console.log('Tipo selecionado:', e.target.value)
                  setFormData({ ...formData, tipo_feedback: e.target.value })
                }}
                className="form-control"
                required
                style={{ fontSize: '1.1rem', padding: '0.75rem' }}
              >
                <option value="MENSAL">📅 Feedback Mensal (Completo)</option>
                <option value="PONTUAL">⚡ Feedback Pontual (Rápido)</option>
              </select>
              <small style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                {formData.tipo_feedback === 'MENSAL' 
                  ? 'Feedback completo com indicadores, assiduidade e aderência' 
                  : 'Feedback rápido com motivo, descrição e comentário'}
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Funcionário</label>
              <select
                value={formData.funcionario_id}
                onChange={(e) => handleEmployeeChange(parseInt(e.target.value))}
                className="form-control"
                required
              >
                <option value={0}>Selecione</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome} - {emp.area}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Data</label>
              <input
                type="date"
                value={formData.data_feedback}
                onChange={(e) => setFormData({ ...formData, data_feedback: e.target.value })}
                className="form-control"
                required
              />
            </div>

            {formData.tipo_feedback === 'MENSAL' && (
              <div className="form-group">
                <label className="form-label">Período Avaliado</label>
                <input
                  type="text"
                  value={formData.periodo_avaliado}
                  onChange={(e) => setFormData({ ...formData, periodo_avaliado: e.target.value })}
                  className="form-control"
                  placeholder="Ex: Janeiro/2024 ou 01/01/2024 a 31/01/2024"
                />
              </div>
            )}

            {formData.tipo_feedback === 'PONTUAL' && (
              <>
                <div className="form-group">
                  <label className="form-label">Motivo do Feedback</label>
                  <input
                    type="text"
                    value={formData.motivo_feedback}
                    onChange={(e) => setFormData({ ...formData, motivo_feedback: e.target.value })}
                    className="form-control"
                    placeholder="Ex: Reconhecimento, Orientação, Alerta"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea
                    value={formData.descricao_feedback}
                    onChange={(e) => setFormData({ ...formData, descricao_feedback: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '120px' }}
                    placeholder="Descreva a situação ou comportamento observado..."
                    required
                  />
                </div>
              </>
            )}

            {selectedEmployee && (
              <div style={{ background: '#e7f3ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: 0, color: '#0066cc', fontWeight: '600' }}>
                  📅 Tempo de Empresa: {selectedEmployee.data_admissao ? 
                    (() => {
                      const admissao = new Date(selectedEmployee.data_admissao)
                      const hoje = new Date()
                      const meses = (hoje.getFullYear() - admissao.getFullYear()) * 12 + (hoje.getMonth() - admissao.getMonth())
                      return `${meses} meses`
                    })() : 'Não informado'
                  }
                </p>
              </div>
            )}

            {selectedEmployee && formData.tipo_feedback === 'MENSAL' && (
              <>
                <div className="card" style={{ background: 'linear-gradient(135deg, #0066cc 0%, #004c99 100%)', color: 'white', marginBottom: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.125rem' }}>VALORES AZSHIP</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                      <strong>APRENDER</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                        Evoluir nas habilidades com humildade, sabedoria e propósito
                      </p>
                    </div>
                    <div>
                      <strong>CONECTAR</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                        Gerar e manter parcerias sustentáveis, colaborativas e fiéis
                      </p>
                    </div>
                    <div>
                      <strong>SERVIR</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                        Atender com excelência, eficiência e comprometimento
                      </p>
                    </div>
                    <div>
                      <strong>INOVAR</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                        Criar soluções inteligentes, práticas e relevantes
                      </p>
                    </div>
                    <div>
                      <strong>PERSEVERAR</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                        Seguir consistente com foco e disciplina
                      </p>
                    </div>
                    <div>
                      <strong>PROSPERAR</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                        Promover resultados positivos, sustentáveis e contínuos
                      </p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: '1.6' }}>
                      <strong>Missão:</strong> Tornamos a gestão de transporte mais simples, segura e confiável. 
                      Acreditamos que o transporte bem gerido melhora o país, valoriza quem trabalha com seriedade 
                      e faz o dinheiro render com eficiência.
                    </p>
                  </div>
                </div>

                {indicators.filter(ind => !ind.campo_vinculado || ind.campo_vinculado === 'INDICADORES').length > 0 ? (
                  <div
                    style={{
                      background: '#f8f9fa',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <h3 style={{ marginBottom: '1rem', color: '#0066cc' }}>
                      Indicadores - {selectedEmployee.area}
                    </h3>
                    {indicators.filter(ind => !ind.campo_vinculado || ind.campo_vinculado === 'INDICADORES').map((indicator) => (
                      <div key={indicator.id} className="form-group">
                        <label className="form-label">
                          {indicator.nome}
                          {indicator.meta && (
                            <span style={{ color: '#28a745', marginLeft: '0.5rem' }}>
                              (Meta: {indicator.meta})
                            </span>
                          )}
                        </label>
                        {indicator.descricao && (
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                            {indicator.descricao}
                          </p>
                        )}
                        <input
                          type="text"
                          value={indicatorValues[indicator.id] || ''}
                          onChange={(e) =>
                            setIndicatorValues({ ...indicatorValues, [indicator.id]: e.target.value })
                          }
                          className="form-control"
                          placeholder="Digite o valor alcançado e comentários relevantes"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Indicadores (Não há indicadores cadastrados para esta área)</label>
                    <textarea
                      value={indicatorValues[0] || ''}
                      onChange={(e) => setIndicatorValues({ ...indicatorValues, 0: e.target.value })}
                      className="form-control"
                      style={{ minHeight: '120px' }}
                      placeholder="Descreva os indicadores e resultados do colaborador..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Assiduidade</label>
                  <textarea
                    value={formData.assiduidade}
                    onChange={(e) => setFormData({ ...formData, assiduidade: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Aderência</label>
                  <textarea
                    value={formData.aderencia}
                    onChange={(e) => setFormData({ ...formData, aderencia: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pontos Positivos</label>
                  <textarea
                    value={formData.pontos_positivos}
                    onChange={(e) => setFormData({ ...formData, pontos_positivos: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '100px' }}
                    placeholder="Descreva os pontos fortes e conquistas do colaborador..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pontos de Melhoria</label>
                  <textarea
                    value={formData.melhorias}
                    onChange={(e) => setFormData({ ...formData, melhorias: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '100px' }}
                  />
                </div>
              </>
            )}

            {formData.tipo_feedback === 'PONTUAL' && (
              <div className="form-group">
                <label className="form-label">Comentário do Colaborador (após assinatura)</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: '80px', background: '#f8f9fa', cursor: 'not-allowed' }}
                  placeholder="Este campo será preenchido pelo colaborador ao assinar"
                  disabled
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary">
              Salvar Feedback
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Histórico de Feedbacks</h2>
        
        <div className="filters">
          <div className="filter-group search-box">
            <label className="form-label">Buscar Funcionário</label>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              placeholder="Digite o nome..."
            />
          </div>

          <div className="filter-group">
            <label className="form-label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="assinado">Assinados</option>
              <option value="pendente">Pendentes</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Funcionário</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.map((fb) => {
              const employee = employees.find((e) => e.id === fb.funcionario_id)
              return (
                <tr key={fb.id}>
                  <td>{new Date(fb.data_feedback).toLocaleDateString('pt-BR')}</td>
                  <td>{employee?.nome}</td>
                  <td>
                    <span className="badge" style={{ background: fb.tipo_feedback === 'PONTUAL' ? '#ffc107' : '#17a2b8' }}>
                      {fb.tipo_feedback === 'PONTUAL' ? '⚡ Pontual' : '📅 Mensal'}
                    </span>
                  </td>
                  <td>
                    <span className={fb.assinado ? 'badge badge-success' : 'badge badge-warning'}>
                      {fb.assinado ? '✓ Assinado' : '⏳ Pendente'}
                    </span>
                  </td>
                  <td>
                    {!fb.assinado && (
                      <button
                        onClick={() => {
                          setSelectedFeedback(fb)
                          setShowSignModal(true)
                        }}
                        className="btn btn-warning"
                        style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}
                      >
                        Assinar
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPDF(fb.id)}
                      className="btn btn-info"
                      style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}
                    >
                      📄 PDF
                    </button>
                    {currentUser?.perfil === 'admin' && (
                      <button
                        onClick={() => handleDelete(fb.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showSignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Assinar Feedback</h2>
            <div className="form-group">
              <label className="form-label">Senha de Assinatura</label>
              <input
                type="password"
                value={signPassword}
                onChange={(e) => setSignPassword(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Comentário (opcional)</label>
              <textarea
                value={signComment}
                onChange={(e) => setSignComment(e.target.value)}
                className="form-control"
                style={{ minHeight: '100px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSign} className="btn btn-success">
                Confirmar Assinatura
              </button>
              <button
                onClick={() => {
                  setShowSignModal(false)
                  setSignPassword('')
                  setSignComment('')
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

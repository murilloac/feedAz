import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filterAction, filterEntity, logs])

  const loadLogs = async () => {
    try {
      const response = await api.get('/audit-logs')
      setLogs(response.data)
      setFilteredLogs(response.data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('Acesso negado')
        navigate('/dashboard')
      }
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]
    
    if (filterAction) {
      filtered = filtered.filter(log => log.action === filterAction)
    }
    
    if (filterEntity) {
      filtered = filtered.filter(log => log.entity_type === filterEntity)
    }
    
    setFilteredLogs(filtered)
  }

  const getActionBadge = (action: string) => {
    const badges: any = {
      CREATE: { class: 'badge-success', text: '✓ Criado' },
      UPDATE: { class: 'badge-warning', text: '✎ Editado' },
      DELETE: { class: 'badge badge-danger', text: '✗ Excluído' },
      LOGIN: { class: 'badge', text: '→ Login' },
      LOGOUT: { class: 'badge', text: '← Logout' }
    }
    const badge = badges[action] || { class: 'badge', text: action }
    return <span className={badge.class}>{badge.text}</span>
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📋 Logs de Auditoria</h1>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          Voltar
        </button>
      </div>

      <div className="card">
        <div className="filters">
          <div className="filter-group">
            <label className="form-label">Ação</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="form-control"
            >
              <option value="">Todas</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Edição</option>
              <option value="DELETE">Exclusão</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="form-label">Entidade</label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="form-control"
            >
              <option value="">Todas</option>
              <option value="USER">Usuário</option>
              <option value="EMPLOYEE">Funcionário</option>
              <option value="FEEDBACK">Feedback</option>
              <option value="INDICATOR">Indicador</option>
              <option value="AREA">Área</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Ação</th>
              <th>Entidade</th>
              <th>Detalhes</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td>{getActionBadge(log.action)}</td>
                <td>{log.entity_type}</td>
                <td>{log.details || '-'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {log.ip_address || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
            Nenhum log encontrado
          </p>
        )}
      </div>
    </div>
  )
}

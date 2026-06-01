import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import api from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetStep, setResetStep] = useState<'email' | 'answer'>('email')
  const [resetEmail, setResetEmail] = useState('')
  const [secretQuestion, setSecretQuestion] = useState('')
  const [secretAnswer, setSecretAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authService.login(email, senha)
      navigate('/dashboard')
    } catch (err) {
      setError('Email ou senha incorretos')
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/password-reset/request', { email: resetEmail })
      setSecretQuestion(response.data.pergunta_secreta)
      setResetStep('answer')
      setResetMessage('')
    } catch (err: any) {
      setResetMessage(err.response?.data?.detail || 'Erro ao buscar pergunta secreta')
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/password-reset/confirm', {
        email: resetEmail,
        resposta_secreta: secretAnswer,
        nova_senha: newPassword,
      })
      setResetMessage('Senha alterada com sucesso!')
      setTimeout(() => {
        setShowResetModal(false)
        setResetStep('email')
        setResetEmail('')
        setSecretQuestion('')
        setSecretAnswer('')
        setNewPassword('')
        setResetMessage('')
      }, 2000)
    } catch (err: any) {
      setResetMessage(err.response?.data?.detail || 'Erro ao resetar senha')
    }
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setResetStep('email')
    setResetEmail('')
    setSecretQuestion('')
    setSecretAnswer('')
    setNewPassword('')
    setResetMessage('')
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#0066cc', fontSize: '2.5rem', marginBottom: '0.5rem' }}>FeedAz</h1>
          <p style={{ color: '#6c757d', fontSize: '0.9375rem' }}>Sistema de Feedback One-a-One</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="form-control"
              required
            />
          </div>
          {error && (
            <p style={{ color: '#dc3545', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            style={{
              width: '100%',
              padding: '0.875rem',
              marginTop: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#0066cc',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline',
            }}
          >
            Esqueci minha senha
          </button>
        </form>

        {showResetModal && (
          <div className="modal-overlay" onClick={closeResetModal}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px' }}
            >
              <h2 style={{ marginBottom: '1.5rem', color: '#0066cc' }}>Reset de Senha</h2>

              {resetStep === 'email' ? (
                <form onSubmit={handleRequestReset}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="form-control"
                      required
                      placeholder="Digite seu email"
                    />
                  </div>
                  {resetMessage && (
                    <p
                      style={{
                        color: resetMessage.includes('Erro') ? '#dc3545' : '#28a745',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {resetMessage}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary">
                      Continuar
                    </button>
                    <button type="button" onClick={closeResetModal} className="btn btn-secondary">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset}>
                  <div className="form-group">
                    <label className="form-label">Pergunta Secreta</label>
                    <input
                      type="text"
                      value={secretQuestion}
                      className="form-control"
                      disabled
                      style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Resposta</label>
                    <input
                      type="text"
                      value={secretAnswer}
                      onChange={(e) => setSecretAnswer(e.target.value)}
                      className="form-control"
                      required
                      placeholder="Digite a resposta da pergunta secreta"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control"
                      required
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  {resetMessage && (
                    <p
                      style={{
                        color: resetMessage.includes('sucesso') ? '#28a745' : '#dc3545',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {resetMessage}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary">
                      Confirmar
                    </button>
                    <button type="button" onClick={closeResetModal} className="btn btn-secondary">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        <div
          style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#6c757d' }}
        >
          <p>Desenvolvido por MAC</p>
        </div>
      </div>
    </div>
  )
}

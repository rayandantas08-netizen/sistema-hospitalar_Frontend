import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@hospitalar.com');
  const [password, setPassword] = useState('Hospitalar@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      await loginWithToken(response.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar no sistema.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    setError('');
    try {
      await loginWithToken('demo-token');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark large">H</div>
          <h1>Hospitalar</h1>
          <p>Gestão de pacientes, profissionais e triagem clínica.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button full-width-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="demo-divider">
          <span>ou</span>
        </div>

        <button
          type="button"
          className="demo-button"
          onClick={handleDemoLogin}
          disabled={loading}
          title="Permite testar todos os módulos, layout mobile e fluxos sem depender do backend"
        >
          <i className="fas fa-play-circle" /> Entrar em Modo Demonstração
        </button>

        <div className="auth-footer">
          <span>Primeiro acesso?</span>
          <Link to="/register-admin">Cadastrar administrador</Link>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPacientes } from '../api/pacientes';
import { listMedicos } from '../api/medicos';
import { listEnfermeiros } from '../api/enfermeiros';
import { apiFetch } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState(0);
  const [doctors, setDoctors] = useState(0);
  const [nurses, setNurses] = useState(0);
  const [consultasCount, setConsultasCount] = useState(0);
  const [triagensCount, setTriagensCount] = useState(0);
  const [leitosOcupados, setLeitosOcupados] = useState(0);
  const [gravityCounts, setGravityCounts] = useState<{ label: string; value: number; color: string; detail: string }[]>([
    { label: 'Emergência (Vermelho)', value: 0, color: 'red', detail: 'Atendimento Imediato (0 min)' },
    { label: 'Muito urgente (Laranja)', value: 0, color: 'orange', detail: 'Tempo alvo: até 10 min' },
    { label: 'Urgente (Amarelo)', value: 0, color: 'yellow', detail: 'Tempo alvo: até 60 min' },
    { label: 'Pouco urgente (Verde)', value: 0, color: 'green', detail: 'Tempo alvo: até 120 min' },
    { label: 'Não urgente (Azul)', value: 0, color: 'blue', detail: 'Tempo alvo: até 240 min' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    Promise.all([
      listPacientes(token).catch(() => []),
      listMedicos(token).catch(() => []),
      listEnfermeiros(token).catch(() => []),
      apiFetch<any[]>('/consultas', {}, token).catch(() => []),
      apiFetch<any[]>('/triagens', {}, token).catch(() => []),
      apiFetch<any[]>('/leitos', {}, token).catch(() => []),
    ])
      .then(([pacientes, medicos, enfermeiros, consultas, triagens, leitos]) => {
        setPatients(Array.isArray(pacientes) ? pacientes.length : 0);
        setDoctors(Array.isArray(medicos) ? medicos.length : 0);
        setNurses(Array.isArray(enfermeiros) ? enfermeiros.length : 0);
        setConsultasCount(Array.isArray(consultas) ? consultas.length : 0);
        setTriagensCount(Array.isArray(triagens) ? triagens.length : 0);

        if (Array.isArray(leitos) && leitos.length > 0) {
          const occupied = leitos.filter((l: any) => l.status === 'OCUPADO').length;
          setLeitosOcupados(Math.round((occupied / leitos.length) * 100));
        } else {
          setLeitosOcupados(0);
        }

        if (Array.isArray(triagens)) {
          const red = triagens.filter((t: any) => t.classificacaoRisco === 'VERMELHO').length;
          const orange = triagens.filter((t: any) => t.classificacaoRisco === 'LARANJA').length;
          const yellow = triagens.filter((t: any) => t.classificacaoRisco === 'AMARELO').length;
          const green = triagens.filter((t: any) => t.classificacaoRisco === 'VERDE').length;
          const blue = triagens.filter((t: any) => t.classificacaoRisco === 'AZUL').length;

          setGravityCounts([
            { label: 'Emergência (Vermelho)', value: red, color: 'red', detail: 'Atendimento Imediato (0 min)' },
            { label: 'Muito urgente (Laranja)', value: orange, color: 'orange', detail: 'Tempo alvo: até 10 min' },
            { label: 'Urgente (Amarelo)', value: yellow, color: 'yellow', detail: 'Tempo alvo: até 60 min' },
            { label: 'Pouco urgente (Verde)', value: green, color: 'green', detail: 'Tempo alvo: até 120 min' },
            { label: 'Não urgente (Azul)', value: blue, color: 'blue', detail: 'Tempo alvo: até 240 min' },
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="page-wrap dashboard-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Visão geral operacional</p>
          <h2>Painel Clínico e Operacional</h2>
          <p className="page-subtitle">Indicadores consolidados em tempo real a partir do banco de dados.</p>
        </div>
        <div className="filters">
          <select aria-label="Filtrar por unidade">
            <option>{user?.unidadeSaudeNome || 'Todas as Unidades de Saúde'}</option>
          </select>
          <select aria-label="Filtrar por período">
            <option>Plantão de hoje</option>
            <option>Últimos 7 dias</option>
            <option>Mês atual</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="loading-box">
          <i className="fas fa-circle-notch fa-spin" /> Carregando indicadores clínicos do banco...
        </div>
      ) : (
        <div className="stats-grid six-stats">
          <div className="stat-card">
            <div className="stat-icon blue">
              <i className="fas fa-hospital-user" />
            </div>
            <div>
              <span>Pacientes cadastrados</span>
              <strong>{patients}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon petrol">
              <i className="fas fa-user-doctor" />
            </div>
            <div>
              <span>Médicos no banco</span>
              <strong>{doctors}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <i className="fas fa-user-nurse" />
            </div>
            <div>
              <span>Equipe de enfermagem</span>
              <strong>{nurses}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <i className="fas fa-bed" />
            </div>
            <div>
              <span>Taxa de ocupação</span>
              <strong>{leitosOcupados}%</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <i className="fas fa-stethoscope" />
            </div>
            <div>
              <span>Consultas agendadas</span>
              <strong>{consultasCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <i className="fas fa-heart-pulse" />
            </div>
            <div>
              <span>Triagens registradas</span>
              <strong>{triagensCount}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="panel gravity-panel">
          <div className="panel-header-row">
            <h3><i className="fas fa-layer-group" /> Classificação de Risco no Banco (Manchester)</h3>
            <span className="badge-info">Triagem ativa</span>
          </div>

          {gravityCounts.map((row) => (
            <div className="gravity-row" key={row.label}>
              <div className="gravity-row-info">
                <span>{row.label}</span>
                <span className="gravity-target-time">{row.detail}</span>
                <b>{row.value} pacientes</b>
              </div>
              <div className="progress">
                <i
                  className={row.color}
                  style={{ width: `${Math.min(Number(row.value) * 15, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="panel alert-panel">
          <div className="panel-header-row">
            <h3><i className="fas fa-bell" /> Alertas Operacionais</h3>
            <span className="badge-pulse"><i className="fas fa-circle" /> Tempo real</span>
          </div>

          <div className="alert-item info">
            <div className="alert-icon-wrap">
              <i className="fas fa-database" />
            </div>
            <div>
              <b>Conexão ativa com o banco de dados</b>
              <span>Todos os dados exibidos são originados exclusivamente dos registros da API REST.</span>
            </div>
          </div>

          <div className="alert-item warning">
            <div className="alert-icon-wrap">
              <i className="fas fa-triangle-exclamation" />
            </div>
            <div>
              <b>Triagens e Fila de Atendimento</b>
              <span>
                {triagensCount > 0
                  ? `${triagensCount} triagens cadastradas aguardando atendimento nos consultórios.`
                  : 'Nenhuma triagem pendente no banco de dados neste momento.'}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="panel shortcuts-panel">
        <div className="panel-header-row">
          <h3><i className="fas fa-bolt" /> Acesso Rápido às Rotinas Clínicas</h3>
          <span className="shortcuts-hint">Clique para navegar diretamente</span>
        </div>
        <div className="shortcut-grid">
          <Link to="/pacientes" className="shortcut-card">
            <div className="shortcut-icon-circle blue-circ">
              <i className="fas fa-user-plus" />
            </div>
            <div className="shortcut-meta">
              <b>Novo Paciente</b>
              <small>Cadastro e admissão</small>
            </div>
            <i className="fas fa-chevron-right shortcut-arrow" />
          </Link>

          <Link to="/atendimento" className="shortcut-card">
            <div className="shortcut-icon-circle green-circ">
              <i className="fas fa-bullhorn" />
            </div>
            <div className="shortcut-meta">
              <b>Chamar Paciente</b>
              <small>Fila do consultório</small>
            </div>
            <i className="fas fa-chevron-right shortcut-arrow" />
          </Link>

          <Link to="/triagem" className="shortcut-card">
            <div className="shortcut-icon-circle orange-circ">
              <i className="fas fa-heart-pulse" />
            </div>
            <div className="shortcut-meta">
              <b>Classificar Risco</b>
              <small>Protocolo Manchester e MEWS</small>
            </div>
            <i className="fas fa-chevron-right shortcut-arrow" />
          </Link>

          <Link to="/sala-vermelha" className="shortcut-card red-shortcut">
            <div className="shortcut-icon-circle red-circ">
              <i className="fas fa-truck-medical" />
            </div>
            <div className="shortcut-meta">
              <b>Sala Vermelha</b>
              <small>Emergência e Leitos UTI</small>
            </div>
            <i className="fas fa-chevron-right shortcut-arrow" />
          </Link>

          <Link to="/farmacia" className="shortcut-card">
            <div className="shortcut-icon-circle purple-circ">
              <i className="fas fa-pills" />
            </div>
            <div className="shortcut-meta">
              <b>Dispensação Farmácia</b>
              <small>Estoque e saída de itens</small>
            </div>
            <i className="fas fa-chevron-right shortcut-arrow" />
          </Link>

          <Link to="/painel" target="_blank" rel="noreferrer" className="shortcut-card">
            <div className="shortcut-icon-circle teal-circ">
              <i className="fas fa-tv" />
            </div>
            <div className="shortcut-meta">
              <b>Painel de Chamada TV</b>
              <small>Abrir em tela cheia</small>
            </div>
            <i className="fas fa-arrow-up-right-from-square shortcut-arrow" />
          </Link>
        </div>
      </section>
    </div>
  );
}

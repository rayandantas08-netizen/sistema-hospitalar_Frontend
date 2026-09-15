import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { broadcastCall } from '../services/callService';

interface CriticalPatient {
  id: string;
  code: string;
  name: string;
  age?: string;
  reason: string;
  vitals?: string;
  time: string;
  status: string;
  bed?: string;
}

interface HospitalBed {
  id: string;
  nomeOuNumero: string;
  setor?: string;
  status: 'LIVRE' | 'OCUPADO' | 'HIGIENIZACAO' | 'MANUTENCAO' | 'ISOLAMENTO';
  pacienteNome?: string;
  diagnostico?: string;
  ventiladorMecanico?: boolean;
  monitorCardiaco?: boolean;
}

interface EmergencyStaff {
  id: string;
  nome: string;
  papel: string;
  registroConselho?: string;
  status: string;
  funcao?: string;
}

export default function RedRoomPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'fila' | 'leitos' | 'equipe'>('fila');
  const [patients, setPatients] = useState<CriticalPatient[]>([]);
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [staff, setStaff] = useState<EmergencyStaff[]>([]);
  const [called, setCalled] = useState<CriticalPatient | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real emergency records from API
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    Promise.all([
      apiFetch<CriticalPatient[]>('/sala-vermelha/fila', {}, token).catch(() => []),
      apiFetch<HospitalBed[]>('/leitos?setor=SALA_VERMELHA', {}, token).catch(() => []),
      apiFetch<EmergencyStaff[]>('/sala-vermelha/equipe', {}, token).catch(() => []),
    ])
      .then(([dbPatients, dbBeds, dbStaff]) => {
        setPatients(Array.isArray(dbPatients) ? dbPatients : []);
        setBeds(Array.isArray(dbBeds) ? dbBeds : []);
        setStaff(Array.isArray(dbStaff) ? dbStaff : []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCallNext() {
    if (!patients.length) return;
    const next = patients[0];

    try {
      if (token) {
        await apiFetch('/chamadas/chamar', {
          method: 'POST',
          body: JSON.stringify({
            pacienteId: next.id,
            senha: next.code,
            sala: 'Sala Vermelha (Emergência)',
            prioridade: 'Vermelho',
          }),
        }, token);
      }
    } catch {
      // Continua
    }

    broadcastCall({
      senha: next.code,
      nome: next.name,
      sala: 'Sala Vermelha (Emergência)',
      prioridade: 'Vermelho',
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      medicoOuResponsavel: user?.nome,
    });

    setCalled(next);
    setPatients((cur) => cur.slice(1));
  }

  async function handleBedStatusChange(bedId: string, newStatus: HospitalBed['status']) {
    try {
      if (token) {
        await apiFetch(`/leitos/${bedId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        }, token);
      }
      setBeds((prev) => prev.map((b) => (b.id === bedId ? { ...b, status: newStatus } : b)));
    } catch {
      setBeds((prev) => prev.map((b) => (b.id === bedId ? { ...b, status: newStatus } : b)));
    }
  }

  const occupiedBedsCount = beds.filter((b) => b.status === 'OCUPADO').length;

  return (
    <div className="page-wrap red-room-page">
      <header className="red-room-header">
        <div>
          <p className="red-eyebrow">
            <i className="fas fa-truck-medical" /> Setor de Emergência e Suporte Avançado de Vida
          </p>
          <h2>Sala Vermelha — Área Crítica</h2>
          <p>Conectada em tempo real ao banco de dados e ao Painel de Chamada TV.</p>
        </div>
        <div className="red-status">
          <span className="red-status-pill">
            <i className="fas fa-heart-pulse fa-beat" /> MONITORAMENTO ATIVO
          </span>
          <small>Unidade: {user?.unidadeSaudeNome || 'Hospital Central'}</small>
        </div>
      </header>

      {/* Metrics Row from Database */}
      <div className="red-metrics">
        <div className="red-metric-card">
          <i className="fas fa-user-injured" />
          <div className="red-metric-info">
            <span>Pacientes na Fila</span>
            <strong>{patients.length}</strong>
          </div>
        </div>
        <div className="red-metric-card">
          <i className="fas fa-bed-pulse" />
          <div className="red-metric-info">
            <span>Leitos Ocupados</span>
            <strong>{beds.length ? `${occupiedBedsCount} / ${beds.length}` : '0 / 0'}</strong>
          </div>
        </div>
        <div className="red-metric-card">
          <i className="fas fa-stopwatch" />
          <div className="red-metric-info">
            <span>Tempo Médio na Sala</span>
            <strong>{patients.length ? patients[0].time : '0 min'}</strong>
          </div>
        </div>
        <div className="red-metric-card">
          <i className="fas fa-user-doctor" />
          <div className="red-metric-info">
            <span>Equipe no Banco de Dados</span>
            <strong>{staff.length} Profissionais</strong>
          </div>
        </div>
      </div>

      {/* Red Tabs Navigation */}
      <nav className="red-tabs" aria-label="Navegação da Sala Vermelha">
        <button
          type="button"
          className={`red-tab-btn ${activeTab === 'fila' ? 'active' : ''}`}
          onClick={() => setActiveTab('fila')}
        >
          <i className="fas fa-list-ol" /> Fila Crítica ({patients.length})
        </button>
        <button
          type="button"
          className={`red-tab-btn ${activeTab === 'leitos' ? 'active' : ''}`}
          onClick={() => setActiveTab('leitos')}
        >
          <i className="fas fa-bed" /> Mapa de Leitos ({beds.length ? `${occupiedBedsCount}/${beds.length}` : '0'})
        </button>
        <button
          type="button"
          className={`red-tab-btn ${activeTab === 'equipe' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipe')}
        >
          <i className="fas fa-user-doctor" /> Equipe de Emergência ({staff.length})
        </button>
      </nav>

      {/* Tab Panels */}
      <div className="red-tab-content-wrapper">
        {loading ? (
          <div className="reference-empty compact">
            <i className="fas fa-circle-notch fa-spin" />
            <strong>Consultando dados da Sala Vermelha no banco...</strong>
          </div>
        ) : (
          <>
            {activeTab === 'fila' && (
              <div className="red-grid">
                <section className="red-card red-call-card">
                  <div className="red-card-heading">
                    <div>
                      <span className="red-card-tag">Atendimento Imediato</span>
                      <h3>{called ? 'Paciente em Chamada Emergencial' : 'Próxima Admissão na Sala'}</h3>
                    </div>
                    <span className="critical-badge">NÍVEL 1 — IMEDIATO</span>
                  </div>

                  {called ? (
                    <div className="red-called-box">
                      <div className="red-called-code">{called.code}</div>
                      <div className="red-called-details">
                        <h4>{called.name} {called.age ? `(${called.age})` : ''}</h4>
                        <p className="red-called-reason">
                          <i className="fas fa-triangle-exclamation" /> {called.reason}
                        </p>
                        {called.vitals && (
                          <div className="red-called-vitals">
                            <i className="fas fa-heart-pulse" /> {called.vitals}
                          </div>
                        )}
                        <span className="red-called-meta">
                          <i className="fas fa-location-dot" /> Direcionado para {called.bed || 'Leito de Choque'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="red-dismiss-btn"
                        onClick={() => setCalled(null)}
                      >
                        <i className="fas fa-check-double" /> Confirmar Entrada no Leito
                      </button>
                    </div>
                  ) : (
                    <div className="red-empty">
                      <div className="red-empty-icon">
                        <i className="fas fa-truck-medical" />
                      </div>
                      <strong>Pronto para admissão emergencial</strong>
                      <span>Ao acionar o botão abaixo, a chamada toca na TV da recepção com aviso sonoro prioritário.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="red-call-button"
                    onClick={handleCallNext}
                    disabled={!patients.length}
                  >
                    <i className="fas fa-bullhorn" /> Chamar Próximo Caso Crítico (SAMU/Resgate)
                  </button>
                </section>

                <section className="red-card">
                  <div className="red-card-heading">
                    <h3><i className="fas fa-triangle-exclamation" /> Fila Crítica no Banco de Dados</h3>
                    <span className="red-count-pill">{patients.length} casos</span>
                  </div>

                  <div className="red-patients-list">
                    {patients.length > 0 ? (
                      patients.map((patient) => (
                        <div className="red-patient-row" key={patient.code || patient.id}>
                          <span className="critical-code">{patient.code}</span>
                          <div className="red-patient-info">
                            <strong>{patient.name}</strong>
                            <p className="red-reason-text">{patient.reason}</p>
                            {patient.vitals && (
                              <div className="red-vitals-pill">
                                <i className="fas fa-heart-pulse" /> {patient.vitals}
                              </div>
                            )}
                            <small className="red-time-info">
                              <i className="fas fa-clock" /> Na sala há {patient.time} · {patient.status}
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="reference-empty compact">
                        <i className="fas fa-shield-heart" />
                        <strong>Nenhum paciente crítico no banco de dados</strong>
                        <span>Não há chamadas de emergência pendentes nesta unidade.</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'leitos' && (
              <div className="red-beds-container">
                <div className="beds-toolbar-row">
                  <div>
                    <h4>Mapa Operacional de Leitos da Emergência</h4>
                    <p>Controle de admissão, higienização e suporte ventilatório.</p>
                  </div>
                  <button type="button" className="primary-button" onClick={() => window.dispatchEvent(new CustomEvent('module-create'))}>
                    <i className="fas fa-plus" /> Novo Leito
                  </button>
                </div>

                {beds.length > 0 ? (
                  <div className="red-beds-grid">
                    {beds.map((bed) => {
                      const statusLower = bed.status.toLowerCase();
                      return (
                        <div
                          key={bed.id}
                          className={`red-bed-card bed-${statusLower}`}
                        >
                          <div className="bed-header">
                            <div className="bed-title">
                              <i className="fas fa-bed-pulse" /> <strong>{bed.nomeOuNumero}</strong>
                            </div>
                            <span className={`bed-status-badge ${statusLower}`}>{bed.status}</span>
                          </div>
                          <div className="bed-body">
                            <div className="bed-patient">
                              <small>Paciente / Diagnóstico</small>
                              <strong>{bed.pacienteNome || 'Leito Desocupado'}</strong>
                              <span className="bed-diag">{bed.diagnostico || 'Sem diagnóstico ativo'}</span>
                            </div>
                            <div className="bed-specs">
                              <div>
                                <small>Ventilador</small>
                                <span><i className="fas fa-lungs" /> {bed.ventiladorMecanico ? 'Em uso' : 'Não'}</span>
                              </div>
                              <div>
                                <small>Monitor</small>
                                <span><i className="fas fa-wave-square" /> {bed.monitorCardiaco ? 'Ativo' : 'Standby'}</span>
                              </div>
                            </div>
                            <div className="bed-actions-mini">
                              <select
                                value={bed.status}
                                onChange={(e) => void handleBedStatusChange(bed.id, e.target.value as HospitalBed['status'])}
                                aria-label="Alterar status do leito"
                              >
                                <option value="LIVRE">Livre</option>
                                <option value="OCUPADO">Ocupado</option>
                                <option value="HIGIENIZACAO">Higienização</option>
                                <option value="ISOLAMENTO">Isolamento</option>
                                <option value="MANUTENCAO">Manutenção</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="reference-empty compact">
                    <i className="fas fa-bed" />
                    <strong>Nenhum leito cadastrado no banco de dados</strong>
                    <span>Cadastre leitos no backend para gerenciar a ocupação da Sala Vermelha.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'equipe' && (
              <div className="red-staff-container">
                <div className="staff-toolbar-row">
                  <h4>Equipe de Emergência Cadastrada</h4>
                  <p>Profissionais com escala e plantão ativo no banco de dados.</p>
                </div>

                {staff.length > 0 ? (
                  <div className="red-staff-grid">
                    {staff.map((person) => (
                      <div className="red-staff-card" key={person.id}>
                        <div className="staff-avatar">
                          <i className="fas fa-user-doctor" />
                        </div>
                        <div className="staff-info">
                          <span className="staff-role">{person.funcao || person.papel}</span>
                          <strong>{person.nome}</strong>
                          <small>{person.registroConselho || 'Registro Ativo'}</small>
                          <div className="staff-tags">
                            <span className="staff-badge">Plantão Ativo</span>
                            <span className="staff-status"><i className="fas fa-circle" /> {person.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reference-empty compact">
                    <i className="fas fa-user-doctor" />
                    <strong>Nenhum profissional alocado na Sala Vermelha no banco de dados</strong>
                    <span>Vincule médicos e enfermeiros à escala da Sala Vermelha.</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <section className="red-safety">
        <i className="fas fa-shield-heart" />
        <div>
          <strong>Protocolo de Segurança e Reanimação (ACLS / ATLS)</strong>
          <span>
            Todos os procedimentos realizados na Sala Vermelha exigem anotação imediata em prontuário,
            dupla checagem para medicações de alta vigilância e comunicação em alça fechada pela equipe.
          </span>
        </div>
      </section>
    </div>
  );
}

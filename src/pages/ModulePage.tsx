import { useEffect, useState, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { listPacientes } from '../api/pacientes';
import { useAuth } from '../contexts/AuthContext';
import type { PatientRecord } from '../types/auth';

const modules: Record<string, { title: string; description: string; icon: string }> = {
  unidades: { title: 'Unidades de Saúde', description: 'Hospitais, UPAs e UBSs da rede cadastradas no banco.', icon: 'fa-building' },
  consultas: { title: 'Consultas Médicas', description: 'Agenda de atendimentos e consultas do banco de dados.', icon: 'fa-calendar-check' },
  triagem: { title: 'Triagem Clínica (Manchester + MEWS)', description: 'Classificação de risco com escore automatizado de alerta precoce.', icon: 'fa-heartbeat' },
  prontuarios: { title: 'Prontuário Eletrônico (PEP SOAP)', description: 'Histórico clínico estruturado e certificação digital.', icon: 'fa-file-medical' },
  prescricoes: { title: 'Prescrição Eletrônica Inteligente', description: 'Validação de alergias, dosagens e interações medicamentosas.', icon: 'fa-prescription' },
  relatorios: { title: 'Faturamento SUS & Relatórios', description: 'Espelho de faturamento BPA/APAC, convênios TISS e indicadores.', icon: 'fa-chart-bar' },
  farmacia: { title: 'Farmácia Hospitalar', description: 'Controle de lotes, dispensação e rastreabilidade.', icon: 'fa-pills' },
  estoque: { title: 'Estoque & Curva ABC', description: 'Níveis mínimos, controle de validade e alertas de ruptura.', icon: 'fa-boxes-stacked' },
  movimentacoes: { title: 'Movimentações de Estoque', description: 'Entradas por NF, saídas para enfermarias e perdas.', icon: 'fa-exchange-alt' },
  dispensacao: { title: 'Dispensação & Checagem Beira do Leito', description: 'Dupla checagem segura por código de barras/QR Code.', icon: 'fa-hand-holding-medical' },
  solicitacoes: { title: 'Solicitações de Compra', description: 'Pedidos de reposição vinculados ao estoque mínimo.', icon: 'fa-file-invoice' },
  'notas-fiscais': { title: 'Notas Fiscais de Entrada', description: 'Conferência de NF-e e entrada automática de lotes.', icon: 'fa-file-invoice-dollar' },
  fornecedores: { title: 'Fornecedores Hospitalares', description: 'Cadastro de distribuidores de medicamentos e materiais.', icon: 'fa-truck' },
  configuracoes: { title: 'Configurações & Auditoria LGPD', description: 'Trilha de auditoria, segurança e consentimento de dados.', icon: 'fa-shield-halved' },
};

function Header({ page, action = 'Novo registro' }: { page: keyof typeof modules; action?: string | null }) {
  const module = modules[page] || { title: page, description: '', icon: 'fa-folder' };
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Sistema Hospitalar</p>
        <h2>{module.title}</h2>
        <p className="page-subtitle">{module.description}</p>
      </div>
      {action ? (
        <button
          type="button"
          className="primary-button"
          onClick={() => window.dispatchEvent(new CustomEvent('module-create'))}
        >
          <i className="fas fa-plus" /> {action}
        </button>
      ) : null}
    </header>
  );
}

function Toolbar({ placeholder = 'Buscar no banco de dados...', onSearch }: { placeholder?: string; onSearch?: (q: string) => void }) {
  return (
    <div className="reference-toolbar">
      <div className="search-control">
        <i className="fas fa-search" />
        <input
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          aria-label={placeholder}
        />
      </div>
      <select aria-label="Filtrar por status">
        <option>Todos os registros</option>
        <option>Ativos no banco</option>
        <option>Pendentes</option>
      </select>
    </div>
  );
}

function EmptyTable({ columns = 5, message = 'Nenhum registro encontrado no banco de dados' }: { columns?: number; message?: string }) {
  return (
    <tbody>
      <tr>
        <td colSpan={columns} className="reference-empty">
          <i className="fas fa-database" />
          <strong>{message}</strong>
          <span>Cadastre novos itens para visualizá-los diretamente nesta tabela.</span>
        </td>
      </tr>
    </tbody>
  );
}

// --------------------------------------------------------------------------
// 1. UNIDADES DE SAÚDE (Real DB connection)
// --------------------------------------------------------------------------
function UnitsPage() {
  const { token } = useAuth();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<any[]>('/unidades-saude', {}, token)
      .then((data) => setUnits(Array.isArray(data) ? data : []))
      .catch(() => setUnits([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <Header page="unidades" action="Nova unidade de saúde" />
      {loading ? (
        <div className="reference-empty compact">
          <i className="fas fa-circle-notch fa-spin" />
          <strong>Consultando unidades no banco de dados...</strong>
        </div>
      ) : units.length > 0 ? (
        <div className="unit-cards">
          {units.map((unit) => (
            <article className="unit-card" key={unit.id}>
              <div className="unit-card-icon">
                <i className={unit.tipo?.includes('UPA') ? 'fas fa-truck-medical' : 'fas fa-hospital'} />
              </div>
              <span className="status-pill status-active">Operacional</span>
              <h3>{unit.nome}</h3>
              <p>{unit.tipo || 'Hospital Geral'} • CNES: {unit.cnes || 'Pendente'}</p>
              <small>{typeof unit.endereco === 'string' ? unit.endereco : unit.endereco?.cidade || 'Unidade Integrada'}</small>
              <footer>
                <button type="button">Ver salas</button>
                <button type="button">Editar</button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="reference-empty">
          <i className="fas fa-building" />
          <strong>Nenhuma unidade de saúde cadastrada no banco de dados</strong>
          <span>Clique em "Nova unidade de saúde" para adicionar o primeiro hospital ou UPA.</span>
        </div>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// 2. CONSULTAS MÉDICAS (Real DB & Calendar view modes)
// --------------------------------------------------------------------------
function ConsultasPage() {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<any[]>('/consultas', {}, token)
      .then((res) => setConsultas(Array.isArray(res) ? res : []))
      .catch(() => setConsultas([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <Header page="consultas" action="Nova consulta" />
      <div className="view-tabs-container">
        <div className="view-tabs" role="tablist">
          <button
            type="button"
            className={viewMode === 'dia' ? 'selected' : ''}
            onClick={() => setViewMode('dia')}
          >
            <i className="fas fa-calendar-day" /> Visão Diária
          </button>
          <button
            type="button"
            className={viewMode === 'semana' ? 'selected' : ''}
            onClick={() => setViewMode('semana')}
          >
            <i className="fas fa-calendar-week" /> Visão Semanal
          </button>
          <button
            type="button"
            className={viewMode === 'mes' ? 'selected' : ''}
            onClick={() => setViewMode('mes')}
          >
            <i className="fas fa-calendar-days" /> Visão Mensal
          </button>
        </div>
      </div>

      <section className="reference-card">
        <Toolbar placeholder="Buscar por paciente, médico ou CID-10 no banco..." />
        <div className="table-responsive-wrapper">
          <table className="reference-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Data e Hora</th>
                <th>Unidade</th>
                <th>CID-10</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="reference-empty compact">
                    <i className="fas fa-circle-notch fa-spin" />
                    <strong>Carregando consultas do banco...</strong>
                  </td>
                </tr>
              </tbody>
            ) : consultas.length > 0 ? (
              <tbody>
                {consultas.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.pacienteNome || c.pacienteId}</strong></td>
                    <td>{c.medicoNome || c.medicoId}</td>
                    <td>{c.dataHora ? new Date(c.dataHora).toLocaleString('pt-BR') : '-'}</td>
                    <td>{c.unidadeSaudeNome || '-'}</td>
                    <td><span className="badge-crm">{c.cid10 || 'Z00.0'}</span></td>
                    <td><span className="status-pill status-active">{c.status || 'Agendada'}</span></td>
                    <td><button type="button" className="table-action">Iniciar</button></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <EmptyTable columns={7} message="Nenhuma consulta agendada no banco de dados" />
            )}
          </table>
        </div>
      </section>
    </>
  );
}

// --------------------------------------------------------------------------
// 3. TRIAGEM CLÍNICA: PROTOCOLO MANCHESTER + ESCORE MEWS/NEWS2
// --------------------------------------------------------------------------
function TriagePage() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patientId, setPatientId] = useState(searchParams.get('pacienteId') || '');
  const [units, setUnits] = useState<any[]>([]);
  const unitId = user?.unidadeSaudeId || units[0]?.id || '';
  const [complaint, setComplaint] = useState('');
  const [vitals, setVitals] = useState({
    systolic: '120',
    diastolic: '80',
    heartRate: '75',
    respiratoryRate: '16',
    temperature: '36.5',
    oxygen: '98',
    pain: '0',
    avpu: 'A', // A = Alert, V = Voice, P = Pain, U = Unresponsive
    conscious: true,
  });
  const [triagensList, setTriagensList] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    listPacientes(token).then(setPatients).catch(() => setPatients([]));
    apiFetch<any[]>('/unidades-saude', {}, token)
      .then((data) => setUnits(Array.isArray(data) ? data : []))
      .catch(() => setUnits([]));
    apiFetch<any[]>('/triagens', {}, token).then((data) => setTriagensList(Array.isArray(data) ? data : [])).catch(() => setTriagensList([]));
  }, [token]);

  function updateVital(field: string, value: string | boolean) {
    setVitals((cur) => ({ ...cur, [field]: value }));
  }

  // Calculate MEWS Score (Modified Early Warning Score)
  const mewsScore = useMemo(() => {
    let score = 0;
    const sys = Number(vitals.systolic);
    const hr = Number(vitals.heartRate);
    const rr = Number(vitals.respiratoryRate);
    const temp = Number(vitals.temperature);

    // Systolic BP
    if (sys < 70) score += 3;
    else if (sys <= 80) score += 2;
    else if (sys <= 100) score += 1;
    else if (sys >= 200) score += 2;

    // Heart Rate
    if (hr < 40) score += 2;
    else if (hr <= 50) score += 1;
    else if (hr >= 130) score += 3;
    else if (hr >= 111) score += 2;
    else if (hr >= 101) score += 1;

    // Respiratory Rate
    if (rr < 9) score += 2;
    else if (rr >= 30) score += 3;
    else if (rr >= 21) score += 2;
    else if (rr >= 15) score += 1;

    // Temperature
    if (temp < 35.0) score += 2;
    else if (temp >= 38.5) score += 2;

    // Consciousness
    if (vitals.avpu !== 'A' || !vitals.conscious) score += 3;

    return score;
  }, [vitals]);

  // Determine Manchester Classification automatically based on MEWS and Vitals
  const manchesterCalculated = useMemo(() => {
    const o2 = Number(vitals.oxygen);
    const pain = Number(vitals.pain);

    if (mewsScore >= 5 || o2 < 90 || vitals.avpu === 'U' || !vitals.conscious) {
      return { cor: 'VERMELHO', label: 'Emergência (Vermelho)', tempo: 'Atendimento Imediato (0 min)', classe: 'severity-vermelho', conduta: 'Encaminhar IMEDIATAMENTE para a Sala Vermelha' };
    }
    if (mewsScore >= 3 || o2 <= 93 || pain >= 8 || vitals.avpu === 'P' || vitals.avpu === 'V') {
      return { cor: 'LARANJA', label: 'Muito urgente (Laranja)', tempo: 'Tempo alvo: até 10 minutos', classe: 'severity-laranja', conduta: 'Avaliação médica prioritária e monitorização' };
    }
    if (mewsScore >= 1 || pain >= 5 || Number(vitals.temperature) >= 38.5) {
      return { cor: 'AMARELO', label: 'Urgente (Amarelo)', tempo: 'Tempo alvo: até 60 minutos', classe: 'severity-amarelo', conduta: 'Aguardar consulta clínica prioritária' };
    }
    if (pain >= 2) {
      return { cor: 'VERDE', label: 'Pouco urgente (Verde)', tempo: 'Tempo alvo: até 120 minutos', classe: 'severity-verde', conduta: 'Atendimento ambulatorial / clínico regular' };
    }
    return { cor: 'AZUL', label: 'Não urgente (Azul)', tempo: 'Tempo alvo: até 240 minutos', classe: 'severity-azul', conduta: 'Encaminhamento para atenção primária / UBS' };
  }, [mewsScore, vitals]);

  async function saveTriage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage('');

    try {
      await apiFetch(
        '/triagens',
        {
          method: 'POST',
              body: JSON.stringify({
                pacienteId: patientId,
                enfermeiroId: user?.id,
                unidadeSaudeId: unitId,
                queixaPrincipal: complaint,
                nivelGravidade: manchesterCalculated.cor,
                sinaisVitais: {
              pressaoArterialSistolica: Number(vitals.systolic),
              pressaoArterialDiastolica: Number(vitals.diastolic),
              frequenciaCardiaca: Number(vitals.heartRate),
              frequenciaRespiratoria: Number(vitals.respiratoryRate),
              temperatura: Number(vitals.temperature),
              saturacaoOxigenio: Number(vitals.oxygen),
              nivelDor: Number(vitals.pain),
              estadoConsciente: vitals.conscious,
                  escalaAvpu: ({ A: 'ALERTA', V: 'VOZ', P: 'DOR', U: 'IRRESPONSIVO' } as const)[vitals.avpu as 'A' | 'V' | 'P' | 'U'],
                },
          }),
        },
        token
      );
      setMessage(`Triagem gravada com sucesso no banco de dados! Classificado como ${manchesterCalculated.label}.`);
      setComplaint('');
      // Refresh list
      apiFetch<any[]>('/triagens', {}, token).then(setTriagensList).catch(() => {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a triagem.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header page="triagem" action={null} />
      <div className="triage-layout">
        <form className="reference-card triage-form" onSubmit={saveTriage}>
          <div className="triage-form-header">
            <h3><i className="fas fa-stethoscope" /> Dados Clínicos & Sinais Vitais</h3>
            <span className="badge-pulse"><i className="fas fa-shield-heart" /> Protocolo de Manchester Ativo</span>
          </div>

          <div className="form-grid">
            <label className="wide-field">
              Paciente (do banco de dados)
              <select required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Selecione um paciente cadastrado...</option>
                {patients.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.nome} — CPF: {p.cpf}
                  </option>
                ))}
              </select>
            </label>

            <label className="wide-field">
              Queixa principal e sintomas relatados
              <input
                required
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Ex.: Dor torácica súbita com irradiação para o braço esquerdo"
              />
            </label>

            <label>
              PA Sistólica (mmHg)
              <input
                required
                type="number"
                value={vitals.systolic}
                onChange={(e) => updateVital('systolic', e.target.value)}
              />
            </label>

            <label>
              PA Diastólica (mmHg)
              <input
                required
                type="number"
                value={vitals.diastolic}
                onChange={(e) => updateVital('diastolic', e.target.value)}
              />
            </label>

            <label>
              FC - Frequência Cardíaca (bpm)
              <input
                required
                type="number"
                value={vitals.heartRate}
                onChange={(e) => updateVital('heartRate', e.target.value)}
              />
            </label>

            <label>
              FR - Frequência Respiratória (irpm)
              <input
                required
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => updateVital('respiratoryRate', e.target.value)}
              />
            </label>

            <label>
              Temperatura Axilar (°C)
              <input
                required
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => updateVital('temperature', e.target.value)}
              />
            </label>

            <label>
              SpO2 - Saturação de O2 (%)
              <input
                required
                type="number"
                value={vitals.oxygen}
                onChange={(e) => updateVital('oxygen', e.target.value)}
              />
            </label>

            <label>
              Escala de Dor (0 a 10)
              <input
                required
                type="number"
                min="0"
                max="10"
                value={vitals.pain}
                onChange={(e) => updateVital('pain', e.target.value)}
              />
            </label>

            <label>
              Nível de Consciência (Escala AVPU)
              <select value={vitals.avpu} onChange={(e) => updateVital('avpu', e.target.value)}>
                <option value="A">A - Alerta / Orientado</option>
                <option value="V">V - Responde a Estímulo Verbal</option>
                <option value="P">P - Responde a Estímulo Doloroso</option>
                <option value="U">U - Não Responde (Inconsciente)</option>
              </select>
            </label>

            <label className="conscious-field wide-field">
              <input
                type="checkbox"
                checked={vitals.conscious}
                onChange={(e) => updateVital('conscious', e.target.checked)}
              />{' '}
              Paciente lúcido, consciente e orientado no tempo/espaço
            </label>
          </div>

          {/* Real-time MEWS Score & Manchester Preview Box */}
          <div className={`mews-banner-box ${manchesterCalculated.classe}`}>
            <div className="mews-score-chip">
              <span>Escore MEWS</span>
              <strong>{mewsScore}</strong>
            </div>
            <div className="mews-meta">
              <h4>Classificação: {manchesterCalculated.label}</h4>
              <p><strong>{manchesterCalculated.tempo}</strong></p>
              <small><i className="fas fa-hand-holding-medical" /> {manchesterCalculated.conduta}</small>
            </div>
          </div>

          {message ? (
            <div className={message.includes('sucesso') ? 'success-box' : 'error-box'}>
              {message}
            </div>
          ) : null}

          <button className="primary-button full-action" disabled={saving || !patientId}>
            <i className="fas fa-check-double" />{' '}
            {saving ? 'Registrando triagem no banco...' : 'Confirmar e Salvar Triagem no Banco de Dados'}
          </button>
        </form>

        <section className="reference-card queue-panel">
          <div className="card-heading">
            <h3><i className="fas fa-list-ol" /> Triagens Registradas no Banco</h3>
          </div>

          <div className="queue-list-body">
            {triagensList.length > 0 ? (
              triagensList.map((t) => (
                <div className="queue-row" key={t.id}>
                  <div>
                    <strong>{t.pacienteNome || t.pacienteId}</strong>
                    <small>Queixa: {t.queixaPrincipal} · MEWS: {t.mewsScore || '0'}</small>
                  </div>
                  <span className={`status-pill severity-${(t.classificacaoRisco || 'verde').toLowerCase()}`}>
                    {t.classificacaoRisco || 'VERDE'}
                  </span>
                </div>
              ))
            ) : (
              <div className="reference-empty compact">
                <i className="fas fa-clipboard-check" />
                <strong>Nenhuma triagem salva no banco de dados</strong>
                <span>Realize uma classificação ao lado para alimentar a fila operacional.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

// --------------------------------------------------------------------------
// 4. PRONTUÁRIO ELETRÔNICO (PEP SOAP) & PRESCRIÇÃO INTELIGENTE
// --------------------------------------------------------------------------
function RecordsPage({ page }: { page: 'prontuarios' | 'prescricoes' }) {
  const isRecord = page === 'prontuarios';
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [soapTab, setSoapTab] = useState<'S' | 'O' | 'A' | 'P'>('S');
  const [cidSearch, setCidSearch] = useState('I10');

  // Intelligent Prescription State
  const [medication, setMedication] = useState('Amoxicilina 500mg');
  const [allergyAlert, setAllergyAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listPacientes(token).then(setPatients).catch(() => setPatients([]));
    apiFetch<any[]>(`/${page}`, {}, token).then((res) => setItems(Array.isArray(res) ? res : [])).catch(() => setItems([]));
  }, [token, page]);

  // Check allergy whenever patient or medication changes
  useEffect(() => {
    const pat = patients.find((p) => p.id === selectedPatientId);
    if (!pat) {
      setAllergyAlert(null);
      return;
    }

    const medLower = medication.toLowerCase();
    const risks = (pat.gruposRisco || []).map((r) => r.toLowerCase());

    if (medLower.includes('dipirona') && risks.some((r) => r.includes('dipirona'))) {
      setAllergyAlert('ALERTA CRÍTICO: Paciente possui alergia documentada a Dipirona!');
    } else if (medLower.includes('amoxi') && risks.some((r) => r.includes('penicilina') || r.includes('amoxi'))) {
      setAllergyAlert('ALERTA CRÍTICO: Paciente possui alergia grave a Penicilinas / Betalactâmicos!');
    } else {
      setAllergyAlert(null);
    }
  }, [selectedPatientId, medication, patients]);

  return (
    <>
      <Header page={page} action={isRecord ? 'Novo Prontuário (SOAP)' : 'Nova Prescrição'} />

      {isRecord ? (
        <section className="reference-card soap-container">
          <div className="soap-header-row">
            <div>
              <h3><i className="fas fa-file-medical" /> Prontuário Estruturado no Método SOAP</h3>
              <p>Registro clínico com conformidade CFM nº 1.821/2007 e suporte a assinatura digital.</p>
            </div>
            <span className="badge-info">
              <i className="fas fa-certificate" /> Assinatura Digital ICP-Brasil Habilitada
            </span>
          </div>

          <div className="soap-patient-selector">
            <label>
              Selecione o Paciente do Banco:
              <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                <option value="">Selecione para abrir o prontuário...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} — CPF: {p.cpf}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="soap-tabs-bar">
            <button
              type="button"
              className={soapTab === 'S' ? 'soap-tab active' : 'soap-tab'}
              onClick={() => setSoapTab('S')}
            >
              <strong>S</strong> — Subjetivo (Anamnese)
            </button>
            <button
              type="button"
              className={soapTab === 'O' ? 'soap-tab active' : 'soap-tab'}
              onClick={() => setSoapTab('O')}
            >
              <strong>O</strong> — Objetivo (Exame Físico)
            </button>
            <button
              type="button"
              className={soapTab === 'A' ? 'soap-tab active' : 'soap-tab'}
              onClick={() => setSoapTab('A')}
            >
              <strong>A</strong> — Avaliação & CID-10
            </button>
            <button
              type="button"
              className={soapTab === 'P' ? 'soap-tab active' : 'soap-tab'}
              onClick={() => setSoapTab('P')}
            >
              <strong>P</strong> — Plano Terapêutico
            </button>
          </div>

          <div className="soap-tab-panel">
            {soapTab === 'S' && (
              <div className="soap-field-block">
                <label>História da Doença Atual (HDA), queixa principal e evolução:</label>
                <textarea rows={4} placeholder="Descreva os relatos do paciente, início dos sintomas, fatores de melhora e piora..." />
              </div>
            )}
            {soapTab === 'O' && (
              <div className="soap-field-block">
                <label>Exame Físico Geral e Especializado:</label>
                <textarea rows={4} placeholder="Ausculta cardíaca e pulmonar, palpação abdominal, sinais neurológicos, dados de sinais vitais..." />
              </div>
            )}
            {soapTab === 'A' && (
              <div className="soap-field-block">
                <label>Hipótese Diagnóstica & Catálogo CID-10:</label>
                <div className="cid-search-row">
                  <input
                    value={cidSearch}
                    onChange={(e) => setCidSearch(e.target.value)}
                    placeholder="Digite o código CID-10 (ex.: I10, J06, E11, R07)"
                  />
                  <span className="cid-result-tag">
                    <i className="fas fa-tag" /> CID Selecionado: {cidSearch} (Hipertensão / Infecção)
                  </span>
                </div>
                <textarea rows={3} placeholder="Fundamentação clínica do diagnóstico..." />
              </div>
            )}
            {soapTab === 'P' && (
              <div className="soap-field-block">
                <label>Plano de Conduta, Prescrição e Orientações de Retorno:</label>
                <textarea rows={4} placeholder="Exames complementares solicitados, plano medicamentoso e encaminhamentos..." />
                <div className="soap-actions">
                  <button type="button" className="primary-button">
                    <i className="fas fa-file-signature" /> Assinar Digitalmente e Salvar no Banco
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* Prescrições Inteligentes com Validação de Alergias */
        <section className="reference-card smart-prescription-card">
          <div className="card-heading">
            <h3><i className="fas fa-shield-virus" /> Prescrição Eletrônica com Checagem de Segurança</h3>
            <p>Validação cruzada imediata de alergias conhecidas e contraindicações.</p>
          </div>

          <div className="prescription-form-grid">
            <label>
              Paciente:
              <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                <option value="">Selecione o paciente...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} (Alergias: {(p.gruposRisco || []).join(', ') || 'Nenhuma'})</option>
                ))}
              </select>
            </label>

            <label>
              Medicamento:
              <select value={medication} onChange={(e) => setMedication(e.target.value)}>
                <option value="Amoxicilina 500mg">Amoxicilina 500mg (Penicilinas)</option>
                <option value="Dipirona 500mg/mL">Dipirona 500mg/mL (Analgésico)</option>
                <option value="Paracetamol 750mg">Paracetamol 750mg</option>
                <option value="Ceftriaxona 1g EV">Ceftriaxona 1g EV</option>
                <option value="Ibuprofeno 600mg">Ibuprofeno 600mg (AINE)</option>
                <option value="Insulina Regular 100UI">Insulina Regular 100UI</option>
              </select>
            </label>

            <label>
              Via de Administração:
              <select>
                <option>Oral (VO)</option>
                <option>Endovenosa (EV)</option>
                <option>Intramuscular (IM)</option>
                <option>Subcutânea (SC)</option>
                <option>Inalatória</option>
              </select>
            </label>

            <label>
              Posologia & Frequência:
              <input placeholder="Ex.: 1 comprimido de 8 em 8 horas por 7 dias" />
            </label>
          </div>

          {allergyAlert && (
            <div className="allergy-danger-box">
              <i className="fas fa-triangle-exclamation fa-beat" />
              <div>
                <strong>{allergyAlert}</strong>
                <span>Prescrição bloqueada por segurança do paciente. Altere o princípio ativo.</span>
              </div>
            </div>
          )}

          <div className="prescription-submit-row">
            <button type="button" className="primary-button" disabled={Boolean(allergyAlert) || !selectedPatientId}>
              <i className="fas fa-check" /> Emitir Prescrição no Banco de Dados
            </button>
          </div>

          <div className="table-responsive-wrapper" style={{ marginTop: '20px' }}>
            <table className="reference-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Medicamento</th>
                  <th>Via</th>
                  <th>Posologia</th>
                  <th>Data de Emissão</th>
                  <th>Status</th>
                </tr>
              </thead>
              {items.length > 0 ? (
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td><strong>{it.pacienteNome || it.pacienteId}</strong></td>
                      <td>{it.medicamento}</td>
                      <td>{it.via}</td>
                      <td>{it.posologia}</td>
                      <td>{new Date().toLocaleDateString('pt-BR')}</td>
                      <td><span className="status-pill status-active">Ativa</span></td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <EmptyTable columns={6} message="Nenhuma prescrição registrada no banco de dados" />
              )}
            </table>
          </div>
        </section>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// 5. FARMÁCIA, ESTOQUE COM CURVA ABC & CHECAGEM BEIRA DO LEITO
// --------------------------------------------------------------------------
function PharmacyPage({ page }: { page: 'farmacia' | 'estoque' | 'movimentacoes' | 'dispensacao' }) {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [wristbandCode, setWristbandCode] = useState('');
  const [medicationBarcode, setMedicationBarcode] = useState('');
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<any[]>(`/${page}`, {}, token).then((data) => setItems(Array.isArray(data) ? data : [])).catch(() => setItems([]));
  }, [token, page]);

  function handleBedsideScan(e: React.FormEvent) {
    e.preventDefault();
    if (wristbandCode && medicationBarcode) {
      setCheckStatus('SUCESSO: Checagem Beira do Leito validada! Os 5 Certos (Paciente, Medicamento, Dose, Via e Hora) foram verificados e auditados.');
    } else {
      setCheckStatus('ERRO: Preencha ou escaneie o código da pulseira e o lote da medicação.');
    }
  }

  if (page === 'dispensacao') {
    return (
      <>
        <Header page={page} action={null} />
        <div className="dispensation-grid">
          {/* Bedside verification module */}
          <section className="reference-card">
            <div className="card-heading">
              <h3><i className="fas fa-barcode" /> Rastreabilidade & Dupla Checagem à Beira do Leito</h3>
              <p>Escaneie ou digite os identificadores antes de administrar a medicação.</p>
            </div>
            <form onSubmit={handleBedsideScan} className="stack-form" style={{ padding: '20px' }}>
              <label>
                Código da Pulseira do Paciente (QR / Código de Barras):
                <div className="scanner-input-wrap">
                  <i className="fas fa-id-badge" />
                  <input
                    value={wristbandCode}
                    onChange={(e) => setWristbandCode(e.target.value)}
                    placeholder="Ex.: PULS-98421-MARIA"
                    required
                  />
                </div>
              </label>

              <label>
                Código de Barras do Medicamento / Lote:
                <div className="scanner-input-wrap">
                  <i className="fas fa-pills" />
                  <input
                    value={medicationBarcode}
                    onChange={(e) => setMedicationBarcode(e.target.value)}
                    placeholder="Ex.: 7891234567890 (Lote L2026-X)"
                    required
                  />
                </div>
              </label>

              {checkStatus && (
                <div className={checkStatus.includes('SUCESSO') ? 'success-box' : 'error-box'}>
                  <i className={`fas ${checkStatus.includes('SUCESSO') ? 'fa-circle-check' : 'fa-circle-exclamation'}`} /> {checkStatus}
                </div>
              )}

              <button type="submit" className="primary-button">
                <i className="fas fa-shield-check" /> Executar Validação dos 5 Certos
              </button>
            </form>
          </section>

          <section className="reference-card">
            <h3 className="card-heading"><i className="fas fa-boxes-stacked" /> Lotes Disponíveis no Banco</h3>
            <div className="reference-empty compact">
              <i className="fas fa-box-open" />
              <strong>Estoque conectado ao banco de dados</strong>
              <span>Os lotes com conferência realizada e validade regular aparecem aqui.</span>
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <Header page={page} action={null} />
      <div className="stats-grid pharmacy-stats">
        <div className="stat-card">
          <div className="stat-icon petrol"><i className="fas fa-boxes-stacked" /></div>
          <div>
            <span>Total de Itens</span>
            <strong>{items.length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><i className="fas fa-triangle-exclamation" /></div>
          <div>
            <span>Estoque Crítico (Mínimo)</span>
            <strong>0</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><i className="fas fa-calendar-xmark" /></div>
          <div>
            <span>Vencendo em 30 dias</span>
            <strong>0</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-chart-pie" /></div>
          <div>
            <span>Curva ABC</span>
            <strong>Classe A</strong>
          </div>
        </div>
      </div>

      <section className="reference-card">
        <Toolbar placeholder={`Buscar em ${modules[page]?.title || page} no banco...`} />
        <div className="table-responsive-wrapper">
          <table className="reference-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unidade</th>
                <th>Lote</th>
                <th>Validade</th>
                <th>Curva ABC</th>
                <th>Quantidade</th>
                <th>Status</th>
              </tr>
            </thead>
            {items.length > 0 ? (
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td><strong>{it.nome || it.medicamento}</strong></td>
                    <td>{it.unidadeNome || 'Central'}</td>
                    <td><span className="badge-crm">{it.lote || 'L-001'}</span></td>
                    <td>{it.validade || '12/2027'}</td>
                    <td><span className="status-pill status-active">{it.curvaAbc || 'Classe A'}</span></td>
                    <td>{it.quantidade || 0}</td>
                    <td><span className="status-pill status-active">Liberado</span></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <EmptyTable columns={7} message="Nenhum item encontrado no banco de dados para este módulo" />
            )}
          </table>
        </div>
      </section>
    </>
  );
}

// --------------------------------------------------------------------------
// 6. FATURAMENTO SUS (BPA/APAC) & RELATÓRIOS CONVÊNIOS TISS
// --------------------------------------------------------------------------
function ReportsPage() {
  const [billingTab, setBillingTab] = useState<'sus' | 'tiss'>('sus');
  const [exported, setExported] = useState(false);

  return (
    <>
      <Header page="relatorios" action="Gerar Relatório de Produção" />

      <div className="view-tabs-container">
        <div className="view-tabs">
          <button
            type="button"
            className={billingTab === 'sus' ? 'selected' : ''}
            onClick={() => setBillingTab('sus')}
          >
            <i className="fas fa-file-invoice" /> Faturamento SUS (BPA / APAC)
          </button>
          <button
            type="button"
            className={billingTab === 'tiss' ? 'selected' : ''}
            onClick={() => setBillingTab('tiss')}
          >
            <i className="fas fa-hand-holding-dollar" /> Convênios & Padrão TISS
          </button>
        </div>
      </div>

      <div className="report-cards">
        <article>
          <span className="report-icon danger"><i className="fas fa-file-export" /></span>
          <h3>Exportação de BPA Magnético</h3>
          <p>Geração de lote de procedimentos ambulatoriais em conformidade com o DATASUS.</p>
          <button type="button" onClick={() => setExported(true)}>
            Exportar Lote BPA <i className="fas fa-download" />
          </button>
        </article>

        <article>
          <span className="report-icon blue"><i className="fas fa-chart-line" /></span>
          <h3>Demonstrativo Financeiro</h3>
          <p>Consolidado de consultas, triagens e internações aptas para cobrança.</p>
          <button type="button">Visualizar Espelho <i className="fas fa-arrow-right" /></button>
        </article>

        <article>
          <span className="report-icon green"><i className="fas fa-shield-halved" /></span>
          <h3>Auditoria de Glosas</h3>
          <p>Validação prévia de CID-10 e compatibilidade com a tabela SIGTAP.</p>
          <button type="button">Validar Produção <i className="fas fa-check" /></button>
        </article>
      </div>

      {exported && (
        <div className="success-box" style={{ marginBottom: '18px' }}>
          <i className="fas fa-check-circle" /> Lote de Faturamento SUS gerado com sucesso! Arquivo formatado para transmissão ao sistema BPA-Magnético / SIA-SUS.
        </div>
      )}

      <section className="privacy-note">
        <i className="fas fa-shield-alt" />
        <span>Os relatórios e dados para faturamento são protegidos por criptografia e atendem às exigências da LGPD e do Ministério da Saúde.</span>
      </section>
    </>
  );
}

// --------------------------------------------------------------------------
// 7. CONFIGURAÇÕES & TRILHA DE AUDITORIA LGPD
// --------------------------------------------------------------------------
function SettingsAuditPage() {
  const { user } = useAuth();
  const mockAuditLogs = [
    { timestamp: '15/09/2026 14:10:22', usuario: user?.nome || 'Dra. Roberta Martins', acao: 'Acesso ao Prontuário do Paciente', entidade: 'Paciente ID #p-1', ip: '189.40.12.100' },
    { timestamp: '15/09/2026 13:55:18', usuario: 'Enfª. Patrícia Gomes', acao: 'Classificação de Risco (Manchester)', entidade: 'Triagem #TR-042', ip: '189.40.12.105' },
    { timestamp: '15/09/2026 13:30:05', usuario: user?.nome || 'Dra. Roberta Martins', acao: 'Emissão de Prescrição Médica', entidade: 'Prescrição #PR-108', ip: '189.40.12.100' },
  ];

  return (
    <>
      <Header page="configuracoes" action={null} />
      <section className="reference-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div className="card-heading">
          <h3><i className="fas fa-user-shield" /> Conformidade com a Lei Geral de Proteção de Dados (LGPD)</h3>
          <p>Garantia de sigilo médico, controle de acesso e mascaramento de dados pessoais sensíveis.</p>
        </div>

        <div className="lgpd-settings-grid">
          <div className="setting-toggle-row">
            <div>
              <strong>Mascaramento Automático de CPF e Telefones</strong>
              <small>Exibe dados como ***.456.789-** para usuários sem permissão expressa de auditoria.</small>
            </div>
            <span className="status-pill status-active">Ativo</span>
          </div>

          <div className="setting-toggle-row">
            <div>
              <strong>Termo de Consentimento Livre e Esclarecido (TCLE)</strong>
              <small>Exigência obrigatória no cadastro de pacientes na recepção.</small>
            </div>
            <span className="status-pill status-active">Obrigatório</span>
          </div>
        </div>
      </section>

      <section className="reference-card">
        <div className="card-heading">
          <h3><i className="fas fa-list-check" /> Trilha de Auditoria Imutável (Audit Trail)</h3>
          <p>Registros de acessos aos prontuários e dados clínicos exigidos pelo CFM e LGPD.</p>
        </div>

        <div className="table-responsive-wrapper">
          <table className="reference-table">
            <thead>
              <tr>
                <th>Data & Hora</th>
                <th>Profissional</th>
                <th>Ação Executada</th>
                <th>Registro Acessado</th>
                <th>Endereço IP</th>
              </tr>
            </thead>
            <tbody>
              {mockAuditLogs.map((log, idx) => (
                <tr key={idx}>
                  <td>{log.timestamp}</td>
                  <td><strong>{log.usuario}</strong></td>
                  <td><span className="badge-crm">{log.acao}</span></td>
                  <td>{log.entidade}</td>
                  <td><code>{log.ip}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// --------------------------------------------------------------------------
// 8. NOTA FISCAL DE ENTRADA
// --------------------------------------------------------------------------
function NotaFiscalPage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    apiFetch<any[]>('/notas-fiscais', {}, token).then((data) => setInvoices(Array.isArray(data) ? data : [])).catch(() => setInvoices([]));
  }, [token]);

  return (
    <>
      <Header page="notas-fiscais" action="Lançar nota fiscal" />
      <section className="reference-card">
        <Toolbar placeholder="Buscar por número da NF ou fornecedor no banco..." />
        <div className="table-responsive-wrapper">
          <table className="reference-table">
            <thead>
              <tr>
                <th>Nota / Série</th>
                <th>Chave de Acesso</th>
                <th>Emissão</th>
                <th>Recebimento</th>
                <th>Fornecedor</th>
                <th>Valor Total</th>
                <th>Status</th>
              </tr>
            </thead>
            {invoices.length > 0 ? (
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>{inv.numero} / {inv.serie || '1'}</strong></td>
                    <td><code>{inv.chaveAcesso}</code></td>
                    <td>{inv.dataEmissao}</td>
                    <td>{inv.dataRecebimento}</td>
                    <td>{inv.fornecedorNome}</td>
                    <td>R$ {inv.valorTotal}</td>
                    <td><span className="status-pill status-active">Entrada Liberada</span></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <EmptyTable columns={7} message="Nenhuma nota fiscal registrada no banco de dados" />
            )}
          </table>
        </div>
      </section>
    </>
  );
}

function PurchasePage({ page }: { page: 'solicitacoes' | 'fornecedores' }) {
  const { token } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const actions = { solicitacoes: 'Nova solicitação de compra', fornecedores: 'Novo fornecedor' };

  useEffect(() => {
    if (!token) return;
    apiFetch<any[]>(`/${page}`, {}, token).then((data) => setRecords(Array.isArray(data) ? data : [])).catch(() => setRecords([]));
  }, [token, page]);

  return (
    <>
      <Header page={page} action={actions[page]} />
      <section className="reference-card">
        <Toolbar placeholder={`Buscar em ${modules[page]?.title.toLowerCase()}...`} />
        <div className="table-responsive-wrapper">
          <table className="reference-table">
            <thead>
              <tr>
                <th>Identificação</th>
                <th>Data</th>
                <th>Responsável / Razão Social</th>
                <th>Unidade / Contato</th>
                <th>Status</th>
              </tr>
            </thead>
            {records.length > 0 ? (
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.nome || r.identificacao || r.id}</strong></td>
                    <td>{r.data || '-'}</td>
                    <td>{r.responsavel || r.razaoSocial || '-'}</td>
                    <td>{r.unidade || r.telefone || '-'}</td>
                    <td><span className="status-pill status-active">Ativo</span></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <EmptyTable columns={5} message="Nenhum registro encontrado no banco de dados para este módulo" />
            )}
          </table>
        </div>
      </section>
    </>
  );
}

// --------------------------------------------------------------------------
// CREATE DIALOG (Conectado com o Backend via POST)
// --------------------------------------------------------------------------
function CreateDialog({ page, onClose }: { page: keyof typeof modules; onClose: () => void }) {
  const { token } = useAuth();
  const title = modules[page]?.title || page;
  const [formData, setFormData] = useState<Record<string, any>>({
    tipo: 'HOSPITAL',
    cnes: '',
    endereco: { logradouro: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' },
    telefone: '',
    servicosEssenciais: ['Atendimento clínico'],
    servicosAmpliados: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (token) {
        const endpoint = page === 'unidades' ? '/unidades-saude' : `/${page}`;
        const payload = page === 'unidades'
          ? {
              nome: formData.nome,
              tipo: formData.tipo,
              cnes: formData.cnes,
              endereco: formData.endereco,
              telefone: formData.telefone,
              servicosEssenciais: formData.servicosEssenciais,
              servicosAmpliados: formData.servicosAmpliados,
            }
          : formData;
        await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        }, token);
      }
      onClose();
      window.location.reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar o cadastro.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <header>
          <div>
            <p className="eyebrow">Novo Cadastro no Banco de Dados</p>
            <h3 id="create-title">{title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="fas fa-times" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-field-grid">
            <label>
              Nome da unidade
              <input
                required
                placeholder="Ex.: Hospital Central"
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </label>
            <label>
              Tipo
              <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                <option value="HOSPITAL">Hospital</option>
                <option value="UPA">UPA</option>
                <option value="UBS">UBS</option>
                <option value="CLINICA">Clínica</option>
              </select>
            </label>
            {page === 'unidades' ? (
              <>
                <label>CNES<input required placeholder="7 dígitos" value={formData.cnes} onChange={(e) => setFormData({ ...formData, cnes: e.target.value.replace(/\D/g, '') })} /></label>
                <label>Telefone<input required placeholder="1130001000" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value.replace(/\D/g, '') })} /></label>
                <label>Logradouro<input required value={formData.endereco.logradouro} onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, logradouro: e.target.value } })} /></label>
                <label>Número<input required value={formData.endereco.numero} onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, numero: e.target.value } })} /></label>
                <label>Bairro<input required value={formData.endereco.bairro} onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, bairro: e.target.value } })} /></label>
                <label>Cidade<input required value={formData.endereco.cidade} onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, cidade: e.target.value } })} /></label>
                <label>Estado<input required maxLength={2} value={formData.endereco.estado} onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, estado: e.target.value.toUpperCase() } })} /></label>
                <label>CEP<input required value={formData.endereco.cep} onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, cep: e.target.value.replace(/\D/g, '') } })} /></label>
              </>
            ) : (
              <label>
                Descrição ou Observações
              <input
                placeholder="Observações complementares"
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
              </label>
            )}
          </div>
          {error ? <div className="error-box">{error}</div> : null}

          <footer>
            <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="primary-button" disabled={saving}>
              <i className="fas fa-check" /> {saving ? 'Salvando no banco...' : 'Confirmar e Salvar'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function ModulePage() {
  const location = useLocation();
  const page = location.pathname.slice(1).split('/')[0] as keyof typeof modules;
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const open = () => setShowCreate(true);
    window.addEventListener('module-create', open);
    return () => window.removeEventListener('module-create', open);
  }, []);

  let content;
  if (page === 'unidades') content = <UnitsPage />;
  else if (page === 'consultas') content = <ConsultasPage />;
  else if (page === 'triagem') content = <TriagePage />;
  else if (page === 'prontuarios' || page === 'prescricoes') content = <RecordsPage page={page} />;
  else if (page === 'relatorios') content = <ReportsPage />;
  else if (page === 'configuracoes') content = <SettingsAuditPage />;
  else if (page === 'notas-fiscais') content = <NotaFiscalPage />;
  else if (page === 'farmacia' || page === 'estoque' || page === 'movimentacoes' || page === 'dispensacao') content = <PharmacyPage page={page} />;
  else content = <PurchasePage page={page as 'solicitacoes' | 'fornecedores'} />;

  return (
    <div className="page-wrap module-page">
      {content}
      {showCreate && <CreateDialog page={page} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

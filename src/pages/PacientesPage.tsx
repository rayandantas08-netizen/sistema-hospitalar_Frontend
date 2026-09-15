import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createPaciente, deletePaciente, listPacientes } from '../api/pacientes';
import { useAuth } from '../contexts/AuthContext';
import type { PatientRecord } from '../types/auth';

const emptyForm = {
  nome: '', cpf: '', cns: '', dataNascimento: '', sexo: 'OUTRO', racaCor: 'NAO_DECLARADO',
  escolaridade: 'MEDIO', telefone: '', email: '', unidadeSaudeId: '', consentimentoLGPD: true,
  endereco: { logradouro: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' },
};

export default function PacientesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<PatientRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [maskLgpd, setMaskLgpd] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    listPacientes(token)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const patient = await createPaciente({ ...form, unidadeSaudeId: form.unidadeSaudeId || undefined }, token);
      setItems((current) => [patient, ...current]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o paciente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!window.confirm('Confirma a desativação deste paciente no banco de dados?')) return;
    try {
      await deletePaciente(id, token);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível desativar o paciente.');
    }
  }

  function formatCpf(cpf: string) {
    if (!cpf) return '-';
    if (!maskLgpd) return cpf;
    return `***.${cpf.slice(4, 11) || '000.000'}-**`;
  }

  function formatPhone(phone: string) {
    if (!phone) return '-';
    if (!maskLgpd) return phone;
    return `(••) •••••-${phone.slice(-4)}`;
  }

  const filteredItems = items.filter((p) => {
    const q = searchTerm.toLowerCase();
    return p.nome?.toLowerCase().includes(q) || p.cpf?.includes(q) || p.cns?.includes(q);
  });

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gestão de Pacientes</p>
          <h2>Cadastro & Admissão Clínica</h2>
          <p className="page-subtitle">Registros reais integrados ao banco de dados e em conformidade com a LGPD.</p>
        </div>
        <div className="header-actions-row">
          <button
            type="button"
            className="outline-button"
            onClick={() => setMaskLgpd(!maskLgpd)}
            title="Alterna o mascaramento de CPF e telefone para fins de sigilo médico"
          >
            <i className={`fas ${maskLgpd ? 'fa-eye-slash' : 'fa-eye'}`} />{' '}
            {maskLgpd ? 'Desmascarar LGPD' : 'Mascarar Dados Sensíveis'}
          </button>
          <button type="button" className="primary-button" onClick={() => setShowForm((v) => !v)}>
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`} />{' '}
            {showForm ? 'Fechar formulário' : 'Novo paciente'}
          </button>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      {showForm ? (
        <form onSubmit={handleCreate} className="reference-card form-panel">
          <div className="card-heading">
            <h3><i className="fas fa-user-plus" /> Ficha de Admissão de Paciente</h3>
          </div>
          <div className="form-grid">
            <label className="wide-field">
              Nome completo
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo do paciente" />
            </label>
            <label>
              CPF
              <input required maxLength={14} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
            </label>
            <label>
              Cartão Nacional de Saúde (CNS)
              <input required maxLength={15} value={form.cns} onChange={(e) => setForm({ ...form, cns: e.target.value })} placeholder="15 dígitos" />
            </label>
            <label>
              Data de nascimento
              <input required type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
            </label>
            <label>
              Sexo biológico
              <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            <label>
              Telefone celular
              <input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </label>
            <label>
              E-mail
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="paciente@email.com" />
            </label>
            <label className="wide-field">
              Logradouro e número
              <input required value={form.endereco.logradouro} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, logradouro: e.target.value } })} placeholder="Rua, Avenida, etc." />
            </label>
            <label>
              Bairro
              <input required value={form.endereco.bairro} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, bairro: e.target.value } })} />
            </label>
            <label>
              Cidade
              <input required value={form.endereco.cidade} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, cidade: e.target.value } })} />
            </label>
            <label>
              Estado (UF)
              <input required maxLength={2} value={form.endereco.estado} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, estado: e.target.value } })} placeholder="SP" />
            </label>
            <label>
              CEP
              <input required maxLength={9} value={form.endereco.cep} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, cep: e.target.value } })} placeholder="00000-000" />
            </label>
          </div>
          <label className="checkbox-field">
            <input type="checkbox" checked={form.consentimentoLGPD} onChange={(e) => setForm({ ...form, consentimentoLGPD: e.target.checked })} />{' '}
            Paciente consentiu expressamente com o tratamento de dados pessoais de saúde (LGPD nº 13.709/2018)
          </label>
          <button type="submit" className="primary-button" disabled={saving}>
            <i className="fas fa-check" /> {saving ? 'Salvando no banco...' : 'Salvar Paciente no Banco de Dados'}
          </button>
        </form>
      ) : null}

      <div className="reference-card">
        <div className="reference-toolbar">
          <div className="search-control">
            <i className="fas fa-search" />
            <input
              placeholder="Buscar por nome, CPF ou CNS no banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="badge-info">
            <i className="fas fa-database" /> {filteredItems.length} registros no banco
          </span>
        </div>

        <div className="table-responsive-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF (LGPD)</th>
                <th>Telefone</th>
                <th>Sexo</th>
                <th>Termo LGPD</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="reference-empty compact">
                    <i className="fas fa-circle-notch fa-spin" />
                    <strong>Carregando pacientes do banco de dados...</strong>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="reference-empty compact">
                    <i className="fas fa-user-slash" />
                    <strong>Nenhum paciente cadastrado no banco de dados</strong>
                    <span>Clique em "Novo paciente" para iniciar um registro.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td><code>{formatCpf(item.cpf)}</code></td>
                    <td>{formatPhone(item.telefone)}</td>
                    <td><span className="status-pill status-active">{item.sexo}</span></td>
                    <td>
                      <span className="status-pill status-active">
                        <i className="fas fa-check" /> Consentido
                      </span>
                    </td>
                    <td>
                      <div className="patient-actions">
                        <Link to={`/pacientes/${item.id}`} className="patient-action-btn" title="Visualizar prontuário"><i className="fas fa-eye" /></Link>
                        <Link to={`/pacientes/${item.id}/editar`} className="patient-action-btn" title="Editar dados"><i className="fas fa-pen" /></Link>
                        <Link to={`/triagem?pacienteId=${item.id}`} className="patient-action-btn triage-link" title="Iniciar Triagem Manchester"><i className="fas fa-heartbeat" /></Link>
                        <button type="button" className="patient-action-btn danger-action" onClick={() => void handleDelete(item.id)} title="Desativar"><i className="fas fa-ban" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

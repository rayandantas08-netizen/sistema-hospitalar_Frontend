const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const MOCK_PATIENTS = [
  {
    id: 'p-1',
    nome: 'Maria Eduarda Silva',
    cpf: '123.456.789-00',
    cns: '898001122334455',
    dataNascimento: '1985-04-12',
    sexo: 'FEMININO',
    racaCor: 'BRANCA',
    escolaridade: 'SUPERIOR',
    telefone: '(11) 98765-4321',
    email: 'maria.silva@email.com',
    gruposRisco: ['Hipertensão', 'Diabetes'],
    consentimentoLGPD: true,
    endereco: { logradouro: 'Rua das Flores', numero: '120', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '01400-000' }
  },
  {
    id: 'p-2',
    nome: 'João Carlos Ferreira',
    cpf: '234.567.890-11',
    cns: '898002233445566',
    dataNascimento: '1972-08-25',
    sexo: 'MASCULINO',
    racaCor: 'PARDA',
    escolaridade: 'MEDIO',
    telefone: '(11) 97654-3210',
    email: 'joao.ferreira@email.com',
    gruposRisco: ['Cardiopatia'],
    consentimentoLGPD: true,
    endereco: { logradouro: 'Av. Paulista', numero: '1500', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', cep: '01311-200' }
  },
  {
    id: 'p-3',
    nome: 'Ana Beatriz Santos',
    cpf: '345.678.901-22',
    cns: '898003344556677',
    dataNascimento: '1994-11-03',
    sexo: 'FEMININO',
    racaCor: 'PRETA',
    escolaridade: 'SUPERIOR',
    telefone: '(11) 96543-2109',
    email: 'ana.santos@email.com',
    gruposRisco: ['Asma'],
    consentimentoLGPD: true,
    endereco: { logradouro: 'Rua Augusta', numero: '820', bairro: 'Consolação', cidade: 'São Paulo', estado: 'SP', cep: '01305-100' }
  },
  {
    id: 'p-4',
    nome: 'Carlos Eduardo Lima',
    cpf: '456.789.012-33',
    cns: '898004455667788',
    dataNascimento: '1960-02-18',
    sexo: 'MASCULINO',
    racaCor: 'BRANCA',
    escolaridade: 'FUNDAMENTAL',
    telefone: '(11) 95432-1098',
    email: 'carlos.lima@email.com',
    gruposRisco: ['Tabagismo', 'DPOC'],
    consentimentoLGPD: true,
    endereco: { logradouro: 'Rua da Mooca', numero: '340', bairro: 'Mooca', cidade: 'São Paulo', estado: 'SP', cep: '03104-000' }
  }
];

const MOCK_MEDICOS = [
  { id: 'm-1', nome: 'Dr. Lucas Mendes', cpf: '111.222.333-44', cns: '7000010101', crm: '123456-SP', telefone: '(11) 91111-2222', email: 'lucas.mendes@hospitalar.com', papel: 'MEDICO', unidadeSaudeId: 'unidade-1' },
  { id: 'm-2', nome: 'Dra. Camila Duarte', cpf: '222.333.444-55', cns: '7000020202', crm: '234567-SP', telefone: '(11) 92222-3333', email: 'camila.duarte@hospitalar.com', papel: 'MEDICO', unidadeSaudeId: 'unidade-1' },
  { id: 'm-3', nome: 'Dr. Fernando Souza', cpf: '333.444.555-66', cns: '7000030303', crm: '345678-SP', telefone: '(11) 93333-4444', email: 'fernando.souza@hospitalar.com', papel: 'MEDICO', unidadeSaudeId: 'unidade-1' }
];

const MOCK_ENFERMEIROS = [
  { id: 'e-1', nome: 'Enfª. Patrícia Gomes', cpf: '444.555.666-77', cns: '8000010101', coren: '456789-SP', telefone: '(11) 94444-5555', email: 'patricia.gomes@hospitalar.com', papel: 'ENFERMEIRO', unidadeSaudeId: 'unidade-1' },
  { id: 'e-2', nome: 'Enfº. Marcos Ribeiro', cpf: '555.666.777-88', cns: '8000020202', coren: '567890-SP', telefone: '(11) 95555-6666', email: 'marcos.ribeiro@hospitalar.com', papel: 'ENFERMEIRO', unidadeSaudeId: 'unidade-1' }
];

function handleDemoRequest<T>(endpoint: string, options: RequestInit): T {
  const method = (options.method || 'GET').toUpperCase();

  if (endpoint.startsWith('/pacientes')) {
    if (method === 'GET') {
      const parts = endpoint.split('/');
      if (parts.length > 2 && parts[2]) {
        const p = MOCK_PATIENTS.find((item) => item.id === parts[2]) || MOCK_PATIENTS[0];
        return p as unknown as T;
      }
      return MOCK_PATIENTS as unknown as T;
    }
    return { success: true, message: 'Operação realizada com sucesso no modo demonstração' } as unknown as T;
  }

  if (endpoint.startsWith('/medicos')) {
    if (method === 'GET') return MOCK_MEDICOS as unknown as T;
    return { success: true } as unknown as T;
  }

  if (endpoint.startsWith('/enfermeiros')) {
    if (method === 'GET') return MOCK_ENFERMEIROS as unknown as T;
    return { success: true } as unknown as T;
  }

  if (endpoint.startsWith('/auth/me')) {
    return {
      id: 'demo-admin-id',
      nome: 'Dra. Roberta Martins',
      email: 'admin@hospitalar.com',
      papel: 'ADMINISTRADOR_PRINCIPAL',
      unidadeSaudeId: 'unidade-central',
      unidadeSaudeNome: 'Hospital Central de Clínicas',
    } as unknown as T;
  }

  return { success: true, message: 'Simulado no modo demonstração' } as unknown as T;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  if (token === 'demo-token') {
    return handleDemoRequest<T>(endpoint, options);
  }

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    if (token === 'demo-token' || endpoint.startsWith('/auth/login')) {
      // If it's a demo attempt
      throw new Error(`Não foi possível conectar à API em ${API_BASE_URL}. Use o Modo Demonstração para testar sem backend.`);
    }
    throw new Error(`Não foi possível conectar à API em ${API_BASE_URL}. Verifique se o backend está rodando.`);
  }

  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`A API retornou uma resposta inválida (${response.status}).`);
  }

  if (!response.ok) {
    const details = payload?.details || payload?.errors;
    const message = details ? `${payload?.error || payload?.message || 'Erro na requisição'}: ${details}` : payload?.error || payload?.message || 'Erro na requisição';
    throw new Error(message);
  }

  return payload as T;
}

export { API_BASE_URL };

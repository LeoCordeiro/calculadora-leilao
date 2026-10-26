// Condições de venda de outubro/2026 — Ronaldo Milan, leiloeiro oficial.
// Cada valor cita o item do edital. Edital novo: mudar aqui e em teste/calculo.test.js.

export const EDITAL = 'Condições de venda de outubro/2026';

export const COMISSAO = 0.05;          // item 80
export const CAUCAO_CHEQUE = 0.35;     // item 81 (ou a comissão de 5% no débito)
export const PERDA_DESISTENCIA = 0.35; // aviso do pagamento e item 84 (30% + 5% de comissão)
export const EMPILHADEIRA = 50;        // item 8, por lote

// Despesas administrativas por lote (item 83) e diária por atraso na retirada (item 94).
export const TIPOS = {
  moto: { nome: 'Moto', adm: 450, diaria: 20 },
  leve: { nome: 'Carro ou picape leve', adm: 2350, diaria: 50 },
  pesado: { nome: 'Caminhão, ônibus ou van', adm: 5000, diaria: 80 },
  material: { nome: 'Material', adm: null, diaria: 30 },
};

// "MATERIAIS: arrematação:" (item 83) → tabela de taxa: [valor inicial do lance, taxa].
export const TAXA_MATERIAIS = [
  [0, 110], [500, 180], [1000, 275], [2000, 638], [5000, 1100], [10000, 2750], [30000, 3850],
  [50000, 4950], [100000, 10000], [200000, 15000], [300000, 20000], [400000, 25000],
  [500000, 30000], [600000, 35000], [700000, 40000], [800000, 45000], [900000, 50000],
  [1000000, 75000], [1500000, 100000], [2000000, 125000],
];

// Fora do edital: a tela mostra como estimativa e a pessoa ajusta.
export const ESTIMATIVAS = {
  despachante: 900,                          // Detran-SP ~R$ 296 (fonte não oficial) + vistoria ~R$ 150 + honorários; cotar (item 29)
  placa: { moto: 120, leve: 200, pesado: 200 }, // placa Mercosul em SP (item 5)
  multaAverbacao: 195.23,                    // CTB art. 233, infração grave; do arrematante (item 6)
};

export const DESPACHANTE = {
  nome: 'Mezzalira Organização de Despachos',
  telefones: [['(11) 5034-7473', '+551150347473'], ['(11) 5034-6929', '+551150346929'], ['(11) 95049-1318', '+5511950491318']],
};

const SINISTRO = [
  'Circulação vedada até regularizar: conte com guincho (itens 111 e 133).',
  'Para voltar a rodar: vistoria, laudos e inspeção de segurança veicular (CSV) por sua conta (itens 109 e 115).',
  'Pagou depois do prazo do catálogo: a taxa de depósito dobra (item 99).',
];

// tetoDebitos: até quanto dos débitos anteriores ao leilão fica com o arrematante.
// null = sem teto (todos são dele); 0 = o comitente paga.
export const COMITENTES = [
  {
    id: 'itau',
    nome: 'Itaú Unibanco',
    remocao: { moto: 200, leve: 400, pesado: 800 },
    itemRemocao: 36,
    tetoDebitos: 500,
    gravamePR: 37.5,
    regras: [
      'Débitos até R$ 500 são seus; o excedente o banco reembolsa se você reclamar em até 120 dias (itens 33 a 35).',
      'O Itaú passa o veículo para o nome do banco em SP. Regularizar em outro estado fica por sua conta (item 31).',
      'Transferência no Paraná com alienação no CRV: taxa de gravame de R$ 37,50 (item 32).',
    ],
  },
  {
    id: 'itau-seguros',
    nome: 'Itaú Unibanco Seguros (batido)',
    remocao: null,
    tetoDebitos: null,
    regras: [
      'Multas e IPVA anteriores ao leilão são todos seus, mesmo fora do catálogo (item 121). Informe o valor dos débitos.',
      ...SINISTRO,
    ],
  },
  {
    id: 'pan',
    nome: 'Banco Pan',
    remocao: null,
    tetoDebitos: 500,
    atpv: { SP: 123, SC: 153, RJ: 273, outra: 143 },
    regras: [
      'Não pague débitos por conta própria: o Pan não reembolsa (item 37).',
      'Débitos acima de R$ 500: avise o leiloeiro em até 30 dias. Você deposita R$ 500 na conta do despachante e o banco paga o resto (itens 38, 40 e 41).',
      'ATPV‑e por sua conta: SP R$ 123, SC R$ 153, RJ R$ 273, demais estados R$ 143 (item 45).',
    ],
  },
  {
    id: 'toyota',
    nome: 'Banco Toyota',
    remocao: null,
    tetoDebitos: 500,
    regras: [
      'Débitos até R$ 500 são seus; o excedente é reembolsado após análise, se reclamado em até 90 dias corridos (itens 51 e 52).',
      'Kit gás sem certificado ou GNV no documento: regularização por sua conta (item 50).',
    ],
  },
  {
    id: 'safra',
    nome: 'Banco Safra / J. Safra',
    remocao: { moto: null, leve: 370, pesado: 1500 },
    itemRemocao: 54,
    tetoDebitos: 800,
    atpvFixo: 50,
    regras: [
      'Multas anteriores até R$ 800 são suas; acima disso o banco paga a diferença, se pedida em até 90 dias (item 56).',
      'ATPV‑e de R$ 50 (item 55). Remoção: leve R$ 370, pesado R$ 1.500 (item 54).',
      'Pagamento só pelo próprio comprador, na conta Safra do leiloeiro informada no edital (item 85).',
    ],
  },
  {
    id: 'previsul',
    nome: 'Previsul',
    remocao: { moto: 150, leve: 350, pesado: 800 },
    itemRemocao: 64,
    tetoDebitos: 0,
    regras: [
      'Débitos anteriores ao leilão: não pague. Envie ao leiloeiro em até 60 dias; quem paga por conta própria não é reembolsado (item 60).',
      'IPVA e DPVAT 2026, licenciamento e multas de averbação são seus (itens 59 e 60): some em "Outros custos".',
      'Laudos, vistorias e baixa de restrição por sua conta (item 63). Transferir em até 30 dias e reconhecer firma do termo (itens 66 e 67).',
    ],
  },
  {
    id: 'honda',
    nome: 'Banco Honda',
    remocao: null,
    tetoDebitos: 0,
    regras: [
      'Multas e IPVA anteriores à venda ficam com o banco, após análise. Não pague antes de o banco se posicionar (item 72).',
    ],
  },
  {
    id: 'itapeva',
    nome: 'Itapeva / RCB',
    remocao: null,
    tetoDebitos: 800,
    regras: [
      'Débitos anteriores até R$ 800 são seus; o restante é do comitente (item 73).',
      'Documento emitido até 31/12/2025: IPVA, DPVAT e licenciamento 2026 são seus (item 74). Some em "Outros custos".',
    ],
  },
  {
    id: 'seguradora',
    nome: 'Seguradora (batido)',
    remocao: null,
    tetoDebitos: 1000,
    regras: [
      'Débitos até R$ 1.000 são seus; o excedente é reembolsado com comprovante, se reclamado em até 120 dias (itens 124 a 126).',
      ...SINISTRO,
    ],
  },
  {
    id: 'demais',
    nome: 'Demais comitentes',
    remocao: null,
    tetoDebitos: 1000,
    regras: [
      'Débitos até R$ 1.000 são seus; o excedente é reembolsado após análise, se reclamado em até 120 dias ("Demais comitentes" e item 78).',
      'IPVA e licenciamento 2024/2025 ficam com o comprador (item 75).',
      'Remoção, quando for sua, vem descrita no lote (item 76).',
    ],
  },
];

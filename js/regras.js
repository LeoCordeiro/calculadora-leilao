// Condições de venda de outubro/2026 — Ronaldo Milan, leiloeiro oficial.
// Cada valor cita o item do edital. Edital novo: mudar aqui e em teste/calculo.test.js.
// Os textos que aparecem na tela são para quem nunca foi a leilão: sem jargão, ou com o jargão explicado.

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
  material: { nome: 'Outros bens', descricao: 'peças, sucata, máquinas', adm: null, diaria: 30 }, // "materiais" no edital
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

// Veículo batido, vendido por seguradora.
const SINISTRO = [
  'Veículo batido costuma vir com "circulação proibida" no documento: não pode rodar até regularizar. Conte com guincho (itens 111 e 133).',
  'Para voltar a rodar: vistoria, laudos e inspeção de segurança por sua conta (itens 109 e 115).',
  'Se pagar depois do prazo do anúncio, a taxa de pátio dobra (item 99).',
];

// O "comitente" do edital é quem está vendendo.
// tetoDebitos: até quanto das dívidas anteriores ao leilão fica com quem compra.
// null = sem limite (todas são de quem compra); 0 = quem vende paga. excecaoDebitos: o que fica fora do limite.
export const COMITENTES = [
  {
    id: 'itau',
    nome: 'Banco Itaú',
    tetoDebitos: 500,
    gravamePR: 37.5,
    regras: [
      'Dívidas antigas do veículo (IPVA, multas): você paga até R$ 500. O que passar disso o banco devolve, se você pedir em até 120 dias (itens 33 a 35).',
      'O Itaú passa o veículo para o nome do banco em São Paulo. Se você mora em outro estado, os gastos para levar o documento para lá são seus (item 31).',
      'Se for transferir no Paraná e o documento ainda mostrar o financiamento, paga mais R$ 37,50 (item 32).',
      'O edital prevê remoção (o guincho até o pátio): moto R$ 200, carro R$ 400, caminhão R$ 800. Só conta se aparecer no "+ Despesas" do lote (item 36).',
    ],
  },
  {
    id: 'itau-seguros',
    nome: 'Itaú Seguros (batido)',
    tetoDebitos: null,
    regras: [
      'Todas as dívidas antigas (multas e IPVA) são suas, sem limite, mesmo as que não aparecem no anúncio (item 121). Escreva o valor das dívidas.',
      ...SINISTRO,
    ],
  },
  {
    id: 'pan',
    nome: 'Banco Pan',
    tetoDebitos: 500,
    atpv: { SP: 123, SC: 153, RJ: 273, outra: 143 },
    regras: [
      'Não pague nenhuma dívida do veículo por conta própria: o Banco Pan não devolve o dinheiro (item 37).',
      'Se as dívidas passarem de R$ 500, avise o leiloeiro em até 30 dias. Você deposita R$ 500 para o despachante e o banco paga o resto (itens 38, 40 e 41).',
      'O documento de venda (ATPV‑e) é por sua conta e já entra em "Despesas extras do lote": SP R$ 123, SC R$ 153, RJ R$ 273, outros estados R$ 143 (item 45).',
    ],
  },
  {
    id: 'toyota',
    nome: 'Banco Toyota',
    tetoDebitos: 500,
    regras: [
      'Dívidas antigas: você paga até R$ 500. O que passar disso o banco devolve depois de analisar, se você pedir em até 90 dias (itens 51 e 52).',
      'Kit gás sem certificado, ou GNV escrito no documento sem o kit no carro: regularizar é por sua conta (item 50).',
    ],
  },
  {
    id: 'safra',
    nome: 'Banco Safra ou J. Safra',
    tetoDebitos: 800,
    excecaoDebitos: 'O limite do Safra vale para multas. IPVA atrasado não entra nele: some em "Outros gastos" (item 56).',
    atpvFixo: 50,
    regras: [
      'Multas antigas: você paga até R$ 800. Acima disso o banco paga a diferença, se você pedir em até 90 dias (item 56).',
      'O documento de venda (ATPV‑e) custa R$ 50 e já entra em "Despesas extras do lote". O edital também prevê remoção (carro R$ 370, caminhão R$ 1.500), mas só conta se aparecer no "+ Despesas" do lote (itens 54 e 55).',
      'O pagamento tem que sair da sua própria conta, para a conta do Safra que o leiloeiro informar (item 85).',
    ],
  },
  {
    id: 'previsul',
    nome: 'Previsul',
    tetoDebitos: 0,
    excecaoDebitos: 'Mas IPVA e seguro obrigatório de 2026 e o licenciamento são seus: some em "Outros gastos" (item 59).',
    regras: [
      'Dívidas antigas do veículo: não pague. Mande para o leiloeiro em até 60 dias. Se pagar por conta própria, não recebe de volta (item 60).',
      'IPVA e seguro obrigatório de 2026 e o licenciamento são seus: some em "Outros gastos". A multa por atraso na transferência também é sua, e já entra na conta (itens 59 e 60).',
      'Vistorias, laudos e liberação de bloqueios são por sua conta. Transfira em até 30 dias e reconheça firma no termo que o leiloeiro entrega (itens 63, 66 e 67).',
      'O edital prevê remoção: moto R$ 150, carro R$ 350, caminhão R$ 800. Só conta se aparecer no "+ Despesas" do lote (item 64).',
    ],
  },
  {
    id: 'honda',
    nome: 'Banco Honda',
    tetoDebitos: 0,
    regras: [
      'Multas e IPVA antigos ficam com o banco, depois de analisar. Não pague nada antes de o banco responder (item 72).',
    ],
  },
  {
    id: 'itapeva',
    nome: 'Itapeva ou RCB',
    tetoDebitos: 800,
    excecaoDebitos: 'Se o documento é de até 31/12/2025, IPVA, seguro obrigatório e licenciamento de 2026 não entram nesse limite: some em "Outros gastos" (item 74).',
    regras: [
      'Dívidas antigas: você paga até R$ 800; o resto é com o vendedor (item 73).',
      'Se o documento foi emitido até 31/12/2025, o IPVA, o seguro obrigatório e o licenciamento de 2026 são seus: some em "Outros gastos" (item 74).',
    ],
  },
  {
    id: 'seguradora',
    nome: 'Seguradora (batido)',
    tetoDebitos: 1000,
    regras: [
      'Dívidas antigas: você paga até R$ 1.000. O que passar disso é devolvido com comprovante, se você pedir em até 120 dias (itens 124 a 126).',
      ...SINISTRO,
    ],
  },
  {
    id: 'demais',
    nome: 'Outro vendedor',
    tetoDebitos: 1000,
    excecaoDebitos: 'IPVA e licenciamento de 2024 e 2025 atrasados não entram nesse limite: some em "Outros gastos" (item 75).',
    regras: [
      'Dívidas antigas: você paga até R$ 1.000. O que passar disso é devolvido depois de análise, se você pedir em até 120 dias (item 78).',
      'IPVA e licenciamento de 2024 e 2025 atrasados ficam com você, sem limite: some em "Outros gastos" (item 75).',
      'Remoção ou outra despesa do lote aparece no "+ Despesas" do site (item 76).',
    ],
  },
];

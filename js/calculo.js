// Custo de um arremate pelas condições de venda (js/regras.js). Sem DOM; conta em centavos.
import {
  CAUCAO_CHEQUE, COMISSAO, COMITENTES, EMPILHADEIRA, ESTIMATIVAS, PERDA_DESISTENCIA, TAXA_MATERIAIS, TIPOS,
} from './regras.js';
import { reais } from './dinheiro.js';

const cent = (valor) => Math.round((valor ?? 0) * 100);
const soma = (linhas) => linhas.reduce((total, linha) => total + linha.valor, 0);

// Campo omitido (undefined) usa o padrão; remoção e placa omitidas usam o edital e a estimativa do tipo.
export const PADRAO = {
  lance: null,
  tipo: 'leve',
  comitente: 'demais',
  uf: 'SP',
  gravamePR: false,
  empilhadeira: false,
  debitos: null, // null = pior caso: o teto do comitente
  despachante: ESTIMATIVAS.despachante,
  averbacao: true,
  guincho: 0,
  outros: 0,
};

export const comitentePorId = (id) =>
  COMITENTES.find((c) => c.id === id) ?? COMITENTES.find((c) => c.id === 'demais');

export function taxaMateriais(lance) {
  let taxa = 0;
  for (const [inicio, valor] of TAXA_MATERIAIS) if (lance >= inicio) taxa = valor;
  return taxa;
}

export const remocaoDoEdital = (comitenteId, tipo) => comitentePorId(comitenteId).remocao?.[tipo] ?? null;

function notaDebitos(d) {
  if (d.semTeto) return d.informado === null ? 'sem limite com este vendedor: escreva o valor' : 'todas são suas';
  if (d.teto === 0) return 'ficam com quem está vendendo';
  if (d.informado === null) return `você não informou: conta o máximo, ${reais(d.teto)}`;
  if (d.comitente > 0) return `você paga até ${reais(d.teto)}; o vendedor paga ${reais(d.comitente)}`;
  return 'valor que você informou';
}

export function calcular(entrada) {
  const e = { ...PADRAO };
  for (const [campo, valor] of Object.entries(entrada)) if (valor !== undefined) e[campo] = valor;

  const tipo = TIPOS[e.tipo] ? e.tipo : 'leve';
  const veiculo = tipo !== 'material';
  const c = comitentePorId(e.comitente);
  const lance = cent(e.lance);
  const comissao = Math.round(lance * COMISSAO);
  const leilao = [
    { id: 'lance', rotulo: 'Seu lance', valor: lance },
    { id: 'comissao', rotulo: 'Comissão do leiloeiro', valor: comissao, nota: '5% do lance' },
  ];
  const doc = [];
  const debitos = { informado: null, teto: null, seu: 0, comitente: 0, semTeto: false };

  if (!veiculo) {
    leilao.push({ id: 'adm', rotulo: 'Taxa do leilão', valor: cent(taxaMateriais(e.lance ?? 0)), nota: 'muda conforme o valor do lance' });
  } else {
    leilao.push({ id: 'adm', rotulo: 'Taxa do leilão', valor: cent(TIPOS[tipo].adm), nota: 'valor fixo por veículo ("despesas administrativas")' });

    const remocao = e.remocao ?? remocaoDoEdital(c.id, tipo) ?? 0;
    if (remocao > 0) leilao.push({ id: 'remocao', rotulo: 'Taxa de remoção', valor: cent(remocao), nota: 'guincho que levou o veículo até o pátio' });

    if (c.atpv) {
      const uf = c.atpv[e.uf] === undefined ? 'outra' : e.uf;
      leilao.push({ id: 'atpv', rotulo: 'Documento de venda (ATPV‑e)', valor: cent(c.atpv[uf]), nota: `veículo registrado em ${uf === 'outra' ? 'outro estado' : uf}` });
    } else if (c.atpvFixo) {
      leilao.push({ id: 'atpv', rotulo: 'Documento de venda (ATPV‑e)', valor: cent(c.atpvFixo), nota: 'valor fixo deste vendedor' });
    }

    if (e.empilhadeira) leilao.push({ id: 'empilhadeira', rotulo: 'Empilhadeira', valor: cent(EMPILHADEIRA), nota: 'para tirar o veículo do lugar' });

    debitos.semTeto = c.tetoDebitos === null;
    debitos.teto = debitos.semTeto ? null : cent(c.tetoDebitos);
    debitos.informado = e.debitos === null ? null : cent(e.debitos);
    if (debitos.informado === null) {
      debitos.seu = debitos.semTeto ? 0 : debitos.teto;
    } else {
      debitos.seu = debitos.semTeto ? debitos.informado : Math.min(debitos.informado, debitos.teto);
      debitos.comitente = debitos.informado - debitos.seu;
    }
    doc.push({ id: 'debitos', rotulo: 'Dívidas do veículo', valor: debitos.seu, nota: notaDebitos(debitos) });

    if (c.gravamePR && e.gravamePR) doc.push({ id: 'gravame', rotulo: 'Tirar o financiamento do documento', valor: cent(c.gravamePR), nota: 'só no Paraná' });
    if (e.despachante > 0) doc.push({ id: 'despachante', rotulo: 'Passar para o seu nome', valor: cent(e.despachante), nota: 'estimativa: pergunte o preço ao despachante' });
    const placa = e.placa ?? ESTIMATIVAS.placa[tipo];
    if (placa > 0) doc.push({ id: 'placa', rotulo: 'Placa nova (Mercosul)', valor: cent(placa), nota: 'estimativa' });
    if (e.averbacao) doc.push({ id: 'averbacao', rotulo: 'Multa por atraso na transferência', valor: cent(ESTIMATIVAS.multaAverbacao), nota: 'quase certa' });
  }

  if (e.guincho > 0) doc.push({ id: 'guincho', rotulo: 'Guincho até sua casa', valor: cent(e.guincho) });
  if (e.outros > 0) doc.push({ id: 'outros', rotulo: 'Outros gastos', valor: cent(e.outros) });

  const totalLeilao = soma(leilao);
  const totalDoc = soma(doc);
  const total = totalLeilao + totalDoc;
  return {
    tipo,
    veiculo,
    comitente: c,
    leilao,
    doc,
    debitos,
    lance,
    totalLeilao,
    totalDoc,
    total,
    acrescimo: total - lance,
    fixos: total - lance - comissao,
    caucaoCheque: Math.round(lance * CAUCAO_CHEQUE),
    caucaoDebito: comissao,
    perdaDesistencia: Math.round(lance * PERDA_DESISTENCIA),
    diaria: cent(TIPOS[tipo].diaria),
  };
}

/** Maior lance inteiro (reais) cujo custo total cabe no orçamento; null se nem o lance zero cabe. */
export function lanceMaximo(orcamento, entrada) {
  const limite = cent(orcamento);
  const custo = (lance) => calcular({ ...entrada, lance }).total;
  if (custo(0) > limite) return null;
  let menor = 0;
  let maior = Math.floor(orcamento);
  while (menor < maior) {
    const meio = Math.ceil((menor + maior) / 2);
    if (custo(meio) <= limite) menor = meio;
    else maior = meio - 1;
  }
  return menor;
}

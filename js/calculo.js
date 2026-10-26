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
  if (d.semTeto) return d.informado === null ? 'sem teto neste comitente: informe o valor' : 'sem teto: todos são seus';
  if (d.teto === 0) return 'ficam com o comitente';
  if (d.informado === null) return `pior caso: o teto de ${reais(d.teto)}`;
  if (d.comitente > 0) return `teto de ${reais(d.teto)}; o comitente paga ${reais(d.comitente)}`;
  return 'valor informado';
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
    { id: 'lance', rotulo: 'Lance', valor: lance },
    { id: 'comissao', rotulo: 'Comissão do leiloeiro (5%)', valor: comissao, nota: 'item 80' },
  ];
  const doc = [];
  const debitos = { informado: null, teto: null, seu: 0, comitente: 0, semTeto: false };

  if (!veiculo) {
    leilao.push({ id: 'adm', rotulo: 'Despesas administrativas', valor: cent(taxaMateriais(e.lance ?? 0)), nota: 'tabela de materiais, item 83' });
  } else {
    leilao.push({ id: 'adm', rotulo: 'Despesas administrativas', valor: cent(TIPOS[tipo].adm), nota: `${TIPOS[tipo].nome.toLowerCase()}, item 83` });

    const remocao = e.remocao ?? remocaoDoEdital(c.id, tipo) ?? 0;
    if (remocao > 0) leilao.push({ id: 'remocao', rotulo: 'Remoção', valor: cent(remocao), nota: c.itemRemocao ? `item ${c.itemRemocao}` : 'informada no lote' });

    if (c.atpv) {
      const uf = c.atpv[e.uf] === undefined ? 'outra' : e.uf;
      leilao.push({ id: 'atpv', rotulo: 'ATPV‑e', valor: cent(c.atpv[uf]), nota: `${uf === 'outra' ? 'outro estado' : uf}, item 45` });
    } else if (c.atpvFixo) {
      leilao.push({ id: 'atpv', rotulo: 'ATPV‑e', valor: cent(c.atpvFixo), nota: 'item 55' });
    }

    if (e.empilhadeira) leilao.push({ id: 'empilhadeira', rotulo: 'Empilhadeira', valor: cent(EMPILHADEIRA), nota: 'item 8' });

    debitos.semTeto = c.tetoDebitos === null;
    debitos.teto = debitos.semTeto ? null : cent(c.tetoDebitos);
    debitos.informado = e.debitos === null ? null : cent(e.debitos);
    if (debitos.informado === null) {
      debitos.seu = debitos.semTeto ? 0 : debitos.teto;
    } else {
      debitos.seu = debitos.semTeto ? debitos.informado : Math.min(debitos.informado, debitos.teto);
      debitos.comitente = debitos.informado - debitos.seu;
    }
    doc.push({ id: 'debitos', rotulo: 'Débitos do veículo', valor: debitos.seu, nota: notaDebitos(debitos) });

    if (c.gravamePR && e.gravamePR) doc.push({ id: 'gravame', rotulo: 'Gravame no Paraná', valor: cent(c.gravamePR), nota: 'item 32' });
    if (e.despachante > 0) doc.push({ id: 'despachante', rotulo: 'Transferência pelo despachante', valor: cent(e.despachante), nota: 'estimativa; cote com a Mezzalira' });
    const placa = e.placa ?? ESTIMATIVAS.placa[tipo];
    if (placa > 0) doc.push({ id: 'placa', rotulo: 'Placa Mercosul', valor: cent(placa), nota: 'estimativa, item 5' });
    if (e.averbacao) doc.push({ id: 'averbacao', rotulo: 'Multa de averbação', valor: cent(ESTIMATIVAS.multaAverbacao), nota: 'provável, item 6' });
  }

  if (e.guincho > 0) doc.push({ id: 'guincho', rotulo: 'Guincho ou transporte', valor: cent(e.guincho) });
  if (e.outros > 0) doc.push({ id: 'outros', rotulo: 'Outros custos', valor: cent(e.outros) });

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

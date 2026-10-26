// Tela da calculadora: lê os campos, chama calcular() e desenha o resultado.
// O que foi digitado fica só neste aparelho (localStorage).
import { COMITENTES, DESPACHANTE, ESTIMATIVAS, TIPOS } from './regras.js';
import { calcular, extrasDoEdital, lanceMaximo } from './calculo.js';
import { lerValor, porcento, reais, reaisInteiros, valorNoCampo } from './dinheiro.js';

const $ = (id) => document.getElementById(id);
const CHAVE = 'calculadora-leilao:v2'; // v2: "remocao" virou "extras"
const ERRO_VALOR = 'Use só números, como 15000 ou 1.234,56.';
const DINHEIRO = ['lance', 'extras', 'debitos', 'despachante', 'placa', 'guincho', 'outros', 'orcamento', 'fipe'];
const MARCAS = ['gravame', 'empilhadeira', 'averbacao'];
const UFS = ['SP', 'SC', 'RJ', 'outra'];
const SO_VEICULO = ['campo-comitente', 'campo-marcas', 'campo-debitos', 'campo-despachante', 'campo-placa', 'campo-averbacao', 'regras-comitente-bloco'];
const ROTULO = {
  lance: 'Seu lance', extras: 'Despesas extras do lote', debitos: 'Dívidas do veículo', despachante: 'Passar para o seu nome',
  placa: 'Placa nova', guincho: 'Guincho', outros: 'Outros gastos', orcamento: 'Quanto pode gastar', fipe: 'Preço na FIPE',
};
const ICONE_ALERTA = '<svg class="na-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
// um botão por número: link dentro do texto com área de toque aumentada invade o número da linha de baixo
const TELEFONES = `<span class="telefones">${DESPACHANTE.telefones.map(([texto, numero]) => `<a class="telefone" href="tel:${numero}">${texto}</a>`).join('')}</span>`;

let tipo = 'leve';
let placaEditada = false;
let extrasEditadas = false; // valor copiado do "+ Despesas" do site não volta ao padrão sozinho
let temLance = false;
const totaisNaTela = new Set(); // o total grande e o colado no lance que estão visíveis agora

function montar() {
  $('tipos').innerHTML = Object.entries(TIPOS).map(([id, t]) => `
    <button type="button" class="na-segmento tipo" data-tipo="${id}" aria-pressed="false">
      <span class="tipo__nome">${t.nome}</span>
      <span class="tipo__taxa">${t.adm ? `taxa do leilão ${reaisInteiros(t.adm)}` : t.descricao}</span>
    </button>`).join('');
  $('comitente').innerHTML = COMITENTES.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function aplicarExtrasDoEdital() {
  if (!extrasEditadas) $('extras').value = valorNoCampo(extrasDoEdital($('comitente').value, $('uf').value, tipo));
}

function aplicarPlacaPadrao() {
  const padrao = ESTIMATIVAS.placa[tipo];
  if (!placaEditada && padrao !== undefined) $('placa').value = valorNoCampo(padrao);
}

function padroes() {
  $('comitente').value = 'demais';
  $('uf').value = 'SP';
  $('despachante').value = valorNoCampo(ESTIMATIVAS.despachante);
  $('averbacao').checked = true;
  aplicarExtrasDoEdital();
  aplicarPlacaPadrao();
}

function restaurar() {
  let salvo = null;
  try { salvo = JSON.parse(localStorage.getItem(CHAVE)); } catch { /* sem armazenamento: fica o padrão */ }
  if (!salvo || typeof salvo !== 'object') return;
  if (TIPOS[salvo.tipo]) tipo = salvo.tipo;
  if (COMITENTES.some((c) => c.id === salvo.comitente)) $('comitente').value = salvo.comitente;
  if (UFS.includes(salvo.uf)) $('uf').value = salvo.uf;
  for (const id of DINHEIRO) {
    if (typeof salvo[id] !== 'string') continue;
    const valor = lerValor(salvo[id]);
    $(id).value = typeof valor === 'number' ? valorNoCampo(valor) : salvo[id];
  }
  for (const id of MARCAS) if (typeof salvo[id] === 'boolean') $(id).checked = salvo[id];
  placaEditada = salvo.placaEditada === true;
  extrasEditadas = salvo.extrasEditadas === true;
}

function salvar() {
  const dados = { tipo, comitente: $('comitente').value, uf: $('uf').value, placaEditada, extrasEditadas };
  for (const id of DINHEIRO) dados[id] = $(id).value;
  for (const id of MARCAS) dados[id] = $(id).checked;
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* aba anônima ou cota cheia: a conta segue, só não fica guardada */ }
}

function lerCampo(id) {
  const valor = lerValor($(id).value);
  const invalido = valor === undefined;
  $(id).setAttribute('aria-invalid', String(invalido));
  $(`${id}-erro`).hidden = !invalido;
  $(`${id}-erro`).textContent = invalido ? ERRO_VALOR : '';
  return valor;
}

function dicaExtras(c, veiculo) {
  const comoVer = 'No site, abra o lote e clique em "+ Despesas". Escreva aqui o que aparecer além do lance, da comissão e da despesa adm. (ex.: "Despesas Extras", "Despesa Assessoria").';
  if (!veiculo) return comoVer;
  if (c.atpv) return `${comoVer} Para o Banco Pan já vem o documento de venda (ATPV‑e) do estado escolhido.`;
  if (c.atpvFixo) return `${comoVer} Para este vendedor já vem ${reaisInteiros(c.atpvFixo)} do documento de venda (ATPV‑e).`;
  return comoVer;
}

const dicaExtrasEditadas = ' O valor que você escreveu fica, mesmo trocando o vendedor.';

function dicaDebitos(c) {
  let dica = `Não sabe? Deixe em branco: a conta usa ${reaisInteiros(c.tetoDebitos)}, o limite deste vendedor para dívidas antigas. O que passar disso, ele paga.`;
  if (c.tetoDebitos === null) dica = 'Com este vendedor, todas as dívidas antigas são suas, sem limite. Escreva o valor que aparece no anúncio.';
  if (c.tetoDebitos === 0) dica = 'Com este vendedor, as dívidas antigas ficam com ele.';
  return c.excecaoDebitos ? `${dica} ${c.excecaoDebitos}` : dica;
}

const linhas = (lista) => lista.map((l) =>
  `<div class="linha"><dt>${l.rotulo}${l.nota ? `<span class="linha__nota">${l.nota}</span>` : ''}</dt><dd>${reais(l.valor)}</dd></div>`).join('');

function atualizarBarra() {
  $('barra-total').classList.toggle('is-visivel', temLance && totaisNaTela.size === 0);
}

function desenhar() {
  const v = Object.fromEntries(DINHEIRO.map((id) => [id, lerCampo(id)]));
  const entrada = {
    lance: v.lance ?? null,
    tipo,
    comitente: $('comitente').value,
    uf: $('uf').value,
    gravamePR: $('gravame').checked,
    empilhadeira: $('empilhadeira').checked,
    extras: v.extras ?? 0,
    debitos: v.debitos ?? null,
    despachante: v.despachante ?? 0,
    placa: v.placa ?? 0,
    averbacao: $('averbacao').checked,
    guincho: v.guincho ?? 0,
    outros: v.outros ?? 0,
  };
  const r = calcular(entrada);
  const c = r.comitente;
  temLance = entrada.lance !== null;

  // campos que dependem do tipo e do comitente
  for (const botao of $('tipos').querySelectorAll('[data-tipo]')) {
    const ativo = botao.dataset.tipo === tipo;
    botao.classList.toggle('is-active', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  }
  for (const id of SO_VEICULO) $(id).hidden = !r.veiculo;
  $('campo-uf').hidden = !(r.veiculo && c.atpv);
  $('campo-gravame').hidden = !(r.veiculo && c.gravamePR);
  $('extras-dica').textContent = dicaExtras(c, r.veiculo) + (extrasEditadas ? dicaExtrasEditadas : '');
  $('debitos-dica').textContent = dicaDebitos(c);
  const tituloGastos = r.veiculo ? 'Documentos e outros gastos' : 'Outros gastos';
  $('t-doc').textContent = tituloGastos;
  $('linhas-doc-titulo').textContent = tituloGastos;
  $('sub-doc-rotulo').textContent = r.veiculo ? 'Documentos e gastos (estimativa)' : 'Outros gastos';
  $('t-resultado').textContent = r.veiculo ? 'Total para ter o veículo no seu nome' : 'Total para levar o lote';

  // resultado
  $('total').textContent = temLance ? reais(r.total) : '—';
  $('total').classList.toggle('is-vazio', !temLance);
  if (!temLance) $('acrescimo').textContent = 'Digite o lance para ver quanto vai gastar de verdade.';
  else if (r.lance > 0) $('acrescimo').textContent = `${reais(r.acrescimo)} a mais que o lance (${porcento(r.acrescimo / r.lance)} a mais)`;
  else $('acrescimo').textContent = `${reais(r.acrescimo)} só de taxas e gastos`;
  $('formula').textContent = r.veiculo
    ? `Como a conta é feita: seu lance + 5% de comissão + ${reais(r.fixos)} de taxas e gastos que não mudam com o lance.`
    : 'Como a conta é feita: seu lance + 5% de comissão + taxa do leilão (muda conforme o lance) + outros gastos.';

  const avisos = [];
  const invalidos = DINHEIRO.filter((id) => v[id] === undefined);
  if (invalidos.length) avisos.push(`Não entendi o valor em: ${invalidos.map((id) => ROTULO[id]).join(', ')}. Use só números, como 15000 ou 1.234,56.`);
  if (r.veiculo && r.debitos.semTeto && r.debitos.informado === null) {
    avisos.push(`Com ${c.nome}, todas as dívidas antigas do veículo são suas, sem limite. Escreva o valor das dívidas para a conta ficar certa.`);
  }
  $('avisos').innerHTML = avisos.map((t) => `<div class="na-alerta na-alerta--aviso" role="status">${ICONE_ALERTA}<span class="na-alerta__texto">${t}</span></div>`).join('');

  $('detalhe').hidden = !temLance;
  $('sub-leilao').textContent = reais(r.totalLeilao);
  $('sub-doc').textContent = reais(r.totalDoc);
  $('linhas-leilao').innerHTML = linhas(r.leilao);
  $('linhas-doc').innerHTML = r.doc.length ? linhas(r.doc) : '<div class="linha"><dt>Nenhum gasto extra</dt><dd>R$ 0,00</dd></div>';
  $('caucao').innerHTML = `Quando ganhar o lance: deixe um cheque de <strong>${reais(r.caucaoCheque)}</strong> como garantia (35% do lance) ou pague a comissão de <strong>${reais(r.caucaoDebito)}</strong> no cartão de débito. O resto, pague até 1 dia útil depois, das 9h às 16h30.`;

  // limite e FIPE
  if (typeof v.orcamento !== 'number') $('limite-resultado').textContent = '';
  else {
    const maximo = lanceMaximo(v.orcamento, entrada);
    $('limite-resultado').innerHTML = maximo === null
      ? `Não dá: só as taxas e gastos deste lote já somam ${reais(calcular({ ...entrada, lance: 0 }).total)}.`
      : `Dê no máximo <strong>${reais(maximo * 100)}</strong> de lance. Passou disso, o total fica acima de ${reais(Math.round(v.orcamento * 100))}.`;
  }
  if (!(v.fipe > 0)) $('fipe-resultado').textContent = '';
  else if (!temLance) $('fipe-resultado').textContent = 'Digite o lance para comparar com a FIPE.';
  else {
    const fipe = Math.round(v.fipe * 100);
    const diferenca = fipe - r.total;
    $('fipe-resultado').innerHTML = `Você vai pagar <strong>${porcento(r.total / fipe)}</strong> do preço de mercado: ${reais(Math.abs(diferenca))} ${diferenca >= 0 ? 'a menos' : 'a mais'} que a FIPE.`;
  }

  // regras
  $('regras-comitente-titulo').textContent = `Regras de quem vende: ${c.nome}`;
  $('regras-comitente').innerHTML = c.regras.map((t) => `<li>${t}</li>`).join('');
  $('regras-gerais').innerHTML = [
    'No site do leilão, o botão "+ Despesas" de cada lote mostra a conta oficial do leilão para o lance atual. Use para conferir.',
    `Deu o lance, não tem volta: se desistir ou não pagar, perde 35% do lance${temLance ? `, ${reais(r.perdaDesistencia)}` : ''} (item 84).`,
    `Tire ${r.veiculo ? 'o veículo' : 'o lote'} do pátio em até 5 dias úteis. Depois disso, paga ${reais(r.diaria)} por dia (itens 93 e 94).`,
    r.veiculo && `A transferência tem que ser feita pelo despachante do leilão, a Mezzalira. Ligue antes e pergunte o preço (item 29): ${TELEFONES}`,
    r.veiculo && 'Os documentos podem demorar: até 45 dias úteis para chegar ao despachante e mais 30 dias úteis com ele (item 25).',
    r.veiculo && 'Problema no número do chassi ou do motor, laudos de vistoria e troca de categoria (de aluguel para particular, por exemplo) ficam por sua conta (itens 3, 4 e 22).',
    r.veiculo && 'Só aceitam reclamação de motor fundido ou câmbio travado, em veículo de 2017 para cima (menos os do Itaú), e antes de o veículo sair do pátio (item 14).',
    'Lance condicional (quando o vendedor ainda vai decidir se aceita o valor): espere até 5 dias úteis; se aceitarem, pague em 24 horas (itens 15 e 16).',
    'Primeira compra pela internet: só pode levar 1 lote, a não ser que o leiloeiro libere mais (item 130).',
    !r.veiculo && 'Sucata com baixa definitiva no Detran só pode ser comprada por empresa cadastrada no Detran (itens 23 e 126).',
  ].filter(Boolean).map((t) => `<li>${t}</li>`).join('');

  $('lance-total-linha').hidden = !temLance;
  $('lance-total').textContent = temLance ? reais(r.total) : '';
  $('barra-total-valor').textContent = temLance ? reais(r.total) : '';
  atualizarBarra();
  salvar();
}

document.addEventListener('input', (ev) => {
  if (!DINHEIRO.includes(ev.target.id)) return;
  if (ev.target.id === 'placa') placaEditada = true;
  if (ev.target.id === 'extras') extrasEditadas = true;
  desenhar();
});

document.addEventListener('change', (ev) => {
  const { id } = ev.target;
  if (id === 'comitente' || id === 'uf') aplicarExtrasDoEdital();
  if (id === 'comitente' || id === 'uf' || MARCAS.includes(id)) desenhar();
});

document.addEventListener('focusout', (ev) => {
  if (!DINHEIRO.includes(ev.target.id)) return;
  const valor = lerValor(ev.target.value);
  if (typeof valor === 'number') {
    ev.target.value = valorNoCampo(valor);
    salvar();
  }
});

$('tipos').addEventListener('click', (ev) => {
  const botao = ev.target.closest('[data-tipo]');
  if (!botao || botao.dataset.tipo === tipo) return;
  tipo = botao.dataset.tipo;
  aplicarExtrasDoEdital();
  aplicarPlacaPadrao();
  desenhar();
});

$('incrementos').addEventListener('click', (ev) => {
  const botao = ev.target.closest('[data-somar]');
  if (!botao) return;
  const atual = lerValor($('lance').value);
  $('lance').value = valorNoCampo((typeof atual === 'number' ? atual : 0) + Number(botao.dataset.somar));
  desenhar();
});

$('novo-lote').addEventListener('click', () => {
  for (const id of ['lance', 'debitos', 'guincho', 'outros', 'orcamento', 'fipe']) $(id).value = '';
  $('gravame').checked = false;
  $('empilhadeira').checked = false;
  placaEditada = false;
  extrasEditadas = false;
  aplicarExtrasDoEdital();
  aplicarPlacaPadrao();
  desenhar();
  $('lance').focus();
});

const observador = new IntersectionObserver((registros) => {
  for (const registro of registros) {
    if (registro.isIntersecting) totaisNaTela.add(registro.target);
    else totaisNaTela.delete(registro.target);
  }
  atualizarBarra();
});
observador.observe($('total'));
observador.observe($('lance-total-linha'));

montar();
padroes();
restaurar();
desenhar();

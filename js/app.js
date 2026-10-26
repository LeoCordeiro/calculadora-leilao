// Tela da calculadora: lê os campos, chama calcular() e desenha o resultado.
// O que foi digitado fica só neste aparelho (localStorage).
import { COMITENTES, DESPACHANTE, ESTIMATIVAS, TIPOS } from './regras.js';
import { calcular, lanceMaximo, remocaoDoEdital } from './calculo.js';
import { lerValor, porcento, reais, reaisInteiros, valorNoCampo } from './dinheiro.js';

const $ = (id) => document.getElementById(id);
const CHAVE = 'calculadora-leilao:v1';
const ERRO_VALOR = 'Valor em reais, ex.: 39,90 ou 1.234,56.';
const DINHEIRO = ['lance', 'remocao', 'debitos', 'despachante', 'placa', 'guincho', 'outros', 'orcamento', 'fipe'];
const MARCAS = ['gravame', 'empilhadeira', 'averbacao'];
const UFS = ['SP', 'SC', 'RJ', 'outra'];
const SO_VEICULO = ['campo-comitente', 'campo-remocao', 'campo-marcas', 'campo-debitos', 'campo-despachante', 'campo-placa', 'campo-averbacao', 'regras-comitente-bloco'];
const ROTULO = {
  lance: 'Valor do lance', remocao: 'Remoção', debitos: 'Débitos', despachante: 'Despachante', placa: 'Placa Mercosul',
  guincho: 'Guincho', outros: 'Outros custos', orcamento: 'Quanto quer gastar', fipe: 'FIPE',
};
const ICONE_ALERTA = '<svg class="na-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
const TELEFONES = DESPACHANTE.telefones.map(([texto, numero]) => `<a href="tel:${numero}">${texto}</a>`).join(', ');

let tipo = 'leve';
let placaEditada = false;
let temLance = false;
const totaisNaTela = new Set(); // o total grande e o colado no lance que estão visíveis agora

function montar() {
  $('tipos').innerHTML = Object.entries(TIPOS).map(([id, t]) => `
    <button type="button" class="na-segmento tipo" data-tipo="${id}" aria-pressed="false">
      <span class="tipo__nome">${t.nome}</span>
      <span class="tipo__taxa">${t.adm ? `taxa adm. ${reaisInteiros(t.adm)}` : 'taxa pela faixa do lance'}</span>
    </button>`).join('');
  $('comitente').innerHTML = COMITENTES.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function aplicarRemocaoDoEdital() {
  $('remocao').value = valorNoCampo(remocaoDoEdital($('comitente').value, tipo) ?? 0);
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
  aplicarRemocaoDoEdital();
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
}

function salvar() {
  const dados = { tipo, comitente: $('comitente').value, uf: $('uf').value, placaEditada };
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

function dicaRemocao(c) {
  const nomeTipo = TIPOS[tipo].nome.toLowerCase();
  const valor = remocaoDoEdital(c.id, tipo);
  if (valor !== null) return `Edital: ${reaisInteiros(valor)} para ${nomeTipo} (item ${c.itemRemocao}).`;
  if (c.remocao) return `O edital não fixa remoção de ${nomeTipo} para este comitente. Se o lote cobrar, informe aqui.`;
  return 'Este comitente não fixa remoção no edital. Se o lote cobrar, informe aqui (item 76).';
}

function dicaDebitos(c) {
  if (c.tetoDebitos === null) return 'Sem teto neste comitente: todos os débitos anteriores são seus. Informe o valor.';
  if (c.tetoDebitos === 0) return 'Os débitos anteriores ao leilão ficam com o comitente.';
  return `Vazio = pior caso: ${reaisInteiros(c.tetoDebitos)}, o máximo que fica com você. Acima disso, o comitente paga.`;
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
    remocao: v.remocao ?? 0,
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
  $('remocao-dica').textContent = dicaRemocao(c);
  $('debitos-dica').textContent = dicaDebitos(c);
  const extras = r.veiculo ? 'Documentação e extras' : 'Extras';
  $('t-doc').textContent = extras;
  $('linhas-doc-titulo').textContent = extras;
  $('sub-doc-rotulo').textContent = r.veiculo ? 'Documentação, estimada' : 'Extras';
  $('t-resultado').textContent = r.veiculo ? 'Custo total para ter o veículo no seu nome' : 'Custo total do lote';

  // resultado
  $('total').textContent = temLance ? reais(r.total) : '—';
  $('total').classList.toggle('is-vazio', !temLance);
  if (!temLance) $('acrescimo').textContent = 'Digite o lance para ver quanto o lote custa de verdade.';
  else if (r.lance > 0) $('acrescimo').textContent = `${reais(r.acrescimo)} a mais que o lance (+${porcento(r.acrescimo / r.lance)})`;
  else $('acrescimo').textContent = `${reais(r.acrescimo)} só de custos`;
  $('formula').textContent = r.veiculo
    ? `Conta: lance + 5% de comissão + ${reais(r.fixos)} de custos fixos deste lote.`
    : 'Conta: lance + 5% de comissão + taxa pela faixa do lance + extras.';

  const avisos = [];
  const invalidos = DINHEIRO.filter((id) => v[id] === undefined);
  if (invalidos.length) avisos.push(`Valor inválido em ${invalidos.map((id) => ROTULO[id]).join(', ')}. A conta ignora o campo até corrigir.`);
  if (r.veiculo && r.debitos.semTeto && r.debitos.informado === null) {
    avisos.push(`${c.nome}: os débitos anteriores são todos seus e o edital não dá teto. Informe o valor para a conta ficar completa.`);
  }
  $('avisos').innerHTML = avisos.map((t) => `<div class="na-alerta na-alerta--aviso" role="status">${ICONE_ALERTA}<span class="na-alerta__texto">${t}</span></div>`).join('');

  $('detalhe').hidden = !temLance;
  $('sub-leilao').textContent = reais(r.totalLeilao);
  $('sub-doc').textContent = reais(r.totalDoc);
  $('linhas-leilao').innerHTML = linhas(r.leilao);
  $('linhas-doc').innerHTML = r.doc.length ? linhas(r.doc) : '<div class="linha"><dt>Nenhum extra informado</dt><dd>R$ 0,00</dd></div>';
  $('caucao').innerHTML = `No arremate: cheque caução de <strong>${reais(r.caucaoCheque)}</strong> (35% do lance) ou a comissão de <strong>${reais(r.caucaoDebito)}</strong> no débito (item 81). O resto em 1 dia útil, das 9h às 16h30 (item 82).`;

  // limite e FIPE
  if (typeof v.orcamento !== 'number') $('limite-resultado').textContent = '';
  else {
    const maximo = lanceMaximo(v.orcamento, entrada);
    $('limite-resultado').innerHTML = maximo === null
      ? `Não cabe: só os custos fixos deste lote já somam ${reais(calcular({ ...entrada, lance: 0 }).total)}.`
      : `Lance máximo: <strong>${reais(maximo * 100)}</strong>. Acima disso, o total passa de ${reais(Math.round(v.orcamento * 100))}.`;
  }
  if (!(v.fipe > 0)) $('fipe-resultado').textContent = '';
  else if (!temLance) $('fipe-resultado').textContent = 'Digite o lance para comparar com a FIPE.';
  else {
    const fipe = Math.round(v.fipe * 100);
    const diferenca = fipe - r.total;
    $('fipe-resultado').innerHTML = `Custo total = <strong>${porcento(r.total / fipe)}</strong> da FIPE: ${reais(Math.abs(diferenca))} ${diferenca >= 0 ? 'abaixo' : 'acima'} dela.`;
  }

  // regras
  $('regras-comitente-titulo').textContent = c.nome;
  $('regras-comitente').innerHTML = c.regras.map((t) => `<li>${t}</li>`).join('');
  $('regras-gerais').innerHTML = [
    `Desistir ou não pagar: perde 35% do lance${temLance ? ` (${reais(r.perdaDesistencia)})` : ''}. O lance não tem volta.`,
    `Retire em até 5 dias úteis. Depois, diária de ${reais(r.diaria)} (itens 93 e 94).`,
    r.veiculo && `Despachante credenciado obrigatório: ${DESPACHANTE.nome}. Cote antes do leilão: ${TELEFONES} (item 29).`,
    r.veiculo && 'Documentos em até 45 dias úteis do comitente + 30 dias úteis do despachante (item 25).',
    r.veiculo && 'Remarcação de chassi ou motor, laudos ECV e CSV e troca de categoria por sua conta (itens 3, 4 e 22).',
    r.veiculo && 'Reclamação só de motor fundido ou câmbio travado, em veículo acima de 2016 (exceto Itaú), antes de sair do pátio (item 14).',
    'Lance condicional: espere até 5 dias úteis; se liberado, pague em 24 horas (itens 15 e 16).',
    'Primeira compra online: só 1 lote, salvo liberação do leiloeiro (item 130).',
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
  desenhar();
});

document.addEventListener('change', (ev) => {
  const { id } = ev.target;
  if (id === 'comitente') aplicarRemocaoDoEdital();
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
  aplicarRemocaoDoEdital();
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
  aplicarRemocaoDoEdital();
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

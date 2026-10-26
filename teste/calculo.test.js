import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcular, lanceMaximo, taxaMateriais } from '../js/calculo.js';
import { lerValor, valorNoCampo } from '../js/dinheiro.js';

const valor = (r, id) => [...r.leilao, ...r.doc].find((l) => l.id === id)?.valor;

test('lance de R$ 15.000 em carro do Itaú com as estimativas padrão', () => {
  const r = calcular({ lance: 15000, tipo: 'leve', comitente: 'itau' });
  assert.equal(r.totalLeilao, 1810000); // 15.000 + 750 + 2.350
  assert.equal(r.totalDoc, 179523); // 500 de débitos (pior caso) + 900 + 200 + 195,23
  assert.equal(r.total, 1989523);
  assert.equal(r.fixos, 1989523 - 1500000 - 75000);
});

// Conta oficial do site ("+ Despesas"), lida em 26/10/2026 no leilão 15647.
test('bate com o "+ Despesas" do site: lote 029A (Honda Fit, Safra) e lote 001 (Ranger, Ford)', () => {
  assert.equal(calcular({ lance: 1800, tipo: 'leve', comitente: 'safra' }).totalLeilao, 429000); // 1.800 + 90 + 2.350 + 50
  assert.equal(calcular({ lance: 54000, tipo: 'leve', comitente: 'safra' }).totalLeilao, 5910000); // lote 002
  assert.equal(calcular({ lance: 120900, tipo: 'leve', comitente: 'demais', extras: 250 }).totalLeilao, 12954500); // assessoria
});

test('despesas administrativas e diária por tipo (itens 83 e 94)', () => {
  const adm = (tipo) => valor(calcular({ lance: 1000, tipo }), 'adm');
  assert.equal(adm('moto'), 45000);
  assert.equal(adm('leve'), 235000);
  assert.equal(adm('pesado'), 500000);
  assert.deepEqual(['moto', 'leve', 'pesado', 'material'].map((tipo) => calcular({ tipo }).diaria), [2000, 5000, 8000, 3000]);
});

test('despesas extras do lote: padrão é o ATPV-e do edital (Pan por UF, Safra R$ 50); o site manda', () => {
  const extras = (comitente, uf, tipo = 'leve') => valor(calcular({ lance: 1000, comitente, uf, tipo }), 'extras');
  assert.deepEqual(['SP', 'SC', 'RJ', 'outra', 'PR'].map((uf) => extras('pan', uf)), [12300, 15300, 27300, 14300, 14300]);
  assert.equal(extras('safra', 'RJ'), 5000);
  assert.equal(extras('itau', 'SP'), undefined); // remoção do Itaú só se o "+ Despesas" mostrar
  assert.equal(extras('safra', 'SP', 'material'), undefined);
  assert.equal(valor(calcular({ lance: 1000, comitente: 'safra', extras: 0 }), 'extras'), undefined);
  assert.equal(valor(calcular({ lance: 1000, comitente: 'itau', extras: 400 }), 'extras'), 40000);
  assert.equal(valor(calcular({ lance: 1000, tipo: 'material', extras: 120 }), 'extras'), 12000);
});

test('gravame do Paraná só no Itaú e quando marcado (item 32)', () => {
  assert.equal(valor(calcular({ lance: 1000, comitente: 'itau', gravamePR: true }), 'gravame'), 3750);
  assert.equal(valor(calcular({ lance: 1000, comitente: 'itau' }), 'gravame'), undefined);
  assert.equal(valor(calcular({ lance: 1000, comitente: 'pan', gravamePR: true }), 'gravame'), undefined);
});

test('débitos: teto do comitente, pior caso e sem teto', () => {
  const deb = (comitente, debitos) => calcular({ lance: 1000, comitente, debitos }).debitos;
  assert.equal(deb('itau', 1200).seu, 50000);
  assert.equal(deb('itau', 1200).comitente, 70000);
  assert.equal(deb('itau', 300).seu, 30000);
  assert.equal(deb('itau', null).seu, 50000);
  assert.equal(deb('demais', null).seu, 100000);
  assert.equal(deb('safra', 900).seu, 80000);
  assert.equal(deb('itapeva', 900).seu, 80000);
  assert.equal(deb('honda', 2000).seu, 0);
  assert.equal(deb('previsul', null).seu, 0);
  assert.equal(deb('itau-seguros', null).seu, 0);
  assert.equal(deb('itau-seguros', null).semTeto, true);
  assert.equal(deb('itau-seguros', 3000).seu, 300000);
});

test('materiais: taxa pela faixa do lance e nada de documentação de veículo', () => {
  assert.deepEqual([0, 499, 499.5, 500, 999.99, 1000, 99999.5, 100000, 2000000].map(taxaMateriais),
    [110, 110, 110, 180, 180, 275, 4950, 10000, 125000]);
  const r = calcular({ lance: 10000, tipo: 'material', comitente: 'itau', guincho: 300 });
  assert.equal(r.total, 1000000 + 50000 + 275000 + 30000);
  assert.deepEqual(r.doc.map((l) => l.id), ['guincho']);
});

test('comissão arredonda no centavo; caução e perda são 35% do lance', () => {
  assert.equal(calcular({ lance: 15001 }).caucaoDebito, 75005);
  assert.equal(calcular({ lance: 15000.5 }).caucaoDebito, 75003);
  const r = calcular({ lance: 15000 });
  assert.equal(r.caucaoCheque, 525000);
  assert.equal(r.perdaDesistencia, 525000);
});

test('lance máximo para um orçamento', () => {
  const e = { tipo: 'leve', comitente: 'itau' };
  assert.equal(lanceMaximo(19895.23, e), 15000);
  assert.equal(lanceMaximo(19895.22, e), 14999);
  assert.equal(lanceMaximo(1000, e), null);
  // material: a taxa sobe de R$ 110 para R$ 180 no lance de R$ 500
  assert.equal(lanceMaximo(704, { tipo: 'material' }), 499);
  assert.equal(lanceMaximo(705, { tipo: 'material' }), 500);
});

test('ler valor em reais como a pessoa digita', () => {
  const casos = {
    '': null, '   ': null, '15000': 15000, '15.000': 15000, '15.000,50': 15000.5, 'R$ 2.350': 2350,
    'R$ 15.000,00': 15000, '1.234,56': 1234.56, '39,90': 39.9, '39.90': 39.9, '0': 0,
    '12,345': undefined, 'abc': undefined, '1.23.4': undefined, '-5': undefined, '15.00.000': undefined,
    '15000,': 15000, '15.000,': 15000, '1.': 1, ',': null, // separador no fim = digitando, não é erro
  };
  for (const [texto, esperado] of Object.entries(casos)) assert.equal(lerValor(texto), esperado, texto);
  assert.equal(valorNoCampo(15000), '15.000');
  assert.equal(valorNoCampo(1234.5), '1.234,50');
});

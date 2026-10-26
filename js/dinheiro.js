// Dinheiro em pt-BR: ler o que a pessoa digitou e mostrar em reais.

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const REAIS_INTEIROS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const INTEIRO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const DECIMAL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PORCENTO = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

/** Vazio = null; inválido = undefined; senão reais. Aceita 15000, 15.000, 15.000,50, 39,90 e 39.90. */
export function lerValor(texto) {
  const s = String(texto ?? '').replace(/R\$|\s/g, '');
  if (!s) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s) || /^\d+(,\d{1,2})?$/.test(s)) {
    return Number(s.replace(/\./g, '').replace(',', '.'));
  }
  if (/^\d+\.\d{1,2}$/.test(s)) return Number(s);
  return undefined;
}

export const reais = (centavos) => REAIS.format(centavos / 100);
export const reaisInteiros = (valor) => REAIS_INTEIROS.format(valor);
export const porcento = (fracao) => PORCENTO.format(fracao);

/** Como o valor volta para o campo: 15000 → "15.000"; 1234.5 → "1.234,50". */
export const valorNoCampo = (valor) => (Number.isInteger(valor) ? INTEIRO : DECIMAL).format(valor);

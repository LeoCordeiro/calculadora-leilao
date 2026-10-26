# Calculadora do leilão — quanto custa de verdade um lance no leilão do Ronaldo Milan (veículos e materiais), para o Leonardo usar no celular durante o leilão.

## Mapa
- Stack: HTML + CSS + JS puro (módulos ES), sem build · Rodar: preview `calculadora-leilao` (porta 5800, `python -m http.server`, no launch.json do cofre) · Testes: `npm test` (node:test) · Deploy: site estático, só com ordem dele.
- `js/regras.js` valores do edital, cada um com o item (+ `ESTIMATIVAS`, o que não está no edital) · `js/calculo.js` conta pura em centavos (`calcular`, `lanceMaximo`) · `js/dinheiro.js` ler e formatar R$ · `js/app.js` tela e localStorage (`calculadora-leilao:v1`).
- Estilo: DS LeoTec (Nuvem Azul) em `estilos/nuvem-azul/` — cópia do `design.mjs sync`, não editar; o que falta vai em `estilos/app.css`, só com token. Conferir: `node <BIBLIOTECA>/marca/design.mjs conferir estilos/nuvem-azul`.
- Edital fonte: `C:\Users\Admin\Pictures\cond.outubro2026.pdf` (condições de venda de outubro/2026).
- Grafo: `graphify query "<pergunta>"`; atualiza sozinho pelos ganchos do git.

## Regras e armadilhas
- Edital novo: mudar `regras.js` e `teste/calculo.test.js` juntos; todo valor cita o item.
- Textos da tela para leigo (pedido dele, 26/10): sem jargão ou com o jargão explicado ("Quem está vendendo" = comitente; "Taxa do leilão" = despesas administrativas; "Dívidas" = débitos). Item do edital só nas regras, entre parênteses.
- Leituras do edital: ATPV-e por UF (item 45) só para o Pan (está na seção dele); a tabela de taxa é de MATERIAIS (vem logo após "MATERIAIS: arrematação"); débitos vazios = pior caso (o teto do comitente); "Demais comitentes" tem teto de R$ 1.000, mas o item 75 diz que IPVA e licenciamento 2024/2025 são do comprador (a tela avisa).
- A conta do leilão segue o "+ Despesas" de cada lote no site (milanleiloes.com.br): lance + 5% + despesa adm. + "Despesas extras do lote". O padrão das extras é só o ATPV-e do edital (Pan por UF, Safra R$ 50) e volta a ele a cada troca de vendedor, estado ou tipo; remoção e "Despesa Assessoria" só entram se o site mostrar (26/10: lotes do Safra cobraram só R$ 50; um da Ford, R$ 250 de assessoria). Os testes guardam esses totais reais. Placa volta ao padrão só enquanto a pessoa não editou.
- `[hidden]` precisa de `display: none !important`: o DS põe `display` em `.na-field` e `.na-check`.
- No celular o total fica colado no lance (com o teclado aberto a barra fixa some atrás dele) e na barra de baixo quando os dois saem da tela.
- Ícones PNG gerados do `icone.svg` (Chrome headless + PIL). Trocou o SVG: gerar de novo.

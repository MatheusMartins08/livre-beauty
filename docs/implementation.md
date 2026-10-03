# Registro de implementação — Livre Beauty

Escopo aprovado: site editorial para um salão fictício, fotografias de banco e fontes locais, páginas institucionais, detalhes de serviços e profissionais, agendamento demonstrativo em cinco etapas e contato demonstrativo. A execução ocorre no diretório compartilhado do projeto. Nenhum commit, publicação ou implantação integra esta entrega.

## Registro de tarefas

- [x] Conteúdo centralizado, identidade visual, componentes compartilhados, layout e página inicial.
- [x] Fotografias, fontes, créditos, origem dos arquivos e licenças em `docs/assets.md`.
- [x] Páginas internas, seis detalhes de serviço, quatro perfis e documentos demonstrativos de atendimento.
- [x] Metadados por página, URLs canônicas, metadados sociais e bloqueio de indexação no modo demonstrativo.
- [x] Disponibilidade local, validação de contato e horário, compatibilidade e agendamento em cinco etapas.
- [x] Navegação responsiva, filtros, galeria ampliada, comparação editorial, contato, FAQ e canais demonstrativos.
- [x] Mapa externo opcional, carregado pelo OpenStreetMap após a escolha do visitante.
- [x] Recursos de acessibilidade implementados: teclado, foco de diálogos e formulários, mensagens de erro e movimento reduzido.
- [x] Suítes implementadas em `tests/availability.spec.ts`, `tests/booking.spec.ts`, `tests/pages.spec.ts`, `tests/interface.spec.ts` e `tests/quality.spec.ts`.
- [x] README em português com execução, edição, rotas, limites da demonstração e integração futura.
- [x] Verificação final integrada de lint, geração de tipos/TypeScript, suíte de testes e build de produção.
- [x] Registro final dos resultados, revisão visual em mobile/tablet/desktop e confirmação de eventuais limitações.

## Contratos de integração

`content/salon.ts` exporta `site`, `navigation`, `services`, `stylists`, `gallery`, `faqs`, `testimonials` e `salonPolicies`. IDs relacionam serviços e profissionais; slugs definem as URLs. `site.showPrices` controla a apresentação dos valores. `site.isDemo` controla indexação e emissão de dados estruturados, sem ativar funcionalidades reais.

`lib/utils.ts` exporta `bookingHref`, `formatPrice`, `priceLabel`, `getService` e `getStylist`. `lib/metadata.ts` exporta `pageMetadata`, `siteUrl` e `salonStructuredData`. `SITE_URL` fornece a origem dos metadados, com `http://localhost:3000` como padrão local.

`lib/booking.ts` contém `AvailabilityRequest`, `BookingRequest` e `BookingResult`, o fuso `America/Sao_Paulo` e os adaptadores demonstrativos `loadAvailability()` e `submitDemoBooking()`. São os pontos para substituir a disponibilidade e a confirmação locais em uma futura integração de agenda.

A página de agendamento recebe parâmetros assíncronos, valida a pré-seleção e mantém escolhas compatíveis pelos parâmetros `servico` e `profissional`. Serviços e perfis desconhecidos retornam 404.

## Limites da demonstração

Os formulários não persistem nem transmitem dados pessoais. Não há reserva real, endpoint de atendimento, cobrança ou integração de mensagem. Os dados permanecem apenas na memória dos componentes. WhatsApp, telefone, e-mail e Instagram apresentam a proposta em diálogos demonstrativos.

Imagens e fontes são locais. O mapa é uma exceção externa opcional: clicar em “Explorar a região” carrega conteúdo do OpenStreetMap, sem enviar os campos dos formulários. Ele mostra a região dos Jardins e não um estabelecimento real.

O modo demonstrativo usa `noindex, nofollow` e não emite JSON-LD de um negócio fictício. Alterar o modo exige revisar dados reais e metadados; integrar agenda e contato continua sendo um trabalho separado.

## Verificação final

Concluída em **2 de outubro de 2026**, no build de produção local, com Chrome e fuso de São Paulo.

| Verificação | Resultado |
| --- | --- |
| `npm.cmd run lint` | Sem erros ou avisos |
| `npm.cmd run typecheck` | Geração de rotas e TypeScript aprovados |
| `npm.cmd run test` | **160 testes passaram**, em 2,5 minutos, contra o servidor de produção |
| `npm.cmd run build` | Build otimizado aprovado; páginas institucionais estáticas e detalhes gerados pelo catálogo |
| Regressões finais de hero, menu, foco e movimento reduzido | 4 testes passaram após os últimos ajustes visuais e de conteúdo |
| Responsividade | 21 rotas em 320, 390, 768, 1440 e 1920 px, sem overflow horizontal |
| Imagens, links e console | Imagens locais carregadas, alt text, destinos e âncoras verificados; nenhum erro de console nas rotas |
| Acessibilidade automatizada | Nenhuma violação WCAG A/AA nos 21 caminhos, com axe-core |
| Revisão visual | Hero, serviços, perfis, galeria, contato e ambiente revisados em mobile, tablet e desktop |
| Revisão de código independente | Nenhum problema crítico ou importante identificado |

Os testes incluem pré-seleções válidas e inválidas, compatibilidade, duração, fuso, datas passadas, ausência de horários, carregamento, erros temporários, retry, preservação ao voltar, mudanças de profissional, validação dos dados e prevenção de duplo envio. Galeria, comparação, contato, FAQ sem JavaScript, menu e mapa opcional também foram verificados.

### Lighthouse

Auditorias do **Lighthouse 13.5.0**, realizadas em Chrome headless contra `http://localhost:3101`, após o build, usando as configurações padrão mobile e desktop:

| Medida | Mobile | Desktop |
| --- | --- | --- |
| Desempenho | **87** | **100** |
| Acessibilidade | **100** | **100** |
| Boas práticas | **100** | **100** |
| SEO | 66 | 66 |
| LCP | 3,7 s | 0,7 s |
| CLS | 0 | 0 |

O score de SEO reflete o `noindex, nofollow` intencional da demonstração. As pontuações de desempenho são medições locais de laboratório; a medição mobile anterior foi 92. O carregamento usa 104 KiB de fontes WOFF2 locais e imagens dimensionadas pelo Next.js. Não houve achados finais de acessibilidade nos relatórios.

Os relatórios JSON de auditoria ficam em `.cache/lighthouse-mobile.json` e `.cache/lighthouse-desktop.json`, excluídos do versionamento. Para reproduzir, inicie o build de produção e execute:

```powershell
npx.cmd --yes lighthouse@13.5.0 http://localhost:3101 --chrome-flags="--headless" --output=html --output-path=.cache/lighthouse-mobile.html
npx.cmd --yes lighthouse@13.5.0 http://localhost:3101 --preset=desktop --chrome-flags="--headless" --output=html --output-path=.cache/lighthouse-desktop.html
```

### Arquivos da entrega

- `app/`: layout, estilos, ícone, homepage e todas as páginas da proposta.
- `components/`: elementos reutilizáveis e controles de navegação, agendamento, filtros, galeria, comparação, FAQ, contato e mapa.
- `content/`: dados tipados do salão e créditos das imagens.
- `lib/`: disponibilidade, confirmação local, utilitários e metadados.
- `public/images/` e `public/fonts/`: fotografias, fontes e licenças locais.
- `tests/` e `playwright.config.ts`: suíte automatizada e execução contra desenvolvimento ou produção.
- `scripts/download-assets.mjs`, `docs/assets.md` e `README.md`: reprodução de arquivos, procedência e guia de manutenção.
- `package.json`, lockfile, ESLint, Next config e gitignore: scripts, dependências autorizadas, otimização e exclusão de ferramentas/artefatos.
- `AGENTS.md`: regras do usuário preservadas fora do bloco regenerado pelo Next.js.

Na entrega inicial, foram adicionados Phosphor Icons e Playwright. A refatoração da homepage acrescenta GSAP e `@gsap/react`. Lighthouse e o formatador foram usados temporariamente, sem alterar as dependências do projeto. O site permanece uma entrega local demonstrativa, sem publicação.

## Refatoração editorial da homepage — 2 de outubro de 2026

Somente `/` recebeu a nova identidade visual. A fotografia e a headline do hero foram preservadas, agora com moldura creme e header escuro sobre fundo claro. A composição segue sobre nós, manifesto fotográfico com Instagram, seis serviços, convite para os especialistas em uma seção charcoal com fotografia em arco, quatro FAQs, três avaliações fictícias, localização e rodapé completo.

A faixa de valores, os princípios de atendimento, o comparador, o feed independente e o CTA final separado foram retirados dessa página. O catálogo, os perfis, a galeria, os formulários e o agendamento das páginas internas mantêm o comportamento anterior. Nenhuma informação de um estabelecimento real foi criada.

### Arquivos desta refatoração

- `app/page.tsx`: composição em Server Component, textos e fotografias do hero e das oito seções.
- `app/home.module.css`: paleta e estilos isolados por rota, incluindo header, rodapé, diálogos, responsividade e transições CSS.
- `content/home.ts`: conteúdo editorial tipado, títulos visuais/acessíveis e referências aos serviços e FAQs existentes.
- `components/home-motion.tsx`: GSAP, ScrollTrigger, escopo React, limpeza, reveals e parallax de até 16 px.
- `components/home-faq.tsx`: FAQ nativo com melhoria progressiva, estado acessível, reversão da animação e movimento reduzido.
- `components/header.tsx`: detecção do hero mesmo com streaming e fechamento animado exclusivo do menu na homepage.
- `components/reveal.tsx`: exclusão da homepage do controlador anterior, evitando animações duplicadas.
- `package.json` e `package-lock.json`: somente GSAP e `@gsap/react` como novas dependências.
- `tests/home.spec.ts` e `tests/interface.spec.ts`: regressões da nova composição, tema, header, foco, CTAs, FAQ, menu, canais e mapa.
- `README.md` e este registro: manutenção da homepage, movimento, comandos e resultados.

### Revisão de movimento

Revisão aplicada com os critérios de `gsap-performance`, `review-animations`, `animate` e `transitions-polish`.

| Antes da revisão | Depois | Motivo |
| --- | --- | --- |
| Triggers com `once` podiam ser removidos durante a inicialização de outro ScrollTrigger | Timelines não rebobinam; os triggers permanecem até a limpeza do contexto | Evitar a corrida reproduzida na inicialização do parallax |
| Qualquer foco terminava o reveal imediatamente | Apenas foco `:focus-visible` termina o reveal | Preservar o alvo entre pointerdown e pointerup; acesso por teclado continua imediato |
| Números bronze tinham contraste de 2,73:1 sobre ivory | Números terracota com contraste suficiente para texto grande | Preservar legibilidade; bronze permanece nas estrelas decorativas |
| Uma imagem dimensionada apenas pela largura perdia definição no hero estreito e alto | `sizes` considera a altura do recorte mobile | Manter a fotografia nítida com `object-fit: cover` |

Veredito da revisão de movimento: **aprovado**. O movimento de apresentação fica em 650–900 ms, com deslocamento de 24 px e stagger limitado. Interações ficam em 150–250 ms, sem bounce, pinning, scroll hijacking ou `will-change` permanente. O parallax é restrito a desktop com ponteiro preciso. Contextos, observers, listeners e timers têm limpeza; mudanças de preferência de movimento restauram os elementos visíveis. A animação de altura é restrita ao FAQ, onde mantém o fluxo do conteúdo, dura 250 ms e reverte a partir da altura corrente.

### Comparação das páginas internas

Capturas de `/sobre` e `/faq` coincidiram integralmente com as capturas anteriores. Em `/servicos`, a comparação de pixels encontrou **zero diferenças fora das fotografias**; a diferença nas imagens decorreu exclusivamente do carregamento lazy entre capturas. Cores de body, header, rodapé e título coincidiram nos três caminhos. Os testes também verificam a ida e volta entre homepage e páginas internas sem vazamento de tema.

### Lighthouse da homepage refatorada

Lighthouse 13.5.0, Chrome headless e build local em `http://localhost:3101`:

| Medida | Mobile | Desktop |
| --- | --- | --- |
| Desempenho | 89 | 100 |
| Acessibilidade | 100 | 100 |
| Boas práticas | 100 | 100 |
| SEO | 66 | 66 |
| LCP | 3,7 s | 0,7 s |
| CLS | 0 | 0 |
| TBT | 100 ms | 0 ms |

O SEO permanece limitado pelo `noindex, nofollow` intencional. O desempenho mobile é uma medição de laboratório e pode variar; a entrega não foi publicada. Relatórios: `.cache/editorial-lighthouse-mobile.json` e `.cache/editorial-lighthouse-desktop.json`.

### Verificação final da refatoração

| Verificação | Resultado |
| --- | --- |
| `npm.cmd run lint` | Sem erros ou avisos |
| `npm.cmd run typecheck` | Geração de rotas e TypeScript aprovados |
| `npm.cmd run build` | Build otimizado aprovado; homepage permanece estática |
| `npm.cmd test` no build de produção | **170 testes passaram**, em 2,1 minutos |
| Primeiro clique dos canais e mapa sob demanda | Seis repetições consecutivas aprovadas em produção após a correção |
| axe-core, WCAG A/AA | Zero violações nas 21 rotas |
| Revisão visual | Capturas em 320, 390, 768, 1440 e 1920 px; CTAs na primeira tela e ausência de overflow verificadas |
| Teclado, movimento reduzido e funcionamento sem JavaScript | FAQ, menu, foco e visibilidade aprovados |
| Imagens, links e console | Fotografias locais e destinos válidos; zero erros de console nos testes das rotas |
| Formatação e diff | Prettier aprovado nos arquivos de código alterados; `git diff --check` sem erros |

O teste que exigia um comparador na homepage foi substituído pela verificação da composição resumida autorizada. Os testes de agendamento, filtros, galeria, contato, metadados e slugs inexistentes continuam na suíte.

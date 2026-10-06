# Registro de implementação — Livre Beauty

Entrega local com identidade editorial preservada, navegação simplificada, ações textuais compartilhadas e limpeza de recursos sem utilização.

## Alterações

- Nove páginas base e quatro perfis individuais; FAQ e localização concentrados na homepage.
- Serviços com seis âncoras, descrições resumidas, duração, preço inicial e agendamento pré-selecionado.
- Perfis com biografia, experiência, especialidades e serviços; sem a seção de inspiração.
- Rodapé com três colunas e links para destinos ativos.
- Ações com label, underline e seta; 200 ms, retração de 65%, deslocamento de 3 px e escala 1,08.
- Galeria com legendas centralizadas, preservando filtros, lightbox e navegação por teclado.
- Agendamento local com conclusão em Resumo da sua escolha, mantendo validação e proteção contra duplo envio.
- Mapa separado do formulário desativado e carregado somente sob demanda na homepage.
- Remoção de recursos antigos: comparador, controlador de reveal sem uso, exports e estilos exclusivos, cinco SVGs do template, três JPEGs sem referência ativa, TTFs e CSS de fonte arquivado.
- Vinte fotografias, três WOFF2, licenças e créditos preservados; script de assets alinhado ao inventário atual.

## Refinamento visual — sistema de ações

As ações deixaram de ser todas iguais e passaram a seguir uma hierarquia, com o mesmo tipo, a mesma curva (200 ms) e cantos retos:

- **Primária** (`.button`): preenchida em grafite, hover em terracota. Usada nas ações de conversão (agendar).
- **Secundária** (`.button-secondary`): contorno. **Clara** (`.button-light`): versão para fundos escuros ou fotos. **Compacta** (`.button-compact`): usada no header, nos cards e nas linhas de serviço.
- **Terciária** (`.action-link`): texto, sublinhado e seta. Assinatura editorial para ações de exploração.
- **Navegação** (`.nav-link`): sem seta. O sublinhado cresce no hover e fica fixo na página atual.
- **Seletores** (`.chip`): filtros da galeria e índice de /servicos.

`ButtonLink` aceita `secondary`, `light` e `compact`. `TextLink` cobre a ação terciária. Nenhum texto fica abaixo de 11 px, exceto o subtítulo do logotipo. O foco usa bronze ou branco nas superfícies escuras.

## Contratos preservados

IDs e slugs do catálogo, relações serviço/profissional, `showPrices`, metadados, parâmetros assíncronos e geração estática dos perfis. `ButtonLink` mantém suas propriedades existentes e utiliza `ActionContent` para a apresentação compartilhada. Não foram adicionadas dependências, endpoints ou integrações.

`loadAvailability()` e `submitDemoBooking()` permanecem adaptadores locais. Os dados são utilizados somente em memória. Os canais abrem diálogos locais e o mapa externo não recebe campos do agendamento. A indexação permanece desativada e não há emissão de JSON-LD de HairSalon.

## Verificação

- `npm.cmd run lint`, `npm.cmd run typecheck` e `npm.cmd run build`: aprovados.
- `npm.cmd test` no servidor de produção: **133 testes aprovados**.
- Treze URLs revisadas em 320, 390, 768, 1440 e 1920 px: 65 combinações sem overflow, imagens quebradas, links para destinos removidos ou erros no console.
- Axe com regras WCAG 2 A/AA e 2.1 A/AA: nenhuma violação detectada nas 13 páginas.
- Rotas removidas com resposta 404; âncoras, pré-seleções, menu, Escape, retorno do foco, lightbox, filtros, quatro FAQs e carregamento opcional do mapa verificados.
- Agendamento validado com dados inválidos, incompatibilidade, ausência de horários, retorno entre etapas, falhas temporárias, revalidação de horário e duplo envio. Nenhum POST de dados pessoais.
- Revisão de movimento: ações em 200 ms e somente transformações; foco imediato; redução de movimento durante a sessão; limpeza dos controladores GSAP entre páginas; FAQ nativo sem JavaScript.

Capturas e relatórios de auditoria permanecem em `.cache/`, fora do versionamento. A auditoria automática complementa a revisão visual e por teclado.

### Lighthouse em produção

Medições locais, realizadas após o encerramento dos testes de navegador para evitar concorrência de CPU:

| Página | Perfil | Desempenho | Acessibilidade | Boas práticas | LCP | CLS |
|---|---|---:|---:|---:|---:|---:|
| Homepage | Mobile | 92 | 100 | 100 | 3,3 s | 0 |
| Homepage | Desktop | 100 | 100 | 100 | 0,8 s | 0 |
| Serviços | Mobile | 83 | 100 | 100 | 3,9 s | 0 |
| Galeria | Mobile | 86 | 100 | 100 | 3,3 s | 0 |
| Agendamento | Mobile | 88 | 100 | 100 | 3,0 s | 0 |

As notas de SEO de 63–66 refletem exclusivamente o bloqueio intencional de indexação. `noindex` foi preservado. As medições de desempenho podem variar conforme máquina, cache e rede; permanecem oportunidades de otimização de carregamento de imagens e recursos, sem alteração das fotografias ou dependências nesta limpeza.

## Arquivos alterados

- Páginas: `app/page.tsx`, `app/sobre/page.tsx`, `app/servicos/page.tsx`, `app/profissionais/page.tsx`, `app/profissionais/[slug]/page.tsx`, `app/galeria/page.tsx`, `app/agendamento/page.tsx`, `app/politicas/page.tsx`, `app/privacidade/page.tsx` e `app/termos/page.tsx`.
- Estilos: `app/globals.css`, `app/home.module.css` e `components/booking.module.css`.
- Componentes: `components/ui.tsx`, `components/header.tsx`, `components/footer.tsx`, `components/service-directory.tsx`, `components/gallery-grid.tsx`, `components/booking-wizard.tsx`, `components/demo-channel.tsx` e o novo `components/location-map.tsx`.
- Conteúdo: `content/salon.ts`, `content/home.ts` e `content/image-credits.ts`.
- Testes: `tests/booking.spec.ts`, `tests/editorial.spec.ts`, `tests/home.spec.ts`, `tests/interface.spec.ts`, `tests/pages.spec.ts`, `tests/quality.spec.ts` e o novo `tests/cleanup.spec.ts`.
- Documentação e assets: `README.md`, `docs/assets.md`, este registro e `scripts/download-assets.mjs`.

Foram excluídas as três rotas antigas, `components/contact.tsx`, `components/before-after.tsx`, `components/reveal.tsx` e os assets sem utilização descritos em `docs/assets.md`. Fontes locais, licenças e fotografias utilizadas foram preservadas.

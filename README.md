# Livre Beauty

Website editorial para um ateliê de beleza, com conteúdo em português, fotografias locais e navegação responsiva. Next.js 16.3.8, App Router, React 19, TypeScript e Tailwind CSS 4. Ícones Phosphor, animações GSAP e testes Playwright.

## Executar e verificar

Requisitos: Node.js 20.9 ou superior e npm. No PowerShell:

Em um clone novo, copie `.env.example` para `.env.local` e preencha a URL e a
chave publicável do Supabase. Preserve o `.env.local` quando ele já estiver
configurado. O modelo, as migrations e as regras de acesso estão em
[docs/database.md](docs/database.md). Não versione credenciais.

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra [localhost:3000](http://localhost:3000). Em outros sistemas, use `npm` sem a extensão `.cmd`.

O botão **Enviar pelo WhatsApp** aparece após a confirmação da reserva, com nome,
serviço, profissional confirmado, data, início, término previsto e duração.
Configure `WHATSAPP_NUMBER` no `.env.local` com o número do salão em formato
internacional (país + DDD + número, somente dígitos). Reinicie o servidor após
alterar essa configuração. Sem um número válido, o WhatsApp permite escolher
um contato. A mensagem abre pronta; a pessoa revisa e envia pelo WhatsApp.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run start
```

O typecheck executa `next typegen` e `tsc --noEmit`. Após excluir rotas, um servidor de desenvolvimento antigo pode deixar tipos obsoletos em `.next/dev/types`; encerre esse servidor e descarte somente esse cache gerado antes de repetir o comando.

Para testar o build de produção em uma porta própria:

```powershell
$env:TEST_PRODUCTION = 'true'
$env:TEST_PORT = '3102'
npm.cmd test
```

O Playwright utiliza o Chrome instalado. Esta entrega é local, sem publicação.

## Páginas e navegação

| Rota | Conteúdo |
| --- | --- |
| `/` | Hero, história, manifesto, seis serviços, equipe, quatro FAQs, avaliações e localização |
| `/sobre` | História, valores e experiência do ateliê |
| `/servicos` | Seis categorias, fotografias, descrições, duração, investimento e agendamento |
| `/profissionais` | Quatro especialistas com filtro por serviço |
| `/profissionais/[slug]` | Biografia, experiência, especialidades e serviços compatíveis |
| `/galeria` | Fotografias com filtros e lightbox |
| `/agendamento` | Serviço, profissional, data e horário, dados e revisão |
| `/politicas` | Condições de atendimento |
| `/privacidade` | Tratamento dos dados, navegação e mapa opcional |
| `/termos` | Informações de uso |

São 13 URLs, contando os quatro perfis individuais. Perguntas frequentes e localização ficam na homepage, acessíveis por `/#faq-title` e `/#visite-title`. Os serviços são acessados por `/servicos#<slug>`. Não há controles flutuantes ou barra fixa inferior.

Slugs de profissional: `lia-monteiro`, `rafael-costa`, `marina-alves` e `sofia-dias`. Perfis desconhecidos retornam 404. Slugs de serviço continuam identificando categorias e pré-seleções: `corte-autoral`, `coloracao-personalizada`, `balayage`, `ritual-de-tratamento`, `finalizacao-e-penteados` e `extensoes`.

O agendamento aceita `?servico=<slug>&profissional=<slug>`, validando a existência e a compatibilidade dos valores. Exemplo: `/agendamento?servico=corte-autoral&profissional=lia-monteiro`.

## Conteúdos editáveis

O dono edita textos e fotos da homepage, galeria, contato, serviços, combos,
profissionais, horários, exceções e regras do agendamento em `/painel` →
**Edição do site**. Os arquivos abaixo continuam como conteúdo padrão e para as
páginas que não estão no editor. Detalhes, permissões e migrations em
[docs/site-editor.md](docs/site-editor.md).

| Local | Responsabilidade |
| --- | --- |
| `content/salon.ts` | Marca, navegação, catálogo, profissionais, relações, galeria, avaliações, quatro FAQs e políticas |
| `content/home.ts` | Textos resumidos, títulos e fotografias da homepage |
| `content/image-credits.ts` | Caminhos locais, autores, origem e licença das 20 fotografias |
| `app/globals.css` | Paleta, fontes, espaçamentos, ações e responsividade compartilhados |
| `app/home.module.css` | Composição exclusiva da homepage e destaque translúcido dos serviços |
| `components/ui.tsx` | `ActionContent`, `ButtonLink`, títulos, fotografias, profissionais e CTAs |
| `components/booking-wizard.tsx` | Estados e controles das cinco etapas |
| `lib/booking.ts` | Disponibilidade, fuso, compatibilidade e validação da seleção |
| `components/demo-channel.tsx` | Diálogos locais dos canais e seus destinos |
| `components/location-map.tsx` | Carregamento opcional do mapa na homepage |
| `components/faq-accordion.tsx` | FAQ nativo com abertura reversível e acessível |
| `lib/metadata.ts` | Metadados, origem e dados estruturados |

`site.showPrices` controla os valores em todo o site; `false` exibe “Investimento sob consulta”. Preserve IDs nas relações `serviceIds` e `stylistId`. Preserve também os slugs usados nas âncoras e no agendamento.

## Identidade e movimento

Ivory `#F6F1EB`, creme `#EDE4DA`, soft white `#FCFAF7`, charcoal `#24211F`, espresso `#302A27`, taupe `#756A64`, terracota `#A86650`, bronze `#B78A62`, bege rosado `#D8C6B8` e divisórias `#D7CEC6`. Títulos em Cormorant Garamond, texto e controles em Geist. As três fontes WOFF2 e suas licenças são locais.

As ações compartilham `.action-link`, `.action-label` e `.action-arrow`. O texto recebe underline; hover e foco recuam a linha para 65% e movem a seta 3 px para cima/direita com escala 1,08. Os tokens `--action-duration` e `--action-ease` controlam a transição de 200 ms. `ActionContent` renderiza label e seta; `ButtonLink` mantém seu contrato de propriedades e utiliza esse padrão. `.action-inline` preserva a entrelinha dos links inseridos em textos.

`HomeMotion` e `PageMotion` usam `useGSAP`, referências locais e `gsap.matchMedia()` com limpeza ao navegar. Reveals duram 650 ms, percorrem 24 px e limitam o stagger a 180 ms. Parallax de até 16 px é restrito às fotos do manifesto e da experiência em desktop com ponteiro preciso. Menu: entrada de 250 ms e saída de 150 ms. FAQ: Web Animations API, 250 ms, reversível a partir da posição atual.

Filtros e FAQ emitem `page-layout-change` para atualizar o ScrollTrigger quando o layout muda. Alterar `prefers-reduced-motion` durante a sessão cancela movimentos. O conteúdo permanece visível sem JavaScript e o FAQ mantém o comportamento nativo de `details`. Hover animado exige ponteiro preciso; foco por teclado continua imediato e visível.

## Dados e integrações

A disponibilidade usa catálogo, horários de funcionamento e intervalos ocupados
do Supabase, no fuso `America/Sao_Paulo`. Respeita a duração do serviço,
elimina horários passados e é revalidada ao confirmar. Voltar preserva
respostas; mudanças incompatíveis limpam seleções posteriores.
`loadAvailability()` consulta o banco e `submitDemoBooking()`, apesar do nome
legado, registra a reserva real. As RPCs impedem conflitos de horários.

Antes da confirmação, os dados pessoais ficam na memória da página. Ao confirmar,
nome, telefone e e-mail são registrados no Supabase com os dados do atendimento.
O painel usa autenticação real e exige um perfil autorizado em `staff_profiles`;
as consultas e gravações respeitam RLS. Os cookies da equipe mantêm a sessão,
sem armazenar dados do formulário em `localStorage` ou `sessionStorage`.

Não há pagamentos pelo site. Os diálogos institucionais de Instagram levam à
galeria; WhatsApp e telefone levam ao agendamento. Na confirmação, o botão
**Enviar pelo WhatsApp** abre uma mensagem pronta no número configurado, para
revisão e envio pela pessoa. As máscaras formatam telefones com DDD e valores
em reais, preservando a validação antes de salvar.

O OpenStreetMap é solicitado somente após clicar em **Explorar a região**. O iframe usa `referrerPolicy="no-referrer"` e não recebe os dados do agendamento. Fotografias e fontes permanecem locais.

`site.isDemo` permanece ativo para manter `noindex, nofollow` e desativar o JSON-LD de `HairSalon`. `SITE_URL` define a origem dos metadados; o padrão é `http://localhost:3000`. Revise as informações e a configuração de indexação antes de publicar.

## Assets e qualidade

[docs/assets.md](docs/assets.md) registra créditos, licenças e reprodução dos assets. O script `node scripts/download-assets.mjs` gera somente as fotografias e fontes utilizadas; `--images-only` e `--fonts-only` limitam o escopo. Ao substituir fotografias, mantenha dimensões reservadas, textos alternativos descritivos, `sizes` e os créditos correspondentes.

Os testes cobrem as 13 URLs em 320, 390, 768, 1440 e 1920 px, links e âncoras, imagens, teclado, movimento reduzido, menus, filtros, lightbox, FAQ sem JavaScript, canais locais, mapa sob demanda e agendamento. Incluem pré-seleções válidas e inválidas, incompatibilidade, retorno entre etapas, ausência de horários, validação, erros temporários, revalidação e duplo envio.

Relatórios e capturas locais ficam em `.cache/`, `test-results/` e `playwright-report/`, fora do versionamento. [docs/implementation.md](docs/implementation.md) registra a revisão da entrega.

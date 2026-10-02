# Livre Beauty

Site demonstrativo de um ateliê de beleza fictício, com direção editorial, fotografias locais e navegação responsiva. Construído com Next.js 16, App Router, React 19, TypeScript e Tailwind CSS 4. Ícones: Phosphor Icons. Testes: Playwright.

## Executar localmente

Requisitos: Node.js 20.9 ou superior e npm. Na raiz do projeto, usando PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra [localhost:3000](http://localhost:3000). Os comandos usam `.cmd` para funcionar também em ambientes Windows com restrição à execução de scripts PowerShell. Em outros sistemas, use `npm` e `npx` sem essa extensão.

Para verificar o projeto:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

`typecheck` gera os tipos de rota do Next.js antes de executar o TypeScript. Para abrir a versão de produção local, encerre o servidor de desenvolvimento, gere o build e inicie o servidor:

```powershell
npm.cmd run build
npm.cmd run start
```

Nenhuma publicação ou implantação faz parte desta entrega.

## Funcionamento da demonstração

- Apresentação do salão, serviços, equipe, experiência e referências fotográficas.
- Filtro de profissionais por serviço e de referências da galeria por categoria.
- Galeria ampliada e comparação editorial entre referências naturais e finalizadas.
- Agendamento em cinco etapas: serviço, profissional, data e horário, contato e revisão.
- Horários demonstrativos no fuso `America/Sao_Paulo`, considerando duração, compatibilidade, dias de atendimento e horários já transcorridos.
- Validação de contato e revalidação do horário antes da confirmação da simulação.
- Formulário de contato e canais demonstrativos de WhatsApp, telefone, e-mail e Instagram.

**Nenhuma reserva real é criada.** Não há backend de atendimento, pagamento, envio de mensagem ou persistência dos dados dos formulários. Os campos ficam apenas na memória da página; a aplicação não os grava em banco de dados, `localStorage`, `sessionStorage` ou cookies. Para experimentar, use dados de exemplo. O preenchimento automático depende das configurações do navegador.

Marca, endereço, equipe, experiências, depoimentos, preços e políticas são fictícios. As fotografias são ilustrativas e não comprovam resultados realizados pelo salão. O site usa `noindex, nofollow` enquanto `site.isDemo` estiver ativo e não inclui rastreamento de marketing ou analytics.

Em `/contato`, **somente ao clicar em “Explorar a região”** o navegador solicita o mapa externo do OpenStreetMap. O mapa mostra a região dos Jardins, sem indicar um estabelecimento real, e não recebe os dados dos formulários. “Como chegar à região” também abre o OpenStreetMap. Imagens e fontes do site são carregadas localmente.

## Rotas

| Rota | Conteúdo |
| --- | --- |
| `/` | Página inicial |
| `/sobre` | História, valores e proposta de cuidado |
| `/servicos` | Diretório, categorias, duração e investimento inicial |
| `/servicos/[slug]` | Serviço, orientações, profissionais e referências |
| `/profissionais` | Equipe com filtro por serviço |
| `/profissionais/[slug]` | Perfil, especialidades e portfólio ilustrativo |
| `/galeria` | Referências com filtros e visualização ampliada |
| `/agendamento` | Agendamento demonstrativo em cinco etapas |
| `/contato` | Formulário, canais, horários e mapa opcional |
| `/faq` | Perguntas frequentes |
| `/politicas` | Modelo de políticas de atendimento |
| `/privacidade` | Funcionamento dos dados e do mapa externo |
| `/termos` | Termos da apresentação demonstrativa |

Slugs de serviço: `corte-autoral`, `coloracao-personalizada`, `balayage`, `ritual-de-tratamento`, `finalizacao-e-penteados` e `extensoes`. Slugs de profissional: `lia-monteiro`, `rafael-costa`, `marina-alves` e `sofia-dias`. Slugs desconhecidos retornam 404.

Os links de agendamento preservam a seleção pelos parâmetros `servico` e `profissional`, por exemplo: `/agendamento?servico=corte-autoral&profissional=lia-monteiro`. A página valida os slugs e a compatibilidade dessa combinação.

## Editar conteúdo e aparência

| Arquivo ou pasta | O que editar |
| --- | --- |
| `content/salon.ts` | Marca, textos, navegação, serviços, profissionais, relações, galeria, depoimentos, FAQ e políticas |
| `content/image-credits.ts` | Autores, origem, licença e caminhos das fotografias |
| `app/globals.css` | Cores, espaçamento, tipografia e regras responsivas |
| `app/layout.tsx` | Fontes locais, estrutura global e configuração geral de SEO |
| `components/ui.tsx` | Títulos, fotografias, botões, cartões e chamadas de agendamento |
| `components/booking-wizard.tsx` | Etapas e estados do agendamento |
| `lib/booking.ts` | Datas, horários, disponibilidade, validação e confirmação demonstrativa |
| `components/contact.tsx` | Formulário e carregamento opcional do mapa |
| `components/demo-channel.tsx` | Canais demonstrativos |
| `lib/metadata.ts` | Metadados por página, URL base e dados estruturados |
| `public/images/` | Fotografias locais |
| `public/fonts/` | Fontes e licenças |

Em `content/salon.ts`, altere `site.showPrices` para `false` para apresentar “Investimento sob consulta”. Preserve os IDs nas relações `serviceIds` e `stylistId`; os slugs definem as URLs. Ao renomear um slug, revise links e testes.

O título principal é editado em `site.hero.title.opening` e `site.hero.title.emphasis`; a segunda parte recebe o destaque em itálico. O nome acessível e o título SEO são derivados desse mesmo conteúdo.

`site.isDemo` começa como `true`. Antes de representar um estabelecimento real, substitua os dados fictícios, revise os textos demonstrativos e configure a origem correta em `SITE_URL`, no ambiente ou em `.env.local`. O padrão é `http://localhost:3000`. Em `lib/metadata.ts`, confira endereço, cidade, horários e imagens de `salonStructuredData()` antes de mudar `site.isDemo` para `false`: essa mudança habilita indexação e JSON-LD de `HairSalon` no layout.

**Mudar `isDemo` não ativa reservas, mensagens, pagamentos ou canais reais.** Essas funcionalidades precisam de integração própria. Mantenha segredos no servidor e não versione `.env.local`.

## Fotografias, fontes e créditos

As fotografias ficam em `public/images/`. A origem de cada arquivo, autores, créditos, recortes e observações de uso estão em [docs/assets.md](docs/assets.md). A galeria reutiliza algumas imagens de serviços para manter a continuidade visual.

Cormorant Garamond e Geist ficam em `public/fonts/` e são carregadas com `next/font/local`. As licenças integrais acompanham os arquivos em `cormorant-garamond.LICENSE.txt` e `geist.LICENSE.txt`; os créditos também constam em `docs/assets.md`.

O procedimento para reproduzir os arquivos locais, com acesso à rede, e o script `scripts/download-assets.mjs` estão documentados em `docs/assets.md`.

## Testes no navegador

`playwright.config.ts` usa o Google Chrome instalado por meio de `channel: "chrome"`, no fuso de São Paulo. Se o navegador não estiver disponível, instale o navegador desse canal e execute a suíte:

```powershell
npx.cmd playwright install chrome
npm.cmd run test
```

A suíte inicia automaticamente o servidor em [localhost:3100](http://localhost:3100), ou reutiliza um servidor local disponível nessa origem. Não é necessário iniciar outro servidor manualmente para os testes. O relatório HTML fica em `playwright-report/`; capturas e rastros de falhas ficam em `test-results/`.

Para executar os testes contra o build local:

```powershell
npm.cmd run build
$env:TEST_PORT = "3101"
$env:TEST_PRODUCTION = "true"
npm.cmd run test
Remove-Item Env:TEST_PORT, Env:TEST_PRODUCTION
```

| Arquivo | Cobertura |
| --- | --- |
| `tests/availability.spec.ts` | Datas, fuso, compatibilidade, disponibilidade e revalidação |
| `tests/booking.spec.ts` | Etapas, pré-seleção, validação e confirmação |
| `tests/pages.spec.ts` | Rotas, metadados, filtros, links de agendamento e 404 |
| `tests/interface.spec.ts` | Interações, navegação, galeria, FAQ, contato e responsividade |
| `tests/quality.spec.ts` | Todas as 21 rotas em 320, 390, 768, 1440 e 1920 px; imagens, links, console, foco, movimento reduzido e mapa opcional |

O estado da verificação final fica em [docs/implementation.md](docs/implementation.md).

As instruções do projeto em `AGENTS.md` ficam fora do bloco gerado pelo Next.js, para que `next dev` preserve suas regras ao atualizar o arquivo.

## Pontos para futura integração

`loadAvailability()` e `submitDemoBooking()`, em `lib/booking.ts`, são os pontos de entrada para consulta e confirmação. Hoje executam apenas regras locais. Uma operação real pode substituir esses adaptadores, mantendo os contratos `AvailabilityRequest`, `BookingRequest` e `BookingResult` usados pelo componente. O serviço real de agenda deve verificar disponibilidade e confirmação, incluindo a prevenção de reservas simultâneas.

O envio de contato fica em `ContactForm`, em `components/contact.tsx`. Os canais externos estão concentrados em `components/demo-channel.tsx`. Nenhum serviço de e-mail, CRM, calendário ou banco de dados foi escolhido neste projeto. A integração deve definir o serviço efetivo, os tratamentos de erro e os dados necessários antes de ativar o envio.

Depois das integrações, atualize confirmações, informações reais, privacidade, termos e políticas. `site.futureSections` registra possibilidades como loja, gift cards, blog, carreiras, promoções e unidades; essas rotas ainda não estão implementadas.

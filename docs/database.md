# Banco de dados do LivreBeauty

## Escopo e estado

O modelo abaixo foi derivado de `content/salon.ts`, `lib/admin.ts` e
`lib/booking.ts`. A Fase 2 criou e validou o banco; a Fase 3 conecta o Next.js
com `@supabase/supabase-js` e `@supabase/ssr`. O login demonstrativo e a agenda
mock foram substituídos por sessão verificada no servidor, RLS e persistência.

As migrations e seeds foram executados localmente em PostgreSQL via PGlite, com
`btree_gist` e uma simulação mínima de `auth.users`/`auth.uid()`.
Em 06/10/2026, as quatro migrations foram aplicadas pelo MCP ao Supabase após
confirmar que `public` e o histórico de migrations estavam vazios. O catálogo foi
carregado; os testes SQL passaram no Supabase com rollback, antes e depois da
consolidação das políticas. O seed de demonstração foi testado somente localmente.

Projeto identificado: `mvsginzwrlspwgcxphtd`, pela URL enviada pelo usuário.
O MCP foi adicionado ao `config.toml` local com esse ref e aprovação manual.
`codex mcp login supabase` concluiu a autenticação OAuth com sucesso.
URL e chave publicável foram salvas apenas no `.env.local` ignorado pelo Git.
O acesso às ferramentas MCP foi verificado nessa sessão. Ao concluir a Fase 2,
o estado validado era: oito tabelas com RLS; 6 serviços, 4 profissionais, 12 vínculos, 7 dias
de funcionamento e 1 configuração; zero clientes, atendimentos e perfis da equipe.
O catálogo remoto foi comparado integralmente com o TypeScript, incluindo textos,
preços, durações, imagens, especialidades, biografias, ordem e vínculos.
`lib/supabase/database.types.ts` contém a saída de `generate_typescript_types`.
`npm.cmd run typecheck` passou; `npm.cmd run lint` terminou com zero erros e
94 avisos em scripts preexistentes de `.claude/skills`, sem alterações nesses arquivos.
Naquela etapa, o usuário escolheu deixar o painel conectado e protegido, aguardando
contas futuras. Não foram criadas contas Auth nem aplicado o seed_demo.sql. Não havia
usuários para apagar. O catálogo é a base de exemplo; clientes e atendimentos
permanentes continuam vazios.

### Acesso administrativo — atualização de 07/10/2026

A pedido do usuário, foi criada a conta `admin@gmail.com` pela API oficial
`auth.admin.createUser`, com e-mail confirmado e a senha solicitada recebida
somente em memória. Seu UUID é `e32387a4-b19a-485a-a7be-1b274bbda2dc`;
`public.staff_profiles` contém o vínculo com papel `owner` e `stylist_id=null`.
Não houve alteração de esquema, políticas, seeds ou configurações do Auth.

O login com a chave publicável e a leitura do próprio perfil via RLS passaram.
Pelo formulário local, foram verificados o redirecionamento de visitante ao
login, a entrada no painel, a sessão após recarregar e o logout com bloqueio
do painel. Não foram criados clientes nem agendamentos nesses testes.

Login local: `http://localhost:3000/painel/entrar`. Em produção, usar o mesmo
caminho no domínio do site. As instruções de acesso estão em `AGENTS.md`;
senha e chave administrativa permanecem fora do Git.

| Versão UTC, igual ao histórico remoto | Migration |
| --- | --- |
| `20261007014620` | `init_schema` |
| `20261007014623` | `rls_policies` |
| `20261007014625` | `public_booking_rpc` |
| `20261007014729` | `harden_rls_policies` |
| `20261007015945` | `public_booking_settings` |
| `20261007021552` | `public_booking_concurrency` |

Os timestamps são UTC, portanto indicam 07/10; a execução aconteceu em 06/10 no
fuso de São Paulo. Os nomes dos arquivos locais foram sincronizados com as versões
geradas pelo MCP, sem alterar o conteúdo das migrations já aplicadas.

O esquema SQL enviado durante a preparação contém `services` e `appointments`
incompatíveis com este modelo, além de assinaturas e pagamentos de outro domínio.
Ele é apenas contexto e não deve ser executado. Estas migrations se destinam a um
**projeto de desenvolvimento vazio**. Se a inspeção revelar essas tabelas no alvo,
parar e confirmar o destino; não apagar, renomear ou substituir suas estruturas.

## Conexão MCP

O Project ref é o identificador de Project Settings → General ou da URL
`https://supabase.com/dashboard/project/<ref>`; um dump SQL não contém esse ref.
O usuário autorizou editar `C:\Users\victo\.codex\config.toml`.
O servidor foi adicionado preservando todas as outras configurações.

```toml
[mcp_servers.supabase]
url = "https://mcp.supabase.com/mcp?project_ref=mvsginzwrlspwgcxphtd&features=database,docs,development,debugging"
default_tools_approval_mode = "prompt"
```

Não inserir token no arquivo. Autenticar com `codex mcp login supabase` ou na
interface do Codex, confirmar com `codex mcp list` e reiniciar a sessão/cliente
se as ferramentas não aparecerem. O usuário conclui o consentimento OAuth no
navegador. A versão local verificada foi `codex-cli 0.162.0-alpha.2`, com suporte
a HTTP; não é necessário adicionar a opção antiga `experimental_use_rmcp_client`.
Para análise sem escrita, acrescentar `&read_only=true` à URL e remover antes da
aplicação. A aprovação manual depende também da política efetiva do cliente;
a configuração não altera as permissões de uma sessão já iniciada.

Referências: [MCP no Codex — documentação oficial OpenAI](https://learn.chatgpt.com/docs/extend/mcp?surface=cli),
[MCP do Supabase](https://supabase.com/docs/guides/ai-tools/mcp).

## Modelo

Todos os registros têm `created_at` e `updated_at` em `timestamptz`, com trigger
automático para atualização. As oito tabelas têm RLS habilitado desde a primeira
migration, sem janela inicial de acesso público às informações privadas.

| Tabela | Chave e campos principais | Origem/regra |
| --- | --- | --- |
| `services` | `id text`, slug, name, category, description, duration, price, image, active, sort_order | Os 6 serviços, preços em reais e duração em minutos |
| `stylists` | `id text`, slug, name, role, experience, specialties text[], description, biography, image, active, sort_order | Os 4 profissionais; `role` aqui é a descrição profissional, não autorização |
| `stylist_services` | PK (stylist_id, service_id), active, sort_order | Vínculos e ordem de `Stylist.serviceIds` |
| `business_hours` | `weekday` 0–6, active, opens_at, closes_at | Domingo = 0; terça a sábado, 09:00–19:00; dias fechados com horários nulos |
| `clients` | `id text`, name, phone unique, email, notes | `AdminClient`; telefone normalizado; nenhum acesso anônimo |
| `appointments` | `id text`, client_id, service_id, booked_with nullable, performed_by, starts_at, ends_at, status, price, payment_method nullable, source, notes | `AdminAppointment`; null em booked_with significa sem preferência |
| `staff_profiles` | `user_id uuid` → auth.users, role, stylist_id unique nullable | owner/staff; funcionário precisa de profissional vinculado |
| `salon_settings` | Singleton `id boolean = true`, show_prices, time_zone, booking_window_days, slot_interval_minutes, demo_commission_rate | `site.showPrices`, fuso e parâmetros existentes no booking; comissão ilustrativa de `lib/admin.ts` |

IDs textuais preservam `corte`, `lia`, URLs e referências existentes. Clientes e
atendimentos novos recebem UUID convertido para texto; seeds mantêm os IDs mock.
As quatro enumerações são:

- `app_role`: owner, staff (equivalentes a dono e funcionário no painel).
- `appointment_status`: agendado, concluido, faltou, cancelado.
- `payment_method`: pix, cartao, dinheiro.
- `appointment_source`: site, painel.

Não migrar galeria, depoimentos, FAQs, políticas, textos editoriais ou `home.ts`.
Descriptions e biografias próprias dos registros de serviço/profissional são
preservadas no catálogo. Endereço e demais textos do site continuam no TypeScript.

## Integridade e horários

- `ends_at > starts_at`, preços não negativos e duração positiva.
- Exclusão GiST com `btree_gist` impede sobreposição por `performed_by` e por
  `client_id` para agendados/concluídos, inclusive em requisições concorrentes.
  Intervalos são `[início, fim)`: um atendimento pode começar quando outro termina.
- Cancelamentos e faltas liberam o horário. Reativar um atendimento valida o
  funcionamento e os conflitos novamente.
- Trigger valida que o profissional, serviço e vínculo estão ativos ao criar,
  trocar profissional/serviço/horário ou reativar um atendimento. Alterar notas,
  pagamento ou cancelar um registro histórico continua possível após desativar
  itens do catálogo.
- Agendados/concluídos devem começar e terminar no mesmo dia local e dentro de
  `business_hours`, sempre em `America/Sao_Paulo`. O painel pode registrar histórico;
  a RPC pública exige instante futuro, janela de 30 dias e grade de 30 minutos.
- O fim de reservas públicas vem da duração do serviço, e o preço é copiado no
  momento da reserva. Editar um serviço não altera preços ou duração de históricos.
  Chamadas futuras do painel devem calcular `ends_at` no servidor a partir do serviço.
- O telefone recebe somente dígitos, remove prefixo brasileiro 55 quando há
  DDD+número e exige 10 ou 11 dígitos. Nome/e-mail são aparados. Um telefone único
  pressupõe uma cliente por número; mudar essa regra exige migration e ajuste da RPC.
- FKs restringem exclusões de registros referenciados; desativar catálogo mantém
  os históricos. Índices cobrem todas as FKs e as consultas por profissional/data.

## Permissões

`private.is_owner()` e `private.current_stylist_id()` consultam `staff_profiles` usando `auth.uid()`.
São funções `stable security definer`, com `search_path` vazio e referências
qualificadas. Só `authenticated` pode executá-las. A quarta migration moveu as
funções de `public` para `private`, fora do schema exposto pela Data API, e
consolidou as políticas em uma por papel/operação. Não adicionar `private` aos
schemas expostos da API. Não há autorização baseada em
parâmetros de URL, perfil escolhido na interface ou metadata editável pelo usuário.

| Tabela | Anon | Staff | Owner |
| --- | --- | --- | --- |
| Catálogo e funcionamento | SELECT de itens ativos; vínculos exigem serviço/profissional ativos | SELECT de ativos | SELECT inclusive inativos; INSERT/UPDATE/DELETE |
| clients | SELECT retorna zero linhas; sem escrita | SELECT de clientes com atendimentos próprios; sem escrita | SELECT/INSERT/UPDATE/DELETE, sujeito às FKs |
| appointments | SELECT retorna zero linhas; sem escrita direta | SELECT/INSERT/UPDATE apenas com performed_by próprio | SELECT/INSERT/UPDATE de todos |
| staff_profiles | Sem acesso | SELECT do próprio perfil; sem alteração de vínculo/papel | Gerencia todos |
| salon_settings | Sem acesso | Sem acesso | Gerencia o singleton |

Não há privilégio nem política de DELETE de atendimentos para `anon` ou
`authenticated`, incluindo owner. Papéis administrativos do banco e a chave
secreta do Supabase têm privilégios elevados; nunca usá-los para operações comuns
do painel. As políticas de UPDATE verificam o registro anterior e posterior,
impedindo que staff transfira um atendimento a outro profissional.

`salon_settings` não é um perfil individual; a interpretação adotada é acesso
apenas do owner. RPCs públicas leem internamente os parâmetros necessários.

Referência: [RLS no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Resultado dos advisors

Depois da quarta migration, não há alertas de RLS ausente, índices faltantes ou
políticas permissivas sobrepostas. Há dois grupos de avisos de segurança, cada um
com as mesmas três RPCs: `create_public_booking`, `get_booked_ranges` e
`get_booking_settings`, executáveis
por `anon` e `authenticated` como SECURITY DEFINER. Essa exposição é intencional
para oferecer reserva/disponibilidade sem acesso direto aos dados privados.
Os avisos foram revisados; não representam uma afirmação de segurança completa.
Revogar EXECUTE ou usar SECURITY INVOKER impediria o fluxo público previsto.

- [RPC SECURITY DEFINER acessível a anon — aviso 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
- [RPC SECURITY DEFINER acessível a authenticated — aviso 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- O advisor de desempenho informa quatro índices ainda sem uso:
  `appointments_client_id_idx`, `appointments_service_id_idx`,
  `appointments_booked_with_idx` e `appointments_starts_at_idx`. Foram mantidos
  para FKs/consultas futuras, pois não há atendimentos persistidos nem carga real.
  [Índices sem uso — informação 0005](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

As funções auxiliares privadas não aparecem mais nos avisos de exposição da API.

## RPCs públicas

`get_booking_settings()` expõe somente `show_prices`, `booking_window_days` e
`slot_interval_minutes`. Não concede SELECT anônimo em `salon_settings` nem
retorna comissão ou configurações privadas. A UI usa esses parâmetros para
preço, janela e grade; a confirmação sempre valida novamente no banco.


Ambas usam `security definer`, `search_path` vazio, consultas qualificadas e
EXECUTE apenas para `anon`/`authenticated` (revogado de PUBLIC).

`get_booked_ranges(p_date date, p_stylist_id text default null)` retorna somente
`performed_by`, `starts_at`, `ends_at` de agendados/concluídos que cruzam o dia
local. Não retorna IDs de cliente/atendimento, contatos, notas ou preços.

`create_public_booking(p_service_id text, p_stylist_id text, p_starts_at timestamptz,
p_name text, p_phone text, p_email text)` recebe null em `p_stylist_id` para
sem preferência. Valida contato, serviço, janela, grade, funcionamento e vínculo.
Escolhe o primeiro profissional livre na ordem do catálogo, reutiliza o cliente
por telefone e insere status agendado/source site/preço do serviço. Usa
`ON CONFLICT DO NOTHING`: uma chamada anônima não sobrescreve nome, e-mail ou notas
de uma cliente existente. Cada tentativa de profissional é uma subtransação;
conflitos de exclusão e deadlocks da tentativa desfazem a inserção de cliente e
permitem tentar o próximo. A migration `public_booking_concurrency` trata
`deadlock_detected` no mesmo bloco transacional, preservando o retorno
`unavailable` em vez de expor HTTP 500. As constraints continuam obrigatórias.

O retorno JSON segue `BookingResult` de `lib/booking.ts`: sucesso com `ok` e `slot`
(id, serviceId, stylistId, date, time, startAt em ISO UTC com milissegundos), ou
falha com `ok=false`, `code=contact|unavailable` e `message`. Não retorna dados
pessoais, nem informa se um telefone já estava cadastrado.

## Seeds

- `supabase/seed.sql`: 6 serviços, 4 profissionais, 12 vínculos, 7 dias de
  funcionamento e 1 registro de configuração. Valores e textos do catálogo foram
  extraídos do TypeScript, preservando a ordem. As configurações operacionais
  refletem `lib/booking.ts`; a comissão de 50% continua explicitamente demonstrativa.
- `supabase/seed_demo.sql`: 12 clientes e **168 atendimentos**, resultado exato de
  `createDemoAppointments('2026-10-06')`. Datas são fixas para a reexecução não criar
  uma nova agenda a cada dia. Telefones são normalizados pelo trigger.
- Ambos usam transação e `ON CONFLICT DO NOTHING`, preservando registros existentes.
  Servem para carga inicial; mudanças futuras no catálogo persistido exigem revisão.
- O usuário escolheu **apenas criar o seed_demo.sql, sem inserir no Supabase**.
  Não criar usuários Auth ou staff_profiles no seed; os vínculos reais dependem
  dos UUIDs gerados pelo Auth.

## Aplicação e validação no Supabase

1. Ler este documento. Confirmar o ref e o ambiente de desenvolvimento.
2. Chamar `list_tables`, `list_extensions` e `list_migrations`; confirmar que o
   alvo está vazio e que `btree_gist` pode ser instalado. Não executar o dump enviado.
3. Em um novo ambiente vazio, usar `apply_migration`, na ordem, com o SQL **exato**
   dos seis arquivos e o nome descritivo correspondente (`init_schema`,
   `rls_policies`, `public_booking_rpc`, `harden_rls_policies`, `public_booking_settings`, `public_booking_concurrency`). Comparar o histórico
   do MCP e sincronizar os timestamps gerados sem editar SQL já aplicado. **Não
   reaplicar** estas migrations no projeto atual: elas já estão registradas.
4. Executar `supabase/seed.sql` via `execute_sql`, por conter somente dados.
5. Executar `supabase/tests/database.sql` via `execute_sql`, em desenvolvimento
   vazio após o catálogo e antes de qualquer demo. Contém BEGIN/ROLLBACK e fixtures
   temporárias, sem DDL. Uma falha aborta a transação: emitir ROLLBACK se necessário.
6. Confirmar as oito tabelas com RLS e contagens do catálogo. Verificar todo o
   catálogo contra `content/salon.ts`, incluindo preço, duração, textos e vínculos.
7. Consultar `get_advisors` para security e performance. Corrigir alertas de RLS,
   privilégios de função ou índices faltantes com novas migrations versionadas.
8. Chamar `generate_typescript_types`; salvar a resposta em
   `lib/supabase/database.types.ts`. Preencher `.env.local` apenas quando necessário,
   usando `.env.example`, e nunca versionar valores privados.
9. Rodar `npm.cmd run typecheck` e `npm.cmd run lint`.

O gerador de tipos representa `p_stylist_id` como string nos argumentos de RPC,
embora o banco aceite SQL NULL para sem preferência. Preservar o arquivo gerado;
tratar essa diferença em um adaptador tipado na fase de integração.

Os testes SQL verificam conflito por profissional/cliente, especialidade,
funcionamento, adjacência, cancelamento/reativação, anon sem dados pessoais,
reservas com preferência e fallback, contato/grade inválidos, ausência de cliente
órfão, isolamento de staff, tentativa de transferência, acesso do owner e DELETE
bloqueado. O teste Playwright opcional de integração envia duas reservas
simultâneas para o mesmo profissional e exige exatamente um sucesso.

## Integração Next.js — Fase 3

- `lib/supabase/server.ts`, `client.ts`, `config.ts` e `proxy.ts`: clientes
  tipados, sessão via cookies e renovação com cabeçalhos sem cache no painel.
  Não usam chave secreta. O cliente público é anônimo e não herda sessões owner.
- `lib/supabase/session.ts` verifica `auth.getUser()` e o próprio
  `staff_profiles`. A página e cada ação de escrita fazem essa verificação;
  URL, estado React e proxy não concedem autorização. Contas sem perfil não
  entram. Ações mantêm RLS com a identidade do usuário.
- `lib/auth-actions.ts`, `components/admin/staff-access.tsx` e
  `app/painel/entrar/page.tsx`: login e logout reais. Sem cadastro, criação de
  contas, escolha de perfil ou acesso alternativo por demonstração.
- `app/painel/page.tsx`, `lib/admin-data.ts`, `read-all.ts` e
  `lib/admin-actions.ts`: dados do servidor, conversão São Paulo, leitura
  paginada para evitar truncamento em 1.000 registros e persistência de clientes,
  agendamentos e status. Preço e duração do atendimento são preservados quando
  o mesmo serviço e horário são mantidos. Erros permanecem no formulário.
- `lib/booking.ts` mantém `loadAvailability` e `submitDemoBooking` como Server
  Actions. O nome legado de submit não implica simulação: ele grava a reserva.
  `booking-shared.ts` contém os tipos, validação e cálculos puros.
- `lib/supabase/catalog.ts`, `lib/catalog.ts` e
  `components/catalog-provider.tsx`: catálogo, horários e configurações do banco.
  `connection()` impede consultas na geração estática; o catálogo é consultado
  a cada acesso. Falhas de banco exibem erro com tentativa novamente; não
  substituem dados por mock.
- Páginas de serviços, profissionais/perfil e agendamento usam o catálogo
  persistido. Componentes do painel usam esse catálogo nos filtros, relatórios,
  agenda e formulários. Galeria, FAQs, textos institucionais, metadados da marca
  e composição editorial de `home.ts` permanecem em TypeScript.
- `components/booking-wizard.tsx`, `booking-calendar.tsx`,
  `service-directory.tsx` e `lib/utils.ts` respeitam disponibilidade,
  configuração de preços e confirmação persistida. Sem preferência mostra o
  profissional efetivamente escolhido pelo banco.
- `app/error.tsx` e `app/painel/error.tsx` usam `retry()` do Next 16.3 para
  consultar novamente dados após uma falha.
- `app/privacidade/page.tsx` e `app/termos/page.tsx` descrevem o armazenamento
  no Supabase e os cookies da equipe. Antes de receber dados reais, o responsável
  ainda deve definir contato operacional, retenção e procedimentos de atendimento
  aos pedidos de privacidade. Os textos não estabelecem esses dados por suposição.
- Testes alterados: `tests/admin.spec.ts`, `booking.spec.ts`,
  `availability.spec.ts`; adicionados `admin-rules.spec.ts`,
  `database-integration.spec.ts` e `supabase-config.ts`. Removido `components/admin/demo-access.tsx`.
  `package.json` e `package-lock.json` incluem somente as duas dependências
  Supabase necessárias. Tipos do banco foram regenerados após a quinta migration e reconferidos após
  a sexta, que não muda assinaturas.

A comissão de 50% continua expressamente demonstrativa nos relatórios existentes.
O catálogo do painel permanece somente leitura, como antes; não foi criado um
editor novo de serviços, profissionais ou configurações.

Referência: [SSR com Next.js — Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).
As APIs de cookies, Proxy, Server Actions, connection e retry foram conferidas
na documentação instalada em `node_modules/next/dist/docs/`.

## Configuração de acesso pendente

O endpoint Auth de configurações foi consultado e retornou
`disable_signup=false`: o cadastro público ainda está habilitado. O MCP
configurado não altera configurações de Auth e não há navegador disponível
pela ferramenta de UI nesta sessão.

No Dashboard do projeto, abrir Authentication → Sign In / Providers, desligar
**Allow new users to sign up** e salvar. Manter o provedor Email habilitado.
[Configurações gerais do Supabase Auth](https://supabase.com/docs/guides/auth/general-configuration)
explica que desligar essa opção permite acesso apenas a usuários existentes.

Para criar outras contas mediante solicitação, usar Authentication → Users → Add user
ou convite administrativo. Copiar o UUID Auth para `staff_profiles.user_id`.
Para Lia: role `owner`, stylist_id `lia`; para os demais: role `staff` e
o ID de seu profissional. A conta administrativa `admin@gmail.com` já existe
com papel `owner` e sem profissional vinculado. Não colocar senhas em SQL,
seeds ou Git. Sem esses vínculos,
`/painel` continua redirecionando para `/painel/entrar`.

A permissão de owner e staff foi validada nos testes SQL com fixtures em
transação e rollback. O login positivo e o ciclo de sessão da conta owner
foram verificados na atualização acima. A gravação autenticada com contas
reais ainda não foi exercitada; esta criação não incluiu alterações na agenda.

## Como testar a integração

Preencher `.env.local` com a URL e a chave publicável, conforme `.env.example`.
Rodar `npm.cmd run dev`, abrir `/painel` e verificar o redirecionamento ao login.
Abrir `/agendamento` para consultar horários do banco. Confirmar o formulário
grava um cliente e um atendimento; revisar a seleção não grava dados.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
$env:TEST_PRODUCTION = 'true'
npm.cmd test
```

A suíte padrão não cria reservas válidas. Confere anonimato da API, RPC limitada,
bloqueio de escrita direta, login inválido, sessão forjada, negação de ações sem
autenticação, calendário, contatos, estados pendentes e recuperação de rede.

Os dois testes que gravam reservas exigem `LIVE_BOOKING_TESTS=true` e devem ser
executados **somente no desenvolvimento**, com limpeza das fixtures após o teste:

```powershell
$env:TEST_PRODUCTION = 'true'
$env:LIVE_BOOKING_TESTS = 'true'
npx.cmd playwright test tests/booking.spec.ts tests/database-integration.spec.ts --grep 'persists one|concurrent public'
Remove-Item Env:LIVE_BOOKING_TESTS
```

Fixtures: `Teste Playwright Reserva` / `playwright-reserva@example.com` /
telefone `11900007771`; `Teste Playwright Concorrencia` /
`playwright-concorrencia@example.com` / telefones `11900007772` e `11900007773`.
Inspecionar os registros exatos e remover primeiro seus atendimentos, depois os
clientes, usando uma operação administrativa de desenvolvimento. Nenhum teste
deve apagar registros por nome parcial nem usar esta limpeza em produção.

As RPCs públicas atuais não têm CAPTCHA/rate limit e não verificam a posse do
telefone. Definir proteção contra abuso antes de publicar com dados reais.
`npm audit --omit=dev` não encontrou vulnerabilidades; o audit completo aponta
cinco avisos na cadeia preexistente ESLint/fast-glob/micromatch/braces. A correção
automática sugeriria downgrade do Next lint para 14; não foi aplicada.

## Resultado da validação da Fase 3

- Build de produção e typecheck aprovados. Lint: zero erros; 94 avisos
  preexistentes em scripts de `.claude/skills`.
- Suíte completa: 140 testes passaram; os dois testes de gravação foram
  desativados por padrão. Após os últimos ajustes, 31 testes de integração e
  regras passaram; o teste simultâneo revelou o deadlock e motivou a sexta
  migration. Reexecutados após a correção: ambos os testes de gravação passaram.
  No total, os 145 casos distintos foram exercitados com sucesso.
- Reserva via interface sem preferência: `booked_with=null`, profissional
  efetivo Lia, status agendado, source site, preço R$ 180 e duração 60 minutos.
  Dois pedidos simultâneos no mesmo intervalo: um sucesso e um unavailable.
- Migrations e seeds aprovados novamente em PGlite; SQL de permissões e
  agendamento passou no Supabase com rollback após a última migration.
- Todas as fixtures persistidas pelos testes de reserva foram inspecionadas e
  removidas por UUID e identidade exata. Estado ao concluir a Fase 3: zero usuários Auth,
  perfis de equipe, clientes e agendamentos; apenas o catálogo de exemplo.
- Advisors finais: oito tabelas com RLS; nenhum alerta de RLS ou índice de
  FK ausente. Permanecem os avisos intencionais de execução das três RPCs
  públicas SECURITY DEFINER e três índices de atendimentos ainda sem uso.

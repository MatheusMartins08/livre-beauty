# Edição do site pelo painel

Fase posterior à integração descrita em `docs/database.md`. O dono do ateliê
edita o site em `/painel`, área **Edição do site**, visível somente para a
conta com papel `owner`. Inspirada na área equivalente do projeto Barber
(`black-crown-barber`), com estas diferenças: gravações de várias linhas são
transacionais (RPC), imagens enviadas e não salvas são descartadas, e o site
público mantém os textos originais se o banco não responder.

## O que o dono edita

| Aba | Conteúdo | Onde fica |
| --- | --- | --- |
| Página inicial | Destaque (chamada, título, texto, legenda, foto), sobre, frase em destaque, títulos de serviços e especialistas, perguntas frequentes (até 4 grupos × 10), depoimentos (até 9) e título da visita | `site_content` |
| Serviços | Nome, categoria, descrições, resumo da home, duração, preço, fotos, ativo, ordem, profissionais e combo | `services`, `stylist_services`, `service_components` |
| Profissionais | Nome, função, experiência, especialidades, descrição, biografia, retrato, ativo, ordem e serviços | `stylists`, `stylist_services` |
| Galeria | Até 24 imagens com título, categoria, profissional e enquadramento | `site_content` (`gallery`) |
| Contato | Endereço, bairro e cidade, WhatsApp, telefone, Instagram e foto da janela do WhatsApp | `site_content` (`contact`) |
| Horários | Semana com vários períodos por dia, exceções e regras do agendamento | `opening_periods`, `schedule_exceptions`, `salon_settings` |

Uma seção sem linha em `site_content` usa o texto de `content/salon.ts` e
`content/home.ts`. **Restaurar original** apaga a linha. Cada seção é validada
no servidor (`lib/site-content.ts`) antes de salvar e novamente ao ler; uma
seção inválida volta inteira ao padrão. Os textos são exibidos como texto puro.

Continuam no código: páginas Sobre, Políticas, Privacidade e Termos, metadados
de SEO, títulos das páginas internas e o mapa (região dos Jardins). O número do
WhatsApp salvo no editor tem prioridade sobre `WHATSAPP_NUMBER`.

## Imagens

Bucket público `site-media` (5 MB; JPG, PNG, WebP e AVIF). O navegador reduz a
foto para até 1600 px em WebP e envia com a sessão do dono para
`<pasta>/<uuid>.<ext>`, sem sobrescrever (`lib/image-upload.ts`). As políticas de
`storage.objects` permitem leitura pública pela URL e escrita, troca e remoção
somente ao owner, nas pastas `site`, `gallery`, `stylists` e `services`.

O servidor aceita apenas `/images/...` ou URLs desse bucket
(`lib/media.ts`); o banco repete a regra em `services` e `stylists`. Depois de
salvar, arquivos que deixaram de ser usados são removidos. Envios descartados,
substituídos antes de salvar ou abandonados ao sair da área também são
removidos. Uma queda de rede no meio do processo pode deixar um arquivo sem uso,
sem efeito no site. `next.config.ts` libera somente
`<NEXT_PUBLIC_SUPABASE_URL>/storage/v1/object/public/site-media/**`.

## Horários e exceções

`opening_periods` substitui `business_hours`, que permanece apenas por
compatibilidade. Períodos do mesmo dia não se sobrepõem (exclusão GiST). Um
atendimento precisa caber inteiro em um período, o que permite pausas.

`schedule_exceptions`, com precedência fechado > horário especial > semana:

- `fechado`: sem profissional, o ateliê fecha nas datas; com profissional, é a
  folga dessa pessoa.
- `horario_especial`: substitui a semana do ateliê nas datas (sem profissional;
  datas não se sobrepõem).
- `bloqueio`: janela indisponível para o ateliê ou para um profissional.

O motivo é visível apenas à equipe. O público recebe só os períodos
(`get_opening_calendar`) e os intervalos ocupados (`get_booked_ranges`, em que
`performed_by` nulo bloqueia todos). `validate_appointment` e
`create_public_booking` aplicam as mesmas regras. Alterar horários ou criar
exceções não cancela atendimentos: o painel lista os afetados para a equipe
avisar os clientes.

## Vários serviços e combos

Uma reserva tem de 1 a 5 serviços, feitos em sequência pelo mesmo profissional.
A duração e o preço de referência são somas; o profissional precisa realizar
todos. `appointment_services` guarda nome, duração e preço de cada item no
momento da reserva; `appointments.service_id` repete o primeiro item.

Um combo é um serviço comum (preço, duração e profissionais próprios) com 2 a 5
componentes em `service_components`. Combo não contém combo, e não pode ser
reservado junto com uma de suas partes nem com outro combo que compartilhe uma
parte (`private.resolve_services`).

Os itens só mudam pelas funções `create_public_booking` (site) e
`save_appointment` (painel), em uma transação. Uma trigger adiada mantém o item
único de gravações diretas antigas e recusa atendimentos cujos itens não
conferem com a duração. A assinatura antiga de `create_public_booking`, com um
serviço, continua disponível.

## Exclusão e histórico

Serviços e profissionais com atendimentos são arquivados (`active=false` e
`deleted_at`), saem do site, do agendamento e do editor, e continuam legíveis no
histórico. Sem histórico, são excluídos com seus vínculos e fotos enviadas.
Excluir um profissional remove o acesso de uma conta `staff` ligada a ele; uma
conta `owner` perde só o vínculo.

## Permissões

| Objeto | Anon | Staff | Owner |
| --- | --- | --- | --- |
| `site_content`, `opening_periods` | SELECT | SELECT | Gerencia |
| `schedule_exceptions` | Sem acesso | SELECT | Gerencia |
| `service_components` | SELECT de combos ativos | SELECT de combos ativos | Gerencia |
| `appointment_services` | Sem acesso | SELECT dos próprios atendimentos | SELECT; escrita só via RPC |
| `storage.objects` em `site-media` | Leitura pela URL pública | Sem escrita | Gerencia |

`save_service`, `save_stylist`, `reorder_catalog`, `delete_service`,
`delete_stylist` e `save_opening_periods` são `SECURITY INVOKER`: cada comando
segue o RLS do owner. `save_appointment` é `SECURITY DEFINER` porque grava os
itens; repete as regras de `appointments` (owner em todos, staff só nos próprios
e sem transferir). `get_staff_settings` informa a comissão à equipe sem expor
`salon_settings`. As ações em `lib/site-actions.ts` verificam a sessão do owner.

## Migrations

| Ordem | Arquivo | Conteúdo |
| --- | --- | --- |
| 1 | `20261008000100_site_media_storage.sql` | Bucket e políticas de Storage |
| 2 | `20261008000200_site_content_and_catalog_editing.sql` | `site_content`, campos de foto/resumo, arquivamento e restrições |
| 3 | `20261008000300_opening_periods_and_exceptions.sql` | Períodos, exceções, funções de dia e calendário público |
| 4 | `20261008000400_multi_service_booking.sql` | Combos, itens, triggers, validação, reserva e `save_appointment` |
| 5 | `20261008000500_site_editor_rpcs.sql` | Funções do editor |

Por decisão do usuário em 08/10/2026, sem MCP do Supabase nesta sessão, as
migrations são aplicadas **no SQL Editor, na ordem acima**, cada arquivo inteiro
e uma única vez. Elas não aparecem em `list_migrations`. Antes, foram
validadas em PostgreSQL local (PGlite com `btree_gist` e simulação de `auth` e
`storage`): as seis migrations anteriores, as cinco novas, `seed.sql`,
`seed_demo.sql` (168 itens criados no commit), `tests/database.sql` e
`tests/site_editor.sql`. Também foi validado o cenário do banco real, com
catálogo e atendimentos já existentes antes das cinco migrations. A primeira
tentativa da migration 4 no Supabase falhou ("pending trigger events"), porque a
cópia dos atendimentos deixava verificações adiadas antes do `ALTER TABLE`. O
arquivo passou a executá-las logo após a cópia; como o SQL Editor roda cada
arquivo em uma única transação, a tentativa com erro não deixou alterações.

O código novo depende dessas migrations: antes delas, Serviços, Profissionais e
Agendamento exibem erro, enquanto a home e a galeria usam o conteúdo padrão.
Aplique o SQL antes de publicar o código.

## Verificação

1. Aplicar as cinco migrations no SQL Editor.
2. Opcional, em desenvolvimento: executar `supabase/tests/database.sql` e depois
   `supabase/tests/site_editor.sql`. Ambos terminam em `ROLLBACK`; pressupõem o
   catálogo do seed sem edições e nenhum atendimento nas datas de teste.
3. Advisors de segurança: além dos avisos já aceitos, `create_public_booking`
   (lista), `get_opening_calendar` e `save_appointment` aparecem como
   `SECURITY DEFINER` executáveis; a exposição é intencional.
4. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` e
   `npm.cmd test`.
5. Com a conta owner, em `/painel` → **Edição do site**: editar um texto e uma
   foto da página inicial, salvar e conferir em `/`; criar um combo, uma pausa
   na semana e uma folga, e conferir em `/agendamento`.
6. Com uma conta staff: a área **Edição do site** não aparece e as ações
   retornam acesso negado.

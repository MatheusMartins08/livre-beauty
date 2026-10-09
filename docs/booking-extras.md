# Mais pedido, WhatsApp, código da reserva e retenção do histórico

Recursos adaptados do Barber (`black-crown-barber`), feitos depois do acesso
individual da equipe (`docs/staff-access.md`).

## Selo "Mais pedido"

`services.popular`. O dono marca o serviço em Edição do site → Serviços. O selo
aparece no card da página inicial, na página Serviços e na escolha do
agendamento. Ele usa o texto principal, com borda na cor de destaque: a cor de
destaque não atinge 4,5:1 de contraste em texto pequeno sobre o fundo.

## Consentimento de WhatsApp (LGPD)

- `clients.whatsapp_opt_in` e `whatsapp_opt_in_at`. Um trigger grava a data quando
  o consentimento é dado e a apaga quando é retirado. Editar outros campos não
  altera a data.
- No agendamento, uma caixa opcional, **nunca marcada por padrão**, registra a
  autorização. A revisão mostra a escolha.
- A reserva pelo site só concede o consentimento. Retirar exige falar com o
  ateliê, que desmarca a opção na edição do cliente no painel. Assim, uma reserva
  feita por terceiros com o mesmo telefone não revoga o que o cliente autorizou.
- A ficha do cliente mostra desde quando ele aceita mensagens e um link direto
  para a conversa.
- O site não verifica a posse do telefone, como no restante do agendamento. Uma
  autorização dada por outra pessoa pode ser retirada pelo ateliê a pedido.

## Código da reserva

- `appointments.code`: `LB-` mais 6 caracteres, sem 0/O, 1/I/L. É gerado pelo
  banco para cada atendimento, inclusive os já existentes, e nunca muda.
- A confirmação e a mensagem do WhatsApp trazem o código.
- `/agendamento/minha-reserva` consulta a reserva com o código e o celular.
  O código aceita minúsculas, espaço ou falta do hífen e do `LB`. A página mostra
  serviços, profissional, data, duração e preço, este só se o ateliê mostra
  preços. Não exibe contatos, observações nem pagamento.
- **Cancelar pelo site:** só reservas agendadas, até `cancel_min_notice_minutes`
  antes do início (padrão 24 h, ajustável nas Regras do agendamento). Fora do
  prazo, a página indica o WhatsApp do ateliê.
- O cancelamento libera o horário, grava `client_cancelled_at` e aparece na
  agenda como "Cancelado pelo cliente no site". Reativar o atendimento apaga
  essa marca.
- A agenda do painel exibe o código, e a busca também o encontra.
- RPCs públicas `get_reservation` e `cancel_reservation`: `SECURITY DEFINER`, com
  código e telefone obrigatórios. Uma combinação errada recebe a mesma resposta
  "não encontrada", sem revelar se o código ou o telefone existe. Como nas outras
  RPCs públicas, não há CAPTCHA nem limite de tentativas: são 887 milhões de
  códigos possíveis por telefone.

Os textos das políticas (`content/salon.ts`) citam 24 horas. Se o prazo mudar no
painel, atualize esse texto.

## Retenção do histórico

- `salon_settings.history_retention_months`: vazio mantém tudo (padrão); ou 6,
  12, 24, 36 ou 60 meses.
- **O que a limpeza diária apaga** (03:30 em São Paulo, pg_cron
  `livrebeauty-purge-expired-history`):
  - atendimentos iniciados antes do prazo, com seus itens;
  - clientes sem atendimentos desde então e sem edição depois do prazo;
  - exceções de agenda encerradas.
- **O que não é afetado:** catálogo, equipe, conteúdo do site e contas.
- Ao ativar ou encurtar o prazo, o painel mostra a prévia
  (`preview_history_purge`, só owner) com as quantidades e a data de corte, e
  exige confirmação. A exclusão não pode ser desfeita, e os relatórios do
  Fechamento desses períodos deixam de existir.
- `private.purge_expired_history()` só é executável pelo dono do banco.

## Migrations, em ordem

Aplicadas pelo usuário em 09/10/2026 no SQL Editor do projeto
`mvsginzwrlspwgcxphtd`, cada arquivo inteiro, uma vez, sem erros. Por isso não
aparecem em `list_migrations`. Depois da aplicação, a API confirmou as
colunas novas e as RPCs: `get_reservation` responde a visitantes e
`preview_history_purge` nega acesso a eles. Para um ambiente novo, aplicar na
mesma ordem:

| Ordem | Arquivo | Conteúdo |
| --- | --- | --- |
| 1 | `20261009000100_staff_access_and_stylist_hours.sql` | Acesso da equipe e horário por profissional |
| 2 | `20261009000200_popular_services.sql` | Selo "Mais pedido" |
| 3 | `20261009000300_reservation_code_and_whatsapp_consent.sql` | Consentimento, código, consulta e cancelamento |
| 4 | `20261009000400_history_retention.sql` | Prazo de guarda, prévia e função de limpeza |
| 5 | `20261009000500_history_retention_schedule.sql` | Habilita o pg_cron e agenda a limpeza diária |

Antes da 1, conferir `show server_version` (14 ou superior). O código depende
das cinco migrations.

Todas foram validadas em PGlite:
- a partir de um banco vazio, com seed e os testes `database.sql`,
  `site_editor.sql`, `staff_access.sql` e `booking_extras.sql`;
- num banco com os 168 atendimentos do `seed_demo.sql` antes delas. Todos
  receberam códigos únicos e nenhum cliente ficou com consentimento presumido.

O pg_cron foi simulado no PGlite. Depois de aplicar, confirme o agendamento:

```sql
select jobname, schedule, command from cron.job
where jobname = 'livrebeauty-purge-expired-history';
```

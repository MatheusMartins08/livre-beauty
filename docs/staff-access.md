# Acesso individual da equipe e horários por profissional

Adaptado do commit `259aeec` do Barber (`black-crown-barber`). O LivreBeauty
mantém o próprio modelo de privacidade: cada profissional vê só os próprios
atendimentos, clientes e comissões, e não a agenda do time.

## Acessos

O dono cria o acesso em `/painel` → **Edição do site** → **Profissionais** →
editar o profissional → **Acesso ao painel**:

- **Criar acesso:** usuário (sugerido a partir do nome) e senha inicial de 8 a
  72 caracteres. A senha é entregue pessoalmente; não fica salva no projeto.
- **Alterar usuário**, **Redefinir senha**, **Desativar** e **Reativar**.
- Excluir o profissional apaga também o login dele no Auth, liberando o usuário.

O profissional entra em `/painel/entrar` com o usuário e a senha. O dono
continua entrando com o e-mail. O campo aceita os dois: sem `@`, o usuário vira
`<usuario>@equipe.livrebeauty.invalid` no Supabase Auth. O domínio `.invalid` é
reservado e não recebe e-mail, então um pedido de recuperação de senha não
entrega a conta a terceiros. Para usar um domínio do salão, defina
`STAFF_LOGIN_DOMAIN` antes de criar contas.

As ações rodam no servidor (`lib/staff-access-actions.ts`):

1. A sessão precisa ser do owner.
2. A chave secreta (`SUPABASE_SECRET_KEY`) é usada só para o Auth.
3. O vínculo em `staff_profiles` é gravado com a sessão do owner, sob RLS.

Se uma etapa falha, a anterior é desfeita e o erro do desfazer também é
conferido; quando não há como desfazer, a mensagem diz o que ficou pendente.

**Desativar** marca `staff_profiles.active = false` e bloqueia o login no Auth.
As funções `private.is_owner()` e `private.current_stylist_id()` passam a
exigir `active`. Assim, uma sessão ainda aberta perde o acesso aos dados no
mesmo instante. Contas `owner` não podem ser desativadas.

## Horários por profissional

| Situação | Horário do profissional |
| --- | --- |
| Sem períodos próprios | Segue o horário do ateliê |
| Com períodos próprios | Os próprios períodos, dentro do horário do ateliê; dia sem período é folga |
| Horário especial próprio na data | Substitui a semana dele nessa data |
| Folga ou bloqueio próprio | Indisponível nesse dia ou intervalo |

- **Onde se edita:** o dono escolhe "Horário de" na aba **Horários**. O
  profissional usa **Meu horário**, no próprio painel.
- **O que pode ser editado:** a semana, a volta ao horário do ateliê e as
  folgas, horários especiais e bloqueios.
- **Avisos:** o painel lista os atendimentos agendados que ficariam fora do novo
  horário. Também avisa quando um período cai fora do horário do ateliê.

No banco, `opening_periods.stylist_id` vazio é o horário do ateliê.
`private.day_blocks` devolve, além das exceções, o complemento do horário
próprio de cada profissional que personalizou a semana. Com isso:

- `get_booked_ranges`, `create_public_booking` e `validate_appointment`
  respeitam o horário individual sem mudar de assinatura;
- o público nunca lê os horários individuais.

## Permissões

| Objeto | Anon | Staff | Owner |
| --- | --- | --- | --- |
| `opening_periods` | Lê só o ateliê | Lê o ateliê e os próprios; edita os próprios | Tudo |
| `schedule_exceptions` | Sem acesso | Lê as do ateliê e as próprias; edita as próprias | Tudo |
| `staff_profiles` | Sem acesso | Lê o próprio | Tudo |
| `save_opening_periods(p_periods, p_stylist_id)` | — | Só a própria semana | Qualquer uma |

## Migration

`supabase/migrations/20261009000100_staff_access_and_stylist_hours.sql`:

- adiciona `login` e `active` em `staff_profiles` e `stylist_id` em
  `opening_periods`;
- libera o horário especial por profissional;
- recria as exclusões de sobreposição por dono;
- substitui as políticas de leitura e escrita das duas tabelas de horários;
- atualiza `day_periods`, `day_blocks`, `save_opening_periods`,
  `save_appointment` e `get_staff_settings`.

Usa `tstzmultirange` e `range_agg`, que exigem PostgreSQL 14 ou superior. Foi
validada em PGlite com todas as migrations anteriores, `seed.sql`,
`seed_demo.sql` e os testes `database.sql`, `site_editor.sql` e
`staff_access.sql`. Também foi validada com catálogo e atendimentos existentes
antes da aplicação.

Aplicada pelo usuário em 09/10/2026 no SQL Editor do projeto
`mvsginzwrlspwgcxphtd`, sem erros, antes das migrations de
`docs/booking-extras.md`. O código depende dela: sem ela, o catálogo e o
login do painel falham, porque leem as colunas novas.

A criação real de um acesso da equipe ainda não foi exercitada, porque exige
autorização do usuário. Se o Auth recusar o domínio `.invalid`, o painel avisa;
nesse caso, defina `STAFF_LOGIN_DOMAIN` antes de criar contas.

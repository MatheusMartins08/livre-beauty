<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions

## Harness de conclusão e GitHub

Estas regras se aplicam a todos os chats e agentes que trabalham neste projeto.

- Repositório: `https://github.com/MatheusMartins08/livre-beauty.git`.
- Remoto esperado: `origin`. Confira as URLs de fetch e push antes de publicar;
  a forma SSH do mesmo repositório também é válida. Se o destino for diferente,
  explique a divergência antes de enviar ou alterar o remoto.
- No início da tarefa, confira `git status --short`, a branch atual e os diffs
  existentes. Registre quais mudanças já estavam pendentes para não misturá-las
  ao trabalho novo nem descartá-las.
- Conclua a implementação, revise o diff e execute as verificações pertinentes
  antes de solicitar o aceite. Não rode testes da aplicação para mudanças
  exclusivamente documentais. Em alterações de código, siga os comandos e
  verificações do projeto conforme o escopo.
- Ao entregar, resuma o resultado, liste os arquivos, informe as verificações
  e explique como testar. Identifique o escopo exato do commit, a branch e o
  destino. Termine perguntando: "Está tudo OK com o resultado? Posso fazer o
  commit e enviar estas alterações para o GitHub?"
- Aguarde a resposta. Se o usuário pedir ajustes, faça-os e solicite o aceite
  novamente. Se responder que está OK ou autorizar o envio, faça commit e push
  do escopo apresentado sem repetir a pergunta. Silêncio ou uma nova tarefa
  não autorizam a publicação. Uma instrução explícita do usuário dispensando
  esse fluxo tem precedência.
- Após o aceite, confira se o diff continua sendo o aprovado. Adicione apenas
  os arquivos ou trechos correspondentes, com caminhos explícitos ou staging
  por hunks. Não inclua alterações anteriores, de outros chats ou de outros
  agentes sem apresentá-las ao usuário e obter aceite para esse escopo.
- Nunca versione `.env.local`, outros arquivos de ambiente privados, tokens,
  dumps com dados pessoais, `.next/`, `node_modules/`, `.cache/`,
  `playwright-report/` ou `test-results/`. `.env.example` pode ser versionado
  somente com placeholders e comentários, sem credenciais.
- Revise `git diff --cached --check` e `git diff --cached` antes do commit.
  Prefira um commit por mudança lógica, com mensagem descritiva usando
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:` ou `chore:`.
- Publique a branch atual em `origin`, usando upstream quando necessário.
  Se trabalhar em uma branch de tarefa, envie essa branch e informe o link;
  não faça merge em `main` automaticamente. Não altere versões do pacote nem
  crie tags de release sem necessidade ou pedido específico.
- Não use force push, não apague branches remotas e não reescreva o histórico
  publicado. Se o remoto avançou, investigue e integre de forma segura,
  preservando as mudanças locais; não use reset destrutivo para contornar.
- Se faltar autenticação, identidade Git ou permissão, ou o envio falhar,
  explique a causa e informe o que foi efetivamente concluído. Não invente
  nome/e-mail de autor nem grave tokens no projeto.
- Verifique que o remoto recebeu o commit e entregue branch, hash e link:
  `https://github.com/MatheusMartins08/livre-beauty/commit/<hash>`.
  Informe as alterações que continuam pendentes fora do escopo aprovado.
- Depois de confirmar o push, encerre a tarefa sem pedir novamente o aceite
  para a mesma publicação. Tarefas somente de consulta não geram commits vazios.
- Quando houver colaboração entre agentes, o agente principal reúne o
  resultado, pede o aceite e publica; subagentes não fazem commits ou pushes
  independentes do trabalho compartilhado.

## Acesso ao painel da equipe

- Login local: `http://localhost:3000/painel/entrar`.
- Painel local: `http://localhost:3000/painel`; sem sessão, redireciona ao login.
  No site publicado, usar os mesmos caminhos no domínio do projeto.
- A autenticação é real, via Supabase Auth com e-mail e senha, e exige vínculo
  em `public.staff_profiles`. Não há login demonstrativo nem credenciais padrão.
- Acesso criado e validado em **07/10/2026** no projeto `mvsginzwrlspwgcxphtd`:
  e-mail `admin@gmail.com`, papel `owner`, sem profissional vinculado.
  A senha foi definida exatamente como solicitado pelo usuário neste chat;
  não está armazenada nas instruções nem em arquivos versionados.
  Login pelo formulário, sessão após recarregar e logout foram verificados.
- Para criar novas contas, o usuário deve informar o e-mail escolhido e
  autorizar a criação. Cadastrar pelo Supabase Auth e vincular o UUID em
  `staff_profiles` com o papel apropriado, seguindo `docs/database.md`.
  Não inventar credenciais, criar contas sem solicitação ou remover a proteção
  do painel para contornar uma falha de login.
- Para localizar ou redefinir o acesso, abrir Authentication → Users no
  Dashboard do projeto e buscar `admin@gmail.com`. Não alterar a senha sem
  solicitação. A API Auth administrativa exige chave secreta somente no
  servidor; não inserir senhas por SQL nem expor a chave no cliente ou no Git.
- Senhas, tokens e códigos de recuperação nunca entram neste arquivo,
  no README, em seeds ou em qualquer arquivo versionado. Usar um gerenciador
  de senhas para guardar credenciais; a senha original não é recuperável pelo banco.

## Local skills (Codex and Claude)

Read `SKILLS.md` for the shared skill catalog and usage instructions.
Codex discovers project skills in `.agents/skills/<name>/SKILL.md`.
Claude discovers project skills in `.claude/skills/<name>/SKILL.md`.
Before applying a relevant skill, read its complete `SKILL.md` and any required references.
Use skills explicitly requested by the user and select the smallest relevant set for other tasks.
User instructions take precedence over skill guidance. Preserve the project rules below.

## Project

This is a professional website built for a real or fictional client.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router

## General rules

- Use TypeScript.
- Prefer reusable React components.
- Avoid unnecessarily large components.
- Keep the project structure organized.
- Do not add dependencies unless there is a clear reason.
- Do not remove existing functionality without explicit approval.
- Preserve existing behavior when modifying code.
- Prefer simple solutions over unnecessary abstraction.

## UI

- Design mobile-first.
- The website must be fully responsive.
- Use semantic HTML.
- Prioritize accessibility.
- Use clear visual hierarchy.
- Keep spacing consistent.
- Avoid excessive animations.
- Use accessible color contrast.
- Always consider mobile, tablet and desktop.

## Next.js

- Use App Router.
- Use Server Components by default.
- Use Client Components only when interaction or browser APIs require them.
- Use next/image for images where appropriate.
- Use next/link for internal navigation.
- Configure metadata for SEO.

## Code quality

- Use descriptive names.
- Avoid duplicated logic.
- Keep components focused.
- Prefer readable code over clever code.
- Do not introduce unnecessary design patterns.

## Security

- Never hardcode API keys, passwords, tokens or secrets.
- Never expose private environment variables to client-side code.
- Use environment variables for secrets.
- Never commit .env.local.

## AI behavior

Before implementing a complex feature:

1. Inspect the existing project.
2. Identify the files that need to change.
3. Explain the proposed approach.
4. Identify possible risks.
5. Then implement.

For larger tasks, divide the work into small steps.

After making changes:

1. Explain what changed.
2. List the files modified.
3. Tell me how to test the change.
4. Mention any potential issues.

Do not rewrite unrelated files.

Do not invent APIs, database schemas or external services without telling me.

## Supabase

- Read `docs/database.md` before database work.
- Version all schema changes in `supabase/migrations/`.
- Apply DDL only with MCP `apply_migration`; never with `execute_sql`.
- Enable RLS on every application table.
- Never expose the Supabase secret key in client code.
- Apply `supabase/seed_demo.sql` only to a confirmed development project.
- Keep Next.js integration as a separate phase after database validation.

When something fails, investigate the root cause before attempting a fix.

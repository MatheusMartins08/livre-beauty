# Painel do Livre Beauty

Implementação somente de front-end, adaptada de `Barber/app/painel` para os serviços e profissionais de `content/salon.ts`. A pedido do usuário, trabalha apenas com serviços avulsos, sem planos ou assinaturas.

## Acesso

- `/painel/entrar`: escolha demonstrativa entre dono e funcionário.
- `/painel`: visão do dono.
- `/painel?perfil=funcionario&profissional=rafael`: exemplo da visão de funcionário.
- O rodapé do site contém o link **Área da equipe**.

## Funcionalidades

O dono acessa visão geral, agenda, clientes, equipe, fechamento e catálogo de serviços. Pode cadastrar e editar clientes, consultar suas fichas e histórico, criar e editar atendimentos, trocar o profissional responsável e alterar status.

O funcionário acessa a própria agenda e produção, clientes vinculados aos seus atendimentos, suas comissões e catálogo. A seleção de profissional na demonstração permite conferir cada visão. O histórico exibido para funcionários fica limitado aos seus próprios atendimentos.

Funcionários também podem criar e editar seus atendimentos e alterar status. O campo de profissional fica bloqueado nesse perfil. O cadastro e a edição de clientes ficam disponíveis apenas ao dono; funcionários podem consultar fichas e observações.

A agenda oferece busca por cliente e filtros de profissional e status. A validação considera especialidades, duração do serviço, funcionamento de terça a sábado entre 9h e 19h e sobreposição de horários do profissional ou cliente. Cancelados e faltas não reservam horário. Reativar um atendimento também verifica conflitos.

O fechamento pode ser consultado por dia, semana ou mês e exportado em CSV. A base é o valor combinado dos serviços concluídos, atribuído a quem executou o atendimento. A comissão de 50% é **apenas um exemplo**, não uma regra comercial confirmada. O relatório não calcula salário fixo, descontos ou pagamentos efetivos.

### Uso em telas menores

Abaixo de 1000 px, agenda, clientes, catálogo e histórico usam páginas de até quatro registros. Busca e filtros pesquisam a lista completa e retornam à primeira página ao mudar o conjunto de resultados. A visão geral mostra três atendimentos e mantém o acesso à agenda completa. Registros, produção da equipe e espaçamentos ficam compactos; o menu permanece acessível durante a rolagem. O desktop mantém as listas e o layout completos.

## Limites desta etapa

- Todos os clientes, atendimentos e contatos são fictícios.
- Dados e alterações ficam no estado do React e são restaurados ao recarregar ou sair da rota.
- Sem autenticação, APIs, banco de dados ou cobranças. A troca de perfil apenas altera a interface e não é uma autorização de segurança.
- O agendamento público mantém seu fluxo existente; as reservas públicas ainda não alimentam o painel.
- Integração futura deverá aplicar autenticação e permissões no servidor, persistência, disponibilidade compartilhada e regras reais de comissão e pagamento.

## Verificação

```powershell
npm.cmd run typecheck
npm.cmd run lint
$env:TEST_PORT='3000'
npx.cmd playwright test tests/admin.spec.ts
npm.cmd run build
```

O teste usa o servidor existente em 3000, quando disponível. Sem ele, o Playwright inicia o servidor definido em `playwright.config.ts`.

## Arquivos desta etapa

- Rotas e estilos: `app/painel/layout.tsx`, `app/painel/page.tsx`, `app/painel/painel.css`, `app/painel/entrar/page.tsx`.
- Interface: `components/admin/dashboard.tsx`, `agenda.tsx`, `appointment-form.tsx`, `clients.tsx`, `reports.tsx`, `demo-access.tsx`, `ui.tsx`, `mobile-pagination.tsx`.
- Tipos, dados fictícios e regras: `lib/admin.ts`.
- Integração com o site: `components/site-shell.tsx`, `app/layout.tsx`, `components/footer.tsx`.
- Testes: `tests/admin.spec.ts`.
- Documentação: `docs/admin.md`.

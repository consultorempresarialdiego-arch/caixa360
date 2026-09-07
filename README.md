# Caixa360 — Fase 1: Fundação

Este pacote contém o código da Fase 1 (autenticação, empresa, RLS, layout
autenticado e navegação). Não inclui Dashboard, Contas a Pagar/Receber,
Fluxo de Caixa ou Importação — isso vem nas próximas fases.

## ⚠️ Importante: este código não foi executado

O ambiente onde este projeto foi gerado não tem acesso à rede (não é
possível rodar `npm install`, não há projeto Supabase real conectado).
Ou seja: o código foi escrito seguindo os padrões corretos do Next.js
15 (App Router, Server Actions, Server Components) e do Supabase
(`@supabase/ssr`, RLS), mas **você precisa rodar e testar no seu ambiente**
antes de considerar a fase concluída. Trate isso como um "primeiro build"
que precisa da sua validação, não como algo já testado em produção.

## Passo a passo para rodar localmente

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Criar um projeto no Supabase** (https://supabase.com) — plano free
   é suficiente para esta fase.

3. **Aplicar a migration**
   No SQL Editor do painel do Supabase, cole e execute o conteúdo de
   `supabase/migrations/0001_foundation.sql`.
   Isso cria: tabela `empresas`, tabela `usuarios_empresas`, a função
   `criar_empresa_inicial` e as políticas de RLS.

4. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Project Settings → API, no painel do Supabase).

5. **Rodar o projeto**
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000

## Fluxo de cadastro → onboarding → dashboard

Corrigido a pedido: **nenhuma empresa é criada automaticamente, com nome
genérico ou de qualquer outra forma, fora do onboarding.**

1. Cadastro cria **apenas** o usuário no Supabase Auth. Nenhum registro em
   `empresas` é criado neste passo.
2. Após confirmar e-mail (se a confirmação estiver ativa) e fazer login, o
   sistema verifica se existe algum vínculo em `usuarios_empresas`:
   - **Não existe** → redireciona para `/onboarding` (obrigatório).
   - **Existe** → redireciona para `/dashboard`.
3. `/onboarding` fica **fora** do layout com sidebar/navegação (é um fluxo
   isolado, sem distrações) e é o único lugar que poderá chamar
   `criar_empresa_inicial()` com dados reais — isso será implementado na
   Fase 2. Por enquanto, é uma tela de espera que apenas confirma que o
   redirecionamento está correto.
4. `app/(app)/layout.tsx` (Dashboard, Contas a Pagar/Receber, Fluxo de
   Caixa, Importação, Configurações) verifica, no servidor, se o usuário
   tem empresa vinculada. Se não tiver, redireciona para `/onboarding` —
   ou seja, **é impossível chegar a qualquer tela do produto sem concluir
   o onboarding**, mesmo digitando a URL diretamente.
5. `/onboarding` também verifica o inverso: se o usuário já tem empresa,
   redireciona para `/dashboard` — evita que alguém que já configurou a
   empresa veja o onboarding de novo.

## Como testar a Fase 1

1. Acesse `/` → deve redirecionar para `/login` (sem sessão).
2. Clique em "Criar conta" → cadastre nome, e-mail e senha (não há mais
   campo de empresa aqui).
   - Se a confirmação de e-mail estiver **desativada** no projeto Supabase
     (padrão em projetos novos), você é redirecionado direto para
     `/onboarding`.
   - Se estiver **ativada**, você verá a mensagem de "verifique seu e-mail"
     — confirme e depois faça login normalmente, também indo para
     `/onboarding`.
3. Confirme que **nenhuma empresa aparece criada** no painel do Supabase
   (tabela `empresas` vazia) até que a Fase 2 implemente o formulário real.
4. Tente acessar `/dashboard` diretamente pela URL, logado, sem ter
   passado pelo onboarding → deve redirecionar de volta para
   `/onboarding`. Isso vale para todas as telas do grupo `(app)`.
5. Teste "Sair" (disponível também na tela de onboarding) → deve voltar
   para `/login`.
6. Teste acessar `/dashboard` sem estar logado → deve redirecionar para
   `/login` (proteção do middleware).
7. Teste "Esqueci minha senha":
   a. Solicite o link com um e-mail cadastrado.
   b. Abra o e-mail recebido e clique no link — deve cair em
      `/auth/callback?code=...&next=/redefinir-senha` e, em seguida, abrir
      `/redefinir-senha` normalmente (sem ser redirecionado para
      `/dashboard`).
   c. Defina uma nova senha → deve redirecionar para `/dashboard` (ou
      `/onboarding`, se ainda não houver empresa) e permitir login com a
      nova senha depois.
8. Se a confirmação de e-mail estiver **ativada** no projeto Supabase,
   teste também esse link: deve cair em `/auth/callback` (sem parâmetro
   `next`, então vai para `/dashboard` por padrão) e, como ainda não há
   empresa, ser redirecionado automaticamente para `/onboarding`.
9. Depois que a Fase 2 estiver pronta e uma empresa for criada via
   onboarding, repita o passo 4 — agora `/dashboard` deve abrir
   normalmente, e acessar `/onboarding` de novo deve redirecionar para
   `/dashboard`.
10. (Fase 2 em diante) Tente chamar `criar_empresa_inicial` duas vezes
    para o mesmo usuário (ex.: via SQL Editor, simulando `auth.uid()`, ou
    repetindo a chamada RPC) — a segunda chamada deve falhar com a
    mensagem "Usuário já possui empresa vinculada.".

## Validação específica de RLS (importante)

Para confirmar que o isolamento por empresa está correto:
1. Crie duas contas de teste diferentes (dois e-mails, duas empresas).
2. Confirme que o Dashboard de cada conta mostra **apenas a própria empresa**.
3. Opcional (mais rigoroso): no SQL Editor do Supabase, tente rodar
   `select * from empresas;` autenticado como `anon` — deve retornar vazio,
   pois nenhuma policy libera leitura sem vínculo em `usuarios_empresas`.

## O que ainda falta (fases seguintes)

- Fase 2: Onboarding (dados da empresa, caixa mínimo, cadastro inicial).
- Fase 3: Lançamentos (Contas a Pagar/Receber funcionais).
- Fase 4/5: Dashboard completo + Radar de Caixa.
- Fase 6: Fluxo de Caixa.
- Fase 7: Configurações completas (categorias, plano).
- Fase 8: Importação Excel/CSV.

## Correção aplicada (bugs de auditoria: callback, redefinir-senha, e-mail, função)

Uma segunda rodada de correções foi aplicada após auditoria técnica:

1. `/auth/callback` agora roda **fora** da checagem de autenticação do
   middleware — antes, um usuário sem sessão era redirecionado para
   `/login` antes mesmo de o código do link de e-mail ser trocado pela
   sessão, quebrando confirmação de cadastro e recuperação de senha.
2. `/redefinir-senha` foi removida da lista de "rotas públicas" do
   middleware. Antes, um usuário chegando autenticado (via link de
   recuperação) era imediatamente expulso para `/dashboard` pela regra
   "autenticado + rota pública → dashboard", sem conseguir ver o
   formulário de nova senha.
3. `signUp()` agora define `emailRedirectTo` apontando para
   `/auth/callback` — antes, o link de confirmação de e-mail não tinha
   destino garantido através da nossa rota de callback.
4. Comentário da função `criar_empresa_inicial()` corrigido para refletir
   que ela é chamada pelo onboarding (Fase 2), não pelo cadastro.
5. `(app)/layout.tsx` e `app/onboarding/layout.tsx` agora verificam
   explicitamente `if (!user) redirect("/login")`, como segunda camada de
   defesa independente do middleware.
6. `criar_empresa_inicial()` passou a: aceitar `p_caixa_minimo` e gravá-lo
   na criação; bloquear explicitamente uma segunda chamada bem-sucedida
   para quem já tem empresa vinculada (`raise exception`); continuar
   usando `auth.uid()` como única fonte do `usuario_id` e nunca aceitar
   `usuario_id`/`empresa_id` do cliente; permanecer atômica.

## Correção aplicada (empresa fictícia)

O problema relatado — criação automática de uma empresa "Minha empresa" —
foi resolvido removendo completamente a criação automática de empresa.
Decisão tomada: **não criar nenhum registro temporário/fictício em
`empresas`**, nem antes do onboarding. Isso não era tecnicamente
necessário: a arquitetura já suporta um usuário autenticado sem nenhuma
linha em `usuarios_empresas`, e o gate de acesso (`(app)/layout.tsx`)
lida bem com esse estado, redirecionando para `/onboarding`. A função
`criar_empresa_inicial()` continua existindo e será chamada pela primeira
vez somente quando o formulário real do onboarding (Fase 2) for enviado
com dados verdadeiros informados pelo usuário.

## Pontos de atenção

- As versões de pacotes em `package.json` são as mais recentes conhecidas
  até o momento da geração deste código — rode `npm install` e, se algum
  pacote tiver uma versão mais nova estável, ajuste conforme necessário.
- Os componentes de UI (`Button`, `Input`, `Label`) foram escritos à mão,
  no estilo do shadcn/ui, mas sem rodar o CLI oficial (sem acesso à rede
  neste ambiente). Se quiser o conjunto completo de componentes shadcn/ui,
  rode `npx shadcn@latest init` no seu ambiente antes da Fase 2.

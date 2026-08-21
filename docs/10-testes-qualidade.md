# 10 — Testes e qualidade

## Objetivo

O AURACS mistura gameplay, UI e avaliação de código. Uma regressão pode quebrar tanto o jogo quanto a regra pedagógica ou a segurança. Por isso, testes devem ser tratados como parte da mecânica e não somente como infraestrutura.

## Comandos principais

Na raiz do repositório:

```bash
npm run build
npm test
npm run lint
```

### Desenvolvimento

```bash
npm install
npm run install:web
npm run dev
```

O comando `npm run dev` inicia:

- API .NET;
- frontend Next.js.

## Backend

Testes:

```bash
dotnet test api.Tests/api.Tests.csproj --configuration Release
```

Build:

```bash
dotnet build AURACS.sln --configuration Release
```

## Frontend

Dentro de `web/`:

```bash
npm test
npm run lint
npm run build
```

Os testes frontend usam o test runner nativo do Node com TypeScript strip-types.

## CI

Arquivo:

```text
.github/workflows/ci.yml
```

A CI roda em:

- push para `main`;
- pull request para `main`.

## Job backend

Executa:

1. checkout;
2. setup .NET 8;
3. restore da solution;
4. build Release;
5. testes xUnit.

## Job frontend

Executa:

1. checkout;
2. Node 22;
3. `npm ci`;
4. audit das dependências de produção;
5. testes unitários;
6. ESLint;
7. Next.js production build.

Audit obrigatório:

```bash
npm audit --omit=dev --audit-level=high
```

O gate avalia dependências de produção. Uma saída do `npm ci` que liste vulnerabilidades de dependências de desenvolvimento não deve ser confundida automaticamente com falha do gate de produção.

## Pirâmide de testes recomendada

### 1. Testes do sandbox

Maior prioridade.

Cobrir:

- código permitido;
- código proibido;
- erros de tipo;
- limites;
- estado transacional;
- operadores;
- combate;
- tentativas de escape.

### 2. Testes de `ChallengeValidator`

Cada desafio deve possuir casos:

- sucesso;
- falha;
- progresso intermediário, quando aplicável;
- solução semanticamente equivalente, quando permitida;
- estado faltante/incorreto.

### 3. Regras puras do frontend

Funções extraídas como regras de progressão, geometria e dano são boas candidatas a testes sem navegador.

### 4. Integração React ↔ Phaser

Testar contratos de eventos e estado sempre que a ponte ganhar complexidade.

### 5. End-to-end

Ainda é uma área de evolução.

Cenários prioritários futuros:

- iniciar nova partida;
- concluir `step-2` e observar mudança do mundo;
- acessar Setor B;
- coletar Katana;
- entrar no Capítulo 2;
- perder uma vida ao errar em combate;
- concluir combate final;
- salvar/recarregar progresso.

## Matriz mínima para novo desafio C#

| Caso | Deve existir |
|---|---|
| código correto | sim |
| código sintaticamente inválido | sim |
| código válido mas semanticamente errado | sim |
| construção não permitida | sim |
| limite relevante | quando aplicável |
| retomada/contexto | quando depende de sessão |
| `progress` | quando tarefa é multipartes |

## Teste manual de gameplay

CI não substitui teste visual.

Depois de alterar Phaser, validar no navegador:

1. spawn de Kael;
2. movimento em todas as direções;
3. colisões;
4. câmera;
5. prompts;
6. abertura/fechamento do terminal;
7. consequência visual do código;
8. mobile/touch quando afetado;
9. ausência de soft lock;
10. reset/retomada.

## Critérios para PR

Um PR deve, quando relevante:

- manter CI verde;
- incluir testes para nova regra;
- não reduzir segurança do sandbox;
- não adicionar validação pedagógica duplicada no frontend;
- atualizar docs se alterar arquitetura/mecânica;
- explicar limitações conhecidas.

## Cobertura qualitativa

Mais importante que perseguir um percentual isolado é garantir cobertura das fronteiras perigosas:

- parser/interpreter;
- persistência;
- progressão;
- transições de capítulo;
- efeitos idempotentes;
- combate;
- input/colisão.

## Regressões especialmente críticas

### Sandbox aceitar sintaxe não prevista

Severidade: crítica.

### Etapa avançar sem backend aprovar

Severidade: alta.

### Efeito de etapa ser aplicado duas vezes

Severidade: alta.

### Save apontar para etapa inexistente e travar a aplicação

Severidade: alta.

### Porta/colisão causar soft lock

Severidade: alta.

### Falha visual sem impacto no estado

Severidade: média, dependendo do caso.

## Performance

Ao alterar Phaser:

- evitar alocações grandes por frame;
- evitar recriar objetos de input no update;
- reaproveitar partículas quando possível;
- destruir objetos temporários;
- observar tamanho do bundle ao adicionar bibliotecas/assets.

## Segurança de dependências

Novas dependências devem ter justificativa clara. Preferir APIs existentes do projeto antes de adicionar pacote para tarefas pequenas.

Toda alteração de `package.json` deve atualizar lockfile e passar o audit de produção.

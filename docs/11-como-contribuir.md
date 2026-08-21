# 11 — Como contribuir

## Objetivo

Este documento define o fluxo recomendado para contribuir com o AURACS sem quebrar progressão, gameplay ou segurança do sandbox.

## Pré-requisitos

- Git;
- .NET SDK 8;
- Node.js 22+;
- npm.

## Instalação

Na raiz:

```bash
npm install
npm run install:web
cp web/.env.example web/.env.local
npm run dev
```

Frontend:

```text
http://localhost:3000
```

API:

```text
http://localhost:5000
```

## Branches

Não desenvolver diretamente na `main`.

Padrão recomendado:

```text
feature/<descricao>
fix/<descricao>
docs/<descricao>
```

Branches criadas por automação/agente podem usar:

```text
agent/<descricao>
```

## Pull requests

Um PR deve ter escopo claro e descrever:

- problema/objetivo;
- alterações realizadas;
- impacto no jogador;
- impacto pedagógico;
- impacto de segurança, se houver;
- como foi validado;
- limitações conhecidas.

Preferir squash merge para manter histórico principal legível quando o PR possuir vários commits de iteração.

## Antes de abrir PR

Execute:

```bash
npm test
npm run lint
npm run build
```

Se alterou somente documentação, revise links relativos e coerência com o código atual.

## Mudanças no sandbox C#

São mudanças sensíveis.

Checklist obrigatório:

- [ ] construção necessária para um objetivo pedagógico real;
- [ ] nós Roslyn aceitos estão explicitamente limitados;
- [ ] tipos/operandos permitidos definidos;
- [ ] código arbitrário continua impossível;
- [ ] testes positivos adicionados;
- [ ] testes negativos/de segurança adicionados;
- [ ] `ChallengeValidator` atualizado, se necessário;
- [ ] documentação de C# atualizada.

Não usar execução genérica de script como solução rápida.

## Novo desafio

Para adicionar uma etapa de código:

1. definir o conceito;
2. definir narrativa e consequência;
3. adicionar step em `chapters.ts`;
4. verificar suporte no `SafeCodeEvaluator`;
5. adicionar validação em `ChallengeValidator`;
6. adicionar testes;
7. conectar efeito visual no mundo, se aplicável;
8. testar progressão e retomada;
9. atualizar documentação.

## Nova área ou objeto Phaser

Checklist:

- [ ] possui razão de gameplay;
- [ ] colisão não cria soft lock;
- [ ] funciona com câmera;
- [ ] prompt de interação é legível;
- [ ] interação funciona por teclado;
- [ ] touch foi considerado;
- [ ] estado persistente não fica preso apenas dentro do Phaser;
- [ ] objetos temporários/listeners são limpos ao destruir a cena.

## Nova conquista

Adicionar ID estável em `ACHIEVEMENTS`.

A conquista deve representar algo realmente implementado.

Evitar descrições que afirmem que um conceito foi aprendido quando a mecânica atual não o pratica de fato.

## Novo item

O inventário atual é simples. Ao adicionar poucos itens, ainda é possível usar strings, mas IDs tipados são preferíveis para expansão.

Não usar nome visível como única regra de negócio em sistemas maiores.

## Alterações de persistência

Ao adicionar campo ao Zustand:

- definir valor padrão;
- decidir comportamento no reset total;
- decidir comportamento no reset de capítulo;
- considerar saves antigos;
- evitar efeitos duplicados na reidratação.

## Estilo de arquitetura

Preservar separação:

```text
Phaser     → mundo e feedback visual
React      → UI
useGameEngine → progressão/orquestração
Zustand    → save local
ASP.NET    → API
Roslyn evaluator → C# permitido
ChallengeValidator → regra pedagógica
```

Evitar mover regra pedagógica para a cena Phaser por conveniência.

## Commits

Preferir mensagens curtas e descritivas:

```text
feat: add quarantine terminal
fix: prevent duplicate step effect
test: cover combat progress state
docs: document sandbox limits
```

O repositório não exige Conventional Commits formalmente, mas consistência ajuda.

## Revisão de código

O reviewer deve verificar pelo menos:

### Funcionalidade

- atende ao objetivo?
- há edge cases?

### Arquitetura

- responsabilidade está na camada certa?
- introduz duplicação de fonte de verdade?

### Segurança

- amplia superfície do sandbox?
- aceita input sem limite?

### Pedagogia

- o conceito ensinado corresponde ao código real?
- o feedback ajuda o iniciante?

### Gameplay

- consequência é clara?
- pode ocorrer soft lock?

### Qualidade

- testes cobrem a mudança?
- CI está verde?
- docs precisam mudar?

## Arquivos legados

`App/` e `Explicacao_Codigo.md` representam a origem em console do projeto.

Eles podem ser úteis como histórico, mas não devem ser usados como referência da arquitetura atual do jogo web.

## Documentação como parte do código

Atualize docs no mesmo PR quando alterar:

- stack;
- arquitetura;
- endpoint;
- limite de segurança;
- capítulo;
- conceito C# suportado;
- persistência;
- regra de gameplay principal.

A pasta `docs/` deve permanecer utilizável por alguém que acabou de conhecer o projeto.

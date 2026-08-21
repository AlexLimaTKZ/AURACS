# Contribuindo com o AURACS

Obrigado pelo interesse em contribuir com **AURACS — Crônicas da Nebulosa**.

O guia completo está em [`docs/11-como-contribuir.md`](./docs/11-como-contribuir.md).

## Início rápido

Pré-requisitos:

- .NET SDK 8
- Node.js 22+
- npm

```bash
npm install
npm run install:web
cp web/.env.example web/.env.local
npm run dev
```

## Antes de abrir um PR

```bash
npm test
npm run lint
npm run build
```

## Regras importantes

- não desenvolver diretamente na `main`;
- manter a validação pedagógica no backend;
- não reintroduzir execução arbitrária de C#;
- toda ampliação do sandbox precisa de testes positivos e negativos;
- mudanças de gameplay devem considerar teclado e touch;
- mudanças de arquitetura, capítulos, segurança ou persistência devem atualizar `docs/` no mesmo PR;
- preferir PRs de escopo claro e squash merge quando houver vários commits de iteração.

## Separação de responsabilidades

```text
Phaser       → mundo e feedback visual
React        → UI
useGameEngine → progressão/orquestração
Zustand      → save local
ASP.NET      → API
Roslyn       → parse e interpretação segura
ChallengeValidator → regra pedagógica
```

Antes de contribuir com uma nova mecânica ou desafio, consulte:

- [`docs/03-game-design-document.md`](./docs/03-game-design-document.md)
- [`docs/06-sistema-csharp.md`](./docs/06-sistema-csharp.md)
- [`docs/10-testes-qualidade.md`](./docs/10-testes-qualidade.md)

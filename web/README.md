# AURACS Web

Frontend e camada de jogo 2D de **AURACS — Crônicas da Nebulosa**.

## Stack

- Next.js 16.3.1
- React 19.2.3
- TypeScript 5
- Phaser 4.2.1
- Zustand 5
- Tailwind CSS 4
- Framer Motion
- Howler
- PrismJS

## Responsabilidades

### React / Next.js

- composição da aplicação;
- HUD;
- terminal/editor de C#;
- AURA e logs;
- menus, overlays e conquistas;
- ponte entre motor do jogo e Phaser.

### Phaser

Arquivos principais em `src/game/`:

- `createShipGame.ts` — cena/mundo 2D;
- `kaelSprite.ts` — personagem e animações;
- `worldGeometry.ts` — regiões e colisões.

Responsabilidades:

- movimentação;
- câmera;
- mundo 2D;
- colisões;
- terminais físicos;
- baú;
- inimigo/combate visual;
- partículas e feedback do cenário.

### Motor do jogo

`src/hooks/useGameEngine.ts` orquestra:

- capítulos e etapas;
- narrativa;
- AURA;
- envio de código ao backend;
- conquistas;
- inventário;
- vidas/game over;
- progressão e reset.

### Estado

`src/lib/store.ts` usa Zustand persist com a chave:

```text
auracs-save
```

O frontend persiste progresso, mas **não valida C# como fonte de verdade**. A aprovação dos desafios acontece na API .NET.

## Configuração

```bash
cp .env.example .env.local
```

Defina:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Desenvolvimento

A partir da raiz do repositório, prefira:

```bash
npm run dev
```

Isso inicia frontend e API juntos.

Somente frontend:

```bash
npm install
npm run dev
```

## Qualidade

```bash
npm test
npm run lint
npm run build
```

## Documentação

Documentação completa do projeto:

[`../docs/README.md`](../docs/README.md)

Leituras mais relevantes para frontend/gameplay:

- [Arquitetura](../docs/02-arquitetura.md)
- [GDD](../docs/03-game-design-document.md)
- [Gameplay loop](../docs/04-gameplay-loop.md)
- [Phaser](../docs/05-phaser-engine.md)
- [Persistência](../docs/09-persistencia-estado.md)
- [Testes](../docs/10-testes-qualidade.md)

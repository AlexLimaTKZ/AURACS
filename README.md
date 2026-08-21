# AURACS — Crônicas da Nebulosa

**AURACS** é um jogo educacional 2D de ficção científica para navegador em que programação C# funciona como uma mecânica do mundo. O jogador controla Kael pela nave Nebulosa, interage com a IA AURA, acessa terminais, resolve falhas da nave e enfrenta ameaças escrevendo código.

> A proposta não é “um quiz que ensina C#”, mas um jogo em que **usar C# muda o mundo**.

## Estado atual

O projeto já possui:

- mundo 2D em **Phaser 4**;
- Kael com sprite pixel-art, movimentação em quatro direções e animações;
- câmera, colisões, partículas e interações;
- Deck 01 com Core, corredor e Setor B;
- terminais diegéticos ligados ao editor React;
- inventário e Katana de Plasma Vermelha;
- **Capítulo 1 — O Despertar**;
- **Capítulo 2 — Setor de Quarentena**;
- combate pedagógico com três vidas;
- AURA, conquistas e progressão persistida localmente;
- backend ASP.NET Core com sandbox C# seguro baseado no Roslyn;
- validação semântica dos desafios;
- testes automatizados e CI.

## Gameplay loop

```text
explorar
  ↓
encontrar um problema
  ↓
interagir com terminal / objeto / hostil
  ↓
escrever C#
  ↓
backend valida semanticamente
  ↓
o mundo reage
  ↓
nova área, estado ou desafio
```

## Arquitetura

```text
Browser
├─ Next.js 16 / React 19
│  ├─ HUD, terminal, menus e conquistas
│  ├─ useGameEngine
│  └─ Zustand persist
│
├─ Phaser 4
│  ├─ mundo 2D
│  ├─ Kael
│  ├─ câmera e colisões
│  ├─ terminais / baú
│  └─ inimigos e efeitos
│
└──────────── HTTP ────────────┐
                              ▼
                    ASP.NET Core (.NET 8)
                              │
                              ▼
                     Roslyn Syntax Tree
                              │
                              ▼
                     SafeCodeEvaluator
                              │
                              ▼
                     ChallengeValidator
```

O frontend não possui um segundo interpretador de C#. O backend é a fonte de verdade para avaliação e aprovação pedagógica.

## C# suportado atualmente

O sandbox aceita apenas um subconjunto explicitamente permitido, incluindo:

- variáveis `int` e `bool`;
- literais `int`, `string` e `bool`;
- atribuições simples;
- operadores aritméticos `+ - * / %`;
- concatenação de strings;
- `Console.WriteLine(...)` com um argumento;
- comandos de combate controlados do Capítulo 2:
  - `katana.Cortar();`
  - `alvo.Vida -= 50;`
  - `katana.GolpeFatal();`

O projeto **não executa C# arbitrário**. Construções como `if/else`, loops, arrays, métodos e classes do jogador ainda não fazem parte do subconjunto atual e devem ser adicionadas somente por allowlist, com testes.

## Stack

### Jogo / frontend

- Next.js 16.3.1
- React 19.2.3
- TypeScript 5
- Phaser 4.2.1
- Zustand 5
- Tailwind CSS 4
- Framer Motion
- Howler
- PrismJS

### Backend

- ASP.NET Core / .NET 8
- Microsoft.CodeAnalysis.CSharp (Roslyn)
- xUnit

## Estrutura

```text
AURACS/
├─ App/                         # versão console histórica
├─ api/                         # API e sandbox C#
│  ├─ Program.cs
│  ├─ SafeCodeEvaluator.cs
│  └─ ChallengeValidator.cs
├─ api.Tests/                   # testes .NET
├─ web/
│  └─ src/
│     ├─ app/                   # composição Next.js
│     ├─ components/            # UI React
│     ├─ game/                  # Phaser, sprites e geometria
│     ├─ hooks/                 # motor do jogo
│     └─ lib/                   # capítulos, regras, store e API client
├─ docs/                        # documentação completa
└─ .github/workflows/ci.yml
```

## Executar localmente

Pré-requisitos:

- .NET SDK 8
- Node.js 22+
- npm

Na raiz:

```bash
npm install
npm run install:web
cp web/.env.example web/.env.local
npm run dev
```

Serviços:

- frontend: `http://localhost:3000`
- API: `http://localhost:5000`

Para produção, configure:

```env
NEXT_PUBLIC_API_URL=https://sua-api.exemplo.com
```

E defina as origens permitidas em `Cors:AllowedOrigins` no backend.

## Testes e qualidade

```bash
npm test
npm run lint
npm run build
```

A CI também executa:

- restore/build/test do backend;
- `npm ci`;
- audit das dependências de produção;
- testes frontend;
- ESLint;
- build de produção do Next.js.

## Documentação

A documentação técnica e de game design está em [`docs/`](./docs/README.md):

- [Visão geral](./docs/01-visao-geral.md)
- [Arquitetura](./docs/02-arquitetura.md)
- [Game Design Document](./docs/03-game-design-document.md)
- [Gameplay loop](./docs/04-gameplay-loop.md)
- [Phaser / mundo 2D](./docs/05-phaser-engine.md)
- [Sistema C# / sandbox](./docs/06-sistema-csharp.md)
- [Capítulos e progressão](./docs/07-capitulos-progresso.md)
- [Backend e segurança](./docs/08-backend-seguranca.md)
- [Persistência](./docs/09-persistencia-estado.md)
- [Testes e qualidade](./docs/10-testes-qualidade.md)
- [Como contribuir](./docs/11-como-contribuir.md)
- [Roadmap](./docs/ROADMAP.md)

Veja também [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Projeto legado

`App/` e `Explicacao_Codigo.md` representam a versão inicial em console e permanecem como referência histórica. A experiência principal atual é `web + api`.

## Princípio central

Ao evoluir o AURACS, preserve esta separação:

```text
Phaser = mundo
React = interface
useGameEngine = progressão
Zustand = save local
ASP.NET/Roslyn = C# seguro e validação
```

Novas funcionalidades pedagógicas só devem ser consideradas concluídas quando existirem no sandbox, no validador, nos testes e no mundo do jogo.

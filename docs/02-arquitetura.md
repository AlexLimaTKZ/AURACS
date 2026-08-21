# 02 — Arquitetura

## Visão de alto nível

O AURACS é dividido em duas camadas principais:

```text
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                │
│  Next.js / React                                               │
│  ├─ HUD                                                        │
│  ├─ terminal de código                                         │
│  ├─ menus / conquistas / overlays                              │
│  └─ useGameEngine                                              │
│              │                                                 │
│              ├──────── estado/progressão ────────┐             │
│              │                                    │             │
│           Zustand                              Phaser 4          │
│           persist                              mundo 2D          │
│                                                 │                │
│                                                 ├─ Kael          │
│                                                 ├─ câmera        │
│                                                 ├─ colisões      │
│                                                 ├─ terminais     │
│                                                 ├─ baú           │
│                                                 └─ hostis        │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP
                                ▼
┌──────────────────────── ASP.NET Core API ──────────────────────┐
│  /run  /reset  /health                                        │
│       │                                                        │
│       ▼                                                        │
│  Roslyn Syntax Tree                                            │
│       │                                                        │
│       ▼                                                        │
│  SafeCodeEvaluator                                             │
│       │                                                        │
│       ▼                                                        │
│  ChallengeValidator                                            │
└────────────────────────────────────────────────────────────────┘
```

## Responsabilidades por camada

### Next.js / React

Responsável pela aplicação web e UI de alto nível:

- composição da página;
- HUD;
- modal/terminal de código;
- logs e falas da AURA;
- conquistas;
- menus e overlays;
- opções visuais;
- integração entre estado React, Zustand e Phaser.

React não deve assumir a responsabilidade de simular C#.

### `useGameEngine`

`web/src/hooks/useGameEngine.ts` é o orquestrador principal da experiência.

Responsabilidades:

- resolver capítulo e etapa atuais;
- processar narrativa;
- disparar falas da AURA;
- enviar código ao backend;
- interpretar estados `failed`, `progress` e `passed`;
- aplicar efeitos de etapas uma única vez;
- desbloquear conquistas;
- controlar vidas no combate;
- gerenciar game over;
- abrir baú e adicionar inventário;
- avançar entre capítulos;
- resetar e retomar partidas.

Regra arquitetural: **Phaser não decide sozinho a progressão pedagógica**. Ele visualiza e reage ao estado fornecido pelo motor do jogo.

### Zustand

`web/src/lib/store.ts` persiste o progresso no `localStorage` sob a chave `auracs-save`.

Estado persistido inclui:

- energia;
- integridade;
- inventário;
- capítulo atual;
- etapa atual;
- capítulos desbloqueados;
- conquistas;
- sequência de acertos;
- identificador de sessão de código;
- efeitos de etapas já aplicados;
- preferências de screen shake e scanlines.

### Phaser 4

A cena 2D vive principalmente em `web/src/game/createShipGame.ts`.

Responsabilidades:

- renderização do mundo;
- movimentação;
- câmera;
- detecção de proximidade;
- colisão;
- animações e partículas;
- terminais físicos;
- baú;
- inimigo do Capítulo 2;
- feedback visual de sistemas;
- efeitos visuais ligados à progressão.

A geometria de colisão do Deck 01 é extraída para `web/src/game/worldGeometry.ts`.

### Ponte React ↔ Phaser

A comunicação usa estado sincronizado e eventos do `Phaser.Game`.

Conceitualmente:

```text
React/Zustand
   │
   ├─ energy
   ├─ stepId
   ├─ chapterId
   ├─ inventory
   └─ terminalOpen
        │
        ▼
      Phaser
```

Eventos de interação retornam do Phaser para React para abrir o terminal ou acionar ações de gameplay.

Essa separação permite substituir a arte/mapa sem alterar a lógica pedagógica do backend.

## Fluxo de execução de um desafio

```text
1. useGameEngine identifica a etapa atual
2. jogador abre um terminal no mundo
3. React exibe editor/terminal
4. jogador envia código
5. frontend chama POST /run
6. backend faz parse com Roslyn
7. SafeCodeEvaluator aceita ou rejeita a sintaxe
8. estado seguro da sessão é atualizado
9. ChallengeValidator verifica o objetivo pedagógico
10. API retorna status + feedback
11. useGameEngine avança ou mantém a etapa
12. Zustand persiste o progresso
13. Phaser recebe o novo estado
14. mundo 2D reage
```

## Organização de diretórios

```text
AURACS/
├─ App/                         # versão console histórica
├─ api/
│  ├─ Program.cs                # API, sessões, rate limit, endpoints
│  ├─ SafeCodeEvaluator.cs      # intérprete seguro do subconjunto C#
│  └─ ChallengeValidator.cs     # validação pedagógica por desafio
├─ api.Tests/                   # testes xUnit
├─ web/
│  └─ src/
│     ├─ app/                   # composição Next.js
│     ├─ components/            # UI React
│     ├─ game/                  # Phaser, sprites e geometria
│     ├─ hooks/                 # motor do jogo
│     └─ lib/                   # capítulos, regras, store e cliente API
├─ docs/                        # documentação atual
└─ .github/workflows/ci.yml     # CI
```

## Decisões arquiteturais importantes

### Backend é a fonte de verdade para C#

O frontend pode mostrar exemplos e dicas, mas não deve aprovar desafios por substring ou por regex como regra final.

### Código arbitrário não é executado

O Roslyn é usado para obter e inspecionar a sintaxe. A aplicação interpreta apenas nós permitidos. Não há `CSharpScript.RunAsync` para o código do jogador.

### Estado pedagógico e estado visual são separados

Uma porta pode ser visualmente aberta porque a etapa foi concluída, mas a conclusão da etapa nasce no motor/backend, não da posição da porta.

### Efeitos devem ser idempotentes

Efeitos como alteração de energia são marcados em `appliedStepEffects` para não serem reaplicados após re-render ou retomada.

## Dependências principais

Frontend:

- Next.js 16.3.1;
- React 19.2.3;
- TypeScript 5;
- Phaser 4.2.1;
- Zustand 5;
- Framer Motion;
- Howler;
- PrismJS;
- Tailwind CSS 4.

Backend:

- ASP.NET Core / .NET 8;
- Microsoft.CodeAnalysis.CSharp (Roslyn);
- xUnit para testes.

## Limites conhecidos da arquitetura atual

- sessões de código ficam em memória no processo da API;
- não há conta de usuário nem persistência cloud;
- reinício/scale-out do backend pode perder o estado da sessão de código;
- Phaser ainda concentra muitas responsabilidades em uma cena grande;
- o conteúdo de capítulos ainda é definido em TypeScript;
- o sandbox C# é deliberadamente menor que a linguagem real.

Esses limites são aceitáveis para o estágio atual, mas orientam o roadmap técnico.

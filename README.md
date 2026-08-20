# AURACS — Crônicas da Nebulosa

AURACS é um jogo educacional de ficção científica para aprender C# resolvendo problemas dentro de uma nave espacial. O jogador interage com a AURA, escreve código no terminal, recebe feedback imediato, toma decisões e desbloqueia conquistas enquanto avança pela narrativa.

## Arquitetura

```text
Browser
  -> Next.js 16 / React 19
  -> ASP.NET Core (.NET 8)
  -> Roslyn Syntax Tree
  -> SafeCodeEvaluator
```

O frontend contém a experiência do jogo e persiste o progresso localmente com Zustand. A API analisa e interpreta somente as construções de C# necessárias às atividades atuais.

O executor seguro suporta progressivamente o subconjunto de C# usado pelo jogo:

- variáveis `int` e `bool`;
- atribuições simples;
- literais `int`, `string` e `bool`;
- operações aritméticas básicas;
- concatenação de strings;
- `Console.WriteLine`;
- comandos de combate explicitamente permitidos no Capítulo 2 (`katana.Cortar()`, `alvo.Vida -= 50` e `katana.GolpeFatal()`).

O frontend não possui um segundo interpretador: o Roslyn/.NET é a fonte única de verdade para validação de código.

A API também possui limite de requisições, limite de tamanho de entrada, expiração de sessões, CORS configurável e endpoint de saúde.

## Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
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
├─ App/                    # versão console original
├─ api/                    # API e avaliador de código
│  ├─ Program.cs
│  ├─ SafeCodeEvaluator.cs
│  └─ ChallengeValidator.cs
├─ api.Tests/              # testes automatizados
├─ web/
│  └─ src/
│     ├─ app/              # composição da aplicação
│     ├─ components/       # UI
│     ├─ hooks/            # motor da narrativa
│     └─ lib/              # conteúdo, estado e cliente HTTP
└─ .github/workflows/ci.yml
```

`App/` representa a primeira versão em console e permanece como referência histórica. A experiência principal atual é formada por `web + api`.

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

Serviços locais:

- frontend: `http://localhost:3000`
- API: `http://localhost:5000`

## Produção

Configure no frontend:

```env
NEXT_PUBLIC_API_URL=https://sua-api.exemplo.com
```

Configure os domínios permitidos da API em `Cors:AllowedOrigins`.

## Testes e qualidade

Backend:

```bash
dotnet test api.Tests/api.Tests.csproj
```

Frontend:

```bash
cd web
npm test
npm run lint
npm run build
```

A GitHub Action executa build e testes do backend, além de lint e build do frontend em pull requests para `main`.

## Validação dos desafios

Os desafios são avaliados pelo resultado do código e pelo estado produzido, em vez de depender apenas da comparação textual do comando digitado. Isso permite aceitar soluções equivalentes quando elas realmente atendem ao objetivo pedagógico.

## Roadmap

- novos capítulos e conceitos de C#;
- ampliar gradualmente o subconjunto suportado da linguagem;
- modularizar capítulos;
- persistência opcional por usuário;
- testes end-to-end;
- melhorias de acessibilidade e opções de redução de movimento/áudio.

# AURACS Web

Frontend da experiência **Crônicas da Nebulosa**.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- Framer Motion

## Configuração

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Defina a URL da API:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Desenvolvimento

A partir da raiz do repositório, prefira:

```bash
npm run dev
```

Isso inicia frontend e API juntos.

Para executar somente o frontend:

```bash
npm install
npm run dev
```

## Qualidade

```bash
npm run lint
npm run build
```

A lógica de progressão do jogo está em `src/hooks/useGameEngine.ts`; `src/app/page.tsx` fica responsável principalmente pela composição visual.

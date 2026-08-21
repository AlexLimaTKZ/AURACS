# 09 — Persistência e estado

## Visão geral

O AURACS possui dois tipos diferentes de estado:

1. **estado persistente do jogo no navegador**;
2. **estado temporário da sessão C# no backend**.

Eles têm objetivos diferentes e não devem ser confundidos.

## Estado persistente no navegador

A aplicação usa Zustand com middleware `persist`.

Chave atual no `localStorage`:

```text
auracs-save
```

## Dados persistidos

O store mantém:

```ts
energy
integrity
inventory
currentChapterId
currentStepId
unlockedChapters
unlockedAchievements
consecutiveSuccesses
codeSessionId
appliedStepEffects
screenShakeEnabled
scanlinesEnabled
```

## Energia

Faixa normalizada:

```text
0..100
```

`updateEnergy` aplica clamp automaticamente.

## Integridade

Existe como parte do estado do jogo e é inicializada em 100.

Nem todas as mecânicas atuais usam esse valor ativamente; não assumir que ele já funciona como um sistema completo de HP da nave.

## Inventário

Estrutura atual:

```ts
string[]
```

`addItem` evita duplicatas simples pelo valor textual.

Item principal atual:

```text
Katana de Plasma Vermelha
```

Para um inventário maior, será preferível migrar para IDs/objetos tipados em vez de nomes livres.

## Capítulo e etapa

A progressão usa o par:

```text
currentChapterId + currentStepId
```

`resolveProgress` deve tratar combinações persistidas que não sejam mais válidas após mudanças de conteúdo.

Ao criar migrations de conteúdo, preservar a capacidade de abrir saves antigos deve ser considerado explicitamente.

## Capítulos desbloqueados

`unlockedChapters` guarda IDs de capítulos já liberados.

Estado inicial:

```text
chapter-1
```

## Conquistas

`unlockedAchievements` guarda IDs.

Conquistas são idempotentes: tentar desbloquear novamente não cria duplicatas.

## `appliedStepEffects`

Esse campo registra efeitos narrativos já executados.

Formato conceitual:

```text
chapterId:stepId
```

Motivo:

Uma etapa pode ser reprocessada por retomada, renderização ou reconstrução da narrativa. Sem esse controle, efeitos como `updateEnergy(+10)` poderiam acontecer várias vezes.

## Preferências visuais

Atualmente persistidas:

- `screenShakeEnabled`;
- `scanlinesEnabled`.

Resetar o jogo preserva essas preferências.

Isso é importante para acessibilidade e conforto visual.

## Hidratação

Como o estado vem de `localStorage`, existe o indicador `_hasHydrated`.

A UI deve evitar tomar decisões de nova partida/retomada antes da hidratação terminar.

## Sessão C#

`codeSessionId` também é persistido no frontend.

Ele identifica uma `CodeSession` temporária no backend.

Importante:

```text
save local ≠ sessão backend permanente
```

A API mantém a sessão apenas em memória e com TTL.

## O que acontece se a sessão backend desaparecer

Cenários:

- backend reiniciou;
- TTL expirou;
- deploy substituiu a instância;
- requisição chegou a uma instância sem aquele estado.

Nesse caso, uma nova sessão pode ser criada com o mesmo UUID. Para algumas etapas, o backend injeta contexto mínimo necessário.

Isso ajuda, mas não reproduz todo o histórico da sessão.

## Reset total

Comportamento esperado:

- tenta remover a sessão remota;
- recria estado inicial;
- volta ao Capítulo 1;
- gera/usa nova sessão conforme o fluxo do store;
- preserva preferências visuais.

## Reset de capítulo

Comportamento esperado:

- energia volta a 100;
- integridade volta a 100;
- etapa volta ao início do capítulo;
- sequência de acertos zera;
- sessão C# é rotacionada;
- efeitos aplicados daquele capítulo são removidos;
- metaprogressão compatível pode permanecer.

## Game over

`lives` e `isGameOver` são atualmente estado React do motor do jogo, não parte persistida do Zustand.

Logo, vidas do combate não são tratadas como metaprogressão permanente.

Ao reiniciar após game over, o capítulo é reiniciado.

## Nova partida x continuar

### Nova partida

Usa estado inicial e inicia `chapter-1` / `step-1`.

### Continuar

Resolve o save persistido e inicializa a narrativa na etapa encontrada.

## Estado Phaser

Phaser não deve ter um save paralelo independente.

O mundo deriva de dados sincronizados como:

- energia;
- step;
- capítulo;
- inventário;
- terminal aberto.

Se uma porta, inimigo ou sistema precisar persistir, a informação persistente deve viver no store/motor e o Phaser deve reconstruir o visual.

## Princípio de fonte de verdade

```text
Zustand = progresso do jogo
Backend CodeSession = contexto temporário do C#
Phaser = representação visual
React local state = UI/transientes
```

## Evolução para cloud save

Se o projeto adicionar contas, recomenda-se definir um modelo versionado de save.

Exemplo futuro:

```json
{
  "version": 2,
  "progress": {
    "chapter": "chapter-2",
    "step": "ch2-monster-2"
  },
  "inventory": ["plasma-katana-red"],
  "achievements": [],
  "settings": {}
}
```

Não enviar para cloud diretamente o formato interno do Zustand sem camada de versionamento/migração.

## Checklist para novo estado persistente

Antes de adicionar um campo ao store:

1. precisa sobreviver a reload?
2. precisa sobreviver a reset de capítulo?
3. precisa sobreviver a reset total?
4. é preferência do usuário ou progresso do personagem?
5. o Phaser pode derivá-lo?
6. saves antigos possuem fallback seguro?
7. há risco de aplicar efeito duas vezes?

Documentar a resposta quando o campo impactar progressão.

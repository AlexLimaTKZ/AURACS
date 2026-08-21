# 04 — Gameplay loop e regras

## Objetivo deste documento

Este arquivo descreve como o jogador interage com o AURACS, quais estados controlam a progressão e quais regras devem ser preservadas ao criar novas mecânicas.

## Loop principal

O loop central do jogo é:

```text
explorar → interagir → entender → programar → validar → reagir → avançar
```

### 1. Explorar

Kael se move pelo mapa 2D em busca de:

- terminais;
- sistemas;
- portas;
- baús;
- inimigos;
- novas áreas.

### 2. Interagir

A interação normalmente acontece pela tecla `E` ou pelo equivalente touch.

O mundo identifica o objeto próximo e dispara a ação adequada:

- abrir terminal;
- abrir baú;
- focar um inimigo;
- avançar para uma nova área/capítulo.

### 3. Entender

AURA e a narrativa apresentam o problema e o conceito necessário.

### 4. Programar

O jogador escreve C# no terminal React. O código é enviado à API junto com:

- `sessionId`;
- `challengeId` da etapa atual.

### 5. Validar

A API retorna um dos estados pedagógicos:

- `failed` — código inválido ou solução que não satisfaz o desafio;
- `progress` — uma parte necessária foi concluída, mas ainda falta outra;
- `passed` — objetivo completo.

### 6. Reagir

O frontend transforma o resultado em feedback:

- logs;
- fala da AURA;
- cor/flash;
- conquista;
- alteração de energia;
- mudança visual no Phaser;
- dano/estado do inimigo;
- desbloqueio de área.

### 7. Avançar

`useGameEngine` resolve a próxima etapa do capítulo e sincroniza o mundo.

## Regras de progressão

### Etapas automáticas

Uma etapa com `autoAdvance: true` pode avançar depois da narrativa/AURA sem código adicional.

### Etapas com código

Uma etapa com `requiredCode` não deve avançar somente porque o texto digitado “parece certo”. A aprovação depende do backend.

### Etapas de escolha

O Capítulo 1 utiliza `int escolha = 1;` ou `int escolha = 2;`.

O backend retorna `choiceValue`, e o motor escolhe o caminho correspondente.

### Efeitos de etapa

Efeitos como alteração de energia devem ser idempotentes.

O estado `appliedStepEffects` impede que um efeito seja executado novamente após:

- re-render;
- retomada;
- reprocessamento de narrativa.

## Interação com terminais

Existem terminais físicos no mundo 2D, enquanto o editor de código é uma interface React.

A separação é intencional:

```text
objeto Phaser
   ↓ interação
React abre terminal
   ↓ código
API valida
   ↓ resultado
React/Zustand atualizam estado
   ↓ sincronização
Phaser reage
```

## Regras de exploração

### Colisão

O jogador não pode atravessar:

- limites da nave;
- obstáculos definidos na geometria;
- áreas ainda bloqueadas.

### Setor B

O Setor B faz parte do Deck 01 e fica atrás de um bulkhead.

A progressão do Capítulo 1 controla quando a área pode ser acessada.

### Câmera

A câmera Phaser segue Kael em um mundo maior que a viewport, permitindo que exploração seja espacial e não apenas troca de telas.

## Inventário

O inventário atual é uma lista persistida de strings.

Item principal implementado:

- **Katana de Plasma Vermelha**.

A adição de item evita duplicatas.

A Katana conecta o final do Capítulo 1 ao gameplay de combate do Capítulo 2.

## Combate

O combate do Capítulo 2 é um sistema pedagógico, não um sistema de ação independente do código.

### Vidas

Kael começa o capítulo de combate com três vidas.

Erros relevantes durante desafios de combate podem causar dano.

Ao chegar a zero:

- `isGameOver` é ativado;
- narrativa de falha é mostrada;
- o jogador pode reiniciar o capítulo.

### Fases atuais

#### Fase 1

```csharp
katana.Cortar();
```

Objetivo: introduzir uma chamada de ação de domínio controlada pelo sandbox.

#### Fase 2

```csharp
alvo.Vida -= 50;
```

Objetivo: praticar operador composto `-=` aplicado a um estado de combate permitido.

#### Fase 3

```csharp
bool escudo = false;
katana.GolpeFatal();
```

O primeiro comando produz estado `progress`; o segundo completa o desafio quando o escudo está desativado.

## Regras de feedback

### Acerto

Deve gerar pelo menos:

- mensagem de sucesso;
- feedback contextual;
- consequência de gameplay ou avanço.

### Erro de sintaxe/segurança

Deve:

- manter o jogador na etapa;
- mostrar o erro recebido da API;
- permitir dica contextual quando houver correspondência em `ERROR_HINTS`.

### Progresso intermediário

Não deve ser tratado como erro.

É usado quando uma tarefa possui múltiplos comandos, como o combate final do Capítulo 2.

## Comandos auxiliares do terminal

O motor reconhece comandos de interface antes de chamar a API:

- `help`;
- `hint`;
- `conquistas` / `achievements`;
- limpeza do terminal via ação própria.

Esses comandos são parte da UX, não do subconjunto C#.

## Reset e retomada

### Nova partida

- limpa a sessão remota quando possível;
- reseta progresso local;
- volta ao Capítulo 1.

### Reset de capítulo

- mantém metaprogressão compatível;
- reinicia energia/integridade e etapa do capítulo;
- cria nova sessão de código.

### Retomar partida

O motor resolve o capítulo/etapa persistidos e reconstrói a sessão narrativa.

## Regras para novas mecânicas

Uma nova mecânica deve responder às perguntas:

1. Qual problema do mundo ela representa?
2. Qual conceito de C# ela ensina ou reforça?
3. Qual objeto ou área representa essa mecânica no Phaser?
4. Quem decide o sucesso: backend ou gameplay?
5. Qual feedback visível o jogador recebe?
6. Como o estado é persistido?
7. Qual teste evita regressão?

Se uma mecânica de C# não possui validação backend adequada, ela ainda não está pronta para entrar no loop principal.

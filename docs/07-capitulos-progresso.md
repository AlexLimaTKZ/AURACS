# 07 — Capítulos, progressão e conteúdo

## Estrutura de conteúdo

Capítulos e etapas são declarados em `web/src/lib/chapters.ts`.

Modelo simplificado:

```ts
interface Chapter {
  id: string;
  title: string;
  initialStepId: string;
  steps: Record<string, ChapterStep>;
}
```

Uma etapa pode possuir:

- narrativa;
- fala da AURA;
- exemplo/objetivo de código;
- escolha;
- efeito de sucesso;
- conquista;
- próxima etapa;
- avanço automático.

## Capítulo 1 — O Despertar

### Objetivo narrativo

Apresentar Kael, AURA, a Nebulosa e a ideia de que os sistemas da nave precisam ser controlados por C#.

### Fluxo

```text
step-1
  ↓ auto
step-1-b
  ↓ auto
step-2 — variável de energia
  ↓
step-3 — Console.WriteLine
  ↓
step-4 — decisão
  ├─ step-4-shields
  └─ step-4-life
        ↓ auto
step-5 — cálculo de distância
  ↓
step-find-katana — exploração / baú
  ↓ interação
step-end
```

### `step-1` — despertar

Narrativa introdutória da falha da nave.

Sem desafio de código.

### `step-1-b` — apresentação do terminal C#

AURA explica que o jogador precisará usar sintaxe C# para interagir com os sistemas.

Sem desafio de código.

### `step-2` — variável inteira

Conceito:

```csharp
int nivelDeEnergia = 25;
```

Validação semântica:

- variável chamada `nivelDeEnergia`;
- tipo `int`;
- valor 25.

Efeito:

- energia do estado do jogo é atualizada;
- conquista `variable_master`.

### `step-3` — saída no console

Conceito:

```csharp
Console.WriteLine("Nível de energia: " + nivelDeEnergia + "%");
```

Validação:

- variável ainda vale 25;
- saída esperada é produzida.

Conquista:

- `console_writer`.

### `step-4` — escolha

Opções:

```csharp
int escolha = 1;
```

ou:

```csharp
int escolha = 2;
```

Caminhos:

- 1 → escudos;
- 2 → suporte de vida.

Importante: isso é atualmente uma escolha por inteiro. Não deve ser descrito como suporte real a `if/else` no sandbox.

### `step-4-shields`

Efeito:

- feedback de escudos;
- energia +10;
- conquista `decision_maker`;
- avanço automático.

### `step-4-life`

Efeito:

- feedback de suporte de vida;
- energia +5;
- conquista `decision_maker`;
- avanço automático.

### `step-5` — expressão matemática

Exemplo:

```csharp
int distancia = 150 * 2 - 50;
Console.WriteLine("Distância segura: " + distancia + " km");
```

Objetivo semântico:

- `distancia == 250`;
- saída deve conter `250`.

### `step-find-katana`

Muda o ritmo: a próxima ação não é código, é exploração.

O jogador deve chegar ao Setor B e interagir com o Baú de Suprimentos.

Resultado:

- item `Katana de Plasma Vermelha` no inventário;
- conquista `katana_found`;
- avanço para o encerramento.

### `step-end`

Finaliza a preparação do Deck 01 e prepara a entrada no Deck 02.

Conquista:

- `chapter_1_complete`.

## Capítulo 2 — Setor de Quarentena

### Objetivo narrativo

Transformar C# em ferramenta de combate e introduzir estados intermediários de desafio.

### Fluxo

```text
ch2-step-1
   ↓ baú/preparação
ch2-monster-1
   ↓
ch2-monster-2
   ↓
ch2-monster-3
   ↓
ch2-end
```

### `ch2-step-1`

Apresenta o ambiente de quarentena e orienta o jogador a se preparar para o hostil.

### `ch2-monster-1` — ação da Katana

Código:

```csharp
katana.Cortar();
```

Objetivo:

- reconhecer uma invocação de domínio permitida;
- conectar sintaxe de chamada de método à ação visual da arma.

Conquista:

- `first_blood_katana`.

### `ch2-monster-2` — operador composto

Código:

```csharp
alvo.Vida -= 50;
```

Objetivo:

- introduzir/reconhecer `-=` em um contexto de alteração de estado.

Conquista:

- `operator_master`.

### `ch2-monster-3` — estado booleano + finalização

Primeiro comando:

```csharp
bool escudo = false;
```

Resultado esperado:

- desafio entra em `progress`;
- escudo é considerado desativado;
- etapa permanece ativa.

Segundo comando:

```csharp
katana.GolpeFatal();
```

Com o escudo desativado, o desafio é concluído.

### `ch2-end`

Conclui o Setor de Quarentena.

Conquista:

- `chapter_2_complete`.

## Estados do desafio

### `failed`

A solução ainda não atende ao objetivo.

### `progress`

Parte de uma tarefa composta foi concluída.

Exemplo principal:

```text
desativar escudo → progress
GolpeFatal        → passed
```

### `passed`

Objetivo completo e progressão autorizada.

## Conquistas atuais

| ID | Título | Gatilho principal |
|---|---|---|
| `first_command` | Primeiro Contato | primeiro comando C# |
| `variable_master` | Mestre das Variáveis | variável inicial |
| `console_writer` | Comunicador | saída no console |
| `decision_maker` | Decisor | escolha do Capítulo 1 |
| `chapter_1_complete` | Sobrevivente | conclusão do Capítulo 1 |
| `no_errors` | Código Perfeito | sequência de três tarefas |
| `hacker` | Hacker Ético | bloqueio do sandbox |
| `helper` | Manual do Piloto | comando help |
| `katana_found` | Espadachim Cibernético | aquisição da Katana |
| `first_blood_katana` | Primeiro Corte | primeira fase de combate |
| `operator_master` | Mestre dos Operadores | fase com `-=` |
| `chapter_2_complete` | Guerreiro do Código | conclusão do Capítulo 2 |

## Capítulos desbloqueados

O store mantém `unlockedChapters`.

O Capítulo 1 começa desbloqueado. O motor pode desbloquear o Capítulo 2 quando a progressão permite.

## Como criar um novo capítulo

Checklist obrigatório:

1. criar `Chapter` e seus steps;
2. registrar em `ALL_CHAPTERS`;
3. definir conceitos pedagógicos;
4. implementar suporte seguro no backend, se necessário;
5. criar validadores de desafio;
6. criar testes de avaliação e validação;
7. implementar representações Phaser necessárias;
8. adicionar feedback da AURA;
9. definir persistência/inventário/conquistas;
10. atualizar este documento e o GDD.

## Regra de coerência

Nenhum capítulo deve depender de uma construção C# que não esteja explicitamente aceita e testada pelo `SafeCodeEvaluator`.

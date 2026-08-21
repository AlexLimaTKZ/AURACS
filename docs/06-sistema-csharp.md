# 06 — Sistema de C# e sandbox

## Objetivo

O AURACS permite que o jogador escreva C#, mas **não executa C# arbitrário**.

O backend utiliza o Roslyn para fazer parse do código e interpreta manualmente apenas construções explicitamente permitidas pelo projeto.

Essa decisão existe por dois motivos:

1. segurança;
2. controle pedagógico.

## Fluxo

```text
código do jogador
      ↓
CSharpSyntaxTree.ParseText
      ↓
diagnósticos de sintaxe
      ↓
verificação estrutural
      ↓
SafeCodeEvaluator
      ↓
CodeSession segura
      ↓
ChallengeValidator
      ↓
failed / progress / passed
```

## Estrutura de wrapper

O código recebido é inserido em uma estrutura sintática controlada para parse:

```csharp
class __AURACS
{
    void Run()
    {
        // código do jogador
    }
}
```

Depois do parse, o avaliador confirma que a árvore continua contendo somente essa estrutura esperada.

Tentativas de injetar `using`, novos tipos, métodos extras ou outras estruturas são rejeitadas.

## Tipos suportados

### Declaração de variável

Atualmente são permitidos:

```csharp
int
bool
```

Exemplos:

```csharp
int nivelDeEnergia = 25;
bool escudo = false;
```

Strings podem existir como valores internos/expressões, mas o avaliador de declaração local atualmente restringe declarações do jogador a `int` e `bool`.

## Literais suportados

- inteiro;
- string;
- `true`;
- `false`.

## Expressões suportadas

### Identificadores

Variáveis existentes podem ser lidas:

```csharp
nivelDeEnergia
```

### Parênteses

```csharp
(10 + 5) * 2
```

### Operadores unários

Somente para inteiros:

```csharp
+10
-10
```

### Operadores aritméticos

```text
+
-
*
/
%
```

Exemplo:

```csharp
int distancia = 150 * 2 - 50;
```

### Concatenação

O operador `+` concatena quando um dos operandos é string.

Exemplo:

```csharp
Console.WriteLine("Nível de energia: " + nivelDeEnergia + "%");
```

## Atribuição

Atribuição simples é permitida apenas para variável já existente e deve preservar o tipo:

```csharp
nivelDeEnergia = 30;
```

## Console.WriteLine

É permitido:

```csharp
Console.WriteLine(expressao);
```

Regra atual:

- exatamente um argumento.

O valor calculado é adicionado aos logs da avaliação e pode ser usado pelo `ChallengeValidator`.

## Extensões controladas de combate

O sandbox possui ações específicas para o conteúdo do Capítulo 2.

Elas **não representam suporte genérico a objetos, métodos ou propriedades de C#**. São comandos de domínio reconhecidos explicitamente pelo avaliador.

### Katana

Permitidos:

```csharp
katana.Cortar();
katana.GolpeFatal();
```

Nenhum outro método de `katana` é aceito.

### Dano

Permitido especificamente:

```csharp
alvo.Vida -= 50;
```

O operador `-=` não é genericamente liberado para qualquer membro. O avaliador exige `alvo.Vida`.

O valor de dano deve ser inteiro positivo dentro do limite interno do avaliador.

## Estado de sessão

Variáveis não ficam em um runtime C# real. Elas são armazenadas em `CodeSession` como `SafeValue`.

Tipos internos:

```text
Int
String
Bool
```

Cada requisição trabalha inicialmente sobre uma cópia da sessão. O estado só é confirmado na sessão original se a avaliação terminar sem erro.

Isso evita que uma execução parcialmente inválida corrompa o estado anterior.

## Limites do avaliador

Atualmente:

- máximo de 8 statements por execução;
- máximo de 64 variáveis por sessão;
- strings com no máximo 500 caracteres;
- overflow de `int` gera erro;
- divisão por zero gera erro.

## O que NÃO é suportado atualmente

O sandbox não deve ser descrito como um C# completo.

Entre as construções não suportadas estão, de forma geral:

- `if` / `else` como statements reais;
- `switch`;
- `for`;
- `foreach`;
- `while`;
- arrays;
- `List<T>`;
- métodos definidos pelo jogador;
- classes definidas pelo jogador;
- `new`;
- LINQ;
- namespaces/imports do jogador;
- acesso a arquivos;
- rede;
- processos;
- reflection;
- carregamento de assemblies;
- chamadas arbitrárias de APIs .NET;
- chamadas arbitrárias de métodos;
- acesso genérico a propriedades/membros.

A existência de um texto de narrativa ou conquista mencionando um conceito não significa que o sandbox o suporte.

## Validação semântica dos desafios

`ChallengeValidator` analisa o estado produzido pelo código.

### `step-2`

Requer:

```text
nivelDeEnergia: int = 25
```

### `step-3`

Requer que `nivelDeEnergia` continue valendo 25 e que o output seja exatamente:

```text
Nível de energia: 25%
```

### `step-4`

Requer:

```csharp
int escolha = 1;
```

ou:

```csharp
int escolha = 2;
```

### `step-5`

Requer `distancia == 250` e saída contendo `250`.

Se o cálculo estiver correto mas não tiver sido impresso, o backend pode retornar `progress`.

### `ch2-monster-1`

Requer ação `Cortar` da Katana.

### `ch2-monster-2`

Requer dano de pelo menos 50 em `alvo.Vida`.

### `ch2-monster-3`

É uma tarefa em duas fases:

1. `escudo` deve ser booleano e `false`;
2. a ação `GolpeFatal` deve ser executada.

A primeira fase pode retornar `progress`, permitindo que o jogador continue na mesma etapa.

## Seed de contexto

Quando uma sessão precisa ser recriada no meio de determinadas etapas, o backend pode semear variáveis mínimas necessárias ao contexto.

Exemplos atuais:

- `nivelDeEnergia = 25` em etapas posteriores do Capítulo 1;
- `escudo = true` no combate final do Capítulo 2.

Isso reduz quebra de retomada quando a sessão in-memory do backend não existe mais.

## Como ampliar o subconjunto

Nunca adicione suporte usando execução arbitrária do código.

Processo recomendado:

1. escolher uma construção C# específica;
2. identificar os nós Roslyn necessários;
3. limitar tipos/operandos;
4. adicionar avaliação explícita;
5. adicionar mensagens de erro claras;
6. criar testes positivos;
7. criar testes negativos/de segurança;
8. adicionar desafio que realmente use a construção;
9. atualizar esta documentação.

## Exemplo: futuro `if/else`

Para suportar condicionais no futuro, não basta aceitar `IfStatementSyntax` sem restrições. Será necessário definir:

- quais operadores de comparação serão suportados;
- se blocos aninhados são permitidos;
- limite de profundidade;
- quais statements podem existir dentro dos blocos;
- como booleanos são avaliados;
- testes para impedir abuso.

## Regra de segurança

> Se uma construção não estiver explicitamente implementada no avaliador seguro, ela é proibida.

Essa abordagem de allowlist é parte central da arquitetura de segurança do AURACS.

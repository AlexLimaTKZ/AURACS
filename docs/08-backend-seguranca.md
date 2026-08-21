# 08 — Backend e segurança

## Papel do backend

A API ASP.NET Core é responsável por:

- receber código C# do jogador;
- manter sessões temporárias de variáveis;
- analisar sintaxe com Roslyn;
- interpretar somente construções permitidas;
- validar desafios;
- aplicar limites de abuso;
- retornar feedback estruturado ao frontend.

## Endpoints

### `GET /health`

Retorna estado básico da API e quantidade de sessões ativas.

Uso:

- health check;
- diagnóstico de deploy;
- observabilidade simples.

### `POST /run`

Entrada conceitual:

```json
{
  "code": "int nivelDeEnergia = 25;",
  "sessionId": "uuid",
  "challengeId": "step-2"
}
```

Saída pode incluir:

- `success`;
- `logs`;
- `returnValue`;
- `challengePassed`;
- `challengeStatus`;
- `feedback`;
- `choiceValue`.

### `POST /reset`

Remove a sessão temporária associada ao UUID informado.

## Modelo de segurança

A estratégia principal é **allowlist**, não blacklist.

O sistema não tenta reconhecer “código perigoso” depois de permitir a linguagem inteira. Ele aceita somente os nós e comandos explicitamente implementados.

```text
não implementado = proibido
```

## Código não é compilado/executado arbitrariamente

O backend utiliza Roslyn para parse e diagnóstico, mas o código do jogador não é entregue a um executor genérico de scripts .NET.

`SafeCodeEvaluator` percorre a árvore sintática e calcula manualmente os valores permitidos.

Isso reduz drasticamente superfícies como:

- filesystem;
- processos;
- sockets;
- environment variables;
- reflection;
- assemblies;
- APIs do sistema operacional;
- loops infinitos de linguagem geral.

## Limites HTTP e de entrada

Valores implementados atualmente:

| Limite | Valor |
|---|---:|
| corpo da requisição | 8 KiB |
| código por execução | 2.000 caracteres |
| requisições de `/run` por IP | 30/minuto |
| fila do rate limiter | 0 |

Ao exceder o rate limit, a API responde com HTTP 429.

## Sessões

As sessões ficam em um `ConcurrentDictionary` no processo da API.

Limites atuais:

| Item | Valor |
|---|---:|
| sessões simultâneas | 2.000 |
| TTL de sessão | 2 horas |

Sessões expiradas são removidas durante operações de limpeza.

Quando o limite de sessões é atingido, a criação de nova sessão pode responder HTTP 503.

## Identificador de sessão

`sessionId` precisa ser um UUID válido.

O frontend persiste um identificador de sessão no Zustand e pode rotacioná-lo em reset/troca de capítulo.

O ID não deve ser tratado como autenticação. Ele é apenas correlação de estado temporário do sandbox.

## Concorrência

Cada `CodeSession` possui `SemaphoreSlim` próprio.

Isso serializa execuções concorrentes para a mesma sessão, evitando condições de corrida ao atualizar variáveis.

A criação de novas sessões também possui gate para controlar a checagem do limite global.

## Transação de estado do avaliador

O avaliador cria uma cópia de trabalho da sessão:

```text
sessão atual
   ↓ copy
working session
   ↓ avalia todos os statements
sucesso? ── não → descarta
   │
  sim
   ↓
commit na sessão
```

Uma instrução inválida no meio da execução não deve deixar alterações parciais no estado original.

## Limites internos do sandbox

| Limite | Valor |
|---|---:|
| statements por execução | 8 |
| variáveis por sessão | 64 |
| tamanho de string | 500 caracteres |

Também existem tratamentos específicos para:

- divisão por zero;
- overflow de `int`;
- tipo incompatível;
- variável inexistente;
- estrutura sintática não permitida.

## CORS

Origens permitidas vêm da configuração:

```text
Cors:AllowedOrigins
```

Fallback de desenvolvimento:

```text
http://localhost:3000
```

Em produção, configure explicitamente apenas os frontends autorizados.

## Seed de sessão

Como as sessões são efêmeras, o backend restaura contexto mínimo em determinados desafios quando uma nova sessão é criada.

Exemplos:

- `nivelDeEnergia = 25` em passos posteriores do Capítulo 1;
- `escudo = true` no desafio final do Capítulo 2.

O seed deve ser mínimo e específico do desafio. Ele não substitui persistência real.

## Threat model simplificado

### Ameaça: executar código .NET arbitrário

Mitigação:

- parse + intérprete allowlist;
- sem script runner genérico.

### Ameaça: payload excessivo

Mitigação:

- limite de body;
- limite de caracteres;
- limite de statements/string/variáveis.

### Ameaça: spam de execução

Mitigação:

- fixed-window rate limiter por IP.

### Ameaça: esgotar sessões

Mitigação:

- TTL;
- limite global;
- cleanup;
- HTTP 503 quando saturado.

### Ameaça: race condition na mesma sessão

Mitigação:

- semaphore por sessão.

### Ameaça: mutação parcial em código que falha

Mitigação:

- working copy + commit somente após avaliação válida.

## Limitações conhecidas

### Estado in-memory

Se a instância da API reiniciar, sessões de código são perdidas.

Em arquitetura com múltiplas réplicas, uma sessão pode não estar disponível em outra instância sem sticky session ou armazenamento compartilhado.

### Rate limit local

O limiter atual é por instância. Em scale-out, o limite efetivo pode se multiplicar pelo número de réplicas.

### Sem autenticação

A API não implementa conta de usuário. O UUID da sessão não fornece identidade forte.

## Evolução recomendada

Quando o projeto exigir escala real:

- sessão em Redis ou storage equivalente;
- rate limiting distribuído;
- telemetria estruturada;
- métricas de rejeição do sandbox;
- autenticação somente se existir necessidade de conta/cloud save;
- testes de fuzzing da árvore sintática;
- limites adicionais de profundidade/complexidade conforme o subconjunto crescer.

## Regra para revisão de segurança

Qualquer PR que amplie o subconjunto C# deve responder:

1. quais novos nós Roslyn são aceitos?
2. quais operandos/tipos são válidos?
3. existe limite de profundidade/quantidade?
4. quais APIs continuam inacessíveis?
5. quais testes de abuso foram adicionados?
6. o estado continua transacional?

Não reintroduzir execução arbitrária como atalho para adicionar conteúdo.

# 01 — Visão geral

## O que é o AURACS

**AURACS — Crônicas da Nebulosa** é um jogo educacional 2D para navegador que ensina fundamentos de C# por meio de uma narrativa de ficção científica.

A proposta central é que programação não apareça como um questionário separado do jogo. O código é parte do universo: Kael encontra terminais, sistemas danificados e hostis; o jogador escreve C#; o backend avalia o código; e o mundo reage ao resultado.

## Premissa

O jogador controla **Kael**, sobrevivente a bordo da nave **Nebulosa**. A inteligência artificial **AURA** perdeu parte do controle direto sobre os sistemas da nave. Para recuperar energia, liberar setores e sobreviver aos perigos internos, Kael precisa interagir com a infraestrutura por meio de terminais C#.

A progressão transforma conceitos de programação em ações concretas:

- criar uma variável representa uma leitura ou configuração de sistema;
- imprimir valores confirma telemetria;
- expressões matemáticas resolvem cálculos de navegação;
- valores booleanos podem representar estados como um escudo ativo ou desativado;
- operadores podem representar dano em combate;
- comandos específicos do domínio representam ações da Katana de Plasma.

## Objetivo pedagógico

O AURACS busca ensinar programação por repetição contextualizada e feedback imediato.

Princípios pedagógicos:

1. **Contexto antes da sintaxe** — o jogador entende por que precisa do código antes de digitá-lo.
2. **Consequência visível** — quando possível, uma solução correta altera o mundo 2D.
3. **Feedback semântico** — desafios são validados pelo estado e pelo resultado produzido, não somente por igualdade textual.
4. **Escopo progressivo** — o sandbox expõe apenas o subconjunto de C# necessário ao conteúdo implementado.
5. **Erro como aprendizado** — AURA transforma erros comuns em dicas compreensíveis.
6. **Gamificação moderada** — conquistas, exploração, inventário e combate reforçam progresso sem substituir o aprendizado.

## Público-alvo

Principalmente pessoas iniciantes em programação e C# que se beneficiam de uma abordagem visual e narrativa.

O projeto não pretende substituir documentação oficial, IDE, compilador completo ou curso formal. Ele funciona como ambiente introdutório e de prática guiada.

## Estado atual do produto

### Capítulo 1 — O Despertar

Conceitos praticados:

- `int`;
- declaração e atribuição;
- `Console.WriteLine`;
- concatenação de strings;
- escolha por valor inteiro;
- expressões aritméticas;
- interação com sistemas da nave;
- exploração do Deck 01 e Setor B;
- aquisição da Katana de Plasma Vermelha.

### Capítulo 2 — Setor de Quarentena

Conceitos praticados por meio do combate:

- chamada de ação permitida `katana.Cortar();`;
- operador composto `-=` aplicado ao alvo de combate;
- `bool`;
- alteração de estado com `false`;
- sequência de comandos para superar uma defesa e finalizar um hostil.

O capítulo possui sistema de três vidas e game over/reinício de capítulo.

## Pilares do produto

### 1. Programação como mecânica

O código deve produzir uma consequência no universo sempre que isso for viável.

### 2. Exploração

O jogador se move fisicamente pela nave, encontra terminais, portas, baús, sistemas e hostis.

### 3. Narrativa guiada por AURA

AURA explica contexto, fornece dicas e conduz a progressão sem remover do jogador a responsabilidade de resolver os desafios.

### 4. Segurança

Código fornecido pelo jogador não é executado como C# arbitrário. O backend analisa a árvore sintática e interpreta somente construções explicitamente permitidas.

### 5. Progressão persistente

Capítulo, etapa, inventário, conquistas e preferências principais são persistidos localmente no navegador.

## O que o AURACS não é

- não é um compilador C# completo;
- não executa assemblies arbitrários enviados pelo usuário;
- não suporta toda a linguagem C#;
- não é MMORPG nem jogo multiplayer;
- não possui backend de contas/persistência em nuvem atualmente;
- não deve fingir suporte a conceitos que o sandbox ainda não implementa.

## Direção do projeto

A evolução deve preservar o loop:

```text
explorar
  ↓
encontrar um problema
  ↓
entender o conceito
  ↓
escrever C#
  ↓
backend valida semanticamente
  ↓
o mundo reage
  ↓
nova possibilidade de exploração
```

Esse loop é a identidade principal do AURACS.

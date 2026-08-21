# 03 — Game Design Document (GDD)

## 1. Identidade

**Título:** AURACS — Crônicas da Nebulosa  
**Gênero:** aventura 2D educacional / ficção científica / programação  
**Plataforma:** navegador desktop e mobile  
**Engine 2D:** Phaser 4  
**Linguagem ensinada:** C#  
**Protagonista:** Kael  
**Guia:** AURA  
**Cenário principal:** nave Nebulosa

## 2. High concept

Um jogo em que escrever C# é uma habilidade diegética do personagem. O jogador explora uma nave danificada, encontra sistemas e ameaças, acessa terminais e utiliza código para resolver problemas reais do mundo do jogo.

A fantasia desejada é:

> “Eu não estou respondendo uma prova de programação; estou usando programação para sobreviver e controlar uma nave.”

## 3. Pilares de design

### Programação com consequência

Cada conceito novo deve, quando possível, produzir feedback visível no jogo.

Exemplos:

- variável correta → sistema passa a reconhecer uma leitura;
- `Console.WriteLine` correto → confirmação de telemetria e desbloqueio;
- escolha numérica → sistema de escudo ou suporte de vida responde;
- operador de dano → hostil perde vida;
- booleano → escudo do inimigo muda de estado.

### Exploração funcional

Andar pelo mapa deve ter propósito. Interações importantes ficam ligadas a objetos do cenário:

- terminais;
- portas;
- baús;
- sistemas;
- inimigos.

### Aprendizado progressivo

O jogo apresenta poucos conceitos por vez. Um capítulo deve reutilizar conhecimentos anteriores antes de introduzir novos.

### AURA como tutora dentro do universo

AURA deve:

- contextualizar objetivos;
- explicar erros em linguagem acessível;
- oferecer dicas;
- reforçar sucesso;
- evitar dar a solução completa sem necessidade.

### Feedback audiovisual

Ações corretas devem gerar resposta clara por pelo menos um canal:

- alteração no cenário;
- animação;
- luz/cor;
- texto de sistema;
- fala da AURA;
- conquista;
- efeito de combate.

## 4. Personagens

### Kael

Personagem controlado pelo jogador.

Características atuais de gameplay:

- movimentação em quatro direções;
- animação pixel-art;
- interação com `E`;
- inventário;
- acesso à Katana de Plasma Vermelha;
- sistema de três vidas no combate do Capítulo 2.

Direção visual:

- traje tecnológico;
- visor iluminado;
- leitura clara em tamanho pequeno;
- silhueta distinguível do cenário.

### AURA

IA da nave e guia pedagógica.

Funções:

- narradora;
- instrutora;
- feedback de erro;
- reforço de missão;
- elo entre programação e ficção científica.

AURA não deve substituir a decisão do jogador nem validar código localmente.

## 5. Mundo

### Nave Nebulosa

É simultaneamente cenário e interface pedagógica.

#### Deck 01 — Core / Setor B

Elementos implementados:

- núcleo/área inicial;
- reator e energia auxiliar;
- terminal principal;
- corredor/bulkhead;
- Setor B;
- segundo terminal;
- sistemas de escudo e suporte de vida;
- baú de suprimentos;
- Katana de Plasma Vermelha.

#### Deck 02 — Setor de Quarentena

Representa a transição para gameplay de combate e comandos de C# associados a estados de batalha.

Elementos atuais:

- ambiente de quarentena;
- hostil cibernético;
- interação de combate;
- feedback de vida/dano;
- três vidas;
- game over e reinício.

## 6. Controles

Desktop:

- `WASD` ou setas — movimentação;
- `E` — interagir;
- teclado no terminal — escrever código.

Mobile/touch:

- controles virtuais de direção;
- botão de interação;
- interface de terminal adaptada ao navegador.

## 7. Core loop

```text
EXPLORAR
   ↓
IDENTIFICAR PROBLEMA
   ↓
INTERAGIR
   ↓
AURA EXPLICA O CONTEXTO
   ↓
ESCREVER C#
   ↓
RECEBER FEEDBACK
   ↓
MUNDO REAGE
   ↓
DESBLOQUEAR PROGRESSO
   ↺
```

## 8. Loop de combate

```text
aproximar do hostil
      ↓
interagir
      ↓
ver instrução/desafio
      ↓
escrever C#
      ↓
backend valida
   ↙        ↘
erro       acerto
 ↓           ↓
perde vida  hostil reage
 ↓           ↓
repetir     próxima fase
```

## 9. Progressão

A progressão possui três dimensões:

### Conhecimento

O jogador aprende novos elementos do subconjunto C# suportado.

### Mundo

Áreas, portas, objetos e confrontos tornam-se disponíveis.

### Metaprogressão

- capítulos desbloqueados;
- inventário;
- conquistas;
- estado salvo localmente.

## 10. Conquistas

Conquistas atuais incluem marcos como:

- primeiro comando;
- primeira variável;
- primeiro `Console.WriteLine`;
- decisão;
- sequência sem erros;
- tentativa bloqueada pelo sandbox;
- uso do help;
- obtenção da Katana;
- primeiro corte;
- uso de operador no combate;
- conclusão dos capítulos 1 e 2.

Conquistas devem recompensar comportamento real e não ensinar conceitos que ainda não são suportados.

## 11. Dificuldade

A dificuldade ideal cresce em três eixos:

1. **sintaxe** — mais elementos da linguagem;
2. **raciocínio** — menos código explicitamente fornecido;
3. **pressão de gameplay** — combate, exploração e consequências.

Evitar aumentar os três eixos ao mesmo tempo na introdução de um conceito.

## 12. Regras de conteúdo pedagógico

Para adicionar um novo desafio:

1. definir qual conceito de C# será ensinado;
2. definir o problema ficcional que justifica o conceito;
3. verificar se o sandbox suporta a construção;
4. adicionar ou ampliar o sandbox de forma restrita;
5. criar validação semântica no backend;
6. escrever narrativa e dica;
7. definir consequência visual;
8. criar testes;
9. documentar a mudança.

## 13. Direção visual

Estética:

- sci-fi industrial;
- fundo espacial;
- iluminação de emergência;
- ciano/azul para sistemas AURACS;
- vermelho/âmbar para perigo e combate;
- pixel-art no personagem e objetos de gameplay;
- HUD tecnológico sem ocupar mais atenção que o mundo.

O uso de scanlines e screen shake deve respeitar preferências do usuário e poder ser reduzido/desativado.

## 14. Áudio

Howler já está presente na stack e deve ser usado de forma controlada para:

- ambiente da nave;
- interface;
- feedback de terminal;
- portas/sistemas;
- combate;
- conquistas.

Áudio nunca deve ser a única forma de comunicar informação essencial.

## 15. Critérios de sucesso de uma nova mecânica

Uma mecânica é considerada bem integrada quando:

- faz sentido no universo;
- ensina ou reforça um conceito;
- possui feedback claro;
- pode ser testada;
- não depende de C# arbitrário;
- não quebra a separação entre Phaser, motor narrativo e backend;
- permanece utilizável com teclado e, quando aplicável, touch.

## 16. Anti-padrões de design

Evitar:

- transformar todo desafio em “vá ao terminal e copie exatamente uma linha”;
- adicionar caminhada sem decisão ou descoberta;
- validar por texto no frontend;
- inserir funcionalidades de C# no roteiro antes do sandbox suportá-las;
- usar combate puramente decorativo sem vínculo pedagógico;
- esconder feedback importante apenas em animações rápidas;
- criar grind para prolongar artificialmente o tempo de jogo.

## 17. Visão de longo prazo

A evolução desejada é transformar a Nebulosa em um espaço conectado de aprendizado, em que capítulos introduzem conceitos progressivamente e o jogador percebe que dominar C# significa ganhar novas formas de interagir com o universo.

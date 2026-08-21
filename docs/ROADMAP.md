# Roadmap

## Como ler este documento

Este roadmap separa claramente:

- **implementado** — existe no código atual;
- **próximo** — recomendado para a próxima fase;
- **futuro** — direção, não compromisso de entrega.

A ordem prioriza primeiro estabilidade e fundação técnica, depois conteúdo.

---

## Estado atual — implementado

### Fundação web

- [x] Next.js + React;
- [x] Phaser 4 para mundo 2D;
- [x] ASP.NET Core / .NET 8;
- [x] Roslyn para parse de C#;
- [x] Zustand com persistência local;
- [x] CI de backend e frontend.

### Jogo 2D

- [x] Kael controlável;
- [x] sprite pixel-art em quatro direções;
- [x] animação de caminhada;
- [x] câmera seguindo jogador;
- [x] colisão manual;
- [x] Core e Setor B do Deck 01;
- [x] terminais físicos;
- [x] controles touch;
- [x] partículas/feedback visual;
- [x] baú de suprimentos;
- [x] Katana de Plasma Vermelha;
- [x] hostil do Capítulo 2;
- [x] sistema de três vidas/game over.

### Conteúdo

- [x] Capítulo 1 — O Despertar;
- [x] variáveis `int`;
- [x] `Console.WriteLine`;
- [x] concatenação;
- [x] aritmética;
- [x] escolha por valor inteiro;
- [x] Capítulo 2 — Setor de Quarentena;
- [x] `bool`;
- [x] comando controlado de Katana;
- [x] operador `-=` de combate;
- [x] desafio multipartes com estado `progress`.

### Segurança

- [x] remoção de execução arbitrária de C#;
- [x] avaliador allowlist;
- [x] validação semântica backend;
- [x] limites de código/body/sessão;
- [x] rate limit;
- [x] TTL;
- [x] CORS configurável;
- [x] health endpoint.

---

## Fase 1 — estabilização da vertical slice

Prioridade imediata.

### Gameplay

- [ ] playtest completo do Capítulo 1 em desktop;
- [ ] playtest completo do Capítulo 2 em desktop;
- [ ] playtest touch/mobile;
- [ ] revisar colisões e pontos de soft lock;
- [ ] revisar escala/câmera em resoluções diferentes;
- [ ] melhorar clareza dos prompts de interação;
- [ ] alinhar descrição da conquista `decision_maker` com a mecânica real atual.

### Qualidade

- [ ] testes end-to-end do caminho crítico;
- [ ] testes adicionais de integração de progressão;
- [ ] teste de retomada após expiração de CodeSession;
- [ ] teste de reset durante diferentes capítulos;
- [ ] instrumentar erros de runtime do frontend.

### Arquitetura Phaser

- [ ] reduzir tamanho de `createShipGame.ts`;
- [ ] separar entidades e sistemas;
- [ ] separar cenas Deck 01 / Deck 02 se a evolução exigir;
- [ ] formalizar contrato de eventos React ↔ Phaser.

---

## Fase 2 — elevar qualidade de jogo

### Arte

- [ ] sprites definitivos de ambientes;
- [ ] animações adicionais de Kael;
- [ ] animações de ataque/impacto;
- [ ] props variados para reduzir repetição;
- [ ] iluminação/efeitos por setor;
- [ ] identidade visual consistente entre capítulos.

### Áudio

- [ ] ambience da Nebulosa;
- [ ] feedback sonoro do terminal;
- [ ] portas e sistemas;
- [ ] Katana;
- [ ] combate;
- [ ] conquista;
- [ ] controles de volume/mute.

### UX

- [ ] tutorial de controles mais claro;
- [ ] fluxo de primeira execução;
- [ ] tela de seleção de capítulos refinada;
- [ ] melhorar terminal no mobile;
- [ ] indicadores de missão mais claros;
- [ ] feedback acessível sem depender só de cor.

---

## Fase 3 — ampliar C# seguro

A expansão deve acontecer somente junto de conteúdo que use cada construção.

### Condicionais

- [ ] operadores de comparação;
- [ ] expressões booleanas;
- [ ] `if`;
- [ ] `else`;
- [ ] limites de nesting;
- [ ] testes de segurança.

### Coleções e repetição

Depois de condicionais estarem estáveis:

- [ ] arrays controlados;
- [ ] `for` limitado;
- [ ] `foreach` limitado;
- [ ] eventualmente `List<T>` com superfície reduzida.

### Métodos

- [ ] definição de método simples;
- [ ] parâmetros;
- [ ] retorno;
- [ ] limites de chamada/recursão;
- [ ] testes contra abuso.

### Objetos

Mais distante:

- [ ] classes didáticas controladas;
- [ ] propriedades simples;
- [ ] instanciação restrita;
- [ ] encapsulamento.

Nunca ampliar o subconjunto por meio de execução arbitrária de scripts.

---

## Fase 4 — novos capítulos

Possível sequência pedagógica:

### Capítulo 3 — Sistemas Lógicos

Objetivo:

- comparações;
- operadores booleanos;
- `if/else`.

Gameplay possível:

- sensores;
- portas condicionais;
- escolha automática de subsistemas;
- diagnóstico de risco.

### Capítulo 4 — Enxame de Drones

Objetivo:

- arrays;
- loops.

Gameplay possível:

- múltiplos drones;
- varredura de alvos;
- energia distribuída;
- programação em lote.

### Capítulo 5 — Protocolo AURA

Objetivo:

- métodos;
- parâmetros;
- retorno.

Gameplay possível:

- escrever rotinas para a IA;
- reutilizar comandos;
- resolver sistemas combinados.

### Capítulo 6 — Arquitetura da Nebulosa

Objetivo:

- classes;
- objetos;
- encapsulamento.

Gameplay possível:

- modelar módulos da nave;
- construir componentes;
- reparar arquitetura de sistemas.

Esses capítulos são visão de design, não funcionalidades implementadas.

---

## Fase 5 — persistência e plataforma

Somente quando houver necessidade real de produto:

- [ ] contas de usuário;
- [ ] cloud save versionado;
- [ ] sincronização entre dispositivos;
- [ ] backend de progresso;
- [ ] telemetria de aprendizado com privacidade;
- [ ] histórico de desafios;
- [ ] recuperação de save.

### Infraestrutura

Se houver escala horizontal:

- [ ] Redis/estado compartilhado para sessões;
- [ ] rate limit distribuído;
- [ ] observabilidade;
- [ ] métricas;
- [ ] tracing;
- [ ] estratégia de deploy do backend.

---

## Fase 6 — ferramentas de conteúdo

Quando editar capítulos em TypeScript se tornar gargalo:

- [ ] schema de capítulo versionado;
- [ ] validação de conteúdo;
- [ ] editor interno ou pipeline de conteúdo;
- [ ] preview de narrativa;
- [ ] ferramenta de teste de desafio;
- [ ] separação entre conteúdo e código da aplicação.

---

## Dívida técnica conhecida

- `createShipGame.ts` grande;
- colisões ainda baseadas em coordenadas manuais;
- sessões backend in-memory;
- conteúdo de capítulos acoplado ao frontend TypeScript;
- subconjunto C# ainda pequeno;
- E2E insuficiente;
- inventário baseado em strings;
- algumas descrições de conquista podem ficar desalinhadas com o conceito realmente praticado;
- necessidade de playtest visual sistemático.

## Regra de priorização

Antes de criar um novo capítulo, perguntar:

1. os capítulos atuais são estáveis?
2. o conceito necessário está seguro no sandbox?
3. existe teste para a nova regra?
4. o mundo reage ao código?
5. a nova funcionalidade melhora aprendizado ou apenas aumenta escopo?

AURACS deve crescer em profundidade antes de crescer apenas em quantidade de features.

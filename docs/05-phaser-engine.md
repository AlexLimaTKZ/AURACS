# 05 — Engine Phaser e mundo 2D

## Papel do Phaser

O AURACS utiliza **Phaser 4.2.1** como engine 2D do jogo no navegador.

Phaser é responsável pelo espaço jogável e por tudo que precisa existir como objeto dentro do mundo. Next.js/React continuam responsáveis por interfaces de alto nível, e o backend continua responsável por validar C#.

## Arquivos principais

```text
web/src/game/
├─ createShipGame.ts   # cena principal, objetos, interação e efeitos
├─ kaelSprite.ts       # geração/animação do personagem
└─ worldGeometry.ts    # limites e colisões da nave
```

## Configuração atual do mundo

Viewport base:

```text
960 × 540
```

Largura do mundo do Deck 01:

```text
1920 px
```

A câmera possui bounds no mundo e segue Kael com suavização.

O jogo usa configuração pixel-art/round pixels para preservar leitura visual dos sprites.

## Kael

Kael é um `Phaser.GameObjects.Sprite`.

Características atuais:

- quatro direções: cima, baixo, esquerda e direita;
- frames de caminhada;
- frame idle;
- direção selecionada pelo vetor de movimento;
- sombra;
- cone/luz de visor;
- partículas de passos;
- velocidade base de movimento definida na cena.

Os frames do personagem são gerados pelo próprio projeto, sem dependência de sprites externos para o personagem atual.

## Input

A cena aceita:

- `WASD`;
- setas;
- input virtual recebido da interface touch;
- `E` para interação.

O estado de input virtual é integrado ao mesmo fluxo de movimentação do teclado.

## Câmera

A câmera:

- possui bounds no mundo;
- segue Kael;
- utiliza zoom acima de 1 para aproximar a leitura da cena;
- pode aplicar fade/flash em eventos.

Elementos de HUD que precisam permanecer estáticos não devem depender da posição do mundo.

## Mundo do Deck 01

Áreas principais:

```text
CORE ── BULKHEAD / CONECTOR ── SETOR B
```

A geometria atual define regiões navegáveis separadas e libera o conector quando o estado de progressão permite acesso ao Setor B.

## Colisão

A colisão principal é geométrica/manual, em vez de depender de um mapa físico completo do Arcade Physics.

`worldGeometry.ts` contém:

- footprint aproximado do jogador;
- retângulos de obstáculos;
- regiões válidas da nave;
- regra de bloqueio do Setor B.

Vantagens para o estágio atual:

- comportamento simples;
- fácil de testar;
- sem necessidade de tilemap/physics bodies para cada objeto.

Limitação:

- conforme o mapa crescer, manter coordenadas manuais em arrays ficará difícil.

## Objetos interativos

### Terminais

A cena possui terminais físicos com detecção de proximidade.

Quando Kael está próximo:

- aparece prompt;
- o terminal recebe destaque visual;
- `E` chama o callback React que abre a interface de código.

### Baú

O baú de suprimentos:

- detecta proximidade;
- mostra prompt;
- aciona callback de abertura;
- integra-se ao inventário React/Zustand;
- entrega a Katana quando aplicável.

### Hostil do Capítulo 2

A cena possui representação visual do inimigo e elementos como:

- container do monstro;
- sombra;
- membros/partes visuais;
- escudo;
- prompt;
- barra de HP;
- animação/movimento;
- efeito de golpe com Katana.

O resultado pedagógico do combate não deve ser decidido pela animação do monstro. O Phaser representa o resultado decidido pelo motor/backend.

## Estado sincronizado

A cena recebe dados como:

```ts
{
  energy,
  stepId,
  terminalOpen,
  chapterId,
  inventory
}
```

Esses dados permitem derivar:

- energia auxiliar;
- área liberada;
- conteúdo visível;
- estado de terminais;
- posse da Katana;
- estado do capítulo.

## Efeitos visuais

A cena possui ou prepara estruturas para:

- estrelas com parallax;
- nebulosa;
- conduítes energizados;
- partículas de passos;
- faíscas;
- vapor;
- luzes de emergência;
- brilho de terminais;
- reator;
- escudo;
- sistemas de suporte de vida;
- slash de Katana;
- flash de câmera.

## Performance

Princípios atuais:

- texturas do Kael são geradas uma vez e reutilizadas;
- objetos auxiliares usados para gerar textura são destruídos;
- evitar recriar cursores/keys a cada frame;
- partículas usam pools/objetos reaproveitáveis quando possível;
- UI complexa continua em React em vez de ser redesenhada no canvas.

## Responsabilidade de cena

`createShipGame.ts` cresceu e hoje concentra muitas responsabilidades.

Ao expandir o projeto, a direção recomendada é separar por módulos/cenas, por exemplo:

```text
game/
├─ scenes/
│  ├─ Deck01Scene.ts
│  └─ Deck02Scene.ts
├─ entities/
│  ├─ Kael.ts
│  ├─ Enemy.ts
│  └─ Terminal.ts
├─ systems/
│  ├─ InteractionSystem.ts
│  ├─ CombatVisualSystem.ts
│  └─ EffectsSystem.ts
├─ maps/
└─ worldGeometry.ts
```

Isso é roadmap, não estado atual.

## Tilemaps

O projeto ainda não depende de tilemap completo para o Deck 01. Quando a quantidade de salas crescer, migrar a geometria para Tilemap/Tiled pode reduzir manutenção de coordenadas manuais.

A migração deve preservar:

- callbacks de interação;
- estado dirigido por `stepId`/`chapterId`;
- separação React ↔ Phaser;
- testes de geometria relevantes.

## Regra essencial

Phaser representa a consequência do aprendizado, mas não é a autoridade de aprovação do exercício.

```text
Phaser mostra → React orquestra → backend valida
```

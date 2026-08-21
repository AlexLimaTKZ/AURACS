# Documentação do AURACS

Esta pasta é a fonte principal de documentação do **AURACS — Crônicas da Nebulosa**.

O projeto é um jogo 2D educacional de ficção científica para navegador em que o jogador aprende C# usando código como uma mecânica do mundo: terminais, sistemas da nave, decisões e combate respondem ao código validado pelo backend.

## Índice

1. [Visão geral](./01-visao-geral.md)
2. [Arquitetura](./02-arquitetura.md)
3. [Game Design Document](./03-game-design-document.md)
4. [Gameplay loop e regras](./04-gameplay-loop.md)
5. [Engine Phaser e mundo 2D](./05-phaser-engine.md)
6. [Sistema de C# e sandbox](./06-sistema-csharp.md)
7. [Capítulos, progressão e conteúdo](./07-capitulos-progresso.md)
8. [Backend e segurança](./08-backend-seguranca.md)
9. [Persistência e estado](./09-persistencia-estado.md)
10. [Testes e qualidade](./10-testes-qualidade.md)
11. [Como contribuir](./11-como-contribuir.md)
12. [Roadmap](./ROADMAP.md)

## Fonte de verdade

A documentação deve acompanhar o comportamento implementado no código. Em caso de divergência, considere como fonte de verdade, nesta ordem:

1. testes automatizados;
2. implementação do backend e validadores;
3. `web/src/hooks/useGameEngine.ts`;
4. `web/src/lib/chapters.ts`;
5. cena Phaser em `web/src/game/`;
6. esta documentação.

Isso evita que ideias futuras sejam confundidas com funcionalidades já disponíveis.

## Estado atual

O jogo possui atualmente:

- experiência 2D em Phaser 4;
- personagem Kael com sprite pixel-art e animação em quatro direções;
- Deck 01 da nave Nebulosa com Core, corredor e Setor B;
- câmera seguindo o jogador;
- terminais diegéticos que abrem a interface React de código;
- inventário com Katana de Plasma Vermelha;
- Capítulo 1: **O Despertar**;
- Capítulo 2: **Setor de Quarentena**;
- sistema de combate pedagógico com três vidas;
- AURA como guia narrativo;
- conquistas;
- progresso local persistido no navegador;
- API ASP.NET Core responsável por analisar e validar o código C#;
- avaliador seguro baseado na árvore sintática do Roslyn;
- CI para backend e frontend.

## Convenção para mudanças

Toda alteração relevante de arquitetura, mecânica, regra pedagógica ou segurança deve atualizar o documento correspondente no mesmo pull request.

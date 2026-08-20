export interface ChapterSuccessContext {
  updateEnergy: (amount: number) => void;
}

export interface ChapterStep {
  id: string;
  narrative: string[];
  auraMessage?: string;
  requiredCode?: string;
  onSuccess?: (state: ChapterSuccessContext) => void;
  nextStepId?: string;
  choices?: { label: string; nextStepId: string }[];
  achievementId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  steps: Record<string, ChapterStep>;
  initialStepId: string;
}

export const CHAPTER_1: Chapter = {
  id: "chapter-1",
  title: "O Despertar",
  initialStepId: "step-1",
  steps: {
    "step-1": {
      id: "step-1",
      narrative: [
        "Você acorda abruptamente com o som estridente de um alarme.",
        "As luzes de emergência vermelhas pulsam na escuridão da cabine da 'Nebulosa'.",
        "Sua cabeça dói. O último som de que se lembra é o de metal se contorcendo durante um salto hiperespacial turbulento."
      ],
      auraMessage: "Kael, que bom que você acordou. Tivemos... um problema. A energia primária está em nível crítico.",
      nextStepId: "step-1-b"
    },
    "step-1-b": {
      id: "step-1-b",
      narrative: [],
      auraMessage: "Meus sistemas de controle direto foram danificados. Para interagir comigo e com a nave, você precisará usar o terminal de comando com a sintaxe C#.",
      nextStepId: "step-2"
    },
    "step-2": {
      id: "step-2",
      narrative: [
        "Sua Tarefa: Declare a variável. Digite o código C# abaixo e pressione Enter:",
        "int nivelDeEnergia = 25;"
      ],
      auraMessage: "Vamos começar. Primeiro, precisamos saber o nível exato de energia. Declare uma variável inteira chamada 'nivelDeEnergia' e atribua a ela o valor que estou lendo dos sensores: 25.",
      requiredCode: "int nivelDeEnergia = 25;",
      achievementId: "variable_master",
      onSuccess: (state) => state.updateEnergy(-75),
      nextStepId: "step-3"
    },
    "step-3": {
      id: "step-3",
      narrative: [
        "Sua Tarefa: Use Console.WriteLine para mostrar o valor.",
        "Console.WriteLine(\"Nível de energia: \" + nivelDeEnergia + \"%\");"
      ],
      auraMessage: "Correto. A variável foi criada. Agora, vamos exibir o valor para confirmar.",
      requiredCode: "Console.WriteLine",
      achievementId: "console_writer",
      nextStepId: "step-4"
    },
    "step-4": {
      id: "step-4",
      narrative: [
        "25% é muito perigoso. Precisamos tomar uma decisão.",
        "Podemos desviar a energia auxiliar para os Escudos (1) ou para o Suporte de Vida (2)."
      ],
      auraMessage: "Esta é uma decisão crítica. Cada escolha tem consequências. Digite 1 para reforçar os Escudos ou 2 para priorizar o Suporte de Vida.",
      choices: [
        { label: "1 — Escudos", nextStepId: "step-4-shields" },
        { label: "2 — Suporte de Vida", nextStepId: "step-4-life" }
      ],
      requiredCode: "int escolha"
    },
    "step-4-shields": {
      id: "step-4-shields",
      narrative: [
        "Os escudos externos começam a se recarregar. Um campo de energia azulada envolve a nave.",
        "A integridade estrutural se estabiliza, mas o oxigênio começa a diminuir lentamente..."
      ],
      auraMessage: "Boa escolha, Kael. Os escudos vão nos proteger de detritos. Mas precisamos encontrar uma fonte de oxigênio em breve. Vamos continuar.",
      achievementId: "decision_maker",
      onSuccess: (state) => state.updateEnergy(10),
      nextStepId: "step-5"
    },
    "step-4-life": {
      id: "step-4-life",
      narrative: [
        "O sistema de suporte de vida ganha energia. O ar fica mais fresco, a temperatura se normaliza.",
        "Mas sem escudos, a nave está vulnerável a impactos..."
      ],
      auraMessage: "Sábia decisão para a sobrevivência imediata. O ar está estabilizado. Mas estamos sem proteção externa. Vamos continuar com cautela.",
      achievementId: "decision_maker",
      onSuccess: (state) => state.updateEnergy(5),
      nextStepId: "step-5"
    },
    "step-5": {
      id: "step-5",
      narrative: [
        "Um alerta soa no painel de controle.",
        "Sensores detectam um campo de asteroides se aproximando.",
        "Sua Tarefa: Calcule a distância segura usando uma expressão matemática:",
        "int distancia = 150 * 2 - 50; Console.WriteLine(\"Distância segura: \" + distancia + \" km\");"
      ],
      auraMessage: "Precisamos calcular se estamos a uma distância segura. Use uma expressão matemática para determinar o valor: 150 vezes 2, menos 50.",
      requiredCode: "int distancia",
      nextStepId: "step-find-katana"
    },
    "step-find-katana": {
      id: "step-find-katana",
      narrative: [
        "Sistemas de propulsão estabilizados e curso corrigido!",
        "ALERTA: Acesso ao Deck 02 requer autorização de combate.",
        "MISSÃO: Vá até o Setor B (à direita) e abra o Baú de Suprimentos [ E ] para equipar a Katana de Plasma!"
      ],
      auraMessage: "Excelente trabalho com os motores, Kael! Para sobrevivermos ao Deck 02, você precisará de uma arma. Vá até o Setor B à direita e abra o Baú de Suprimentos para pegar a Katana de Plasma!",
      nextStepId: "step-end"
    },
    "step-end": {
      id: "step-end",
      narrative: [
        "A Katana de Plasma Vermelha foi sincronizada aos seus circuitos neurais.",
        "O Deck 01 está completamente estabilizado.",
        "O acesso ao Deck 02 (Setor de Quarentena) está liberado para combate!"
      ],
      auraMessage: "Katana de Plasma Vermelha equipada com sucesso! Todos os preparativos para o Deck 02 foram concluídos. Vamos à luta!",
      achievementId: "chapter_1_complete"
    }
  }
};

export const CHAPTER_2: Chapter = {
  id: "chapter-2",
  title: "Setor de Quarentena",
  initialStepId: "ch2-step-1",
  steps: {
    "ch2-step-1": {
      id: "ch2-step-1",
      narrative: [
        "A porta blindada do Deck 02 se tranca e as luzes de emergência piscam em vermelho!",
        "Um hostil cibernético foi detectado patrulhando o setor.",
        "Você está desarmado! Vá até o Baú de Suprimentos à sua frente e aperte [ E ] para equipar a Katana de Plasma!"
      ],
      auraMessage: "Kael, um hostil cibernético corrompido está à frente! Você precisa de uma arma. Abra o Baú de Suprimentos à sua frente apertando [ E ] para equipar a Katana de Plasma!",
      nextStepId: "ch2-monster-1",
    },
    "ch2-monster-1": {
      id: "ch2-monster-1",
      narrative: [
        "⚔️ DUELO CONTRA O HOSTIL: Aproxime-se do hostil e aperte [ E ] para travar a mira e abrir o terminal!",
        "Digite exatamente o código C# que flutua na cabeça dele: katana.Cortar();",
        "CUIDADO: Se errar, o hostil te ataca e você perde vida!"
      ],
      auraMessage: "Katana equipada! Aproxime-se do hostil e aperte [ E ] para focar o terminal. Digite 'katana.Cortar();' exatamente como exibido na cabeça dele para desferir o corte!",
      requiredCode: "katana.Cortar();",
      achievementId: "first_blood_katana",
      nextStepId: "ch2-monster-2",
    },
    "ch2-monster-2": {
      id: "ch2-monster-2",
      narrative: [
        "⚔️ FASE 2: O hostil enfurece-se e o código muda!",
        "Aproxime-se do hostil e aperte [ E ].",
        "Digite o código exibido: alvo.Vida -= 50; para reduzir os pontos vitais do monstro."
      ],
      auraMessage: "O hostil tomou dano e o código mudou! Aperte [ E ] no monstro e digite 'alvo.Vida -= 50;' para reduzir a vida dele!",
      requiredCode: "alvo.Vida -= 50;",
      achievementId: "operator_master",
      nextStepId: "ch2-monster-3",
    },
    "ch2-monster-3": {
      id: "ch2-monster-3",
      narrative: [
        "⚔️ FASE FINAL: O hostil ativa um escudo de plasma!",
        "Passo 1: Desative o escudo digitando: bool escudo = false;",
        "Passo 2: Desfira o golpe fatal final: katana.GolpeFatal();"
      ],
      auraMessage: "Ele ativou um escudo de plasma! Aperte [ E ] no monstro, desative o escudo com 'bool escudo = false;' e depois finalize com 'katana.GolpeFatal();'!",
      requiredCode: "katana.GolpeFatal();",
      achievementId: "chapter_2_complete",
      nextStepId: "ch2-end",
    },
    "ch2-end": {
      id: "ch2-end",
      narrative: [
        "Com um corte estelar fulminante, o Hostil é pulverizado em partículas de plasma.",
        "As sirenes do Deck 02 cessam. O Setor de Quarentena foi purificado com sucesso!"
      ],
      auraMessage: "Vitória absoluta, Kael! Você empunhou a Katana de Plasma e derrotou o hostil com maestria em C#!",
      achievementId: "chapter_2_complete",
    }
  }
};

export const ALL_CHAPTERS: Record<string, Chapter> = {
  "chapter-1": CHAPTER_1,
  "chapter-2": CHAPTER_2,
};

interface ErrorHint {
  pattern: string;
  suggestion: string;
}

const ERROR_HINTS: ErrorHint[] = [
  {
    pattern: "ponto-e-vírgula",
    suggestion: "Você esqueceu o ponto-e-vírgula (;) no final da linha. Em C#, toda instrução termina com ;"
  },
  {
    pattern: "; esperado",
    suggestion: "Faltou um ponto-e-vírgula (;). Adicione ; no final do comando."
  },
  {
    pattern: "não existe no contexto atual",
    suggestion: "Essa variável não foi declarada ainda. Certifique-se de declarar a variável antes de usá-la, por exemplo: int nomeDaVariavel = valor;"
  },
  {
    pattern: "não pode converter implicitamente",
    suggestion: "Os tipos não são compatíveis. Verifique se você está usando o tipo correto (int, string, bool, etc.)."
  },
  {
    pattern: "Número excessivo de caracteres no literal de caractere",
    suggestion: "Você usou aspas simples (') em vez de aspas duplas (\"). Em C#, textos usam aspas duplas: \"texto\""
  },
  {
    pattern: "Erro de sintaxe",
    suggestion: "Há um erro na estrutura do código. Verifique se os parênteses (), chaves {} e aspas estão corretos."
  },
  {
    pattern: "\"(\" esperado",
    suggestion: "Parece que faltou um parêntese de abertura (. Verifique a sintaxe do comando."
  },
  {
    pattern: "\")\" esperado",
    suggestion: "Faltou um parêntese de fechamento ). Verifique se todos os parênteses estão balanceados."
  },
  {
    pattern: "Termo de expressão inválido",
    suggestion: "Algo no código não é uma expressão válida em C#. Verifique se você digitou o comando corretamente."
  },
  {
    pattern: "Acesso bloqueado",
    suggestion: "Você tentou acessar algo restrito no sistema. Concentre-se nos comandos da missão atual."
  },
  {
    pattern: "Tempo de execução excedido",
    suggestion: "Seu código demorou muito para executar. Verifique se há um loop infinito (while sem condição de saída)."
  }
];

export function getAuraErrorHint(errorMessage: string): string | null {
  for (const hint of ERROR_HINTS) {
    if (errorMessage.toLowerCase().includes(hint.pattern.toLowerCase())) {
      return hint.suggestion;
    }
  }
  return null;
}

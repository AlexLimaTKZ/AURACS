
export interface ChapterStep {
  id: string;
  narrative: string[];
  auraMessage?: string;
  requiredCode?: string;
  onSuccess?: (state: any) => void;
  nextStepId?: string;
  // Branching: multiple choices
  choices?: { label: string; nextStepId: string }[];
  // Achievement to unlock on completion
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
        "Podemos desviar a energia auxiliar para os Escudos (1) ou para o Suporte de Vida (2).",
      ],
      auraMessage: "Esta é uma decisão crítica. Cada escolha tem consequências. Digite 1 para reforçar os Escudos ou 2 para priorizar o Suporte de Vida.",
      // Branching! Player types 1 or 2
      choices: [
        { label: "1 — Escudos", nextStepId: "step-4-shields" },
        { label: "2 — Suporte de Vida", nextStepId: "step-4-life" },
      ],
      requiredCode: "int escolha",
    },
    // --- BRANCH A: Escudos ---
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
    // --- BRANCH B: Suporte de Vida ---
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
    // --- Convergência ---
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
      nextStepId: "step-end"
    },
    "step-end": {
      id: "step-end",
      narrative: [
        "A nave ajusta seu curso. Os motores secundários engajam.",
        "Por enquanto, vocês estão seguros..."
      ],
      auraMessage: "Excelente trabalho, Kael. Você salvou a nave por hoje. Mas a jornada está apenas começando. Descanse... e prepare-se para o próximo capítulo.",
      achievementId: "chapter_1_complete",
    }
  }
};

// --- AURA Error Suggestions ---
// Maps common C# errors to friendly suggestions
interface ErrorHint {
  pattern: string;
  suggestion: string;
}

const ERROR_HINTS: ErrorHint[] = [
  {
    pattern: "ponto-e-vírgula",
    suggestion: "Você esqueceu o ponto-e-vírgula (;) no final da linha. Em C#, toda instrução termina com ;",
  },
  {
    pattern: "; esperado",
    suggestion: "Faltou um ponto-e-vírgula (;). Adicione ; no final do comando.",
  },
  {
    pattern: "não existe no contexto atual",
    suggestion: "Essa variável não foi declarada ainda. Certifique-se de declarar a variável antes de usá-la, por exemplo: int nomeDaVariavel = valor;",
  },
  {
    pattern: "não pode converter implicitamente",
    suggestion: "Os tipos não são compatíveis. Verifique se você está usando o tipo correto (int, string, bool, etc.).",
  },
  {
    pattern: "Número excessivo de caracteres no literal de caractere",
    suggestion: "Você usou aspas simples (') em vez de aspas duplas (\"). Em C#, textos usam aspas duplas: \"texto\"",
  },
  {
    pattern: "Erro de sintaxe",
    suggestion: "Há um erro na estrutura do código. Verifique se os parênteses (), chaves {} e aspas estão corretos.",
  },
  {
    pattern: "\"(\" esperado",
    suggestion: "Parece que faltou um parêntese de abertura (. Verifique a sintaxe do comando.",
  },
  {
    pattern: "\")\" esperado",
    suggestion: "Faltou um parêntese de fechamento ). Verifique se todos os parênteses estão balanceados.",
  },
  {
    pattern: "Termo de expressão inválido",
    suggestion: "Algo no código não é uma expressão válida em C#. Verifique se você digitou o comando corretamente.",
  },
  {
    pattern: "Acesso bloqueado",
    suggestion: "Você tentou acessar algo restrito no sistema. Concentre-se nos comandos da missão atual.",
  },
  {
    pattern: "Tempo de execução excedido",
    suggestion: "Seu código demorou muito para executar. Verifique se há um loop infinito (while sem condição de saída).",
  },
];

export function getAuraErrorHint(errorMessage: string): string | null {
  for (const hint of ERROR_HINTS) {
    if (errorMessage.toLowerCase().includes(hint.pattern.toLowerCase())) {
      return hint.suggestion;
    }
  }
  return null;
}

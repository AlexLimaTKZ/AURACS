export interface EvaluationSession {
  variables: Map<string, number | string>;
  lastAccess: number;
}

export interface EvaluationResult {
  success: boolean;
  logs: string[];
  returnValue?: string | null;
}

export interface ChallengeResult {
  passed: boolean;
  feedback?: string | null;
  choiceValue?: number | null;
}

const sessions = new Map<string, EvaluationSession>();

export function getOrCreateSession(sessionId: string, challengeId?: string): EvaluationSession {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      variables: new Map<string, number | string>(),
      lastAccess: Date.now(),
    };
    sessions.set(sessionId, session);
  }
  session.lastAccess = Date.now();

  // Restaurar variáveis de passos anteriores quando o jogo for retomado
  if (challengeId && ["step-3", "step-4", "step-4-shields", "step-4-life", "step-5"].includes(challengeId)) {
    if (!session.variables.has("nivelDeEnergia")) {
      session.variables.set("nivelDeEnergia", 25);
    }
  }

  return session;
}

export function resetSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

// Subconjunto seguro do avaliador C# para o Capítulo 1
export function evaluateCSharpCode(code: string, session: EvaluationSession): EvaluationResult {
  const trimmed = code.trim();
  if (!trimmed) {
    return { success: false, logs: ["[ERRO]: Digite um comando C# antes de executar."] };
  }

  // Dividir instruções por ponto e vírgula, preservando strings
  const statements = splitStatements(trimmed);
  if (statements.length === 0) {
    return { success: false, logs: ["[ERRO]: Nenhuma instrução C# válida encontrada."] };
  }

  if (statements.length > 8) {
    return { success: false, logs: ["[ERRO DE SEGURANÇA]: Limite de 8 instruções por execução."] };
  }

  const logs: string[] = [];
  let returnValue: string | null = null;

  for (const rawStatement of statements) {
    const stmt = rawStatement.trim();
    if (!stmt) continue;

    try {
      // 1. Console.WriteLine(...)
      const consoleMatch = stmt.match(/^Console\s*\.\s*WriteLine\s*\(([\s\S]*)\)$/);
      if (consoleMatch) {
        const argExpr = consoleMatch[1].trim();
        const value = evaluateExpression(argExpr, session);
        const output = String(value);
        logs.push(output);
        returnValue = output;
        continue;
      }

      // 2. int varName = expr
      const declMatch = stmt.match(/^int\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([\s\S]+)$/);
      if (declMatch) {
        const varName = declMatch[1];
        const expr = declMatch[2];
        const val = evaluateExpression(expr, session);
        if (typeof val !== "number" || !Number.isInteger(val)) {
          return { success: false, logs: [`[ERRO]: A variável '${varName}' precisa receber um valor inteiro.`] };
        }
        session.variables.set(varName, val);
        returnValue = String(val);
        continue;
      }

      // 3. bool varName = true / false
      const boolMatch = stmt.match(/^bool\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(true|false)$/i);
      if (boolMatch) {
        const varName = boolMatch[1];
        const val = boolMatch[2].toLowerCase() === "true";
        session.variables.set(varName, val ? 1 : 0);
        logs.push(`[SISTEMA]: Variável booleana '${varName}' definida como ${val}.`);
        returnValue = String(val);
        continue;
      }

      // 4. Chamada de método de combate da Katana (ex: katana.Cortar(); katana.GolpeFatal();)
      const katanaMatch = stmt.match(/^katana\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*\)$/i);
      if (katanaMatch) {
        const method = katanaMatch[1];
        logs.push(`[KATANA]: Executando ${method}() — Corte de plasma ciano desferido!`);
        session.variables.set("katana_action", method);
        returnValue = `katana.${method}()`;
        continue;
      }

      // 5. Atribuição composta de combate (ex: alvo.Vida -= 50; vidaInimigo -= 50;)
      const compoundMatch = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_.]*)\s*-=\s*(\d+)$/);
      if (compoundMatch) {
        const target = compoundMatch[1];
        const damage = parseInt(compoundMatch[2], 10);
        logs.push(`[COMBATE]: ${target} reduzido em ${damage} pontos vitais.`);
        session.variables.set("damage_dealt", damage);
        session.variables.set("combat_target", target);
        returnValue = `${target} -= ${damage}`;
        continue;
      }

      // 6. varName = expr (atribuição simples)
      const assignMatch = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([\s\S]+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const expr = assignMatch[2];
        if (!session.variables.has(varName)) {
          return { success: false, logs: [`[ERRO]: A variável '${varName}' não existe no contexto atual.`] };
        }
        const val = evaluateExpression(expr, session);
        if (typeof val !== "number" || !Number.isInteger(val)) {
          return { success: false, logs: ["A atribuição precisa resultar em um valor inteiro."] };
        }
        session.variables.set(varName, val);
        returnValue = String(val);
        continue;
      }

      return {
        success: false,
        logs: [`[ERRO]: A instrução '${stmt}' não é permitida ou contém erro de sintaxe.`],
      };
    } catch (error) {
      return {
        success: false,
        logs: [`[ERRO]: ${error instanceof Error ? error.message : "Erro na avaliação."}`],
      };
    }
  }

  return {
    success: true,
    logs,
    returnValue,
  };
}

function splitStatements(code: string): string[] {
  const result: string[] = [];
  let current = "";
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < code.length; i += 1) {
    const char = code[i];

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      quoteChar = char;
      current += char;
    } else if (inString && char === quoteChar && code[i - 1] !== "\\") {
      inString = false;
      current += char;
    } else if (!inString && char === ";") {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current);
  }

  return result;
}

function isPureStringLiteral(str: string): boolean {
  if (!str.startsWith('"') || !str.endsWith('"') || str.length < 2) return false;
  for (let i = 1; i < str.length - 1; i += 1) {
    if (str[i] === '"' && str[i - 1] !== "\\") {
      return false;
    }
  }
  return true;
}

function evaluateExpression(expr: string, session: EvaluationSession): number | string {
  const trimmed = expr.trim();
  if (!trimmed) {
    throw new Error("Expressão vazia.");
  }

  return evaluateArithmeticOrString(trimmed, session);
}

function evaluateArithmeticOrString(rawExpr: string, session: EvaluationSession): number | string {
  // Concatenação de string com operador + (ex: "Nível de energia: " + nivelDeEnergia + "%")
  const parts = splitByPlusOutsideQuotes(rawExpr);
  if (parts.length > 1) {
    let hasString = false;
    const evaluatedParts: (string | number)[] = [];

    for (const part of parts) {
      const val = evaluateSubExpression(part.trim(), session);
      if (typeof val === "string") hasString = true;
      evaluatedParts.push(val);
    }

    if (hasString) {
      return evaluatedParts.join("");
    }

    // Se todos forem números, somar
    return evaluatedParts.reduce((acc, curr) => (acc as number) + (curr as number), 0);
  }

  return evaluateSubExpression(rawExpr, session);
}

function splitByPlusOutsideQuotes(expr: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  let parenDepth = 0;

  for (let i = 0; i < expr.length; i += 1) {
    const char = expr[i];

    if (char === '"' && expr[i - 1] !== "\\") {
      inQuotes = !inQuotes;
      current += char;
    } else if (!inQuotes && char === "(") {
      parenDepth += 1;
      current += char;
    } else if (!inQuotes && char === ")") {
      parenDepth -= 1;
      current += char;
    } else if (!inQuotes && parenDepth === 0 && char === "+") {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (current) parts.push(current);
  return parts.length > 1 ? parts : [expr];
}

function evaluateSubExpression(expr: string, session: EvaluationSession): number | string {
  const trimmed = expr.trim();

  // String literal
  if (isPureStringLiteral(trimmed)) {
    return trimmed.slice(1, -1);
  }

  // Inteiro literal
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // Identificador de variável
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    if (!session.variables.has(trimmed)) {
      throw new Error(`O nome '${trimmed}' não existe no contexto atual.`);
    }
    return session.variables.get(trimmed)!;
  }

  // Expressão matemática com operadores +, -, *, /, % e parênteses
  // Sanitizar substituindo identificadores por seus valores inteiros
  const sanitized = trimmed.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
    if (!session.variables.has(match)) {
      throw new Error(`O nome '${match}' não existe no contexto atual.`);
    }
    const val = session.variables.get(match);
    if (typeof val !== "number") {
      throw new Error(`A variável '${match}' não contém um número inteiro.`);
    }
    return String(val);
  });

  // Validar se apenas caracteres matemáticos seguros permanecem
  if (!/^[\d\s+\-*/%()]+$/.test(sanitized)) {
    throw new Error("Expressão contém caracteres inválidos.");
  }

  try {
    // Avaliação segura da expressão aritmética com números inteiros
    const fn = new Function(`return Math.floor(${sanitized});`);
    const res = fn();
    if (typeof res !== "number" || !Number.isFinite(res)) {
      throw new Error("Cálculo aritmético inválido.");
    }
    return res;
  } catch {
    throw new Error("Erro ao avaliar cálculo aritmético.");
  }
}

export function validateChallenge(
  challengeId: string | undefined,
  session: EvaluationSession,
  evaluation: EvaluationResult
): ChallengeResult {
  if (!challengeId) {
    return { passed: false, feedback: "Nenhum desafio ativo informado." };
  }

  switch (challengeId) {
    case "step-2": {
      const value = session.variables.get("nivelDeEnergia");
      const passed = typeof value === "number" && value === 25;
      return passed
        ? { passed: true, feedback: "Variável inteira criada corretamente com o valor 25." }
        : { passed: false, feedback: "Declare uma variável int chamada nivelDeEnergia com o valor 25." };
    }

    case "step-3": {
      const value = session.variables.get("nivelDeEnergia");
      if (typeof value !== "number" || value !== 25) {
        return { passed: false, feedback: "A variável nivelDeEnergia precisa continuar valendo 25." };
      }
      const expected = "Nível de energia: 25%";
      const passed = evaluation.logs.some((log) => log === expected);
      return passed
        ? { passed: true, feedback: "Saída exibida corretamente no console." }
        : { passed: false, feedback: `Exiba exatamente: ${expected}` };
    }

    case "step-4": {
      const choice = session.variables.get("escolha");
      if (typeof choice !== "number" || (choice !== 1 && choice !== 2)) {
        return { passed: false, feedback: "Use int escolha = 1; ou int escolha = 2;" };
      }
      return { passed: true, feedback: `Escolha ${choice} registrada.`, choiceValue: choice };
    }

    case "step-5": {
      const distance = session.variables.get("distancia");
      if (typeof distance !== "number" || distance !== 250) {
        return {
          passed: false,
          feedback: "Calcule distancia como 150 * 2 - 50. O resultado deve ser 250.",
        };
      }
      const printed = evaluation.logs.some((log) => log.includes("250"));
      return printed
        ? { passed: true, feedback: "Cálculo e saída corretos: distância segura de 250 km." }
        : {
            passed: false,
            feedback: "O cálculo está correto; agora exiba a distância com Console.WriteLine.",
          };
    }

    // --- CAPÍTULO 2: COMBATE COM KATANA ---
    case "ch2-monster-1": {
      const action = session.variables.get("katana_action");
      const passed = typeof action === "string" && ["cortar", "executargolpe", "golpe"].includes(action.toLowerCase());
      return passed
        ? { passed: true, feedback: "⚡ CORTE PERFEITO! O Drone Sentinela foi partido ao meio pela Katana de Plasma!" }
        : { passed: false, feedback: "Execute o método de combate: katana.Cortar();" };
    }

    case "ch2-monster-2": {
      const damage = session.variables.get("damage_dealt");
      const passed = typeof damage === "number" && damage >= 50;
      return passed
        ? { passed: true, feedback: "⚡ GOLPE DEVASTADOR! O Parasita teve seus pontos vitais zerados!" }
        : { passed: false, feedback: "Reduza os pontos vitais do parasita com: alvo.Vida -= 50;" };
    }

    case "ch2-monster-3": {
      const shieldDisabled = session.variables.get("escudo") === 0;
      const action = session.variables.get("katana_action");
      const fatalHit = typeof action === "string" && action.toLowerCase().includes("fatal");

      if (!shieldDisabled) {
        return {
          passed: false,
          feedback: "A Besta está protegida por escudo! Primeiro desative o escudo com: bool escudo = false;",
        };
      }

      if (!fatalHit) {
        return {
          passed: false,
          feedback: "Escudo desativado! Agora desfira o golpe final: katana.GolpeFatal();",
        };
      }

      return {
        passed: true,
        feedback: "👑 VITÓRIA! A Besta Blindada Alfa foi desintegrada com o Golpe Fatal de Plasma!",
      };
    }

    default:
      return { passed: false, feedback: "Este passo não exige validação de código." };
  }
}

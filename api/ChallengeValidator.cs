public static class ChallengeValidator
{
    public static ChallengeResult Validate(
        string? challengeId,
        CodeSession session,
        EvaluationResult evaluation)
    {
        if (string.IsNullOrWhiteSpace(challengeId))
        {
            return ChallengeResult.Failed("Código executado. Nenhum desafio ativo foi informado.");
        }

        return challengeId switch
        {
            "step-2" => ValidateEnergyDeclaration(session),
            "step-3" => ValidateEnergyOutput(session, evaluation),
            "step-4" => ValidateChoice(session),
            "step-5" => ValidateDistance(session, evaluation),
            "ch2-monster-1" => ValidateKatanaCut(session),
            "ch2-monster-2" => ValidateCombatDamage(session),
            "ch2-monster-3" => ValidateFinalCombat(session),
            _ => ChallengeResult.Failed("Este passo não exige validação de código.")
        };
    }

    private static ChallengeResult ValidateEnergyDeclaration(CodeSession session)
    {
        var passed = TryGetInt(session, "nivelDeEnergia", out var value) && value == 25;
        return passed
            ? ChallengeResult.PassedResult("Variável inteira criada corretamente com o valor 25.")
            : ChallengeResult.Failed("Declare uma variável int chamada nivelDeEnergia com o valor 25.");
    }

    private static ChallengeResult ValidateEnergyOutput(
        CodeSession session,
        EvaluationResult evaluation)
    {
        if (!TryGetInt(session, "nivelDeEnergia", out var value) || value != 25)
        {
            return ChallengeResult.Failed("A variável nivelDeEnergia precisa continuar valendo 25.");
        }

        var expected = "Nível de energia: 25%";
        var passed = evaluation.Logs.Any(log => string.Equals(log, expected, StringComparison.Ordinal));
        return passed
            ? ChallengeResult.PassedResult("Saída exibida corretamente no console.")
            : ChallengeResult.Failed($"Exiba exatamente: {expected}");
    }

    private static ChallengeResult ValidateChoice(CodeSession session)
    {
        if (!TryGetInt(session, "escolha", out var choice) || choice is < 1 or > 2)
        {
            return ChallengeResult.Failed("Use int escolha = 1; ou int escolha = 2;");
        }

        return ChallengeResult.PassedResult($"Escolha {choice} registrada.", choice);
    }

    private static ChallengeResult ValidateDistance(
        CodeSession session,
        EvaluationResult evaluation)
    {
        if (!TryGetInt(session, "distancia", out var distance) || distance != 250)
        {
            return ChallengeResult.Failed("Calcule distancia como 150 * 2 - 50. O resultado deve ser 250.");
        }

        var printed = evaluation.Logs.Any(log => log.Contains("250", StringComparison.Ordinal));
        return printed
            ? ChallengeResult.PassedResult("Cálculo e saída corretos: distância segura de 250 km.")
            : ChallengeResult.Progress("O cálculo está correto; agora exiba a distância com Console.WriteLine.");
    }

    private static ChallengeResult ValidateKatanaCut(CodeSession session)
    {
        var passed = TryGetString(session, "katana_action", out var action) &&
                     string.Equals(action, "Cortar", StringComparison.Ordinal);

        return passed
            ? ChallengeResult.PassedResult("⚡ CORTE PERFEITO! O Drone Sentinela foi partido ao meio pela Katana de Plasma!")
            : ChallengeResult.Failed("Execute o método de combate: katana.Cortar();");
    }

    private static ChallengeResult ValidateCombatDamage(CodeSession session)
    {
        var passed = TryGetInt(session, "damage_dealt", out var damage) &&
                     damage >= 50 &&
                     TryGetString(session, "combat_target", out var target) &&
                     string.Equals(target, "alvo.Vida", StringComparison.Ordinal);

        return passed
            ? ChallengeResult.PassedResult("⚡ GOLPE DEVASTADOR! O Parasita teve seus pontos vitais zerados!")
            : ChallengeResult.Failed("Reduza os pontos vitais do parasita com: alvo.Vida -= 50;");
    }

    private static ChallengeResult ValidateFinalCombat(CodeSession session)
    {
        var shieldDisabled = TryGetBool(session, "escudo", out var shield) && !shield;
        if (!shieldDisabled)
        {
            return ChallengeResult.Failed(
                "A Besta está protegida por escudo! Primeiro desative o escudo com: bool escudo = false;");
        }

        var fatalHit = TryGetString(session, "katana_action", out var action) &&
                       string.Equals(action, "GolpeFatal", StringComparison.Ordinal);

        if (!fatalHit)
        {
            return ChallengeResult.Progress(
                "Escudo desativado! Agora desfira o golpe final: katana.GolpeFatal();");
        }

        return ChallengeResult.PassedResult(
            "👑 VITÓRIA! A Besta Blindada Alfa foi desintegrada com o Golpe Fatal de Plasma!");
    }

    private static bool TryGetInt(CodeSession session, string name, out int value)
    {
        if (session.Variables.TryGetValue(name, out var safeValue) &&
            safeValue.Kind == SafeValueKind.Int)
        {
            value = safeValue.IntValue;
            return true;
        }

        value = default;
        return false;
    }

    private static bool TryGetString(CodeSession session, string name, out string value)
    {
        if (session.Variables.TryGetValue(name, out var safeValue) &&
            safeValue.Kind == SafeValueKind.String &&
            safeValue.StringValue is not null)
        {
            value = safeValue.StringValue;
            return true;
        }

        value = string.Empty;
        return false;
    }

    private static bool TryGetBool(CodeSession session, string name, out bool value)
    {
        if (session.Variables.TryGetValue(name, out var safeValue) &&
            safeValue.Kind == SafeValueKind.Bool)
        {
            value = safeValue.BoolValue;
            return true;
        }

        value = default;
        return false;
    }
}

public enum ChallengeState
{
    Failed,
    Progress,
    Passed
}

public sealed record ChallengeResult(
    ChallengeState State,
    string Feedback,
    int? ChoiceValue)
{
    public bool Passed => State == ChallengeState.Passed;

    public static ChallengeResult Failed(string feedback) =>
        new(ChallengeState.Failed, feedback, null);

    public static ChallengeResult Progress(string feedback) =>
        new(ChallengeState.Progress, feedback, null);

    public static ChallengeResult PassedResult(string feedback, int? choiceValue = null) =>
        new(ChallengeState.Passed, feedback, choiceValue);
}

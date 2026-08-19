public static class ChallengeValidator
{
    public static ChallengeResult Validate(
        string? challengeId,
        CodeSession session,
        EvaluationResult evaluation)
    {
        if (string.IsNullOrWhiteSpace(challengeId))
        {
            return new ChallengeResult(false, "Código executado. Nenhum desafio ativo foi informado.", null);
        }

        return challengeId switch
        {
            "step-2" => ValidateEnergyDeclaration(session),
            "step-3" => ValidateEnergyOutput(session, evaluation),
            "step-4" => ValidateChoice(session),
            "step-5" => ValidateDistance(session, evaluation),
            _ => new ChallengeResult(false, "Este passo não exige validação de código.", null)
        };
    }

    private static ChallengeResult ValidateEnergyDeclaration(CodeSession session)
    {
        var passed = TryGetInt(session, "nivelDeEnergia", out var value) && value == 25;
        return passed
            ? new ChallengeResult(true, "Variável inteira criada corretamente com o valor 25.", null)
            : new ChallengeResult(false, "Declare uma variável int chamada nivelDeEnergia com o valor 25.", null);
    }

    private static ChallengeResult ValidateEnergyOutput(
        CodeSession session,
        EvaluationResult evaluation)
    {
        if (!TryGetInt(session, "nivelDeEnergia", out var value) || value != 25)
        {
            return new ChallengeResult(false, "A variável nivelDeEnergia precisa continuar valendo 25.", null);
        }

        var expected = "Nível de energia: 25%";
        var passed = evaluation.Logs.Any(log => string.Equals(log, expected, StringComparison.Ordinal));
        return passed
            ? new ChallengeResult(true, "Saída exibida corretamente no console.", null)
            : new ChallengeResult(false, $"Exiba exatamente: {expected}", null);
    }

    private static ChallengeResult ValidateChoice(CodeSession session)
    {
        if (!TryGetInt(session, "escolha", out var choice) || choice is < 1 or > 2)
        {
            return new ChallengeResult(false, "Use int escolha = 1; ou int escolha = 2;", null);
        }

        return new ChallengeResult(true, $"Escolha {choice} registrada.", choice);
    }

    private static ChallengeResult ValidateDistance(
        CodeSession session,
        EvaluationResult evaluation)
    {
        if (!TryGetInt(session, "distancia", out var distance) || distance != 250)
        {
            return new ChallengeResult(false, "Calcule distancia como 150 * 2 - 50. O resultado deve ser 250.", null);
        }

        var printed = evaluation.Logs.Any(log => log.Contains("250", StringComparison.Ordinal));
        return printed
            ? new ChallengeResult(true, "Cálculo e saída corretos: distância segura de 250 km.", null)
            : new ChallengeResult(false, "O cálculo está correto; agora exiba a distância com Console.WriteLine.", null);
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
}

public sealed record ChallengeResult(bool Passed, string Feedback, int? ChoiceValue);

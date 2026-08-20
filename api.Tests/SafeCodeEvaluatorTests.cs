using Xunit;

public sealed class SafeCodeEvaluatorTests
{
    [Fact]
    public void DeclaresEnergyVariableAndPassesChallenge()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("int nivelDeEnergia = 25;", session);
        var challenge = ChallengeValidator.Validate("step-2", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.True(challenge.Passed);
        Assert.Equal(25, session.Variables["nivelDeEnergia"].IntValue);
    }

    [Fact]
    public void RejectsWrongEnergyValue()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("int nivelDeEnergia = 10;", session);
        var challenge = ChallengeValidator.Validate("step-2", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.False(challenge.Passed);
    }

    [Fact]
    public void PersistsVariableAndWritesExpectedOutput()
    {
        var session = new CodeSession();
        SafeCodeEvaluator.Evaluate("int nivelDeEnergia = 25;", session);

        var evaluation = SafeCodeEvaluator.Evaluate(
            "Console.WriteLine(\"Nível de energia: \" + nivelDeEnergia + \"%\");",
            session);
        var challenge = ChallengeValidator.Validate("step-3", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.True(challenge.Passed);
        Assert.Contains("Nível de energia: 25%", evaluation.Logs);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public void AcceptsOnlyValidBranchChoices(int choice)
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate($"int escolha = {choice};", session);
        var challenge = ChallengeValidator.Validate("step-4", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.True(challenge.Passed);
        Assert.Equal(choice, challenge.ChoiceValue);
    }

    [Fact]
    public void RejectsInvalidBranchChoice()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("int escolha = 3;", session);
        var challenge = ChallengeValidator.Validate("step-4", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.False(challenge.Passed);
    }

    [Fact]
    public void ValidatesDistanceByResultInsteadOfSubstring()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate(
            "int distancia = 150 * 2 - 50; Console.WriteLine(\"Distância segura: \" + distancia + \" km\");",
            session);
        var challenge = ChallengeValidator.Validate("step-5", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.True(challenge.Passed);
        Assert.Equal(250, session.Variables["distancia"].IntValue);
    }

    [Theory]
    [InlineData("while (true) { }")]
    [InlineData("System.IO.File.ReadAllText(\"secret.txt\");")]
    [InlineData("new object();")]
    [InlineData("Console.ReadLine();")]
    public void RejectsCodeOutsideSafeSubset(string code)
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate(code, session);

        Assert.False(evaluation.Success);
        Assert.Contains(evaluation.Logs, log => log.Contains("SEGURANÇA", StringComparison.Ordinal));
    }

    [Fact]
    public void RejectsUnknownVariable()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("Console.WriteLine(valor);", session);

        Assert.False(evaluation.Success);
        Assert.Contains(evaluation.Logs, log => log.Contains("não existe no contexto atual", StringComparison.Ordinal));
    }

    [Fact]
    public void DoesNotCommitPartialStateWhenLaterStatementFails()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate(
            "int nivelDeEnergia = 25; Console.ReadLine();",
            session);

        Assert.False(evaluation.Success);
        Assert.False(session.Variables.ContainsKey("nivelDeEnergia"));
    }

    [Fact]
    public void RejectsAttemptsToEscapeTheRunWrapper()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate(
            "} void Injected() { } void Run2() {",
            session);

        Assert.False(evaluation.Success);
        Assert.Contains(evaluation.Logs, log => log.Contains("SEGURANÇA", StringComparison.Ordinal));
    }

    [Fact]
    public void SupportsKatanaCutChallenge()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("katana.Cortar();", session);
        var challenge = ChallengeValidator.Validate("ch2-monster-1", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.True(challenge.Passed);
        Assert.Equal("Cortar", session.Variables["katana_action"].StringValue);
    }

    [Fact]
    public void SupportsCombatDamageChallenge()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("alvo.Vida -= 50;", session);
        var challenge = ChallengeValidator.Validate("ch2-monster-2", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.True(challenge.Passed);
        Assert.Equal(50, session.Variables["damage_dealt"].IntValue);
    }

    [Fact]
    public void FinalCombatUsesProgressStateAfterShieldIsDisabled()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("bool escudo = false;", session);
        var challenge = ChallengeValidator.Validate("ch2-monster-3", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.Equal(ChallengeState.Progress, challenge.State);
        Assert.False(challenge.Passed);
    }

    [Fact]
    public void FinalCombatPassesAfterShieldAndFatalHit()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate(
            "bool escudo = false; katana.GolpeFatal();",
            session);
        var challenge = ChallengeValidator.Validate("ch2-monster-3", session, evaluation);

        Assert.True(evaluation.Success);
        Assert.Equal(ChallengeState.Passed, challenge.State);
        Assert.True(challenge.Passed);
    }

    [Fact]
    public void SupportsCSharpIntegerDivisionSemantics()
    {
        var session = new CodeSession();

        var evaluation = SafeCodeEvaluator.Evaluate("int resultado = -3 / 2;", session);

        Assert.True(evaluation.Success);
        Assert.Equal(-1, session.Variables["resultado"].IntValue);
    }
}

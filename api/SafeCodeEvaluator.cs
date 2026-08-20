using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

public static class SafeCodeEvaluator
{
    private const int MaxStatements = 8;
    private const int MaxVariables = 64;
    private const int MaxStringLength = 500;

    private static readonly HashSet<string> AllowedKatanaMethods = new(StringComparer.Ordinal)
    {
        "Cortar",
        "GolpeFatal"
    };

    public static EvaluationResult Evaluate(string code, CodeSession session)
    {
        var tree = CSharpSyntaxTree.ParseText($"class __AURACS {{ void Run() {{ {code} }} }}");
        var diagnostics = tree.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
        if (diagnostics.Length > 0)
        {
            return EvaluationResult.Fail(diagnostics.Select(d => $"[ERRO]: {d.GetMessage()}").ToArray());
        }

        var root = tree.GetCompilationUnitRoot();
        if (!TryGetSafeRunMethod(root, out var method, out var structureError))
        {
            return EvaluationResult.Fail($"[ERRO DE SEGURANÇA]: {structureError}");
        }

        var statements = method.Body!.Statements;
        if (statements.Count == 0)
        {
            return EvaluationResult.Fail("[ERRO]: Nenhuma instrução C# foi encontrada.");
        }

        if (statements.Count > MaxStatements)
        {
            return EvaluationResult.Fail($"[ERRO DE SEGURANÇA]: Limite de {MaxStatements} instruções por execução.");
        }

        var workingSession = session.CreateWorkingCopy();
        var logs = new List<string>();
        string? returnValue = null;

        try
        {
            foreach (var statement in statements)
            {
                switch (statement)
                {
                    case LocalDeclarationStatementSyntax declaration:
                        returnValue = EvaluateDeclaration(declaration, workingSession);
                        break;

                    case ExpressionStatementSyntax expressionStatement:
                        returnValue = EvaluateExpressionStatement(expressionStatement, workingSession, logs);
                        break;

                    default:
                        throw new UnsafeCodeException(
                            $"A instrução '{statement.Kind()}' não é permitida nesta fase do curso.");
                }
            }

            if (workingSession.Variables.Count > MaxVariables)
            {
                throw new UnsafeCodeException($"Limite de {MaxVariables} variáveis por sessão excedido.");
            }
        }
        catch (UnsafeCodeException ex)
        {
            return EvaluationResult.Fail($"[ERRO DE SEGURANÇA]: {ex.Message}");
        }
        catch (EvaluationException ex)
        {
            return EvaluationResult.Fail($"[ERRO]: {ex.Message}");
        }
        catch (DivideByZeroException)
        {
            return EvaluationResult.Fail("[ERRO]: Tentativa de divisão por zero.");
        }
        catch (OverflowException)
        {
            return EvaluationResult.Fail("[ERRO]: O cálculo ultrapassou o limite permitido para int.");
        }

        session.CommitFrom(workingSession);
        return EvaluationResult.Ok(logs.ToArray(), returnValue);
    }

    private static bool TryGetSafeRunMethod(
        CompilationUnitSyntax root,
        out MethodDeclarationSyntax method,
        out string error)
    {
        method = null!;
        error = "Estrutura de código inválida.";

        if (root.Usings.Count != 0 || root.Members.Count != 1 ||
            root.Members[0] is not ClassDeclarationSyntax wrapper ||
            wrapper.Identifier.Text != "__AURACS")
        {
            return false;
        }

        if (wrapper.Members.Count != 1 ||
            wrapper.Members[0] is not MethodDeclarationSyntax runMethod ||
            runMethod.Identifier.Text != "Run" ||
            runMethod.Body is null)
        {
            return false;
        }

        method = runMethod;
        error = string.Empty;
        return true;
    }

    private static string? EvaluateDeclaration(LocalDeclarationStatementSyntax declaration, CodeSession session)
    {
        if (declaration.Declaration.Type is not PredefinedTypeSyntax predefinedType)
        {
            throw new UnsafeCodeException("Apenas variáveis dos tipos int e bool são permitidas nesta fase.");
        }

        var expectedKind = predefinedType.Keyword.Kind() switch
        {
            SyntaxKind.IntKeyword => SafeValueKind.Int,
            SyntaxKind.BoolKeyword => SafeValueKind.Bool,
            _ => throw new UnsafeCodeException("Apenas variáveis dos tipos int e bool são permitidas nesta fase.")
        };

        string? lastValue = null;
        foreach (var variable in declaration.Declaration.Variables)
        {
            if (variable.Initializer is null)
            {
                throw new EvaluationException($"A variável '{variable.Identifier.Text}' precisa receber um valor inicial.");
            }

            if (!session.Variables.ContainsKey(variable.Identifier.Text) && session.Variables.Count >= MaxVariables)
            {
                throw new UnsafeCodeException($"Limite de {MaxVariables} variáveis por sessão excedido.");
            }

            var value = EvaluateExpression(variable.Initializer.Value, session);
            if (value.Kind != expectedKind)
            {
                var expectedName = expectedKind == SafeValueKind.Int ? "inteiro" : "booleano";
                throw new EvaluationException(
                    $"A variável '{variable.Identifier.Text}' precisa receber um valor {expectedName}.");
            }

            if (session.Variables.TryGetValue(variable.Identifier.Text, out var existing) &&
                existing.Kind != expectedKind)
            {
                throw new EvaluationException(
                    $"A variável '{variable.Identifier.Text}' já existe com outro tipo.");
            }

            session.Variables[variable.Identifier.Text] = value;
            lastValue = value.ToDisplayString();
        }

        return lastValue;
    }

    private static string? EvaluateExpressionStatement(
        ExpressionStatementSyntax statement,
        CodeSession session,
        List<string> logs)
    {
        if (statement.Expression is AssignmentExpressionSyntax assignment)
        {
            if (assignment.IsKind(SyntaxKind.SimpleAssignmentExpression))
            {
                return EvaluateSimpleAssignment(assignment, session);
            }

            if (assignment.IsKind(SyntaxKind.SubtractAssignmentExpression))
            {
                return EvaluateCombatDamage(assignment, session, logs);
            }

            throw new UnsafeCodeException("Somente atribuições simples e o operador -= do desafio de combate são permitidos.");
        }

        if (statement.Expression is InvocationExpressionSyntax invocation)
        {
            if (IsConsoleWriteLine(invocation))
            {
                if (invocation.ArgumentList.Arguments.Count != 1)
                {
                    throw new EvaluationException("Console.WriteLine deve receber exatamente um argumento nesta etapa.");
                }

                var value = EvaluateExpression(invocation.ArgumentList.Arguments[0].Expression, session);
                var output = value.ToDisplayString();
                logs.Add(output);
                return output;
            }

            if (TryGetKatanaMethod(invocation, out var katanaMethod))
            {
                session.Variables["katana_action"] = SafeValue.FromString(katanaMethod);
                var output = $"[KATANA]: Executando {katanaMethod}() — corte de plasma desferido.";
                logs.Add(output);
                return $"katana.{katanaMethod}()";
            }

            throw new UnsafeCodeException(
                "Apenas Console.WriteLine(...) e os métodos de katana previstos no desafio são permitidos.");
        }

        throw new UnsafeCodeException("A expressão informada não é permitida nesta fase do curso.");
    }

    private static string EvaluateSimpleAssignment(AssignmentExpressionSyntax assignment, CodeSession session)
    {
        if (assignment.Left is not IdentifierNameSyntax identifier)
        {
            throw new UnsafeCodeException("Somente atribuições simples a variáveis existentes são permitidas.");
        }

        if (!session.Variables.TryGetValue(identifier.Identifier.Text, out var existing))
        {
            throw new EvaluationException($"A variável '{identifier.Identifier.Text}' não existe no contexto atual.");
        }

        var value = EvaluateExpression(assignment.Right, session);
        if (value.Kind != existing.Kind)
        {
            throw new EvaluationException("A atribuição precisa manter o tipo original da variável.");
        }

        session.Variables[identifier.Identifier.Text] = value;
        return value.ToDisplayString();
    }

    private static string EvaluateCombatDamage(
        AssignmentExpressionSyntax assignment,
        CodeSession session,
        List<string> logs)
    {
        if (assignment.Left is not MemberAccessExpressionSyntax member ||
            member.Expression is not IdentifierNameSyntax target ||
            target.Identifier.Text != "alvo" ||
            member.Name.Identifier.Text != "Vida")
        {
            throw new UnsafeCodeException("No combate, o operador -= só pode ser usado em alvo.Vida.");
        }

        var damage = EvaluateExpression(assignment.Right, session);
        if (damage.Kind != SafeValueKind.Int || damage.IntValue <= 0 || damage.IntValue > 10_000)
        {
            throw new EvaluationException("O dano precisa ser um inteiro positivo dentro do limite permitido.");
        }

        session.Variables["damage_dealt"] = damage;
        session.Variables["combat_target"] = SafeValue.FromString("alvo.Vida");
        var output = $"[COMBATE]: alvo.Vida reduzido em {damage.IntValue} pontos vitais.";
        logs.Add(output);
        return $"alvo.Vida -= {damage.IntValue}";
    }

    private static bool IsConsoleWriteLine(InvocationExpressionSyntax invocation)
    {
        return invocation.Expression is MemberAccessExpressionSyntax member &&
               member.Expression is IdentifierNameSyntax target &&
               target.Identifier.Text == "Console" &&
               member.Name is IdentifierNameSyntax methodName &&
               methodName.Identifier.Text == "WriteLine";
    }

    private static bool TryGetKatanaMethod(InvocationExpressionSyntax invocation, out string method)
    {
        method = string.Empty;
        if (invocation.ArgumentList.Arguments.Count != 0 ||
            invocation.Expression is not MemberAccessExpressionSyntax member ||
            member.Expression is not IdentifierNameSyntax target ||
            member.Name is not IdentifierNameSyntax ||
            target.Identifier.Text != "katana")
        {
            return false;
        }

        method = member.Name.Identifier.Text;
        return AllowedKatanaMethods.Contains(method);
    }

    private static SafeValue EvaluateExpression(ExpressionSyntax expression, CodeSession session)
    {
        return expression switch
        {
            LiteralExpressionSyntax literal => EvaluateLiteral(literal),
            IdentifierNameSyntax identifier => ResolveIdentifier(identifier, session),
            ParenthesizedExpressionSyntax parenthesized => EvaluateExpression(parenthesized.Expression, session),
            PrefixUnaryExpressionSyntax unary => EvaluateUnary(unary, session),
            BinaryExpressionSyntax binary => EvaluateBinary(binary, session),
            _ => throw new UnsafeCodeException(
                $"A expressão '{expression.Kind()}' não faz parte do subconjunto seguro desta fase.")
        };
    }

    private static SafeValue EvaluateLiteral(LiteralExpressionSyntax literal)
    {
        if (literal.IsKind(SyntaxKind.NumericLiteralExpression) && literal.Token.Value is int intValue)
        {
            return SafeValue.FromInt(intValue);
        }

        if (literal.IsKind(SyntaxKind.StringLiteralExpression))
        {
            var text = literal.Token.ValueText;
            if (text.Length > MaxStringLength)
            {
                throw new UnsafeCodeException($"Strings acima de {MaxStringLength} caracteres não são permitidas.");
            }

            return SafeValue.FromString(text);
        }

        if (literal.IsKind(SyntaxKind.TrueLiteralExpression))
        {
            return SafeValue.FromBool(true);
        }

        if (literal.IsKind(SyntaxKind.FalseLiteralExpression))
        {
            return SafeValue.FromBool(false);
        }

        throw new UnsafeCodeException("Somente literais int, string e bool são permitidos.");
    }

    private static SafeValue ResolveIdentifier(IdentifierNameSyntax identifier, CodeSession session)
    {
        if (!session.Variables.TryGetValue(identifier.Identifier.Text, out var value))
        {
            throw new EvaluationException(
                $"O nome '{identifier.Identifier.Text}' não existe no contexto atual.");
        }

        return value;
    }

    private static SafeValue EvaluateUnary(PrefixUnaryExpressionSyntax unary, CodeSession session)
    {
        var operand = EvaluateExpression(unary.Operand, session);
        if (operand.Kind != SafeValueKind.Int)
        {
            throw new EvaluationException("Operadores unários só podem ser usados com inteiros.");
        }

        return unary.Kind() switch
        {
            SyntaxKind.UnaryMinusExpression => SafeValue.FromInt(checked(-operand.IntValue)),
            SyntaxKind.UnaryPlusExpression => operand,
            _ => throw new UnsafeCodeException("Operador unário não permitido.")
        };
    }

    private static SafeValue EvaluateBinary(BinaryExpressionSyntax binary, CodeSession session)
    {
        var left = EvaluateExpression(binary.Left, session);
        var right = EvaluateExpression(binary.Right, session);

        if (binary.IsKind(SyntaxKind.AddExpression) &&
            (left.Kind == SafeValueKind.String || right.Kind == SafeValueKind.String))
        {
            return SafeValue.FromString(left.ToDisplayString() + right.ToDisplayString());
        }

        if (left.Kind != SafeValueKind.Int || right.Kind != SafeValueKind.Int)
        {
            throw new EvaluationException("Esta operação exige valores inteiros.");
        }

        var value = binary.Kind() switch
        {
            SyntaxKind.AddExpression => checked(left.IntValue + right.IntValue),
            SyntaxKind.SubtractExpression => checked(left.IntValue - right.IntValue),
            SyntaxKind.MultiplyExpression => checked(left.IntValue * right.IntValue),
            SyntaxKind.DivideExpression => checked(left.IntValue / right.IntValue),
            SyntaxKind.ModuloExpression => checked(left.IntValue % right.IntValue),
            _ => throw new UnsafeCodeException("Operador binário não permitido.")
        };

        return SafeValue.FromInt(value);
    }
}

public enum SafeValueKind
{
    Int,
    String,
    Bool
}

public readonly record struct SafeValue(
    SafeValueKind Kind,
    int IntValue,
    string? StringValue,
    bool BoolValue)
{
    public static SafeValue FromInt(int value) => new(SafeValueKind.Int, value, null, false);
    public static SafeValue FromString(string value) => new(SafeValueKind.String, 0, value, false);
    public static SafeValue FromBool(bool value) => new(SafeValueKind.Bool, 0, null, value);

    public string ToDisplayString() => Kind switch
    {
        SafeValueKind.Int => IntValue.ToString(System.Globalization.CultureInfo.InvariantCulture),
        SafeValueKind.String => StringValue ?? string.Empty,
        SafeValueKind.Bool => BoolValue ? "True" : "False",
        _ => string.Empty
    };
}

public sealed record EvaluationResult(bool Success, string[] Logs, string? ReturnValue)
{
    public static EvaluationResult Ok(string[] logs, string? returnValue) => new(true, logs, returnValue);
    public static EvaluationResult Fail(params string[] logs) => new(false, logs, null);
}

public sealed class UnsafeCodeException(string message) : Exception(message);
public sealed class EvaluationException(string message) : Exception(message);

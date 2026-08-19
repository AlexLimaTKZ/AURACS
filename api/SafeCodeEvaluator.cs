using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

public static class SafeCodeEvaluator
{
    private const int MaxStatements = 8;

    public static EvaluationResult Evaluate(string code, CodeSession session)
    {
        var tree = CSharpSyntaxTree.ParseText($"class __AURACS {{ void Run() {{ {code} }} }}");
        var diagnostics = tree.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
        if (diagnostics.Length > 0)
        {
            return EvaluationResult.Fail(diagnostics.Select(d => $"[ERRO]: {d.GetMessage()}").ToArray());
        }

        var root = tree.GetCompilationUnitRoot();
        var method = root.DescendantNodes().OfType<MethodDeclarationSyntax>().Single();
        var statements = method.Body?.Statements ?? default;

        if (statements.Count == 0)
        {
            return EvaluationResult.Fail("[ERRO]: Nenhuma instrução C# foi encontrada.");
        }

        if (statements.Count > MaxStatements)
        {
            return EvaluationResult.Fail($"[ERRO DE SEGURANÇA]: Limite de {MaxStatements} instruções por execução.");
        }

        var logs = new List<string>();
        string? returnValue = null;

        try
        {
            foreach (var statement in statements)
            {
                switch (statement)
                {
                    case LocalDeclarationStatementSyntax declaration:
                        EvaluateDeclaration(declaration, session);
                        break;

                    case ExpressionStatementSyntax expressionStatement:
                        returnValue = EvaluateExpressionStatement(expressionStatement, session, logs);
                        break;

                    default:
                        throw new UnsafeCodeException(
                            $"A instrução '{statement.Kind()}' não é permitida nesta fase do curso.");
                }
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

        return EvaluationResult.Ok(logs.ToArray(), returnValue);
    }

    private static void EvaluateDeclaration(LocalDeclarationStatementSyntax declaration, CodeSession session)
    {
        if (!declaration.Declaration.Type.IsKind(SyntaxKind.IntKeyword))
        {
            throw new UnsafeCodeException("Apenas variáveis do tipo int são permitidas neste capítulo.");
        }

        foreach (var variable in declaration.Declaration.Variables)
        {
            if (variable.Initializer is null)
            {
                throw new EvaluationException($"A variável '{variable.Identifier.Text}' precisa receber um valor inicial.");
            }

            var value = EvaluateExpression(variable.Initializer.Value, session);
            if (value.Kind != SafeValueKind.Int)
            {
                throw new EvaluationException($"A variável '{variable.Identifier.Text}' precisa receber um valor inteiro.");
            }

            session.Variables[variable.Identifier.Text] = value;
        }
    }

    private static string? EvaluateExpressionStatement(
        ExpressionStatementSyntax statement,
        CodeSession session,
        List<string> logs)
    {
        if (statement.Expression is AssignmentExpressionSyntax assignment)
        {
            if (!assignment.IsKind(SyntaxKind.SimpleAssignmentExpression) ||
                assignment.Left is not IdentifierNameSyntax identifier)
            {
                throw new UnsafeCodeException("Somente atribuições simples a variáveis existentes são permitidas.");
            }

            if (!session.Variables.ContainsKey(identifier.Identifier.Text))
            {
                throw new EvaluationException($"A variável '{identifier.Identifier.Text}' não existe no contexto atual.");
            }

            var value = EvaluateExpression(assignment.Right, session);
            if (value.Kind != SafeValueKind.Int)
            {
                throw new EvaluationException("A atribuição precisa resultar em um valor inteiro.");
            }

            session.Variables[identifier.Identifier.Text] = value;
            return value.ToDisplayString();
        }

        if (statement.Expression is InvocationExpressionSyntax invocation)
        {
            if (!IsConsoleWriteLine(invocation))
            {
                throw new UnsafeCodeException("A única chamada de método permitida é Console.WriteLine(...).");
            }

            if (invocation.ArgumentList.Arguments.Count != 1)
            {
                throw new EvaluationException("Console.WriteLine deve receber exatamente um argumento nesta etapa.");
            }

            var value = EvaluateExpression(invocation.ArgumentList.Arguments[0].Expression, session);
            var output = value.ToDisplayString();
            logs.Add(output);
            return output;
        }

        throw new UnsafeCodeException("A expressão informada não é permitida nesta fase do curso.");
    }

    private static bool IsConsoleWriteLine(InvocationExpressionSyntax invocation)
    {
        return invocation.Expression is MemberAccessExpressionSyntax member &&
               member.Expression is IdentifierNameSyntax target &&
               target.Identifier.Text == "Console" &&
               member.Name.Identifier.Text == "WriteLine";
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
                $"A expressão '{expression.Kind()}' não faz parte do subconjunto seguro deste capítulo.")
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
            if (text.Length > 500)
            {
                throw new UnsafeCodeException("Strings acima de 500 caracteres não são permitidas.");
            }
            return SafeValue.FromString(text);
        }

        throw new UnsafeCodeException("Somente literais int e string são permitidos.");
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
    String
}

public readonly record struct SafeValue(SafeValueKind Kind, int IntValue, string? StringValue)
{
    public static SafeValue FromInt(int value) => new(SafeValueKind.Int, value, null);
    public static SafeValue FromString(string value) => new(SafeValueKind.String, 0, value);

    public string ToDisplayString() => Kind == SafeValueKind.Int
        ? IntValue.ToString(System.Globalization.CultureInfo.InvariantCulture)
        : StringValue ?? string.Empty;
}

public sealed record EvaluationResult(bool Success, string[] Logs, string? ReturnValue)
{
    public static EvaluationResult Ok(string[] logs, string? returnValue) => new(true, logs, returnValue);
    public static EvaluationResult Fail(params string[] logs) => new(false, logs, null);
}

public sealed class UnsafeCodeException(string message) : Exception(message);
public sealed class EvaluationException(string message) : Exception(message);

using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;
using System.Collections.Concurrent;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add CORS to allow frontend access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// --- Script State Management ---
var sessions = new ConcurrentDictionary<string, ScriptState<object>>();

// Semaphore to prevent race conditions with Console.SetOut
var consoleLock = new SemaphoreSlim(1, 1);

// Shared script options — SANDBOXED: only safe namespaces allowed
var scriptOptions = ScriptOptions.Default
    .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
    .WithReferences(
        typeof(object).Assembly,
        typeof(Console).Assembly,
        typeof(System.Linq.Enumerable).Assembly,
        Assembly.Load("System.Runtime"),
        Assembly.Load("System.Collections")
    );

// Dangerous patterns to block before execution
string[] blockedPatterns = [
    "System.IO", "System.Net", "System.Diagnostics.Process",
    "File.", "Directory.", "Path.", "StreamReader", "StreamWriter",
    "HttpClient", "WebClient", "Socket",
    "Environment.Exit", "Environment.SetEnvironmentVariable",
    "Assembly.", "Reflection.", "AppDomain",
    "Process.Start", "ProcessStartInfo",
    "Registry", "RegistryKey",
    "Thread.", "Task.Run", "Parallel."
];

app.MapPost("/run", async ([FromBody] CodeRequest request) =>
{
    var sessionId = request.SessionId ?? "default";

    // --- SANDBOX: Block dangerous code patterns ---
    var codeToCheck = request.Code.Replace(" ", "");
    foreach (var pattern in blockedPatterns)
    {
        if (codeToCheck.Contains(pattern.Replace(" ", ""), StringComparison.OrdinalIgnoreCase))
        {
            return Results.Ok(new CodeResponse
            {
                Success = false,
                Logs = [$"[ERRO DE SEGURANÇA]: Acesso bloqueado. O comando contém operações restritas ({pattern})."]
            });
        }
    }

    // Lock to prevent race condition with Console.SetOut
    await consoleLock.WaitAsync();

    var sb = new StringBuilder();
    var writer = new StringWriter(sb);
    var originalOut = Console.Out;
    Console.SetOut(writer);

    try
    {
        // Execute with timeout (5 seconds max)
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

        ScriptState<object> state;

        if (sessions.TryGetValue(sessionId, out var previousState))
        {
            state = await previousState.ContinueWithAsync<object>(request.Code, scriptOptions,
                cancellationToken: cts.Token);
        }
        else
        {
            var globals = new ScriptGlobals { Energy = request.Context?.Energy ?? 0 };
            state = await CSharpScript.RunAsync<object>(request.Code, scriptOptions,
                globals: globals, cancellationToken: cts.Token);
        }

        sessions[sessionId] = state;

        Console.SetOut(originalOut);

        return Results.Ok(new CodeResponse
        {
            Success = true,
            Logs = sb.ToString().Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries),
            ReturnValue = state.ReturnValue?.ToString()
        });
    }
    catch (CompilationErrorException e)
    {
        Console.SetOut(originalOut);
        return Results.Ok(new CodeResponse
        {
            Success = false,
            Logs = e.Diagnostics.Select(d => $"[ERRO]: {d.GetMessage()}").ToArray()
        });
    }
    catch (OperationCanceledException)
    {
        Console.SetOut(originalOut);
        return Results.Ok(new CodeResponse
        {
            Success = false,
            Logs = ["[ERRO]: Tempo de execução excedido (máximo 5 segundos). Verifique se há loops infinitos."]
        });
    }
    catch (Exception e)
    {
        Console.SetOut(originalOut);
        return Results.Ok(new CodeResponse
        {
            Success = false,
            Logs = [$"[ERRO CRÍTICO]: {e.Message}"]
        });
    }
    finally
    {
        consoleLock.Release();
    }
});

// Reset session endpoint
app.MapPost("/reset", ([FromBody] ResetRequest request) =>
{
    var sessionId = request.SessionId ?? "default";
    sessions.TryRemove(sessionId, out _);
    return Results.Ok(new { Success = true, Message = "Sessão resetada." });
});

app.Run();

// DTOs
public class CodeRequest
{
    public string Code { get; set; } = "";
    public string? SessionId { get; set; }
    public GameContext? Context { get; set; }
}

public class ResetRequest
{
    public string? SessionId { get; set; }
}

public class GameContext
{
    public int Energy { get; set; }
}

public class CodeResponse
{
    public bool Success { get; set; }
    public string[] Logs { get; set; } = [];
    public string? ReturnValue { get; set; }
}

public class ScriptGlobals
{
    public int Energy { get; set; }
}

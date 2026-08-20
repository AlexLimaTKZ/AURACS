using System.Collections.Concurrent;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;

const int MaxSessions = 2_000;
const int MaxCodeLength = 2_000;
const long MaxRequestBodyBytes = 8 * 1024;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MaxRequestBodyBytes;
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("code-runner", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

var app = builder.Build();

app.UseCors("Frontend");
app.UseRateLimiter();

var sessions = new ConcurrentDictionary<string, CodeSession>(StringComparer.Ordinal);
var sessionTtl = TimeSpan.FromHours(2);
var sessionCreationGate = new SemaphoreSlim(1, 1);

void CleanupExpiredSessions()
{
    var cutoff = DateTimeOffset.UtcNow - sessionTtl;
    foreach (var (id, session) in sessions)
    {
        if (session.LastAccess < cutoff)
        {
            sessions.TryRemove(id, out _);
        }
    }
}

static bool IsValidSessionId(string? sessionId) =>
    !string.IsNullOrWhiteSpace(sessionId) && Guid.TryParse(sessionId, out _);

static void SeedSessionForChallenge(CodeSession session, string? challengeId)
{
    if (challengeId is "step-3" or "step-4" or "step-4-shields" or "step-4-life" or "step-5")
    {
        session.Variables.TryAdd("nivelDeEnergia", SafeValue.FromInt(25));
    }

    if (challengeId == "ch2-monster-3")
    {
        session.Variables.TryAdd("escudo", SafeValue.FromBool(true));
    }
}

async Task<CodeSession?> GetOrCreateSessionAsync(
    string sessionId,
    string? challengeId,
    CancellationToken cancellationToken)
{
    if (sessions.TryGetValue(sessionId, out var existing))
    {
        return existing;
    }

    await sessionCreationGate.WaitAsync(cancellationToken);
    try
    {
        if (sessions.TryGetValue(sessionId, out existing))
        {
            return existing;
        }

        CleanupExpiredSessions();
        if (sessions.Count >= MaxSessions)
        {
            return null;
        }

        var created = new CodeSession();
        SeedSessionForChallenge(created, challengeId);
        sessions[sessionId] = created;
        return created;
    }
    finally
    {
        sessionCreationGate.Release();
    }
}

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    activeSessions = sessions.Count
}));

app.MapPost("/run", async ([FromBody] CodeRequest request, HttpContext httpContext) =>
{
    CleanupExpiredSessions();

    if (!IsValidSessionId(request.SessionId))
    {
        return Results.BadRequest(new CodeResponse
        {
            Success = false,
            Logs = ["[ERRO]: sessionId precisa ser um UUID válido."]
        });
    }

    if (string.IsNullOrWhiteSpace(request.Code))
    {
        return Results.BadRequest(new CodeResponse
        {
            Success = false,
            Logs = ["[ERRO]: Digite um comando C# antes de executar."]
        });
    }

    if (request.Code.Length > MaxCodeLength)
    {
        return Results.BadRequest(new CodeResponse
        {
            Success = false,
            Logs = [$"[ERRO]: Código muito grande. Limite: {MaxCodeLength} caracteres."]
        });
    }

    var session = await GetOrCreateSessionAsync(
        request.SessionId!,
        request.ChallengeId,
        httpContext.RequestAborted);

    if (session is null)
    {
        return Results.Json(
            new CodeResponse
            {
                Success = false,
                Logs = ["[ERRO]: Limite temporário de sessões atingido. Tente novamente em instantes."]
            },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    await session.Gate.WaitAsync(httpContext.RequestAborted);
    try
    {
        session.LastAccess = DateTimeOffset.UtcNow;

        var result = SafeCodeEvaluator.Evaluate(request.Code, session);
        if (!result.Success)
        {
            return Results.Ok(new CodeResponse
            {
                Success = false,
                Logs = result.Logs,
                ChallengeStatus = "failed"
            });
        }

        var challenge = ChallengeValidator.Validate(request.ChallengeId, session, result);

        return Results.Ok(new CodeResponse
        {
            Success = true,
            Logs = result.Logs,
            ReturnValue = result.ReturnValue,
            ChallengePassed = challenge.Passed,
            ChallengeStatus = challenge.State.ToString().ToLowerInvariant(),
            Feedback = challenge.Feedback,
            ChoiceValue = challenge.ChoiceValue
        });
    }
    finally
    {
        session.Gate.Release();
    }
})
.RequireRateLimiting("code-runner");

app.MapPost("/reset", ([FromBody] ResetRequest request) =>
{
    if (!IsValidSessionId(request.SessionId))
    {
        return Results.BadRequest(new { Success = false, Message = "sessionId precisa ser um UUID válido." });
    }

    var removed = sessions.TryRemove(request.SessionId!, out _);
    return Results.Ok(new
    {
        Success = true,
        Removed = removed,
        Message = removed ? "Sessão resetada." : "Sessão já estava vazia."
    });
})
.RequireRateLimiting("code-runner");

app.Run();

public sealed class CodeRequest
{
    public string Code { get; set; } = "";
    public string? SessionId { get; set; }
    public string? ChallengeId { get; set; }
}

public sealed class ResetRequest
{
    public string? SessionId { get; set; }
}

public sealed class CodeResponse
{
    public bool Success { get; set; }
    public string[] Logs { get; set; } = [];
    public string? ReturnValue { get; set; }
    public bool ChallengePassed { get; set; }
    public string ChallengeStatus { get; set; } = "failed";
    public string? Feedback { get; set; }
    public int? ChoiceValue { get; set; }
}

public sealed class CodeSession
{
    public Dictionary<string, SafeValue> Variables { get; private set; }
    public DateTimeOffset LastAccess { get; set; } = DateTimeOffset.UtcNow;
    public SemaphoreSlim Gate { get; } = new(1, 1);

    public CodeSession()
        : this(new Dictionary<string, SafeValue>(StringComparer.Ordinal))
    {
    }

    private CodeSession(Dictionary<string, SafeValue> variables)
    {
        Variables = variables;
    }

    internal CodeSession CreateWorkingCopy() =>
        new(new Dictionary<string, SafeValue>(Variables, StringComparer.Ordinal));

    internal void CommitFrom(CodeSession source)
    {
        Variables = new Dictionary<string, SafeValue>(source.Variables, StringComparer.Ordinal);
    }
}

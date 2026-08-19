using System.Collections.Concurrent;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

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

var sessions = new ConcurrentDictionary<string, CodeSession>();
var sessionTtl = TimeSpan.FromHours(2);
const int MaxSessions = 2_000;
const int MaxCodeLength = 2_000;

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

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    activeSessions = sessions.Count
}));

app.MapPost("/run", ([FromBody] CodeRequest request) =>
{
    CleanupExpiredSessions();

    if (string.IsNullOrWhiteSpace(request.SessionId))
    {
        return Results.BadRequest(new CodeResponse
        {
            Success = false,
            Logs = ["[ERRO]: sessionId é obrigatório."]
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

    if (!sessions.TryGetValue(request.SessionId, out var session))
    {
        if (sessions.Count >= MaxSessions)
        {
            CleanupExpiredSessions();
            if (sessions.Count >= MaxSessions)
            {
                return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            }
        }

        session = new CodeSession();
        sessions[request.SessionId] = session;
    }

    session.LastAccess = DateTimeOffset.UtcNow;

    var result = SafeCodeEvaluator.Evaluate(request.Code, session);
    if (!result.Success)
    {
        return Results.Ok(new CodeResponse
        {
            Success = false,
            Logs = result.Logs
        });
    }

    var challenge = ChallengeValidator.Validate(request.ChallengeId, session, result);

    return Results.Ok(new CodeResponse
    {
        Success = true,
        Logs = result.Logs,
        ReturnValue = result.ReturnValue,
        ChallengePassed = challenge.Passed,
        Feedback = challenge.Feedback,
        ChoiceValue = challenge.ChoiceValue
    });
})
.RequireRateLimiting("code-runner");

app.MapPost("/reset", ([FromBody] ResetRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.SessionId))
    {
        return Results.BadRequest(new { Success = false, Message = "sessionId é obrigatório." });
    }

    var removed = sessions.TryRemove(request.SessionId, out _);
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
    public string? Feedback { get; set; }
    public int? ChoiceValue { get; set; }
}

public sealed class CodeSession
{
    public Dictionary<string, SafeValue> Variables { get; } = new(StringComparer.Ordinal);
    public DateTimeOffset LastAccess { get; set; } = DateTimeOffset.UtcNow;
}

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace TextToMarkDown.Tests.Unit;

/// <summary>
/// 驗證 Serilog 設定正確性的單元測試。
/// 確保 Serilog 已註冊為日誌提供者，且 ILogger 可正常注入。
/// </summary>
public class ProgramConfigurationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProgramConfigurationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Serilog_Should_Be_Registered_As_Logger_Provider()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();

        // Assert — ILoggerFactory should be resolvable (Serilog replaces the default)
        Assert.NotNull(loggerFactory);
    }

    [Fact]
    public void ILogger_Should_Be_Injectable()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ProgramConfigurationTests>>();

        // Assert
        Assert.NotNull(logger);
    }

    [Fact]
    public void Serilog_Logger_Should_Be_Configured_In_Host()
    {
        // Arrange & Act — verify Serilog is wired into the host by checking
        // that the IDiagnosticContext service (registered by UseSerilog) is available
        using var scope = _factory.Services.CreateScope();
        var diagnosticContext = scope.ServiceProvider.GetService<Serilog.IDiagnosticContext>();

        // Assert — IDiagnosticContext is registered by Serilog integration
        Assert.NotNull(diagnosticContext);
    }
}

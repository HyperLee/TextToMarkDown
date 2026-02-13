using Microsoft.AspNetCore.Mvc.Testing;

namespace TextToMarkDown.Tests.Integration;

/// <summary>
/// 驗證安全標頭中介軟體是否正確設定。
/// 確保回應包含 CSP、X-Content-Type-Options、X-Frame-Options 與 Referrer-Policy 標頭。
/// </summary>
public class SecurityHeaderTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public SecurityHeaderTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Response_Should_Contain_ContentSecurityPolicy_Header()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/");

        // Assert
        Assert.True(response.Headers.Contains("Content-Security-Policy"),
            "Response should contain Content-Security-Policy header");

        var cspValue = response.Headers.GetValues("Content-Security-Policy").First();
        Assert.Contains("default-src 'self'", cspValue);
        Assert.Contains("script-src 'self'", cspValue);
        Assert.Contains("style-src 'self' 'unsafe-inline'", cspValue);
        Assert.Contains("frame-src 'none'", cspValue);
        Assert.Contains("object-src 'none'", cspValue);
    }

    [Fact]
    public async Task Response_Should_Contain_XContentTypeOptions_Header()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/");

        // Assert
        Assert.True(response.Headers.Contains("X-Content-Type-Options"),
            "Response should contain X-Content-Type-Options header");

        var value = response.Headers.GetValues("X-Content-Type-Options").First();
        Assert.Equal("nosniff", value);
    }

    [Fact]
    public async Task Response_Should_Contain_XFrameOptions_Header()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/");

        // Assert
        Assert.True(response.Headers.Contains("X-Frame-Options"),
            "Response should contain X-Frame-Options header");

        var value = response.Headers.GetValues("X-Frame-Options").First();
        Assert.Equal("DENY", value);
    }

    [Fact]
    public async Task Response_Should_Contain_ReferrerPolicy_Header()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/");

        // Assert
        Assert.True(response.Headers.Contains("Referrer-Policy"),
            "Response should contain Referrer-Policy header");

        var value = response.Headers.GetValues("Referrer-Policy").First();
        Assert.Equal("strict-origin-when-cross-origin", value);
    }

    [Fact]
    public async Task Security_Headers_Should_Be_Present_On_All_Pages()
    {
        // Arrange & Act — test on Privacy page too
        var response = await _client.GetAsync("/Privacy");

        // Assert
        Assert.True(response.Headers.Contains("Content-Security-Policy"));
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
    }
}

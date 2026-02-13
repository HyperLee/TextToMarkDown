using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TextToMarkDown.Tests.Integration;

public class StaticAssetTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public StaticAssetTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData("/js/markdown-converter.js")]
    [InlineData("/js/clipboard-handler.js")]
    [InlineData("/js/ui-controller.js")]
    public async Task Get_StaticAssets_ReturnsSuccessAndCorrectContentType(string url)
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync(url);

        // Assert
        // Note: Files might not exist yet, so we expect this to fail or we check if we need to create empty files first.
        // TDD: The test should fail if files are missing.
        response.EnsureSuccessStatusCode();
        Assert.Equal("text/javascript", 
            response.Content.Headers.ContentType!.ToString());
    }
}

using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TextToMarkDown.Tests.Integration;

public class IndexPageTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public IndexPageTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        response.EnsureSuccessStatusCode(); // Status Code 200-299
        Assert.Equal("text/html; charset=utf-8", 
            response.Content.Headers.ContentType!.ToString());
    }

    [Fact]
    public async Task IndexPage_ContainsRequiredUiElements()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        // Verify input area
        Assert.Contains("id=\"inputText\"", content);
        
        // Verify convert button
        Assert.Contains("id=\"convertBtn\"", content);
        
        // Verify output area
        Assert.Contains("id=\"outputText\"", content);

        // Verify copy button (US2)
        Assert.Contains("id=\"copyBtn\"", content);
    }
}

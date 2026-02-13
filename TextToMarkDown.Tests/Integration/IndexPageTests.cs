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

    /// <summary>
    /// T044: Full page end-to-end validation — verifies the complete HTML structure
    /// contains all contract-defined UI elements (page-contracts.md) and confirms
    /// FR-018 compliance (single conversion entry, no batch conversion).
    /// </summary>
    [Fact]
    public async Task IndexPage_ContainsAllContractDefinedElements()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/");
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();

        // Assert — All contract-defined UI elements (page-contracts.md GET /)
        Assert.Contains("id=\"inputText\"", content);    // textarea for user input (FR-001)
        Assert.Contains("id=\"convertBtn\"", content);   // convert button (FR-002)
        Assert.Contains("id=\"outputText\"", content);   // markdown output area (FR-003)
        Assert.Contains("id=\"copyBtn\"", content);      // copy to clipboard button (FR-004)
        Assert.Contains("id=\"alertArea\"", content);     // alert message area (FR-014)
        Assert.Contains("id=\"charCount\"", content);     // character count display
    }

    /// <summary>
    /// T044: FR-018 — Verify the page has exactly one convert button (single conversion
    /// entry point) and does not expose batch conversion functionality.
    /// </summary>
    [Fact]
    public async Task IndexPage_HasSingleConvertEntryPoint_FR018()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/");
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();

        // Assert — FR-018: Single conversion entry, no batch conversion
        // Count occurrences of convertBtn — must be exactly 1
        var convertBtnCount = CountOccurrences(content, "id=\"convertBtn\"");
        Assert.Equal(1, convertBtnCount);

        // Verify no batch/bulk conversion elements exist
        Assert.DoesNotContain("batch", content, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("bulk", content, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// T044: Verify the page loads required JavaScript modules for conversion.
    /// The individual modules (markdown-converter, clipboard-handler, ui-controller)
    /// are imported by app-init.js which is the single entry-point module.
    /// </summary>
    [Fact]
    public async Task IndexPage_LoadsRequiredScripts()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/");
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();

        // Assert — The entry-point module that imports all required modules is loaded
        // MapStaticAssets fingerprints filenames, so match the base name only
        Assert.Contains("app-init", content);
    }

    /// <summary>
    /// T044: Verify the page includes proper Bootstrap 5 structure.
    /// </summary>
    [Fact]
    public async Task IndexPage_HasProperHtmlStructure()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/");
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();

        // Assert — Proper HTML structure
        Assert.Contains("<html", content);
        Assert.Contains("</html>", content);
        Assert.Contains("charset=\"utf-8\"", content, StringComparison.OrdinalIgnoreCase);

        // Verify readonly output area
        Assert.Contains("readonly", content);
    }

    private static int CountOccurrences(string text, string pattern)
    {
        int count = 0;
        int index = 0;
        while ((index = text.IndexOf(pattern, index, StringComparison.Ordinal)) != -1)
        {
            count++;
            index += pattern.Length;
        }
        return count;
    }
}

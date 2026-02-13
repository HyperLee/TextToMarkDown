using Microsoft.AspNetCore.Mvc.RazorPages;

namespace TextToMarkDown.Pages;

/// <summary>
/// Page model for the main Text-to-Markdown converter page.
/// All conversion logic executes client-side via JavaScript; this model
/// handles page-level logging and any future server-side concerns.
/// </summary>
public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;

    /// <summary>
    /// Initialises a new instance of <see cref="IndexModel"/>.
    /// </summary>
    /// <param name="logger">Logger injected by the DI container.</param>
    public IndexModel(ILogger<IndexModel> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Handles GET requests to the converter page.
    /// Logs the page access for observability.
    /// </summary>
    public void OnGet()
    {
        _logger.LogInformation("使用者存取轉換器頁面");
    }
}

using Microsoft.AspNetCore.Mvc.RazorPages;

namespace TextToMarkDown.Pages;

/// <summary>
/// 文字轉 Markdown 工具主頁面模型。
/// 所有轉換邏輯在客戶端 JavaScript 完成。
/// </summary>
public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;

    public IndexModel(ILogger<IndexModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {
        _logger.LogInformation("使用者存取轉換器頁面");
    }
}

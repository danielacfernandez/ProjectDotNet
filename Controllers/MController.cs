using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ServiceTRAX.Models.ViewModels;
using ServiceTRAX.Utils;
using System;
using System.Threading.Tasks;

namespace ServiceTRAX.Controllers
{
    /// <summary>
    /// URL Shortening service -Used to send password reset links to SMS readers that cannot read hyperlinks
    /// </summary>
    public class MController : Controller
    {
        private readonly ILogger<HomeController> _log;
        private readonly ShortURLManager _shortURLs;
        private readonly int _shortURLDurationMinutes;

        public MController(ILogger<HomeController> Log, ShortURLManager ShortURLs, IOptions<SiteConfiguration> siteSettings)
        {
            _log = Log;
            _shortURLs = ShortURLs;
            _shortURLDurationMinutes = siteSettings.Value.ShortURLS.ExpirationTimeMinutes;
        }


        [AllowAnonymous, Route("m/{Key}")]
        public async Task<IActionResult> Index(string Key)
        {
            // Retrieve the ShortURL from the DB that belongs to the Key that the user provided
            var shortUrl = await _shortURLs.Get(Key);

            // Verify that the ShortURL was found and is not expired
            if (shortUrl != null && !shortUrl.IsExpired)
            {
                // Redirect to the URL that the ShortURL points to
                return Redirect(shortUrl.OriginalURL);
            }
            else
            {
                // ShortURL lookup failed, save to the log the Reason and TraceID 
                var logMsgParams = new
                {
                    Key,
                    TraceID = Guid.NewGuid(),
                    Reason = shortUrl == null ? "Not found" : (shortUrl.IsExpired ? "Expired" : "Unknown")
                };

                _log.LogError($"ShortURL Failure - Key [{logMsgParams.Key}] - Reason: [{logMsgParams.Reason}] - TraceID: [{logMsgParams.TraceID}]");
                return Ok($"Invalid ShortURL - Either your ShortURL does not exists or has expired (ShortURLs are valid for {_shortURLDurationMinutes / 60} hours) - Trace ID [{logMsgParams.TraceID}]");
            }
        }
    }
}

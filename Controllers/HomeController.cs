using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models;
using ServiceTRAX.Models.ViewModels;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly UserManager<ServiceTRAXUser> _userManager;
        private readonly ILogger<HomeController> _logger;
        private readonly ServiceTRAXData _data;
        private readonly string _mxbBaseURL;

        public HomeController(ILogger<HomeController> logger, ServiceTRAXData Data, UserManager<ServiceTRAXUser> userManager, IOptions<SiteConfiguration> siteSettings)
        {
            _logger = logger;
            _data = Data;
            _userManager = userManager;
            _mxbBaseURL = siteSettings.Value.MxBBaseUrl;
        }

        [Authorize]
        public async Task<IActionResult> Index(int OrganizationID)
        {
            var userOrgs = await _data.AspNetUserOrganizations_Select(User.GetUserID());

            // If the user does not have any Organization assigned or OrganizationId is not assigned (but provided and OrgID) then reject the request
            if(OrganizationID > 0 && (userOrgs.Count() == 0 || !userOrgs.Any(o => o.OrganizationId == OrganizationID)) )
            {
                return new ForbidResult(); 
            }

            // If the user has any Org assigned but didn't provided one -> then redirect to default or first
            if (OrganizationID == 0)
            {
                // If user didn't provide an OrganizationID then redirect to default location (or first if no default defined)
                var defaultOrg = userOrgs.FirstOrDefault(o => o.IsDefaultLocation == true) ?? userOrgs.First();
                return RedirectToAction(nameof(HomeController.Index), "Home", new { OrganizationID = defaultOrg.OrganizationId });
            }

            // Divide messages into Global/Org groups
            var HomePageMessages = await _data.HomePageMessages_Select(OrganizationID, User.GetUserID());
            var RegionMessages = HomePageMessages.Where(m => m.IsOrganizationMessage &&  m.OrganizationID == OrganizationID).ToList();
            var GlobalMessages = HomePageMessages.Where(m => m.IsGlobalMessage).ToList();

            var vm = new HomePageViewModel
            {
                OrganizationID = OrganizationID,
                PasswordExpirationCountdown = await PasswordExpiringInDays(),
                AvailableWidgets = await _data.WidgetsAvailableForMe(User.GetUserID()),
                WidgetsConfiguration = await _data.WidgetsSettings(User.GetUserID()),
                OrganizationMessages = RegionMessages,
                GlobalMessages = GlobalMessages
            };

            return View(vm);
        }

        private async Task<int> PasswordExpiringInDays()
        {
            var PasswordExpiringIn = (await _userManager.FindByIdAsync(User.GetUserID().ToString())).PasswordExpirationTime.Subtract(DateTime.UtcNow);
            return (int)Math.Floor(PasswordExpiringIn.TotalDays);
        }


        [Authorize]
        public IActionResult UserAvailableWidgets()
        {
            return ViewComponent("UserWidgetList");
        }

        [Authorize, HasPermission(Permissions.ReportingMenuEntry)]
        public async Task<IActionResult> RedirectToMxB()
        {
            // Refresh user token (or generate if still does not have one)
            var tokenInfo = await _data.AspNetUserToken_RefreshMxBToken(User.GetUserID());
            return Redirect($"{_mxbBaseURL}/cmd.aspx?cmd=FWDSTRAX&name={tokenInfo.Username}&token={tokenInfo.Token}");
        }

        [Authorize]
        public IActionResult ServiceTRAXError(ServiceTRAXErrorVM error)
        {
            return View(error);
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}

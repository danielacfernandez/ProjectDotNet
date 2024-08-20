using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.ViewModels;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class AdminController : Controller
    {
        private readonly IWebHostEnvironment _env;
        private readonly ServiceTRAXData _data;

        public AdminController(IWebHostEnvironment env, ServiceTRAXData data)
        {
            _env = env;
            _data = data;
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult DeliveryConditions(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult Contacts(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult LocalServiceProvider(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult Resources(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult Skills(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult Widgets(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult LogIndex(int OrganizationID)
        {
            var dirInfo = new DirectoryInfo(Path.Combine(_env.ContentRootPath, "Logs"));
            var logFiles = dirInfo.GetFiles("log-*.txt");

            return View(new ServiceTRAXAdminLogsViewModel
            {
                OrganizationID = OrganizationID,
                Files = logFiles
            });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult Log(string Filename)
        {
            var filePath = Path.Combine(Path.Combine(_env.ContentRootPath, "Logs", Filename));
            return PhysicalFile(filePath, "text/plain");
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult Customers(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> JobHeaders(int OrganizationID)
        {
            return View(new ServiceTRAXJobHeadersViewModel
            {
                OrganizationID = OrganizationID,
                ServiceTypes = await _data.Type_Service_Select(ServiceTRAXData.ServiceTypeKind.JobHeader),
                AllCustomers = await _data.Request_Customer_Select(OrganizationID, User.GetUserID())
            });
        }


        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult MACWorkCodeRate(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }
        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult MACActivityRate(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }
        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult MACReportConfig(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }
        [HasPermission(Permissions.AdminAllScreens)]
        public IActionResult HomePageMessages(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }
    }
}

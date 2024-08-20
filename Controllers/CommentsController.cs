using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceTRAX.Data;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.API;
using ServiceTRAX.Models.ViewModels;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class CommentsController : Controller
    {
        [HasPermission(Permissions.ServiceRequestCommentsReadAdd)]
        public IActionResult Index(int OrganizationID, long RequestID, long ProjectID)
        {
            var vm = new CommentsPageViewModel
            {
                OrganizationID = OrganizationID,
                ProjectID = ProjectID,
                RequestID = RequestID
            };

            return View(vm);
        }
    }
}
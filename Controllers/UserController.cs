using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.ViewModels;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class UserController : Controller
    {
        private readonly ServiceTRAXData _data;

        public UserController(ServiceTRAXData Data)
        {
            _data = Data;
        }
        public IActionResult Index(int OrganizationID)
        {
            //IEnumerable<EndUser> EndUsers = await _data.Customer_EndUser_Select(OrganizationID, null);

            //IEnumerable<Request_Customer> Customers = await _data.Request_Customer_Select(OrganizationID);

            var vm = new ServiceTRAXUserViewModel { OrganizationID = OrganizationID, UserID = User.GetUserID()/*, EndUsers = EndUsers, Customers = Customers*/ };

            return View(vm);
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.ViewModels;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class SearchController : Controller
    {
        private readonly ServiceTRAXData _data;

        public SearchController(ServiceTRAXData Data)
        {
            _data = Data;
        }

        public async Task<IActionResult> Index(int OrganizationID, 
            string ProjectName, 
            string ProjectNumber, 
            string InvoiceNumber,
            string PONumber,
            string HBQuote,
            string Customer,
            string EndUser)
        {
            var vm = new ServiceTRAXSearchViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
                EndUsers = await _data.Customer_EndUser_Select(OrganizationID, null),
                Customers = await _data.Request_Customer_Select(OrganizationID, User.GetUserID()),
                ProjectName = ProjectName,
                ProjectNumber = ProjectNumber,
                InvoiceNumber = InvoiceNumber,
                PONumber = PONumber,
                HBQuote = HBQuote,
                Customer = Customer,
                EndUser = EndUser,
                QuoteRequests = User.UserHasThisPermission(Permissions.ProjectDocumentsQuoteRequests),
                Quotes = User.UserHasThisPermission(Permissions.ProjectDocumentsQuotes),
                ServiceRequests = User.UserHasThisPermission(Permissions.ProjectDocumentsServiceRequests),
                HotSheets = User.UserHasThisPermission(Permissions.ProjectDocumentsHotSheets),
                ReportDailyStatus = User.UserHasThisPermission(Permissions.ProjectDocumentsReportDailyStatus),
                RDSEmailed = User.UserHasThisPermission(Permissions.ProjectDocumentsRDSEmailed),
                PurchaseOrders = User.UserHasThisPermission(Permissions.ProjectDocumentsPurchaseOrders),
                FileAttachments = User.UserHasThisPermission(Permissions.ProjectDocumentsFileAttachments)
            };

            return View(vm);
        }

        [HasPermission(Permissions.ProjectDocumentsAccess)]
        public async Task<IActionResult> ProjectDocuments(int OrganizationID, long? ProjectNo, long? ProjectID)
        {
            if (!ProjectNo.HasValue && ProjectID.HasValue)
            {
                ProjectNo = (await _data.ProjectJob_Keys(ProjectID, null, null)).ProjectNo;
            }

            var vm = new ServiceTRAXProjectDocumentsViewModel
            {
                OrganizationID = OrganizationID,
                Project_No = ProjectNo.Value,
                QuoteRequests = User.UserHasThisPermission(Permissions.ProjectDocumentsQuoteRequests),
                Quotes = User.UserHasThisPermission(Permissions.ProjectDocumentsQuotes),
                ServiceRequests = User.UserHasThisPermission(Permissions.ProjectDocumentsServiceRequests),
                HotSheets = User.UserHasThisPermission(Permissions.ProjectDocumentsHotSheets),
                ReportDailyStatus = User.UserHasThisPermission(Permissions.ProjectDocumentsReportDailyStatus),
                RDSEmailed = User.UserHasThisPermission(Permissions.ProjectDocumentsRDSEmailed),
                PurchaseOrders = User.UserHasThisPermission(Permissions.ProjectDocumentsPurchaseOrders),
                FileAttachments = User.UserHasThisPermission(Permissions.ProjectDocumentsFileAttachments)
            };

            return View(vm);
        }

    }
}
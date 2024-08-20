using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Mime;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Extensions.Options;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.Quote;
using ServiceTRAX.Models.ViewModels;
using ServiceTRAX.Utils;
using Syncfusion.HtmlConverter;
using Syncfusion.Pdf;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class QuoteController : Controller
    {
        private readonly ServiceTRAXData _data;
        private readonly SiteConfiguration _siteConfig;
        private readonly EmailSender _emailSender;

        public QuoteController(ServiceTRAXData data, EmailSender emailSender, IOptions<SiteConfiguration> siteConfiguration)
        {
            _data = data;
            _emailSender = emailSender;
            _siteConfig = siteConfiguration.Value;
        }

        [HasPermission(Permissions.QuoteRead)]
        public async Task<IActionResult> Index(int OrganizationID, long QuoteID)
        {
            var QuoteData = await _data.Quote_Tabs_Select(QuoteID);
            var QuoteRoles = await _data.Role_select(OrganizationID, true, QuoteID, User.GetUserID());
            var QuoteLines = await _data.Quote_QuoteLine_Select(QuoteID, false, false, User.GetUserID());
            var QuoteLinesFee = await _data.Quote_QuoteLine_Select(QuoteID, true, false, User.GetUserID());
            var QuoteLinesPMMarkup = await _data.Quote_QuoteLine_Select(QuoteID, false, true, User.GetUserID());
            var EmailContacts = (await _data.Quote_Contacts_Select(QuoteID, null, true)).Where(c => _emailSender.IsValidEmailAddress(c.Email) && !c.ContactTypeCode.Equals("job_location", StringComparison.OrdinalIgnoreCase));
            var QuoteConditions = await _data.Quote_QuoteCondition_Select(QuoteID);
            var QuoteShiftCrews = await _data.Quote_Data_Select(QuoteID);

            var QuoteHeaders = await _data.Quote_Select(QuoteID, User.GetUserID(), OrganizationID);
            QuoteHeaders.Contacts = (await _data.Request_Contacts_Select_ForQuote(OrganizationID, "customer", QuoteID)).ToList();
            QuoteHeaders.AttachmentStorage = _siteConfig.AttachmentStorageRootPath;

            var vm = new QuoteModel {
                OrganizationID = OrganizationID,
                QuoteID = QuoteID,
                Tabs = new List<QuoteDataTab>(),
                Roles = QuoteRoles,
                Lines = QuoteLines,
                LinesFee = QuoteLinesFee,
                Header = QuoteHeaders,
                LinesPMMarkup = QuoteLinesPMMarkup,
                ShiftCrews = QuoteShiftCrews,
                UserID = User.GetUserID(),
                EmailContacts = EmailContacts,
                Conditions = QuoteConditions,
                RequestID = QuoteHeaders.REQUEST_ID,
                IsReadOnlyView = !User.UserHasThisPermission(Permissions.QuoteCreateSendUpdate),// && QuoteHeaders.UseLSPRole,
                CanSetReadyToSchedule = QuoteHeaders.CanSetReadyToSchedule,
                ServiceRequestID = QuoteHeaders.ServiceRequestID,
                AddAdminFee = QuoteHeaders.AddAdminFee,
                AddFuelSrucharge = QuoteHeaders.AddFuelSrucharge,
                UserHasLSPRole = User.UserHasThisPermission(Permissions.QuoteSendUpdateToPM) && !User.UserHasThisPermission(Permissions.QuoteCreateSendUpdate), //This flag is used to send the email. If the user is LSP and it is not admin or power, then it should send the email just only to the PM.  , // User.IsInRole("Local Service Provider") && User.Roles().Count == 1,
                QuoteOrganizationId = QuoteHeaders.QuoteOrganizationId,
                UseLSPRole = QuoteHeaders.UseLSPRole,
                Time15min = await _data.Time15min_Lookup_Select()
            };
            
            bool typicalFlag = false;
            foreach (var tabName in QuoteData.Select(x => x.TabName).Distinct().ToList())
            {
                QuoteDataTab newTab = new QuoteDataTab();
                newTab.TabName = tabName;
                newTab.Pages = new List<QuoteDataPage>();
                foreach (var pageName in QuoteData.Where(x => x.TabName == tabName).Select(x => x.PageName).Distinct().ToList())
                {
                    QuoteDataPage newPage = new QuoteDataPage();
                    newPage.PageName = pageName;
                    newPage.Sections = new List<QuoteDataSection>();
                    foreach (var sectionName in QuoteData.Where(x => x.TabName == tabName && x.PageName == pageName).Select(x => x.SectionName).Distinct().ToList())
                    {
                        QuoteDataSection newSection = new QuoteDataSection();
                        newSection.SectionName = sectionName;
                        if (sectionName == "Typicals")
                        {
                            typicalFlag = true;
                        }
                        newSection.Items = new List<QuoteDataItem>();
                        foreach (var item in QuoteData.Where(x => x.TabName == tabName && x.PageName == pageName && x.SectionName == sectionName).ToList())
                        {
                            QuoteDataItem newItem = new QuoteDataItem();
                            newItem.QuoteDataID = item.QuoteDataID;
                            newItem.ItemName = item.ItemName;
                            newItem.ItemTime = item.ItemTime;
                            newItem.ItemQuantity = item.ItemQuantity;
                            newItem.IsActive = item.IsActive;
                            newSection.Items.Add(newItem);
                        }
                        newPage.Sections.Add(newSection);
                    }
                    if (!typicalFlag)
                    {
                        QuoteDataSection newSection = new QuoteDataSection();
                        newSection.SectionName = "Typicals";
                        newPage.Sections.Add(newSection);
                    }
                    typicalFlag = false;
                    newTab.Pages.Add(newPage);

                }
                vm.Tabs.Add(newTab);
            }

            return View(vm);
        }

        [HasPermission(Permissions.QuoteRead)]
        public IActionResult ListQuotes(int OrganizationID, string QRStatus, string UserType, string ViewDesc)
        {
            var vm = new ServiceTRAXListQuotesViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
                QRStatus = QRStatus,
                UserType = UserType,
                PageTitle = ViewDesc
            };

            return View(vm);
        }


    }
}
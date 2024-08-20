using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.API.TimeEntry;
using ServiceTRAX.Models.DBModels.TimeEntry;
using ServiceTRAX.Models.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class TimeEntryController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly ServiceTRAXData _data;
        private readonly string _attachmentsBasePath;

        public TimeEntryController(ILogger<HomeController> logger, ServiceTRAXData Data, IOptions<SiteConfiguration> siteSettings)
        {
            _logger = logger;
            _data = Data;
            _attachmentsBasePath = siteSettings.Value.AttachmentStorageRootPath;
        }


        public IActionResult Job(int OrganizationID, DateTime? ForDate, long? ForUserID)
        {
            // Check if the user has permissions to open job TE
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.TimeEntryJobCrewAddRemoveUpdate, Permissions.TimeEntryJobCrewRead, Permissions.TimeEntryJobPersonalClockInClockOut, Permissions.TimeEntryJobPersonalViewTimesheet }))
            {
                return new ForbidResult();
            }

            var vm = new TimeEntryJob
            {
                OrganizationID = OrganizationID,
                Date = ForDate,
                ForUserID = ForUserID
            };
            return View(vm);
        }


        public IActionResult ServiceAccount(int OrganizationID, DateTime? ForDate, long? ForUserID)
        {
            // Check if the user has permissions to open job TE
            if (!User.UserHasAnyPermission(new Permissions[] {
                Permissions.TimeEntrySvcAcctCrewAddRemoveUpdate,
                Permissions.TimeEntrySvcAcctCrewRead,
                Permissions.TimeEntrySvcAcctJobAddRemoveUpdate,
                Permissions.TimeEntrySvcAcctPersonalClockInClockOut,
                Permissions.TimeEntrySvcAcctPersonalViewTimesheet
            }))
            {
                return new ForbidResult();
            }

            var vm = new TimeEntryServiceAccount
            {
                OrganizationID = OrganizationID,
                Date = ForDate,
                ForUserID = ForUserID
            };
            return View(vm);
        }


        private bool ValidApprovalPermissions(long UserId, long? AsResourceId)
        {
            if (User.UserHasThisPermission(Permissions.ApproveMyWeekProxyApproveReject) && AsResourceId.HasValue)
            {
                return true;
            }
            if (User.UserHasThisPermission(Permissions.ApproveMyWeekPersonalApproveReject))
            {
                return true;
            }

            return false;
        }

        public async Task<IActionResult> Approval(int OrganizationID, DateTime? ForDate, long? AsResourceId)
        {
            if (!ValidApprovalPermissions(User.GetUserID(), AsResourceId))
            {
                return new ForbidResult();
            }

            // Check wether the current user has a Resource or not
            var currentResource = await _data.Resource_Select(OrganizationID, User.GetUserID());

            var resourceToUse = AsResourceId.HasValue ? AsResourceId.Value : currentResource?.ResourceId;

            var vm = new TimeEntryApproval
            {
                OrganizationID = OrganizationID,
                Date = ForDate.HasValue ? ForDate.Value.ToUniversalTime() : ForDate,
                AsUserID = User.GetUserID(),
                AsResourceID = resourceToUse,
                CanUndoRejectedTime = User.UserHasThisPermission(Permissions.ApproveMyWeekProxyApproveReject)
            };
            return View(vm);
        }

        public IActionResult TimeEntryMember(int OrganizationID)
        {
            var vm = new TimeEntryMemberViewModel
            {
                OrganizationID = OrganizationID
            };
            return View(vm);
        }
        [HasPermission(Permissions.TimeEntryBulkEnterTime)]
        public async Task<IActionResult> BulkTimeEntry(int OrganizationID, DateTime? StartDate, DateTime? EndDate)
        {
            var Now = DateTime.Now;
            var TodaysDate = new DateTime(Now.Year, Now.Month, Now.Day, 23, 59, 59);

            var bte_jobs_full = await _data.BulkTimeEntry_Job_Select(OrganizationID, User.GetUserID());
            var jobs = bte_jobs_full.Select(j => new { j.ProjectId, j.JobId, j.JobName }).Distinct();
            var requests = bte_jobs_full.Where(j => !j.RequestType.Equals("quote_request", StringComparison.OrdinalIgnoreCase)).Select(j => new { j.ProjectId, j.RequestNumber, j.RequestID, j.DESCRIPTION }).Distinct();

            var vm = new ServiceTRAXBulkTimeEntryViewModel
            {
                OrganizationID = OrganizationID,
                Jobs = jobs,
                Requests = requests,
                Members = await _data.BulkTimeEntry_Resource_Select(OrganizationID, User.GetUserID()),
                PayCodes = await _data.BulkTimeEntry_PayCode_Select(User.GetUserID()),
                StartDate = StartDate ?? (new DateTime(TodaysDate.Year, TodaysDate.Month, 1)).ToUniversalTime(),
                EndDate = EndDate ?? TodaysDate
            };

            return View(vm);
        }

        //[HasPermission(Permissions.DailyStatusRead)]
        public async Task<IActionResult> DailyStatusReport(long OrganizationID, long ServiceID, DateTime ForDate, long? RequestDailyStatusId, string[] ImageURLs)
        {

            //* Checks if current user has permission or he/she is the Lead of the service for ForDate date.
            if (!User.UserHasThisPermission(Permissions.DailyStatusRead) && (!await _data.TimeEntry_CheckLeadForServiceAndDate(ServiceID, ForDate == default ? DateTime.Now : ForDate, User.GetUserID())))
                return Ok($"Access denied");

            // If a RequestDailyStatusId is providen then try to load it
            var data = RequestDailyStatusId.HasValue ? await _data.RequestDailyStatus_Select(RequestDailyStatusId.Value) :
                    await _data.RequestDailyStatus_Select(ServiceID, ForDate.ToUniversalTime(), OrganizationID, User.GetUserID());

            if (data == null)
            {
                return Ok($"DailyStatusReport not found [{OrganizationID}][{ServiceID}][{ForDate}][{(RequestDailyStatusId.HasValue ? RequestDailyStatusId.Value : -1)}]");
            }

            var vm = new ServiceTRAXDailyStatusReportViewModel
            {
                OrganizationID = (int)OrganizationID,
                Date = data.StatusDate.ToString("d"),
                AcctMgr = data.SALESPERSONNAME,
                ServiceTraxNo = data.REQNO,
                ProjMng = data.PROJMGRNAME,
                PoNo = data.PONUMBER,
                Request_Name = data.Request_Name,
                InstallForeman = data.LEADNAME,
                ProjectName = data.ProjectName,
                ProjectStreet = data.JobLocationStreet,
                ProjectCity = data.JobLocationCity,
                ProjectState = data.JobLocationState,
                ProjectZip = data.JobLocationZip,
                ProjectScope = data.PROJECTSCOPE,
                //Workstations = data.WorkstationCount,
                //PrivateOffices = data.PrivateOfficeCount,
                //ConfRooms = data.ConfRoomCount,
                //AncillaryAreas = data.AncillaryAreaCount,
                //Seating = data.SeatingCount,
                //ProjectCompletionPctg = data.PctComplete,
                InstallationCompletedToday = data.NotesToday,
                InstallationScheduledForTotay = data.NotesTomorrow,
                ProductIssuesJobConcerns = data.NotesIssue,
                IsSaved = data.IsSaved,
                ImageIDs = data.ImageIDs,
                PunchOrChange = data.PunchOrChange,
                CleanedAndCollected = data.CleanedAndCollected,
                CheckWithClient = data.CheckWithClient,
                GearsAndToolsCollected = data.GearsAndToolsCollected,
                IsPaperworkSignedOff = data.IsPaperworkSignedOff,
                VendorBadgesOrKeysReturned = data.VendorBadgesOrKeysReturned,
                ProductReturnFormsCompleted = data.ProductReturnFormsCompleted
            };

            var imgsByTwo = new List<List<long>>();
            var imgs = data.ImageIDs.ToArray();
            for (int i = 0; i < imgs.Length; i = i + 2)
            {
                var pageImgs = new List<long>();
                pageImgs.Add(imgs[i]);
                if (i + 1 < imgs.Length)
                {
                    pageImgs.Add(imgs[i + 1]);
                }
                imgsByTwo.Add(pageImgs);
            }

            ViewBag.PageImages = imgsByTwo;

            return View(vm);
        }


        [Route("[controller]/DSRImage/{RequestDailyStatusImageId}")]
        public async Task<IActionResult> GetDSRImageImpl(long RequestDailyStatusImageId)
        {
            try
            {
                var ImgInfo = await _data.RequestDailyStatusImage_Select(RequestDailyStatusImageId);
                var fullpath = $"{_attachmentsBasePath}\\{ImgInfo.RelativePath}\\{ImgInfo.Filename}";

                // PhysicalFileResult does not throw an exception if the file is not found  (file is resolved later in the rquest response)
                // so do a manual check for the file exisntence
                if (System.IO.File.Exists(fullpath))
                {
                    return new PhysicalFileResult(fullpath, GetContentType());
                }
                else
                {
                    return NotFound();
                }

                //
                //
                string GetContentType()
                {
                    var contentTypeProvider = new FileExtensionContentTypeProvider();
                    string contentType = string.Empty;
                    if (!contentTypeProvider.TryGetContentType(fullpath, out contentType))
                    {
                        contentType = "application/octet-stream";
                    }
                    return contentType;
                }

            }
            catch (Exception e)
            {
                _logger.LogError(e, "GetFile Exception");
                return BadRequest();
            }
        }


        [HasPermission(Permissions.TimeEntryBulkEnterTime)]
        public async Task<IActionResult> Expenses(int OrganizationID)
        {
            var vm = new ServiceTRAXExpensesViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
                Jobs = await _data.Expenses_Job_Select(OrganizationID, User.GetUserID()),
                Resources = await _data.Expenses_Resource_Select(OrganizationID, User.GetUserID())
                //PayCodes = await _data.BulkTimeEntry_PayCode_Select(User.GetUserID())
            };

            return View(vm);
        }

        public IActionResult ClockedInNotClockedOut(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }
        
        public IActionResult Callouts(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        public IActionResult RejectedTimesheets(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }
    }
}
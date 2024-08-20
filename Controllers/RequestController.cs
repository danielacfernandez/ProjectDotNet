using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.API;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.HotSheet;
using ServiceTRAX.Models.ViewModels;
using ServiceTRAX.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class RequestController : Controller
    {
        private readonly ServiceTRAXData _data;
        private readonly ILogger<RequestController> _logger;
        private readonly FileStorageManager _fileStorage;
        private readonly String _masterDocumentBasePath;

        public RequestController(ServiceTRAXData data, ILogger<RequestController> logger, FileStorageManager fileStorage, IOptions<SiteConfiguration> siteSettings)
        {
            _data = data;
            _logger = logger;
            _fileStorage = fileStorage;
            _masterDocumentBasePath = siteSettings.Value.MasterDocumentStorageRootPath;
        }


        private bool UserHasPermissions(bool IsNew, bool IsSR, bool IsMACServiceRequest)
        {
            if (IsNew)
            {
                // Create a new Quote Request
                if (!IsSR && User.UserHasThisPermission(Permissions.QuoteRequestCreateUpdateApproveCancel))
                {
                    return true;
                }

                // Create a new Service Request
                if (IsSR && User.UserHasThisPermission(Permissions.ServiceRequestCreateUpdateSetPunch))
                {
                    return true;
                }
            }
            else
            {
                // Open a Quote Request
                if (!IsSR && User.UserHasThisPermission(Permissions.QuoteRequestRead))
                {
                    return true;
                }

                // Open a standard Service Request 
                if (IsSR && User.UserHasThisPermission(Permissions.ServiceRequestRead) && !IsMACServiceRequest)
                {
                    return true;
                }

                // Open a MAC Service Request 
                if (IsSR && User.UserHasThisPermission(Permissions.MACServiceRequestRead) && IsMACServiceRequest)
                {
                    return true;
                }
            }


            return false;
        }

        //public IActionResult TestPrint()
        //{
        //    var signer = new Utils.PDFeSignOff("", Request.Cookies);
        //    var stream = new System.IO.MemoryStream();
        //    signer.TestingPrint(stream);
        //    stream.Position = 0;
        //    return new FileStreamResult(stream, "application/pdf");
        //    //return Ok();

        //}


        //public IActionResult RequestToPdf(long RequestID, long OrganizationID)
        //{
        //    var signer = new Utils.PDFeSignOff(Request.Cookies);
        //    var stream = new System.IO.MemoryStream();
        //    signer.PrintRequestToPDF(RequestID, OrganizationID, stream);
        //    stream.Position = 0;
        //    return new FileStreamResult(stream, "application/pdf");
        //}
        [Route("[controller]/downloadpoinvoicefile/{FILENAME}")]
        public IActionResult DownloadPOInvoiceFile(string FILENAME)
        {
            return GetFileImpl(FILENAME).Result;
        }
        private string GetContentType(string FileFullPath)
        {
            var contentTypeProvider = new FileExtensionContentTypeProvider();
            string contentType = string.Empty;
            if (!contentTypeProvider.TryGetContentType(FileFullPath, out contentType))
            {
                contentType = "application/octet-stream";
            }
            return contentType;
        }
        private async Task<IActionResult> GetFileImpl(string FILENAME)
        {
            try

            {
                string fullpath = "";

                fullpath = Path.Combine(_masterDocumentBasePath, FILENAME);
                    

                if (System.IO.File.Exists(fullpath))
                {
                    return new PhysicalFileResult(fullpath, GetContentType(fullpath));
                }

                return NotFound();

            }
            catch (Exception e)
            {
                _logger.LogError(e, "GetFile Exception");
                return BadRequest();
            }
        }
        public async Task<IActionResult> Index(int OrganizationID, long RequestID = 399780, bool IsNew = false, bool IsAdditionalRequest = false, bool IsSR = false, bool IsStatic = false)
        {
            string Request_Contact_Type = "customer";
            string Location_Contact_Type = "job_location ";

            var RequestStatuses = await _data.Request_Status_Select();

            Request_Data RequestData;
            IEnumerable<int> RequestContacts;
            IEnumerable<int> RequestLocationContacts;
            IEnumerable<Attachment> Attachments;
            IEnumerable<EndUser> EndUsers;
            IEnumerable<JobLocation> JobLocations;
            IEnumerable<RequestProduct> RequestProducts;
            IEnumerable<Request_Contact> LocationContacts;
            QuoteEstimatorData QuoteEstimatorData;
            IEnumerable<Request_HotSheet> HotSheets;
            IEnumerable<RequestResource> Resources;
            IEnumerable<Request_Contact> AllCustomerContacts;

            var ScheduleTypes = await _data.Schedule_Type_Select();

            int currentOrganizationId = OrganizationID;

            string QuoteRequestActualStatusCode = "qr_created";
            if (!IsNew)
            {
                RequestData = await _data.Request_Data_Select(OrganizationID, RequestID, User.GetUserID());
                currentOrganizationId = RequestData.organization_id > 0 ? RequestData.organization_id : OrganizationID;
                IsSR = RequestData?.record_type_code.ToLower() == "service_request" || RequestData?.record_type_code.ToLower() == "workorder";

                if (RequestData != null)
                {
                    RequestContacts = (await _data.Request_Contacts_Select(currentOrganizationId, RequestID, Request_Contact_Type)).Select(c => c.Contact_ID);
                    RequestLocationContacts = (await _data.Request_Contacts_Select(currentOrganizationId, RequestID, Location_Contact_Type)).Select(c => c.Contact_ID);
                    Attachments = await _data.Request_Attachment_Select(RequestID, null, RequestData.request_no, RequestData.version_no, null, null);
                    EndUsers = await _data.Customer_EndUser_Select(currentOrganizationId, RequestData.customer_id);
                    JobLocations = await _data.Job_Location_Select(currentOrganizationId, RequestData.end_user_id, null);
                    RequestProducts = await _data.Request_Products_Select(RequestData.request_id);
                    QuoteRequestActualStatusCode = RequestStatuses.FirstOrDefault(s => s.id == RequestData.request_status_id)?.code ?? "Unknown";
                    LocationContacts = await _data.Job_Location_Contacts_Select(RequestData.job_location_id);
                    AllCustomerContacts = await _data.Customer_Contacts_Select(currentOrganizationId, RequestData.customer_id);
                    QuoteEstimatorData = await _data.Request_QuoteEstimatorData(RequestID);
                    Resources = await _data.Request_Resources_Select(currentOrganizationId, RequestID, User.GetUserID());
                    HotSheets = await _data.Request_Hotsheets_Select(RequestID, User.GetUserID());
                }
                else
                {
                    return RedirectToAction("ServiceTRAXError", "Home", new ServiceTRAXErrorVM
                    {
                        ErrorTitle = "Request Not Found!",
                        ErrorDescription = $"Request # {RequestID} for Organization {OrganizationID} does not exists.",
                        OrganizationID = OrganizationID
                    });
                }
            }
            else
            {
                if (IsSR)
                {
                    RequestData = new Request_Data
                    {
                        request_status_id = RequestStatuses.FirstOrDefault(s => s.code == "sr_created").id,
                        schedule_type_id = ScheduleTypes.First(s => s.code == "date").id,
                        record_type_code = "service_request"
                    };
                }
                else
                {
                    RequestData = new Request_Data
                    {
                        request_status_id = RequestStatuses.FirstOrDefault(s => s.code == "qr_created").id,
                        schedule_type_id = ScheduleTypes.First(s => s.code == "date").id,
                        record_type_code = "quote_request"
                    };
                }

                RequestData.a_m_sales_contact_id = await _data.SalespersonIDByName_Select(currentOrganizationId, await _data.ConfigSystem_Select<string>(currentOrganizationId, "SalespersonDefault").ConfigureAwait(false));


                // If is an Additional Request set the project_id for the RequestData
                
                if (IsAdditionalRequest)
                {
                    var origRequestData = await _data.Request_Data_Select(currentOrganizationId, RequestID, User.GetUserID());
                    RequestData.project_id = origRequestData.project_id;
                    RequestData.project_name = origRequestData.project_name;
                    RequestData.Request_Name = origRequestData.Request_Name;
                    RequestData.quote_or_order_type_id = origRequestData.quote_or_order_type_id;
                    RequestData.SchedulerPMContactID = origRequestData.SchedulerPMContactID;
                    RequestData.job_location_id = origRequestData.job_location_id;
                    RequestData.customer_id = origRequestData.customer_id;
                    RequestData.project_type_id = origRequestData.project_type_id;
                    RequestData.end_user_id = origRequestData.end_user_id;
                    RequestData.Quote_Number = "NEW";
                    RequestData.project_no = origRequestData.project_no;
                    RequestData.version_no = 1;
                    RequestData.IsSendToSchedule = origRequestData.IsSendToSchedule;
                    RequestData.IsInternalRequest = origRequestData.IsInternalRequest;

                    EndUsers = await _data.Customer_EndUser_Select(currentOrganizationId, origRequestData.customer_id);
                    JobLocations = await _data.Job_Location_Select(currentOrganizationId, origRequestData.end_user_id, null);
                    LocationContacts = await _data.Job_Location_Contacts_Select(origRequestData.job_location_id);
                    RequestLocationContacts = (await _data.Request_Contacts_Select(currentOrganizationId, RequestID, Location_Contact_Type)).Select(c => c.Contact_ID);
                    AllCustomerContacts = await _data.Customer_Contacts_Select(currentOrganizationId, origRequestData.customer_id);
                }
                else
                {
                    EndUsers = Enumerable.Empty<EndUser>();
                    JobLocations = Enumerable.Empty<JobLocation>();
                    AllCustomerContacts = Enumerable.Empty<Request_Contact>();
                    RequestLocationContacts = Enumerable.Empty<int>();
                    LocationContacts = Enumerable.Empty<Request_Contact>();
                }

                RequestContacts = Enumerable.Empty<int>();
                Attachments = Enumerable.Empty<Attachment>();
                RequestProducts = Enumerable.Empty<RequestProduct>();
                HotSheets = Enumerable.Empty<Request_HotSheet>();
                QuoteEstimatorData = null;
                Resources = Enumerable.Empty<RequestResource>();
            }

            IEnumerable<Request_Customer> AllCustomers;
            if (IsSR)
            {
                AllCustomers = await _data.Request_Customer_Select(currentOrganizationId, User.GetUserID(), "service", RequestID);
            }
            else
            {
                AllCustomers = await _data.Request_Customer_Select(currentOrganizationId, User.GetUserID(), "quote",RequestID);
            }
            
            var IsProspectCustomer = AllCustomers.Where(c => c.Customer_Id == RequestData.customer_id).FirstOrDefault()?.IsProspect ?? true;

            var IsMACServiceRequest = IsSR && RequestData.project_type_id == 5;  /* MAC Project Type ID - TODO: Better use code*/

            var CommentsCanReadAdd = IsSR && User.UserHasThisPermission(Permissions.ServiceRequestCommentsReadAdd) && !IsMACServiceRequest
                                     || !IsSR && User.UserHasThisPermission(Permissions.QuoteRequestCommentsReadAdd) && !IsMACServiceRequest
                                     || IsSR && User.UserHasThisPermission(Permissions.MACServiceRequestCommentsReadAdd) && IsMACServiceRequest;

            // WorkOrder fixes
            // Set Weekend flag to 'N' if null to prevent date calcualtion issues
            RequestData.include_weekends_flag = RequestData.include_weekends_flag ?? 'N';

            //
            // Verify Permissions 
            //
            if (!UserHasPermissions(IsNew, IsSR, IsMACServiceRequest))
            {
                return new ForbidResult();
            }

            var vm = new QuoteRequestModel {
                IsNew = IsNew,
                IsAdditionalRequest = IsAdditionalRequest,

                IsSR = IsSR,
                IsMACServiceRequest = IsMACServiceRequest,
                CommentsCanReadAdd = CommentsCanReadAdd,


                IsReadOnly = IsReadOnly(),

                ReadOnlyServiceDate = IsReadOnly() || IsInStatuses(new string[] { "soft_scheduled", "hard_scheduled", "ready_to_schedule" }),
                ReadOnlyLSP = !IsInStatuses(new string[] { "qr_created", "qr_sent" }) || !User.UserHasThisPermission(Permissions.LSPOptionsEditable),

                CanSave = IsInStatuses(new string[] { "qr_created", "sr_created" }),
                CanSend = IsInStatus("qr_created"),
                CanApprove = IsInStatus("quoted") && !IsProspectCustomer,
                NeedsCustomer = (IsInStatus("quoted") && IsProspectCustomer) || (IsInStatus("sr_created") && IsProspectCustomer),
                CanCancel = IsInStatus("quoted"),
                CanOpenQR = IsInStatus("qr_sent") && User.UserHasThisPermission(Permissions.QuoteRequestOpenQR),
                CanSeeSurcharge = User.UserHasThisPermission(Permissions.ServiceRequestFuelSurchargeAdminFee),
                CanQuote = IsInStatus("qr_sent") && (User.UserHasThisPermission(Permissions.QuoteCreateSendUpdate) || User.IsInRole("Local Service Provider")),
                CanSoftSchedule = IsInStatus("sr_created") && IsSR && User.UserHasThisPermission(Permissions.ServiceRequestSoftSchedule)
                                    && (!IsReadOnly() || User.UserHasThisPermission(Permissions.ServiceRequestSoftScheduleOnServiceStartDaysLock))
                                    && !IsProspectCustomer,
                CanHardSchedule = IsInStatus("ready_to_schedule") && !IsReadOnly(),
                CanCreateNewQRVersion = !IsSR && IsInStatuses(new string[] { "qr_created", "quote_created" }),
                RequiresServiceDateApproval = IsInStatus("approval_required"),
                RequiresReScheduleApproval = IsInStatus("proposed_reschedule"),
                IsReadyToSchedule = IsInStatus("soft_scheduled"),
                IsHardScheduled = IsInStatus("hard_scheduled"),
                CanReschedule = IsInStatuses(new string[] { "soft_scheduled", "hard_scheduled", "ready_to_schedule" }),
                CanCreateNewSRVersion = IsSR && !IsInStatuses(new string[] { "hard_scheduled", "ready_to_schedule", "sr_cancelled", "completed" }),

                CanCloseSR = !RequestData.CanReOpen && (IsSR && IsInStatuses(new string[] { "sr_created", "soft_scheduled", "hard_scheduled", "ready_to_schedule" })
                                                            && User.UserHasThisPermission(Permissions.ServiceRequestFlagComplete))
                                || (IsMACServiceRequest && IsInStatuses(new string[] { "sr_created", "soft_scheduled", "hard_scheduled", "ready_to_schedule" })
                                && User.UserHasThisPermission(Permissions.MACServiceRequestCreateUpdateClose)),


                CanCancelSR = !IsNew && IsSR && !IsInStatuses(new string[] { "sr_cancelled", "completed" }) && User.UserHasThisPermission(Permissions.ServiceRequestCancel)
                            && (User.UserHasThisPermission(Permissions.ServiceRequestUnrestrictedEditionDate) || (!User.UserHasThisPermission(Permissions.ServiceRequestUnrestrictedEditionDate) && !RequestData.within_srstart_lockperiod))
                            && !IsReadOnly(),
                ReadonlyDueFiveDaysLimit = RequestData.within_srstart_lockperiod && IsSR && !User.UserHasThisPermission(Permissions.ServiceRequestUnrestrictedEditionDate),
                ReadonlyDueServiceStartDateLockPeriod = RequestData.within_srstart_lockperiod && IsSR && !User.UserHasThisPermission(Permissions.ServiceRequestUnrestrictedEditionDate),

                ServiceStartDateLockPeriod = await _data.ConfigSystem_Select<int>(currentOrganizationId, "ServiceRequest_LockPeriod_Days"),

                QuoteRequestStatus = RequestStatuses.FirstOrDefault(s => s.id == RequestData.request_status_id)?.name ?? "Unknown",
                OrganizationID = OrganizationID,
                ServiceTypes = await GetAvailableServiceTypes(),
                Salespersons = await _data.Salesperson_Select(currentOrganizationId),
                Request_Data = RequestData,
                SystemsFurniture = await _data.System_Furniture_Select(),
                ShippingMethod = await _data.Shipping_Method_Select(),
                RequestContacts = RequestContacts,
                ProjectManagers = await _data.Project_Manager_Select(currentOrganizationId),
                AllCustomers = AllCustomers,
                AllCustomerContacts = AllCustomerContacts,
                RequestProduct = RequestProducts.Where(p => string.IsNullOrEmpty(p.Product_Other)),
                RequestProductOther = RequestProducts.Where(p => !string.IsNullOrEmpty(p.Product_Other)),
                CustomerTypes = await _data.Customer_Types(),
                Attachments = Attachments,
                ElevatorTypes = await _data.ElevatorAvailableType_Select(),
                BillingTypes = await _data.Billing_Type_Select(),
                CustomerCostingTypes = await _data.Customer_Costing_Type_Select(),
                QuoteOrOrderTypes = await _data.Quote_Or_Order_Type_Select(),
                ScheduleTypes = ScheduleTypes,
                WorkTypes = await _data.Work_Type_Select(),
                EndUsers = EndUsers,
                JobLocations = JobLocations,
                SecurityAccessKinds = await _data.Security_Access_Select(),
                MultiLevelTypes = await _data.Multi_Level_Type_Select(),
                RequestLocationContacts = RequestLocationContacts,
                LocationContacts = LocationContacts,
                QuoteEstimatorData = QuoteEstimatorData,
                Resources = Resources,
                CustomFields = await _data.CustomCols_Select(RequestID, IsAdditionalRequest),
                HotSheets = HotSheets,
                ProspectCustomerFormEmail = await _data.ConfigSystem_Select<string>(OrganizationID, "ProspectCustomerFormEmailAddress"),
                CanSaveSRMissingFieldsOnSoftSchedule = IsSR && User.UserHasThisPermission(Permissions.ServiceRequestSoftScheduleOnServiceStartDaysLock) && IsInStatus("sr_created"),
                CurrentUserFullName = User.Identity.FullName(),
                CurrentUserID = User.GetUserID(),
                OrganizationLocations = await _data.Resource_Location_Select(currentOrganizationId),
                //OrganizationLocations = IsSR ? await _data.Resource_Location_Select(OrganizationID) : Enumerable.Empty<Models.DBModels.Scheduler.OrganizationLocation>(),
                OrganizationLocationControl = OrganizationLocationSelectStatus(),
                LocalServiceProviders = await _data.LocalServiceProvider_Select(),
                ShowStartDateWarning = User.IsInRole("Client ADMIN") || User.IsInRole("ACI"),
                IsDSRAvailable = IsInStatuses(new string[] { "sr_created", "soft_scheduled", "ready_to_schedule", "hard_scheduled" }),
                IsLSPUser = User.IsInRole("Local Service Provider"),
                timeZoneOffset = RequestData.TimeZoneOffset

            };

            var view = IsStatic ? View("RequestStatic", vm) : View(vm);
            return view;


            // Local functions
            string OrganizationLocationSelectStatus()
            {
                //return "editable";
                 if (IsSR)
                 {
                     if(IsInStatus("soft_scheduled" ))
                     {
                         return "editable";
                     }
                     if (IsInStatuses(new string[] { "hard_scheduled", "ready_to_schedule", "closed", "completed"}))
                     {
                         return "readonly";
                     }
                 }
                 return "hidden";
            }
            
            bool IsInStatus(string Status)
            {
                return QuoteRequestActualStatusCode.Equals(Status, StringComparison.OrdinalIgnoreCase);
            }

            bool IsInStatuses(string[] Statuses)
            {
                return Statuses.Any(s => IsInStatus(s));
            }

            bool IsReadOnly()
            {
                return (!IsSR && !IsInStatus("qr_created"))
                                // If is a SR and it's less than 5 days within Start and the user does not have the Unrestricted Edition Date permission ->  set the Readonly Flag as TRUE
                                || (RequestData.within_srstart_lockperiod && IsSR && !User.UserHasThisPermission(Permissions.ServiceRequestUnrestrictedEditionDate))
                                || (IsSR && !User.UserHasThisPermission(Permissions.MACServiceRequestCreateUpdateClose) && IsMACServiceRequest)
                                || IsInStatuses(new string[] { "sr_cancelled", "completed" })
                                || (IsSR && !RequestData.IsActiveSR)
                                || !User.UserHasThisPermission(Permissions.RequestEdit);
            }

            async Task<IEnumerable<ServiceType>> GetAvailableServiceTypes()
            {
                // For users that cannot create WHSE or Svc Acct jobs return only "Furniture" (code==project) type
                if (IsNew && !User.UserHasThisPermission(Permissions.RequestWHSEandSvcAcctTypesOfService))
                {
                    return await _data.Type_Service_Select(ServiceTRAXData.ServiceTypeKind.RequestUserWithoutSvcAcctPermission);
                }
                else if (IsNew)
                {
                    return await _data.Type_Service_Select(ServiceTRAXData.ServiceTypeKind.RequestNew);
                }

                return await _data.Type_Service_Select(ServiceTRAXData.ServiceTypeKind.RequestReadOnly);
            }

            
        }

        [HttpPost]
        public async Task<IActionResult> UploadInvoice(InvoiceAPIData inv)
        {
            try
            {
                IFormFile file = inv.InvoiceFile;
                var md5 = MD5.Create();
                var sha1 = SHA1.Create();


                var checksumMD5 = md5.ComputeHash(file.OpenReadStream());
                string checksumMD5Value = string.Concat(checksumMD5.Select(x => x.ToString("X2")));
                var checksumSHA1 = sha1.ComputeHash(file.OpenReadStream());
                string checksumSHA1Value = string.Concat(checksumSHA1.Select(x => x.ToString("X2")));


                var result = await _data.POInvoice_Insert(inv.POId, inv.InvoiceDate, inv.Amount, inv.InvoiceNumber, inv.InvoiceFile.FileName, checksumMD5Value, checksumSHA1Value, User.GetUserID());
                // Save request attachments
                await _fileStorage.SavePOInvoiceFile(inv.InvoiceFile, checksumMD5Value, checksumSHA1Value);

                if (!inv.RedirectToBilling)
                {
                    if (result.Succeeded)
                        return RedirectToAction("PurchaseOrders", "Request", new { OrganizationID = inv.OrganizationID, requestid = inv.RequestID, projectid = inv.ProjectID });
                    else
                        return RedirectToAction("PurchaseOrders", "Request", new { OrganizationID = inv.OrganizationID, requestid = inv.RequestID, projectid = inv.ProjectID, importErrors = result.ErrorMessage });
                }
                else
                {
                    if (result.Succeeded)  
                        return RedirectToAction("ByJob", "Billing", new { OrganizationID = inv.OrganizationID, JobID = inv.JobID, SelectedTab = "POINVOICES" });
                    else
                        return RedirectToAction("ByJob", "Billing", new { OrganizationID = inv.OrganizationID, JobID = inv.JobID, SelectedTab = "POINVOICES", importErrors = result.ErrorMessage });
                }
            }
            catch (Exception e)
            {

                return RedirectToAction("PurchaseOrders", "Request", new { importErrors = e.Message });
            }
        }

        [HasPermission(Permissions.QuoteRequestRead)]
        public IActionResult ListQRs(int OrganizationID, string ViewDesc, string QRStatus, string UserType)
        {
            var vm = new ServiceTRAXQRListTEGViewModel
            {
                OrganizationID = OrganizationID,
                QRStatus = QRStatus,
                UserType = UserType,
                PageTitle = ViewDesc
            };

            return View(vm);
        }

        [HasPermission(Permissions.ServiceRequestList)]
        public IActionResult ListSRs(int OrganizationID, string ViewDesc, string SRStatus, string UserType, int? XDays, bool OnlyNotAssigned, int? IncludePunchlist)
        {
            var vm = new ServiceTRAXSRListTEGViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
                PageTitle = ViewDesc,
                SRStatus = SRStatus,
                UserType = UserType,
                XDays = XDays,
                OnlyNotAssigned = OnlyNotAssigned,
                IncludePunchlist = IncludePunchlist ?? 1
            };

            return View(vm);
        }

        [HasPermission(Permissions.MACServiceRequestList)]
        public IActionResult ListServiceAccountJobs(int OrganizationID)
        {
            return View(new ServiceTRAXSVCACCTJobsListTEGViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID()
            });
        }

        [HasPermission(Permissions.ServiceRequestCreateUpdateSetPunch)]
        public IActionResult PunchList(int OrganizationID, long RequestID, long ProjectID)
        {
            var vm = new ServiceTRAXPunchViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
                RequestID = RequestID,
                ProjectID = ProjectID
            };

            return View(vm);
        }

        [HasPermission(Permissions.POTrackingReadCreateUpdateClose)]
        public IActionResult PurchaseOrders(int OrganizationID, long RequestID, long ProjectID)
        {
            var vm = new ServiceTRAXPurchaseOrdersViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
                RequestID = RequestID,
                ProjectID = ProjectID,
                IsEnableEdit = User.UserHasThisPermission(Permissions.POEditable),
                IsAllowedToApprove = User.UserHasThisPermission(Permissions.CanApprovePOInvoices),
                IsLSPUser = User.IsInRole("Local Service Provider"),
                IsOnlyLSPUser = User.IsInRole("Local Service Provider") && User.Identity.Roles().Count() == 1
            };
            return View(vm);
        }


        [HasPermission(Permissions.HotSheetsBOLRead)]
        public IActionResult HotSheetsList(int OrganizationID, long RequestID, long ProjectID)
        {
            var vm = new ServiceTRAXListHotSheetsViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
                RequestID = RequestID,
                ProjectID = ProjectID
            };

            return View(vm);
        }

        [HasPermission(Permissions.HotSheetsBOLRead)]
        public async Task<IActionResult> HotSheet(string HotSheet, int HotSheetID, long? OrganizationID, long? RequestID, bool IsStatic = false)
        {
            HotSheetData HotSheetModel;
            Request_Data req_data = null;
            if (!string.IsNullOrEmpty(HotSheet))
            {
                HotSheetModel = JsonConvert.DeserializeObject<HotSheetData>(Uri.UnescapeDataString(HotSheet));
                // Load the Description from the Request (added by SilvioM because long descriptions were breaking the URL)
                req_data = await _data.Request_Data_Select(OrganizationID.Value, HotSheetModel.RequestID, User.GetUserID());
                HotSheetModel.Description = req_data.description;
            }
            else
            {
                //if (RequestID.HasValue)
                //{
                //    req_data = await _data.Request_Data_Select(OrganizationID.Value, RequestID.Value, User.GetUserID());
                //}
                //else
                //{
                //    var hsdata = await _data.Request_Hotsheet_Select(HotSheetID, User.GetUserID());
                //    req_data = await _data.Request_Data_Select(OrganizationID.Value, hsdata.requestID, User.GetUserID());
                //    RequestID = req_data.request_id;
                //}

                req_data = await _data.Request_Data_Select(OrganizationID.Value, RequestID.Value, User.GetUserID());

                if (req_data == null)
                {
                    return Ok($"Request data for OrgID=[{OrganizationID.Value}] ReqID=[{RequestID.Value}] was not found.");
                }

                var AllCustomers = await _data.Request_Customer_Select(OrganizationID.Value, User.GetUserID());
                var Salespersons = await _data.Salesperson_Select(OrganizationID.Value);
                var EndUsers = await _data.Customer_EndUser_Select(OrganizationID.Value, req_data.customer_id);
                var RequestLocationContacts = (await _data.Request_Contacts_Select(OrganizationID.Value, RequestID.Value, "job_location ")).Select(c => c.Contact_ID);

                HotSheetModel = new HotSheetData
                {
                    //HotSheetID: 0,
                    HotSheetID = 0,
                    //OrganizationID: model.organizationID,
                    OrganizationID = (int)OrganizationID.Value,
                    //RequestID: model.request_Data.request_id,
                    RequestID = RequestID.Value,
                    //JobName: model.request_Data.project_name,
                    JobName = req_data.project_name,
                    //CustomerName: model.allCustomers.filter(cust => cust.customer_Id === model.request_Data.customer_id())[0]?.customer_Name,
                    CustomerName = AllCustomers.Where(c => c.Customer_Id == req_data.customer_id).FirstOrDefault()?.Customer_Name,
                    //EndUserName: model.endUsers.filter(user => user.end_user_id === model.request_Data.end_user_id())[0]?.end_user_name,
                    EndUserName = EndUsers.Where(eu => eu.end_user_id == req_data.end_user_id).FirstOrDefault()?.end_user_name,
                    //EndUserID: model.request_Data.end_user_id(),
                    EndUserID = req_data.end_user_id.HasValue ? req_data.end_user_id.Value : 0,
                    //SalesContact: model.salespersons.filter(sp => sp.salespersonID === model.request_Data.a_m_sales_contact_id())[0]?.salespersonName,
                    SalesContact = Salespersons.Where(sp => sp.SalespersonID == req_data.a_m_sales_contact_id).FirstOrDefault()?.SalespersonName,
                    //JobLocationID: model.request_Data.job_location_id(),
                    JobLocationID = req_data.job_location_id.HasValue ? req_data.job_location_id.Value : 0,
                    //ContactID: model.requestLocationContacts[0]?.Contact_ID,
                    ContactID = RequestLocationContacts.FirstOrDefault(),
                    //Description: model.request_Data.description(),
                    Description = req_data.description,
                    //OrigContactID: model.request_Data.project_Manager_Id(),
                    OrigContactID = req_data.Project_Manager_Id,
                    //WorkDate: model.request_Data.est_start_date(),
                    WorkDate = req_data.est_start_date,
                    //PONo: model.request_Data.dealer_po_no()
                    PONo = req_data.dealer_po_no
                };
            }

            IEnumerable<HotSheetSavedEquipment> SavedEquipment = Enumerable.Empty<HotSheetSavedEquipment>();
            IEnumerable<HotSheetSavedVehicle> SavedVehicle = Enumerable.Empty<HotSheetSavedVehicle>();
            HotSheetDateData DateData = new HotSheetDateData();
            HotSheetAPIData APIData;
            string SpecialInstructions, CreatedBy = "", ModifiedBy = "", Hotsheet_Identifier = "NEW";
            DateTime? DateCreated = null;
            DateTime? DateModified = null;

            var Vehicles = await _data.Request_HotsheetVehicleList_Select();
            var JobLocations = await _data.Job_Location_Select(HotSheetModel.OrganizationID, HotSheetModel.EndUserID, null);
            var OrigLocations = await _data.Job_Location_List_Select(HotSheetModel.OrganizationID);
            var OrigContacts = (await _data.Request_HotsheetOriginContacts_Select(HotSheetModel.RequestID, User.GetUserID())).ToList();
            var DestinationContacts = await _data.Job_Location_Contacts_Select(HotSheetModel.JobLocationID);
            var Equipment = await _data.Request_HotsheetEquipmentList_Select();


            

            if (HotSheetID == 0)
            {
                var hotSheetRequestSchedules = await _data.Request_Schedule_Select(HotSheetModel.RequestID, HotSheetModel.WorkDate, User.GetUserID());
                DateData = hotSheetRequestSchedules.FirstOrDefault() ?? new HotSheetDateData();
                SpecialInstructions = string.Empty;
                HotSheetModel.OrigLocationID = await _data.ConfigSystem_Select<long>(HotSheetModel.OrganizationID, "Regional_Warehouse");
            }
            else
            {
                APIData = await _data.Request_Hotsheet_Select(HotSheetID, User.GetUserID());
                DateData.DriverQty = APIData.DriverQty;
                DateData.InstallerQty = APIData.InstallerQty;
                DateData.JobLength = APIData.JobLength;
                DateData.LeadQty = APIData.LeadQty;
                DateData.MoverQty = APIData.MoverQty;
                DateData.OnSiteStartTime = APIData.OnSiteStartTime;
                DateData.WarehouseStartTime = APIData.WarehouseStartTime;
                DateData.RequestScheduleId = APIData.RequestScheduleId;
                //HotSheetModel.ContactID = APIData.contactID;
                HotSheetModel.JobLocationID = APIData.jobLocationID;
                HotSheetModel.OrigContactID = APIData.origContactID;
                HotSheetModel.OrigLocationID = APIData.origLocationID;
                HotSheetModel.WorkDate = APIData.workDate;
                SavedEquipment = await _data.Request_HotsheetEquipment_Select(HotSheetID, User.GetUserID());
                SavedVehicle = await _data.Request_HotsheetVehicle_Select(HotSheetID, User.GetUserID());
                SpecialInstructions = APIData.specialInstructions;
                DateCreated = APIData.Date_Created;
                CreatedBy = APIData.Created_By;
                DateModified = APIData.Date_Modified;
                ModifiedBy = APIData.Modified_By;
                Hotsheet_Identifier = APIData.Hotsheet_Identifier;
                //if (APIData.origContactID == null)
                //{
                //    OrigContacts.Add(new Request_Contact
                //    {
                //        Contact_ID = -1,
                //        Contact_Name = APIData.OriginContactName,
                //        Contact_Phone = APIData.OriginContactPhone,
                //        Email = ""
                //    });
                //    HotSheetModel.OrigContactID = -1;
                //}
            }

            // HotSheet Origin and Destination contacts retrieval
            var hsContacts = HotSheetID != 0 ? await _data.Request_HotSheet_Contact_Select(HotSheetID, null, User.GetUserID()) : Enumerable.Empty<HotSheetContact>();

            var vm = new ServiceTRAXHotSheetViewModel
            {
                OrganizationID = HotSheetModel.OrganizationID,
                CustomerName = HotSheetModel.CustomerName,
                CustomerID = req_data.customer_id,
                JobName = HotSheetModel.JobName,
                EndUserName = HotSheetModel.EndUserName,
                SalesContact = HotSheetModel.SalesContact,
                Vehicles = Vehicles,
                SavedVehicle = SavedVehicle,
                Equipment = Equipment,
                SavedEquipment = SavedEquipment,
                JobLocations = JobLocations,
                JobLocationID = HotSheetModel.JobLocationID,
                OrigLocationID = HotSheetModel.OrigLocationID,
                OrigLocations = OrigLocations,
                //ContactID = HotSheetModel.ContactID,
                SpecialInstructions = SpecialInstructions,
                DateCreated = DateCreated,
                CreatedBy = CreatedBy,
                DateModified = DateModified,
                ModifiedBy = ModifiedBy,
                Description = HotSheetModel.Description,
                //OrigContactID = HotSheetModel.OrigContactID,
                WorkDate = HotSheetModel.WorkDate,
                DateData = DateData,
                RequestID = HotSheetModel.RequestID,
                PONo = HotSheetModel.PONo,
                Hotsheet_Identifier = Hotsheet_Identifier,
                IsReadOnly = !User.UserHasThisPermission(Permissions.HotSheetsBOLCreateUpdate),

                AllDestinationContacts = DestinationContacts,
                AllOriginContacts = OrigContacts,

                HotSheetOriginContacts = hsContacts.Where(c => c.HSContactTypeCode.Equals("origin", StringComparison.OrdinalIgnoreCase)),
                HotSheetDestinationContacts = hsContacts.Where(c => c.HSContactTypeCode.Equals("destination", StringComparison.OrdinalIgnoreCase)),

                HotSheetRequestSchedules = await _data.Request_Schedule_Select(HotSheetModel.RequestID, HotSheetModel.WorkDate, User.GetUserID()),

                HotSheetID = HotSheetID,

                CurrentUserFullName = User.Identity.FullName()
            };

            return IsStatic ? View("HotSheetStatic", vm) : View(vm);
        }


        [HasPermission(Permissions.MACServiceRequestAssignedResourcesList)]
        public IActionResult SvcAcctJobsAssignedResources(int OrganizationID)
        {
            var vm = new SvcAcctJobsAssignedResourcesViewModel
            {
                OrganizationID = OrganizationID,
                UserID = User.GetUserID(),
            };

            return View(vm);
        }

        public IActionResult OpenSRAssignedToMe(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }
    }

}
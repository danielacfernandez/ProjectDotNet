using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Serilog;
using ServiceTRAX.ActionFilters;
using ServiceTRAX.Data;
using ServiceTRAX.Hubs;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.API;
using ServiceTRAX.Models.API.Account;
using ServiceTRAX.Models.API.Admin;
using ServiceTRAX.Models.API.Billing;
using ServiceTRAX.Models.API.Request;
using ServiceTRAX.Models.API.Scheduler;
using ServiceTRAX.Models.API.TimeEntry;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.Billing;
using ServiceTRAX.Models.DBModels.HotSheet;
using ServiceTRAX.Models.DBModels.Quote;
using ServiceTRAX.Models.DBModels.Scheduler;
using ServiceTRAX.Models.ViewModels;
using ServiceTRAX.Utils;
using ServiceTRAX.Utils.Notifications;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Xml;
using System.Xml.Linq;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http.Extensions;
using Azure.Core;
using Microsoft.Extensions.Configuration.UserSecrets;


namespace ServiceTRAX.Controllers
{
    [Route("api/v1")]
    [Authorize]
    public class APIController : Controller
    {
        private readonly ServiceTRAXData _data;
        private readonly SiteConfiguration _siteConfig;
        private readonly FileStorageManager _fileStorage;
        private readonly ILogger<APIController> _logger;
        private readonly IHubContext<SchedulerHub> _schedulerHubContext;
        private readonly EmailSender _emailSender;
        private readonly UserNotificationEmails _notificationEmailer;

        public APIController(ServiceTRAXData data, FileStorageManager fileStorage, ILogger<APIController> logger, IHubContext<SchedulerHub> schedulerHubContext, IOptions<SiteConfiguration> siteConfiguration, EmailSender EmailSender, UserNotificationEmails NotificationEmailer)
        {
            _data = data;
            _fileStorage = fileStorage;
            _logger = logger;
            _schedulerHubContext = schedulerHubContext;
            _siteConfig = siteConfiguration.Value;
            _emailSender = EmailSender;
            _notificationEmailer = NotificationEmailer;
        }

        private OkObjectResult APISucessResponse()
        {
            return Ok(new { Succeeded = true });
        }

        [HttpPost, Route("savewidgetposition")]
        public async Task<IActionResult> SaveWidgetConfig([FromBody] IEnumerable<WidgetPositionModel> conf)
        {
            await _data.WidgetUpdatePosition(conf);
            return APISucessResponse();
        }


        [HttpPost, Route("setwidgetsenabledstatus")]
        public async Task<IActionResult> SetWidgetsEnabledStatus([FromBody] IEnumerable<WidgetEnabledStatus> widgets)
        {
            await _data.WidgetManageEnableStatus(widgets, User.GetUserID());
            return APISucessResponse();
        }


        #region User Accounts 



        //[HttpPost, Route("createuser")]
        //public async Task<IActionResult> CreateUserPost([FromBody] APINewUserInfo user)
        //{
        //    var controller = DependencyResolver.Current.GetService<ControllerB>();
        //    controller.ControllerContext = new ControllerContext(this.Request.RequestContext, controller);
        //    return Ok();
        //}


        /// <summary>
        /// Registers when a User changes location
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        [HttpPost, Route("organizationswitch")]
        public async Task<IActionResult> LocationSwitchPost([FromBody] APIOrganizationChangeInfo info)
        {
            _ = await _data.AspNetUserOrganizations_Update(User.GetUserID(), info.OrganizationID);
            return Ok(new { Succeeded = true });
        }




        #endregion



        #region CustomFieldsManagement

        [HttpGet, Route("customfieldvalues")]
        public async Task<IActionResult> CustomFieldValuesGetImpl(long CustomColumnID)
        {
            var cols = await _data.CustomColumnList_Select(CustomColumnID, User.GetUserID());
            return Ok(Json(cols));
        }


        [HttpPost, Route("customfieldvalueadd")]
        public async Task<IActionResult> CustomFieldValuesAddPostImpl([FromBody] APICustomFieldValue CustomField)
        {
            var cols = await _data.CustomColumnList_Insert(CustomField.customColumnId, CustomField.name, CustomField.order, User.GetUserID());
            return APISucessResponse();
        }

        [HttpPost, Route("customfieldvalueupdate")]
        public async Task<IActionResult> CustomFieldValuesUpdatePostImpl([FromBody] APICustomFieldValue CustomField)
        {
            var cols = await _data.CustomColumnList_Update(CustomField.customColumnId, null, CustomField.name, User.GetUserID());
            return APISucessResponse();
        }

        [HttpPost, Route("customfieldvaluewitchorder")]
        public async Task<IActionResult> CustomFieldValuesSwitchPostImpl([FromBody] APICustomFieldValueSwitch SwitchData)
        {
            await _data.CustomColumnList_Update(SwitchData.customcollistid1, SwitchData.sequence1, null, User.GetUserID());
            await _data.CustomColumnList_Update(SwitchData.customcollistid2, SwitchData.sequence2, null, User.GetUserID());
            return APISucessResponse();
        }


        [HttpPost, Route("customfieldvaluedelete")]
        public async Task<IActionResult> CustomFieldValuesDeletePostImpl([FromBody] long CustomColumnID)
        {
            var cols = await _data.CustomColumnList_Delete(CustomColumnID, User.GetUserID());
            return APISucessResponse();
        }

        #endregion


        #region QuoteRequest

        [HttpPost, Route("addcustomer")]
        public async Task<IActionResult> AddCustomerImpl([FromBody] NewCustomer customer)
        {
            Request_Customer newCust = null;
            if (customer.CustomerTypeCode.Equals("prospect", StringComparison.OrdinalIgnoreCase))
            {
                if (!User.UserHasThisPermission(Permissions.ProspectReadCreateUpdateDelete))
                {
                    return Unauthorized();
                }
                newCust = await _data.Customer_Prospect_Insert(customer.OrganizationID, customer.CustomerName, User.GetUserID());
            }
            else
            {
                newCust = await _data.Customer_Insert(customer.OrganizationID, customer.CustomerName, customer.CustomerTypeID, true, User.GetUserID());
            }

            return Ok(Json(newCust));
        }


        [HttpPost, Route("addenduser")]
        public async Task<IActionResult> AddEndUserCustomerImpl([FromBody] NewEndUserCustomer customer)
        {
            var nc = await _data.Customer_EndUser_Insert(customer.OrganizationID, customer.EndUserName, customer.BelongsToCustomerID, User.GetUserID());
            return Ok(Json(nc));
        }


        [HttpGet, Route("endusers")]
        public async Task<IActionResult> EndUsersImpl(long OrganizationID, long? CustomerID)
        {
            var custs = await _data.Customer_EndUser_Select(OrganizationID, CustomerID);
            return Ok(Json(custs));
        }

        [HttpGet, Route("customers")]
        public async Task<IActionResult> CustomersImpl(long OrganizationID)
        {
            var custs = await _data.Request_Customer_Select(OrganizationID, User.GetUserID());
            return Ok(Json(custs));
        }


        [HttpGet, Route("joblocations")]
        public async Task<IActionResult> JobLocationsImpl(long OrganizationID, long CustomerID)
        {
            var locs = await _data.Job_Location_Select(OrganizationID, CustomerID, null);
            return Ok(Json(locs));
        }

        [HttpGet, Route("joblocationbyid")]
        public async Task<IActionResult> JobLocationByIdImpl(long OrganizationID, long JobLocationId)
        {
            var location = (await _data.Job_Location_Select(OrganizationID, null, JobLocationId)).FirstOrDefault();
            return Ok(Json(new { found = location != null, locationInfo = location }));
        }


        [HttpPost, Route("addcontact")]
        public async Task<IActionResult> AddContactImpl([FromBody] NewContact contact)
        {
            var newCust = await _data.Contact_Insert(contact, User.GetUserID());
            return Ok(Json(newCust));
        }

        /// <summary>
        /// Gets the details about the Contact to edit (Note: the other Contac_Select method returns all the phone numbers togheter so values aren't suitable for edition)
        /// </summary>
        /// <param name="contact"></param>
        /// <returns></returns>
        [HttpGet, Route("updaterequestcontact")]
        public async Task<IActionResult> UpdateContactGETImpl(long ContactID, long OrganizationID)
        {
            var contactToUpdate = await _data.Contact_Select(OrganizationID, ContactID, User.GetUserID());
            return Ok(Json(contactToUpdate));
        }

        [HttpPost, Route("updaterequestcontact")]
        public async Task<IActionResult> UpdateContactPOSTImpl([FromBody] ContactDetails contact)
        {
            var updatedContact = await _data.Contact_Update(contact.contact_id, contact.contact_name, contact.phone_work, contact.phone_cell, contact.phone_home, contact.email, contact.organization_id, User.GetUserID());
            return Ok(Json(updatedContact));
        }

        private bool HasRequestSaveUpdatePermissions(Request_Data requestData)
        {
            if (requestData.record_type_code.Equals("quote_request", StringComparison.OrdinalIgnoreCase) && User.UserHasThisPermission(Permissions.QuoteRequestCreateUpdateApproveCancel))
            {
                return true;
            }
            if ((requestData.record_type_code.Equals("service_request", StringComparison.OrdinalIgnoreCase) || requestData.record_type_code.Equals("workorder", StringComparison.OrdinalIgnoreCase)) && User.UserHasThisPermission(Permissions.ServiceRequestCreateUpdateSetPunch))
            {
                return true;
            }

            return false;

        }
        /*public string ToHex(this byte[] bytes, bool upperCase)
        {
            StringBuilder result = new StringBuilder(bytes.Length * 2);

            for (int i = 0; i < bytes.Length; i++)
                result.Append(bytes[i].ToString(upperCase ? "X2" : "x2"));

            return result.ToString();
        }*/

        [HttpPost, Route("approvepoinvoice")]
        public async Task<IActionResult> ApproveInvoiceImpl([FromBody] InvoiceEmailAPIData invoiceEmailData)
        {
            if (User.UserHasThisPermission(Permissions.CanApprovePOInvoices))
            {

                // #19299: Adds a label to PO invoice file with approved time and approved by.
                var signer = new PDFeSignOff(_siteConfig.BaseURL, Request.Cookies);
                var result = await _data.AddApprovedByToPOInvoice(invoiceEmailData, signer, User.GetUserID(), User.Identity.FullName());

                // TODO: I think we want to flag the invoice as approved even if adding the label to the pdf fails.
                //if (result)
                //{
                    result = await _data.POInvoice_FlagAsApproved(invoiceEmailData.POInvoiceId, User.GetUserID());
                    if (result)
                        result = await _data.SendPOInvoiceEmail(invoiceEmailData.POInvoiceId, User.GetUserID(), invoiceEmailData.OrganizationID, invoiceEmailData.FileName, invoiceEmailData.MDFileName, invoiceEmailData.Total);
                //}

                return Ok(Json(result));
            }
            else { return  Unauthorized();
            }

        }

        //[HttpPost, Route("uploadInvoice")]
        //public async Task<IActionResult> UploadInvoiceImpl(InvoiceAPIData inv)
        //{

        //    IFormFile file = inv.InvoiceFile;
        //    var md5 = MD5.Create();
        //    var sha1 = SHA1.Create();


        //    var checksumMD5 = md5.ComputeHash(file.OpenReadStream());
        //    string checksumMD5Value = string.Concat(checksumMD5.Select(x => x.ToString("X2")));
        //    var checksumSHA1 = sha1.ComputeHash(file.OpenReadStream());
        //    string checksumSHA1Value = string.Concat(checksumSHA1.Select(x => x.ToString("X2")));


        //    var result = await _data.POInvoice_Insert(inv.POId, inv.InvoiceDate, inv.Amount, inv.InvoiceNumber, inv.InvoiceFile.FileName, checksumMD5Value, checksumSHA1Value, User.GetUserID());
        //    // Save request attachments
        //    await _fileStorage.SavePOInvoiceFile(inv.InvoiceFile, checksumMD5, checksumSHA1Value);

        //    return Ok(Json(result));

        //}

        [HttpPost, Route("saverequest")]
        public async Task<IActionResult> SaveRequestImpl(RequestAPIData qr)
        {

            try
            {
                var requestData = JsonConvert.DeserializeObject<Request_Data>(qr.request);
                var requestProds = JsonConvert.DeserializeObject<IEnumerable<RequestProduct>>(qr.requestProducts);
                var requestAttachments = JsonConvert.DeserializeObject<IEnumerable<Attachment>>(qr.requestAttachments);
                var requestContacts = JsonConvert.DeserializeObject<IEnumerable<Request_Contact>>(qr.requestContacts);
                var jobContacts = JsonConvert.DeserializeObject<IEnumerable<Request_Contact>>(qr.requestLocationContacts);
                var requestHeaderResources = JsonConvert.DeserializeObject<IEnumerable<RequestResource>>(qr.requestHeaderResources);
                var requestScopeResources = JsonConvert.DeserializeObject<IEnumerable<RequestResource>>(qr.requestScopeResources);
                var customFields = JsonConvert.DeserializeObject<IEnumerable<RequestCustomField>>(qr.customFields);

                //
                // Validate Access
                //
                if (!HasRequestSaveUpdatePermissions(requestData))
                {
                    return Unauthorized();
                }


                var root = new XElement("QuoteRequestDetails");

                var contacts = new XElement("Contacts");
                foreach (var contact in requestContacts)
                {
                    var xcontact = new XElement("Contact");
                    xcontact.Add(new XElement("Contact_ID", contact.Contact_ID));
                    contacts.Add(xcontact);
                }
                root.Add(contacts);

                var xJobContacts = new XElement("JobContacts");
                foreach (var contact in jobContacts)
                {
                    var xcontact = new XElement("JobContact");
                    xcontact.Add(new XElement("Contact_ID", contact.Contact_ID));
                    xJobContacts.Add(xcontact);
                }
                root.Add(xJobContacts);

                var hresources = new XElement("HeaderResources");
                foreach (var resource in requestHeaderResources)
                {
                    var xresource = new XElement("HeaderResource");
                    xresource.Add(new XElement("ResourceID", resource.ResourceID));
                    hresources.Add(xresource);
                }
                root.Add(hresources);

                var sresources = new XElement("ScopeResources");
                foreach (var resource in requestScopeResources)
                {
                    var yresource = new XElement("ScopeResource");
                    yresource.Add(new XElement("ResourceID", resource.ResourceID));
                    sresources.Add(yresource);
                }
                root.Add(sresources);


                var products = new XElement("RequestProducts");
                foreach (var reqProd in requestProds)
                {
                    var product = new XElement("Product");
                    product.Add(new XElement("ProductLookupID", reqProd.product_lookup_id));
                    product.Add(new XElement("Request_ID", reqProd.RequestID));
                    product.Add(new XElement("ShippingMethodLookupID", reqProd.Shipping_Method_Lookup_ID));
                    product.Add(new XElement("ProductOther", reqProd.Product_Other));
                    products.Add(product);
                }
                root.Add(products);

                var fields = new XElement("CustomFields");
                foreach (var cusField in customFields)
                {
                    var field = new XElement("CustomField");
                    field.Add(new XElement("CustomFieldId", cusField.CustomFieldID));
                    field.Add(new XElement("CustomFieldValue", cusField.CustomFieldValue));
                    fields.Add(field);
                }
                root.Add(fields);

                var attachments = new XElement("RequestAttachments");
                foreach (var attachment in requestAttachments)
                {
                    var xattach = new XElement("Attachment");
                    xattach.Add(new XElement("request_document_id", attachment.request_document_id));
                    xattach.Add(new XElement("name", attachment.name));
                    xattach.Add(new XElement("created_by", attachment.created_by));
                    xattach.Add(new XElement("date_created", attachment.date_created));
                    attachments.Add(xattach);
                }
                root.Add(attachments);

                var newAttachments = new XElement("NewAttachments");
                var md5 = MD5.Create();
                var sha1 = SHA1.Create();
                if (qr.newFiles != null)
                {
                    foreach (var file in qr.newFiles)
                    {
                        var checksumMD5 = md5.ComputeHash(file.OpenReadStream());
                        string checksumMD5Value = string.Concat(checksumMD5.Select(x => x.ToString("X2")));
                        var checksumSHA1 = sha1.ComputeHash(file.OpenReadStream());
                        string checksumSHA1Value = string.Concat(checksumSHA1.Select(x => x.ToString("X2")));
                        var newAttachment = new XElement("NewAttachment");
                        newAttachment.Add(new XElement("name", file.FileName));
                        newAttachment.Add(new XElement("created_by_userID", User.GetUserID()));
                        newAttachment.Add(new XElement("date_created", DateTime.Now));
                        newAttachment.Add(new XElement(name: "CheckSumMD5Value", checksumMD5Value));
                        newAttachment.Add(new XElement(name: "CheckSumSHA1Value", checksumSHA1Value));
                        newAttachments.Add(newAttachment);
                    }
                }
                root.Add(newAttachments);

                var DetailsXML = root.ToString(SaveOptions.DisableFormatting);

                Request_Data rd = null;
                if (qr.isNew)       
                {
                    rd = await _data.QuoteRequest_Insert(requestData, DetailsXML, User.GetUserID(), requestData.record_type_code, qr.clientTimeZone, qr.clientTimeZoneEndDate);
                    // Save request attachments
                    await _fileStorage.SaveQuoteRequestAttachment(rd.project_no.ToString(), rd.request_id.ToString(), rd.request_no.ToString(), rd.version_no.ToString(), qr.newFiles);
                }
                else
                {
                    rd = await _data.QuoteRequest_Update(requestData, DetailsXML, User.GetUserID(), qr.clientTimeZone);
                    // Save request attachments
                    await _fileStorage.SaveQuoteRequestAttachment(rd.project_no.ToString(), rd.request_id.ToString(), rd.request_no.ToString(), rd.version_no.ToString(), qr.newFiles);
                }

                return Ok(Json(rd));
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Saving Request");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }
        }


        //[HttpPost, Route("signpdffile")]
        //public async Task<IActionResult> SignPFDFilePosImpl(PDFeSignatureRequest PDFInfo)
        //{
        //    var file = PDFInfo.FileToSign;
        //    var outputFilename = Path.Combine(@"D:\Temp\eSignature", file.FileName);
        //    // Write the file to disk 
        //    using (var fileStream = new FileStream(outputFilename, FileMode.Create))
        //    {
        //        await file.CopyToAsync(fileStream);
        //    }

        //    var pdfSingature = new PDFeSignOff();
        //    //pdfSingature.SignEmerDoc(outputFilename, "Michael Scott", 20);
        //    pdfSingature.SignDeliveryTicketDoc(outputFilename, "Michael Scott", 20, PDFInfo.Xpos, PDFInfo.Ypos);

        //    return Ok(Json(new { Succeeded = true, Filename = outputFilename }));
        //}


        private bool HasChangeStatusPermissions(string StatusCode)
        {
            if (StatusCode.Equals("completed", StringComparison.OrdinalIgnoreCase))
            {
                return User.UserHasThisPermission(Permissions.ServiceRequestFlagComplete);
            }

            if (StatusCode.Equals("closed", StringComparison.OrdinalIgnoreCase))
            {
                return User.UserHasAllThisPermission(new Permissions[] { Permissions.ServiceRequestCreateUpdateSetPunch, Permissions.ServiceRequestFlagComplete });
            }

            if (User.UserHasThisPermission(Permissions.ServiceRequestCreateUpdateSetPunch) && User.UserHasThisPermission(Permissions.QuoteRequestCreateUpdateApproveCancel))
            {
                return true;
            }

            return false;
        }

        [HttpPost, Route("changerequeststatus")]
        public async Task<IActionResult> ChangeRequestStatusImpl([FromBody] RequestChangeStatusAPI data)
        {
            var status = (await _data.Request_Status_Select()).FirstOrDefault(s => s.code.Equals(data.StatusLookupCode, StringComparison.OrdinalIgnoreCase));
            if (status != null)
            {
                if (!HasChangeStatusPermissions(status.code))
                {
                    return Unauthorized();
                }

                var rq = await _data.QuoteRequest_ChangeStatus(data.RequestID, status.id, User.GetUserID());
                return Ok(Json(rq));
            }

            return StatusCode((int)HttpStatusCode.BadRequest, $"StatusLookupCode [{data.StatusLookupCode}] not found");
        }

        [HttpPost, Route("reopensr"), HasPermission(Permissions.ServiceRequestReOpen)]
        public async Task<IActionResult> ReOpenSRImpl([FromBody] long RequestID)
        {
            var result = await _data.ServiceRequest_ReOpen(RequestID, User.GetUserID());
            return Ok(Json(result));
        }

        [HttpGet, Route("joblocationcontacts")]
        public async Task<IActionResult> JobLocationContactsImpl(long JobLocationID)
        {
            var cts = await _data.Job_Location_Contacts_Select(JobLocationID);
            return Ok(Json(cts));
        }


        [HttpGet, Route("requestattachments")]
        public async Task<IActionResult> RequestAttachmentsGetImpl(long RequestID)
        {
            var attachments = await _data.Request_Attachment_Select(RequestID, null, null, null, null, null);
            return Ok(JSONUtils.JsonUTC(attachments));
        }

        [HttpGet, Route("newquoterequestversion")]
        public async Task<IActionResult> NewQuoteRequestVersionImpl(long OrganizationID, long RequestID)
        {
            // Create the new version in SQL
            var newQR = await _data.QuoteRequest_CreateNewVersion(RequestID, User.GetUserID());
            // Attachments copy
            //await CopyRequestAttachments(OrganizationID, RequestID, newQR);

            return Ok(Json(newQR));
        }

        [HttpGet, Route("newservicerequestversion")]
        public async Task<IActionResult> NewServiceRequestVersionImpl(long OrganizationID, long RequestID, string Type)
        {
            Request_Data newQR;
            switch (Type)
            {
                case "version":
                    newQR = await _data.ServiceRequest_CreateNewRequest(RequestID, "NewVersion", User.GetUserID(), false);
                    // Attachments copy
                    //await CopyRequestAttachments(OrganizationID, RequestID, newQR);
                    return Ok(Json(newQR.request_id));
                case "additional":
                    newQR = await _data.ServiceRequest_CreateNewRequest(RequestID, "NewRequestNo", User.GetUserID(), false);
                    return Ok(Json(newQR.request_id));
                case "copy":
                    newQR = await _data.ServiceRequest_CreateNewRequest(RequestID, "CopyRequest", User.GetUserID(), false);
                    // Attachments copy
                    //await CopyRequestAttachments(OrganizationID, RequestID, newQR);
                    return Ok(Json(newQR.request_id));
                case "punchcopy":
                    newQR = await _data.ServiceRequest_CreateNewRequest(RequestID, "CopyRequest", User.GetUserID(), true);
                    // Attachments copy
                    //await CopyRequestAttachments(OrganizationID, RequestID, newQR);
                    return Ok(Json(newQR.request_id));
                case "punchnew":
                    newQR = await _data.ServiceRequest_CreateNewRequest(RequestID, "NewRequestNo", User.GetUserID(), true);
                    return Ok(Json(newQR.request_id));
                default:
                    return Ok(Json(false));
            }
        }




        [HttpGet, Route("customercontacts")]
        public async Task<IActionResult> CustomerContactsImpl(long OrganizationID, long CustomerID)
        {
            var contacts = await _data.Customer_Contacts_Select(OrganizationID, CustomerID);
            return Ok(Json(contacts));
        }


        [HttpGet, Route("comments")]
        public async Task<IActionResult> GetCommentsImpl(long? ProjectID, long? RequestID, long? QuoteID)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.QuoteRequestCommentsReadAdd, Permissions.ServiceRequestCommentsReadAdd, Permissions.MACServiceRequestCommentsReadAdd }))
            {
                return Unauthorized();
            }

            var comments = await _data.ProjectComment_Select(ProjectID, RequestID, QuoteID, null, true);
            return Ok(Json(comments));
        }

        [HttpGet, Route("commentsbydate")]
        public async Task<IActionResult> GetCommentsByDateImpl(long? ProjectID, long? RequestID, long? QuoteID)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.QuoteRequestCommentsReadAdd, Permissions.ServiceRequestCommentsReadAdd, Permissions.MACServiceRequestCommentsReadAdd }))
            {
                return Unauthorized();
            }

            var comments = await _data.ProjectComment_Select(ProjectID, RequestID, QuoteID, null, true);
            // Group comments by Date and then order inner groups by PorjectCommentID 
            var groupedComments = comments.GroupBy(c => c.CreateTime.Date).Select(cg => new { Date = cg.Key, Comments = cg.ToArray().OrderBy(c => c.ProjectCommentID) });

            return Ok(Json(groupedComments));
        }


        [HttpGet, Route("deletecomment")]
        public async Task<IActionResult> DeleteCommentImpl(long ProjectCommentID)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.QuoteRequestCommentsReadAdd, Permissions.ServiceRequestCommentsReadAdd, Permissions.MACServiceRequestCommentsReadAdd }))
            {
                return Unauthorized();
            }

            var succeed = await _data.ProjectComment_Delete(ProjectCommentID, User.GetUserID());
            return Ok(Json(new { wasDeleted = succeed }));
        }


        [HttpPost, Route("appendcomment")]
        public async Task<IActionResult> AppendCommentImpl([FromBody] NewComment comment)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.QuoteRequestCommentsReadAdd, Permissions.ServiceRequestCommentsReadAdd, Permissions.MACServiceRequestCommentsReadAdd }))
            {
                return Unauthorized();
            }

            var newcomment = await _data.ProjectComment_Insert(comment.projectid, comment.requestid, comment.quoteid, comment.comment, comment.clientvisible, User.GetUserID());
            return Ok(Json(newcomment));
        }


        [HttpPost, Route("createservicerequest"), HasPermission(Permissions.ServiceRequestCreateUpdateSetPunch)]
        public async Task<IActionResult> CreateServiceRequestImpl([FromBody] NewServiceRequest sr)
        {
            // Create the new SR db entries
            var newsr = await _data.ServiceRequest_Insert(sr.RequestID, null, User.GetUserID());
            // Copy any attachemts it may have
            //await CopyRequestAttachments(sr.OrganizationId, sr.RequestID, newsr);

            return Ok(Json(newsr));
        }

        private async Task<bool> CopyRequestAttachments(long OrganizationId, long SourceRequestID, Request_Data NewRequest)
        {
            // Retrieve original attachment files names (to copy the phisycal files to the new Request folders)
            var RequestData = await _data.Request_Data_Select(OrganizationId, SourceRequestID, User.GetUserID());

            return await CopyRequestAttachments(SourceRequestID, RequestData.request_no, RequestData.version_no, NewRequest, false);

            //var attachments = await _data.Request_Attachment_Select(SourceRequestID, null, RequestData.request_no, RequestData.version_no, null);

            //// Copy the files
            //var copySuceeded = await _fileStorage.CopyRequestAttachments(attachments, NewRequest.project_no, NewRequest.request_id, NewRequest.request_no, NewRequest.version_no);
            //return copySuceeded;
        }

        private async Task<bool> CopyRequestAttachments(long SourceRequestID, int SourceRequestNo, int SourceRequestVersion, Request_Data NewRequest, bool FailOnMissingAttachments)
        {
            var attachments = await _data.Request_Attachment_Select(SourceRequestID, null, SourceRequestNo, SourceRequestVersion, null, null);

            if ((attachments == null || attachments.Count() == 0) && FailOnMissingAttachments)
            {
                return false;
            }
            else
            {
                // Copy the files
                var copySuceeded = await _fileStorage.CopyRequestAttachments(attachments, NewRequest.project_no, NewRequest.request_id, NewRequest.request_no, NewRequest.version_no);
                return copySuceeded;
            }
        }

        [HttpPost, Route("addjoblocation")]
        public async Task<IActionResult> AddJobLocationImpl([FromBody] JobLocation jl)
        {
            var nlj = await _data.Job_Location_Insert(jl, User.GetUserID());
            return Ok(Json(nlj));
        }

        [HttpPost, Route("updatejoblocation")]
        public async Task<IActionResult> UpdateJobLocationImpl([FromBody] JobLocation jl)
        {
            var nlj = await _data.Job_Location_Update(jl);
            return APISucessResponse();
        }


        [HttpGet, Route("fillscheduler"), HasPermission(Permissions.ServiceRequestSetReadyToSchedule)]
        public async Task<IActionResult> Scheduler_FillFromRequest(long RequestID)
        {
            try
            {
                var locs = await _data.Scheduler_FillFromRequest(RequestID, User.GetUserID());
                var done = new
                {
                    Code = locs.ValidationCode,
                    Msg = locs.ValidationMsg
                };
                return Ok(Json(done));
            }
            catch (Exception e)
            {
                _logger.LogError(e, "FillScheduler Exception");
                throw;
            }

        }
        
        //* TODO: (FJP) need to define a permission for this.
        [HttpGet, Route("removescheduler"), HasPermission(Permissions.ServiceRequestSetHardSchedule)]
        public async Task<IActionResult> Scheduler_Remove(long RequestScheduleID)
        {
            try
            {
                var locs = await _data.Scheduler_Day_Remove(RequestScheduleID, User.GetUserID());
                var done = new
                {
                    Code = locs.ValidationCode,
                    Msg = locs.ValidationMsg
                };
                return Ok(Json(done));
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Scheduler_Remove Exception");
                throw;
            }

        }

        [HttpGet, Route("fillhardscheduler"), HasPermission(Permissions.ServiceRequestSetHardSchedule)]
        public async Task<IActionResult> ServiceRequest_IsHardScheduled_Update(long RequestID)
        {
            try
            {
                var locs = await _data.ServiceRequest_IsHardScheduled_Update(RequestID, User.GetUserID());
                var done = new
                {
                    Code = locs.ValidationCode,
                    Msg = locs.ValidationMsg
                };
                return Ok(Json(done));
            }
            catch (Exception e)
            {
                _logger.LogError(e, "FillHardScheduler Exception");
                throw;
            }

        }




        [HttpPost, Route("setservicedate")]
        public async Task<IActionResult> SetServiceDatePostImpl([FromBody] APIServiceDate SrvcDate)
        {
            await _data.ServiceRequest_SetServiceDate(SrvcDate.RequestID, SrvcDate.SERVICEDATE, false, User.GetUserID(), true);
            return Ok(Json(new { succeeded = true }));
        }

        /// <summary>
        /// Internal Approval of a SR on Red days
        /// </summary>
        /// <param name="SrvcDate"></param>
        /// <returns></returns>
        [HttpPost, Route("approveservicedate")]
        public async Task<IActionResult> ApproveServiceDatePostImpl([FromBody] APIServiceDate SrvcDate)
        {
            await _data.ServiceRequest_SetServiceDate(SrvcDate.RequestID, SrvcDate.SERVICEDATE, SrvcDate.ISAPPROVED, User.GetUserID(), User.UserHasThisPermission(Permissions.ServiceRequestApproveRejectServiceDate));
            return APISucessResponse(); // Ok(Json(new { succeeded = true }));
        }

        /// <summary>
        /// Client Approval of a Rescheduled SR previously set on Red days
        /// </summary>
        /// <param name="SrvcDate"></param>
        /// <returns></returns>
        //[HttpPost, Route("approverescheduledate"), HasPermission(Permissions.ServiceRequestApproveRejectRescheduleDate)]
        //public async Task<IActionResult> ApproveRescheduledServiceDatePostImpl([FromBody] APIServiceDate SrvcDate)
        //{
        //    await _data.ServiceRequest_SetServiceDate(SrvcDate.RequestID, SrvcDate.SERVICEDATE, SrvcDate.ISAPPROVED, User.GetUserID(), true);
        //    return APISucessResponse(); // Ok(Json(new { succeeded = true }));
        //}


        [HttpPost, Route("rescheduleservicedate"), HasPermission(Permissions.ServiceRequestApproveRejectServiceDate)]
        public async Task<IActionResult> RescheduleServiceDatePostImpl([FromBody] APIServiceDate SrvcDate)
        {
            await _data.ServiceRequest_SetServiceDate(SrvcDate.RequestID, SrvcDate.SERVICEDATE, false, User.GetUserID(), true);
            return APISucessResponse(); // Ok(Json(new { succeeded = true }));
        }






        [HttpPost, Route("internalReschedule"), HasPermission(Permissions.ServiceRequestInternalReschedule)]
        public async Task<IActionResult> InternalReschedulePostImpl([FromBody] APIServiceRequestReschedule RescheduleData)
        {
            var result = await _data.ServiceRequest_Reschedule(null, RescheduleData.RequestId, ServiceTRAXData.RescheduleTypeEnum.INTERNAL, string.Empty, User.GetUserID(), false);
            return Ok(Json(result));
        }


        [HttpPost, Route("clientReschedule"), HasPermission(Permissions.ServiceRequestClientReschedule)]
        public async Task<IActionResult> ClientReschedulePostImpl([FromBody] APIServiceRequestReschedule RescheduleData)
        {
            var result = await _data.ServiceRequest_Reschedule(null, RescheduleData.RequestId, ServiceTRAXData.RescheduleTypeEnum.CLIENT, string.Empty, User.GetUserID(), false);
            return Ok(Json(result));
        }


        [HttpPost, Route("cancelservicerequest"), HasPermission(Permissions.ServiceRequestCancel)]
        public async Task<IActionResult> CancelServiceRequestPostImpl([FromBody] APIServiceRequestReschedule RescheduleData)
        {
            var result = await _data.ServiceRequest_Reschedule(null, RescheduleData.RequestId, ServiceTRAXData.RescheduleTypeEnum.INTERNAL, string.Empty, User.GetUserID(), true);
            return Ok(Json(result));
        }


        #endregion

        #region Quote


        [HttpGet, Route("quotetypicalstemplates"), HasPermission(Permissions.QuoteRead)]
        public async Task<IActionResult> QuoteTypicalsTemplatesImpl(long OrganizationID, string PageName)
        {
            var qtt = await _data.QuoteDataTemplates_Select(OrganizationID, PageName);
            QuoteTypical typical = new QuoteTypical();
            typical.Sections = new List<QuoteTypicalSection>();
            foreach (var sectionName in qtt.Select(x => x.SectionName).Distinct().ToList())
            {
                QuoteTypicalSection newSection = new QuoteTypicalSection();
                newSection.SectionName = sectionName;
                newSection.Items = new List<QuoteTypicalItem>();
                foreach (var item in qtt.Where(x => x.SectionName == sectionName).ToList())
                {
                    QuoteTypicalItem newItem = new QuoteTypicalItem();
                    newItem.QuoteDataTemplateID = item.QuoteDataTemplateID;
                    newItem.ItemName = item.ItemName;
                    newItem.ItemTime = item.ItemTime;
                    newItem.ItemQuantity = item.ItemQuantity;
                    newSection.Items.Add(newItem);
                }
                typical.Sections.Add(newSection);
            }
            return Ok(typical);
        }


        [HttpGet, Route("getquotetypicaldetail"), HasPermission(Permissions.QuoteRead)]
        public async Task<IActionResult> QuoteDataTypicalDetailSelect(long QuoteDataTypicalID, bool ShowingTypical)
        {
            IEnumerable<QuoteData> qtt = new List<QuoteData>();
            if (!ShowingTypical)
            {
                qtt = await _data.QuoteDataTypicalDetail_Select(QuoteDataTypicalID);

            }
            else
            {
                qtt = await _data.Quote_QuoteDataTypicalDetail_Select(QuoteDataTypicalID);
            }

            QuoteTypical typical = new QuoteTypical();
            typical.Sections = new List<QuoteTypicalSection>();
            foreach (var sectionName in qtt.Select(x => x.SectionName).Distinct().ToList())
            {
                QuoteTypicalSection newSection = new QuoteTypicalSection();
                newSection.SectionName = sectionName;
                newSection.Items = new List<QuoteTypicalItem>();
                foreach (var item in qtt.Where(x => x.SectionName == sectionName).ToList())
                {
                    QuoteTypicalItem newItem = new QuoteTypicalItem();
                    newItem.QuoteDataTemplateID = item.QuoteDataTemplateID;
                    newItem.ItemName = item.ItemName;
                    newItem.ItemTime = item.ItemTime;
                    newItem.ItemQuantity = item.ItemQuantity;
                    newSection.Items.Add(newItem);
                }
                typical.Sections.Add(newSection);
            }
            return Ok(typical);

        }

        [HttpPost, Route("addtypical"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> AddTypicalImpl([FromBody] QuoteTypical typical)
        {
            var root = new XElement("QuoteDataTypicalDetails");

            foreach (QuoteTypicalSection section in typical.Sections)
            {
                foreach (QuoteTypicalItem item in section.Items)
                {
                    var typicalXML = new XElement("QuoteDataTypicalDetail");
                    typicalXML.Add(new XElement("SectionName", section.SectionName));
                    typicalXML.Add(new XElement("ItemName", item.ItemName));
                    typicalXML.Add(new XElement("ItemTime", item.ItemTime));
                    typicalXML.Add(new XElement("ItemQuantity", item.ItemQuantity));
                    root.Add(typicalXML);
                }
            };

            var newTypical = await _data.Quote_QuoteDataTypical_Insert(typical.OrganizationID, typical.QuoteID, typical.TabName, typical.PageName, typical.TypicalName, User.GetUserID(), root.ToString(SaveOptions.DisableFormatting));

            QuoteDataItem dataItem = new QuoteDataItem
            {
                QuoteDataID = newTypical.QuoteDataID,
                ItemName = newTypical.ItemName,
                ItemTime = newTypical.ItemTime,
                ItemQuantity = newTypical.ItemQuantity,
                IsActive = newTypical.IsActive
            };

            return Ok(Json(dataItem));
        }

        [HttpGet, Route("quoteexistingtypicalstemplates"), HasPermission(Permissions.QuoteRead)]
        public async Task<IActionResult> QuoteDataTypicalsSelect(long OrganizationID, string PageName)
        {
            var typs = await _data.QuoteDataTypicals_Select(OrganizationID, PageName);
            return Ok(Json(typs));
        }

        [HttpGet, Route("quoteselectopbulkentrydefaults")]
        public async Task<IActionResult> QuoteSelectOPBulkEntryDefaults(long OrganizationID, long QuoteID) {
            var defaultValues = await _data.QuoteSelectOPBulkEntryDefaults(OrganizationID, QuoteID, this.User.GetUserID());
            return Ok(Json(defaultValues));
        }

        [HttpPost, Route("addexistingtypical"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> QuoteQuoteDataInsert([FromBody] QuoteTypicalToDB typical)
        {
            try
            {
                var newTypical = await _data.Quote_QuoteData_Insert(typical.QuoteID, typical.TabName, typical.PageName, null, null, true, typical.QuoteDataTypicalID, User.GetUserID());

                QuoteDataItem dataItem = new QuoteDataItem
                {
                    QuoteDataID = newTypical.QuoteDataID,
                    ItemName = newTypical.ItemName,
                    ItemTime = newTypical.ItemTime,
                    ItemQuantity = newTypical.ItemQuantity,
                    IsActive = newTypical.IsActive
                };

                return Ok(Json(dataItem));
            }
            catch (Exception e)
            {
                var ss = e.Message;
                throw;
            }

        }

        [HttpPost, Route("addnewtab"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> QuoteTabsInsert(string TabName, long QuoteID)
        {
            var newTab = await _data.Quote_Tabs_Insert(QuoteID, TabName, User.GetUserID());
            return Ok(Json(newTab));
        }

        [HttpPost, Route("removetab"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_Tabs_Delete(long QuoteID, string TabName)
        {
            await _data.Quote_Tabs_Delete(QuoteID, TabName, User.GetUserID());
            return Ok(Json(true));
        }

        [HttpPost, Route("updateitem"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> QuoteQuoteDataUpdate([FromBody] QuoteDataItem dataItem)
        {
            var newTypical = await _data.Quote_QuoteData_Update(dataItem.QuoteDataID, dataItem.ItemName, dataItem.ItemTime, dataItem.ItemQuantity, dataItem.IsActive, User.GetUserID());
            return Ok(Json(newTypical));
        }

        [HttpPost, Route("removetypical"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> QuoteRemoveTypical([FromBody] long QuoteDataID)
        {
            var deleted = await _data.Quote_RemoveTypical(QuoteDataID);
            return Ok(Json(deleted));
        }

        [HttpPost, Route("addnewitem"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> QuoteQuoteDataInsert([FromBody] QuoteItemToDB addItem)
        {
            var newItem = await _data.Quote_QuoteData_Insert(addItem.QuoteID, addItem.TabName, addItem.PageName, addItem.SectionName, addItem.ItemName, addItem.IsActive, addItem.QuoteDataTypicalID, User.GetUserID());

            QuoteDataItem dataItem = new QuoteDataItem
            {
                QuoteDataID = newItem.QuoteDataID,
                ItemName = newItem.ItemName,
                ItemTime = newItem.ItemTime,
                ItemQuantity = newItem.ItemQuantity,
                IsActive = newItem.IsActive
            };

            return Ok(Json(dataItem));
        }

        [HttpGet, Route("getnewroleline")]
        public async Task<IActionResult> Quote_QuoteRoleLine_Insert(long QuoteID)
        {
            var line = await _data.Quote_QuoteLine_Insert(QuoteID, 0, null, User.GetUserID());
            return Ok(Json(line));
        }

        [HttpGet, Route("getnewwriteline")]
        public async Task<IActionResult> Quote_QuoteWriteLine_Insert(long QuoteID)
        {
            var line = await _data.Quote_QuoteLine_Insert(QuoteID, null, "", User.GetUserID());
            return Ok(Json(line));
        }

        [HttpGet, Route("addFuelSurchargeRate"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_AddFuelSurchargeRate(long QuoteID)
        {
            var line = await _data.Quote_AddFuelSurchargeRate(QuoteID, User.GetUserID());
            return Ok(Json(line));
        }

        [HttpGet, Route("addAdminFee"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_AddAdminFee(long QuoteID, bool addAdminFee)
        {
            var line = await _data.Quote_AddAdminFee(QuoteID, addAdminFee, User.GetUserID());
            return Ok(Json(line));
        }

        [HttpGet, Route("addProjectMgmt"), HasPermission(Permissions.QuoteAddProjectMgmt)]
        public async Task<IActionResult> Quote_AddProjectMgmt(long QuoteID)
        {
            var line = await _data.Quote_AddProjectMgmt(QuoteID, User.GetUserID());
            return Ok(Json(line));
        }

        [HttpPost, Route("createquote")]
        public async Task<IActionResult> CreateQuoteImpl([FromBody] QuoteCreationData data)
        {
            if (User.UserHasThisPermission(Permissions.QuoteCreateSendUpdate) || User.IsInRole("Local Service Provider"))
            {
                var quote = await _data.Quote_Insert(data.RequestID, User.GetUserID());

                if (quote.Quote != null && quote.Quote.QuoteID != 0)
                {
                    return Ok(Json(new { newquoteid = quote.Quote.QuoteID }));
                }

                return StatusCode((int)HttpStatusCode.BadRequest, new { responseText = quote.ValidationError });
            }
            return Unauthorized();
        }


        [HttpPost, Route("updateline")]
        public async Task<IActionResult> Quote_QuoteLine_Update([FromBody] QuoteLine dataLine)
        {
            try
            {
                var updatedLine = await _data.Quote_QuoteLine_Update(dataLine.QuoteLineID, dataLine.Role_ID, dataLine.RoleWriteIn, dataLine.Hours, dataLine.Rate, dataLine.IsOT, User.GetUserID());

                return Ok(Json(updatedLine));
            }
            catch (Exception e)
            {
                var ss = e.Message;
                throw;
            }
        }

        [HttpPost, Route("updateshifts")]
        public async Task<IActionResult> Quote_CalculateShitfsAndCrew([FromBody] QuoteShiftCrew dataShifts)
        {
            var updatedShifts = await _data.Quote_CalculateShitfsAndCrew(dataShifts.QuoteID, dataShifts.HrsPerShift, dataShifts.DaysOnSite, dataShifts.CrewSize, User.GetUserID());
            return Ok(Json(updatedShifts));
        }

        [HttpPost, Route("updatecondition"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_QuoteCondition_Update(int QuoteConditionID, bool Checked)
        {
            await _data.Quote_QuoteCondition_Update(QuoteConditionID, Checked, User.GetUserID());
            return Ok(Json(true));
        }

        [HttpPost, Route("updatecomments"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_QuoteComments_Update(int QuoteID, string Comments)
        {
            await _data.Quote_QuoteComments_Update(QuoteID, Comments, User.GetUserID());
            return Ok(Json(true));
        }

        [HttpGet, Route("popfromqq"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_QuoteLineDay_Generate(long QuoteID)
        {
            await _data.Quote_QuoteLineDay_Generate(QuoteID, true, User.GetUserID(), false);
            return Ok(Json(true));
        }

        [HttpPost, Route("popfromopplan"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_QuoteLine_Generate(long QuoteID)
        {
            var line = await _data.Quote_QuoteLine_Generate(QuoteID, true, User.GetUserID(), false);
            return Ok(Json(line));
        }

        [HttpPost, Route("updateworkrequest"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> Quote_Update(long QuoteID, string Description, string OtherConditions)
        {
            var updatedWC = await _data.Quote_Update(QuoteID, Description, OtherConditions, User.GetUserID());
            return Ok(Json(updatedWC));
        }

        [HttpPost, Route("removeline")]
        public async Task<IActionResult> Quote_QuoteLine_Delete([FromBody] long QuoteLineID)
        {
            //if (User.UserHasThisPermission(Permissions.QuoteCreateSendUpdate) || User.IsInRole("Local Service Provider"))
            //{
                var deleted = await _data.Quote_QuoteLine_Delete(QuoteLineID, User.GetUserID());
                return Ok(Json(deleted));
            //}
            //else
            //    return AccessDenied;
        }

        [HttpGet, Route("newquoteversion"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> NewQuoteVersion(long QuoteID)
        {
            var newQ = await _data.Quote_CreateNewVersion(QuoteID, User.GetUserID());
            return Ok(Json(newQ));
        }

        [HttpPost, Route("updatecontact"), HasPermission(Permissions.QuoteRead)]
        public async Task<IActionResult> Quote_Update_Contacts([FromBody] QuoteContactUpdate ContactInfo)
        {
            var updatedContact = await _data.Quote_Update_Contacts(ContactInfo.QuoteID, ContactInfo.ContactID, User.GetUserID());
            return Ok(Json(updatedContact));
        }

        [HttpPost, Route("sendemail")]
        public async Task<IActionResult> QuoteSendEmail([FromBody] QuoteEmail EmailData)
        {
            var sd = await _data.QuoteSendEmail(EmailData, User.GetUserID());
            return Ok(Json(sd));
        }

        //[HttpPost, Route("sendemailToPM"), HasPermission(Permissions.QuoteSendUpdateToPM)]
        //public async Task<IActionResult> QuoteSendEmailToPM([FromBody] QuoteEmail EmailData)
        //{
        //    var sd = await _data.QuoteSendEmail(EmailData, User.GetUserID());
        //    return Ok(Json(sd));
        //}

        [HttpPost, Route("generatetemplate"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> QuoteGenerateTemplate([FromBody] QuoteEmail EmailData)
        {
            await _data.QuoteGenerateTemplate(EmailData, User.Identity.Name, User.GetUserID());
            return Ok(Json(true));
        }

        [HttpGet, Route("quotedataselect"), HasPermission(Permissions.QuoteRead)]
        public async Task<IActionResult> QuoteDataSelectGetImpl(long QuoteID)
        {
            var qd = await _data.Quote_Data_Select(QuoteID);
            return Ok(Json(qd));
        }

        [HttpGet, Route("quotesbyprojectorjob"), HasPermission(Permissions.QuoteRead)]
        public async Task<IActionResult> QuotesByJobGetImpl(long? JobNo, long? JobId, long? ProjectID)
        {
            var quotes = await _data.Quote_SelectByProjectOrJob(JobId, JobNo, ProjectID, User.GetUserID());
            return Ok(Json(quotes));
        }

        [HttpGet, Route("createquotefromquote"), HasPermission(Permissions.QuoteCreateSendUpdate)]
        public async Task<IActionResult> CreateQuoteFromQuoteGetImpl(long RequestId, long CopyFromQuoteId)
        {
            var result = await _data.Quote_CreateFromQuote(RequestId, CopyFromQuoteId, User.GetUserID());
            return Ok(Json(result));
        }


        #endregion

        #region Scheduler

        // SRLocationId
        [HttpGet, Route("dayschedule"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> DayScheduleImpl(long OrganizationID, DateTime ForDate, bool OnlyUnnasigned)
        {
            // Normal Jobs (editable) schedule lines

            var daySchedule = await _data.Scheduler_Day_Select<APISchedulerDay>(OrganizationID, ForDate.ToUniversalTime(), OnlyUnnasigned);

            var dayCrewSchedule = await _data.Scheduler_DayCrew_Select(OrganizationID, ForDate.ToUniversalTime());

            var dayVehicleSchedule = await _data.Scheduler_DayVehicle_Select(OrganizationID, ForDate.ToUniversalTime());
           
            var dayRows = daySchedule.OrderBy(r => r.SchedulerPosition).ThenBy(r => r.WSEStartTime).Select(schedule =>
            {
                schedule.Crew = dayCrewSchedule.Where(crew => crew.RequestScheduleId == schedule.RequestScheduleId && crew.IsLead == false);
                schedule.Lead = dayCrewSchedule.Where(crew => crew.RequestScheduleId == schedule.RequestScheduleId && crew.IsLead == true);
                schedule.Vehicles = dayVehicleSchedule.Where(vehicle => vehicle.RequestScheduleId == schedule.RequestScheduleId);

                return schedule;
            });

            // PTO and Service Line (read-only) schedule lines
            var dayPTOSvcAcctLines = await _data.Scheduler_DayPTOSvcAcct_Select<APISchedulerDaySvcAcctPTO>(OrganizationID, ForDate.ToUniversalTime(), OnlyUnnasigned);
            var dayPTOSvcAcctCrew = await _data.Scheduler_DayPTOSvcAcctCrew_Select(OrganizationID, ForDate.ToUniversalTime());
            
            var dayPTOSvcAcctRows = dayPTOSvcAcctLines.Select(schedule =>
            {
                schedule.Crew = dayPTOSvcAcctCrew.Where(crew => crew.RequestScheduleId == schedule.RequestScheduleId && crew.IsLead == false);
                schedule.Lead = dayPTOSvcAcctCrew.Where(crew => crew.RequestScheduleId == schedule.RequestScheduleId && crew.IsLead == true);
                return schedule;
            });

            // Get the different customers for the day jobs
            var dayCustomers = daySchedule.Select(d => new { d.customer_id, d.customer_name }).Union(dayPTOSvcAcctLines.Select(d => new { d.customer_id, d.customer_name })).Distinct();

            //* TODO: (FJP) in case they want to see distinct project manager names ignoring proj manager id. js needs to be changed too to accomplish this.
            //var dayPMsAll = daySchedule.Select(d => new { ProjectManagerId = d.ProjectManagerName, d.ProjectManagerName }).Union(dayPTOSvcAcctLines.Select(d => new { ProjectManagerId = d.ProjectManagerName, d.ProjectManagerName})).Distinct().OrderBy(d => d.ProjectManagerName);
            var dayPMsAll = daySchedule.Select(d => new { d.ProjectManagerId, d.ProjectManagerName }).Union(dayPTOSvcAcctLines.Select(d => new { d.ProjectManagerId, d.ProjectManagerName})).Distinct().OrderBy(d => d.ProjectManagerName);

            // to select distinct names ignoring case.
            var dayPMs =
                from ProjectManagerName in dayPMsAll.Select(x => x.ProjectManagerName).Distinct(StringComparer.CurrentCultureIgnoreCase)
                from dayPM in dayPMsAll
                .Where(x => string.Equals(x.ProjectManagerName, ProjectManagerName, StringComparison.OrdinalIgnoreCase))
                .Take(1)
                select dayPM;

            return Ok(JSONUtils.JsonUTC(new { dayRows, dayPTOSvcAcctRows, dayCustomers, dayPMs }));
        }



        [HttpGet, Route("resources"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> LocationResourcesImpl(long OrganizationID, DateTime? ForDate)
        {
            var HumanResources = (await _data.Resource_ResourceSkills_Select(OrganizationID, ForDate.Value.ToUniversalTime())).Select(r => new SchedulerResource(r));
            
            var VehicleResources = await _data.Resource_ResourceVehicles_Select(OrganizationID, ForDate.Value.ToUniversalTime());
            
            var locations = await _data.Resource_Location_Select(OrganizationID);
            
            return Ok(JSONUtils.JsonUTC(new { HumanResources, VehicleResources, locations }));
        }

        [HttpGet, Route("getlocations")]
        public async Task<IActionResult> GetLocationImpl(long OrganizationID, DateTime? ForDate)
        {
            var locations = await _data.Resource_Location_Select(OrganizationID);
            return Ok(JSONUtils.JsonUTC(new {locations }));
        }


        [HttpPost, Route("assignresource"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> AssingCrewResourceImpl([FromBody] APIResourceAssignation assignation)
        {
            DateTime start;
            DateTime end;
            double elapsedInSecs;
            switch (assignation.ResourceType)
            {

                case "CREW":
                    var r = await _data.Scheduler_DayCrew_Update(assignation.RequestScheduleCrewId, assignation.Resource_ID, User.GetUserID());
                    await NotifyClients();
                    return Ok(Json(r));
                case "LEAD":
                    var s = await _data.Scheduler_DayCrew_Update(assignation.RequestScheduleCrewId, assignation.Resource_ID, User.GetUserID());
                    await NotifyClients();
                    return Ok(Json(s));
                case "VEHICLE":
                    var t = await _data.Scheduler_DayVehicle_Update(assignation.RequestScheduleCrewId, assignation.DriverID, assignation.Resource_ID, User.GetUserID());
                    await NotifyClients();
                    return Ok(Json(t));
                default:
                    throw new Exception($"AssingCrewResourceImpl - Unknown resource type ResourceType=[{assignation?.ResourceType ?? "null"}]");
            }

            async Task NotifyClients()
            {
                var start = DateTime.UtcNow;
                await _schedulerHubContext.Clients.All.SendAsync("SchedulerUpdate", new SchedulerChangeMsg { OrganizationID = assignation.OrganizationID });
                var end = DateTime.UtcNow;
                var elapsedInSecs = (end - start).TotalSeconds;
                Log.Information("[PERFORMANCE-SCHED] UserID: " + User.GetUserID() + " NotifyClients - SchedulerUpdate OrganizationID=" + assignation.OrganizationID.ToString() + " - DurationInSecs:" + elapsedInSecs.ToString());
            }
        }


        [HttpPost, Route("updateresourceproperties"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> UpdateResourcePropertiesImpl([FromBody] APIResourceProperties ResourceProps)
        {

            SchedulerDayCrew crewData = null;
            if (ResourceProps.CallOut != null)
            {
                crewData = await _data.Scheduler_DayCrewNoShow_Update(ResourceProps.RequestScheduleCrewId, ResourceProps.CallOut.NoShowLookupID, ResourceProps.CallOut.NoShowReason, User.GetUserID());
            }
            if (ResourceProps.Notes != null)
            {
                crewData = await _data.Scheduler_DayCrewExceptionNotes_Update(ResourceProps.RequestScheduleCrewId, ResourceProps.Notes, User.GetUserID());
            }

            return Ok(JSONUtils.JsonUTC(crewData));
        }


        [HttpGet, Route("daysummarybyrole"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> DaySummaryByRoleImpl(long OrganizationID, DateTime ForDate, long? LocationId)
        {
            var daySummary = await _data.Scheduler_DaySummaryByRole_Select(OrganizationID, ForDate.ToUniversalTime(), LocationId);

 
            return Ok(JSONUtils.JsonUTC(daySummary));
        }


        [HttpGet, Route("requestschedulerolesandquantities"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> RequestScheduleRolesAndQuantitiesImpl(long RequestScheduleId)
        {
            var dayRolesQtys = await _data.Scheduler_RolesAndQuantities_Select(RequestScheduleId, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(dayRolesQtys));
        }

        [HttpGet, Route("quotesrolesandquantities"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> QuotesRolesAndQuantitiesImpl(long QuoteID) {
            var dayRolesQtys = await _data.Quote_RolesAndQuantities_Select(QuoteID, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(dayRolesQtys));
        }

        [HttpPost, Route("requestschedulerolesandquantities"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> RequestScheduleRolesAndQuantitiesPostImpl([FromBody] APIScheduleRolesAndQtys rolesAndQtys)
        {
            var root = new XElement("Roles");

            foreach (var role in rolesAndQtys.RolesAndQts)
            {
                var xrole = new XElement("Role");
                xrole.Add(new XElement("RoleId", role.roleId));
                xrole.Add(new XElement("Quantity", role.quantity));
                root.Add(xrole);
            }

            var res = await _data.Scheduler_RolesAndQuantities_Update(rolesAndQtys.RequestScheduleId, root.ToString(), User.GetUserID());
            await _schedulerHubContext.Clients.All.SendAsync("SchedulerUpdate", new SchedulerChangeMsg { OrganizationID = rolesAndQtys.OrganizationID });
            return Ok(JSONUtils.JsonUTC(res));
        }

        [HttpPost, Route("quotelinedaybulkinsert")]
        public async Task<IActionResult> QuoteLineDayBulkInsertPostImpl([FromBody] APIQuoteLineDay quoteLineDayBulkEntry) {
            try {
                var root = new XElement("Roles");

                foreach (var role in quoteLineDayBulkEntry.RolesAndQtties) {
                    var xrole = new XElement("Role");
                    xrole.Add(new XElement("RoleId", role.roleId));
                    xrole.Add(new XElement("Quantity", role.quantity));
                    root.Add(xrole);
                }

                var res = await _data.QuoteLineDay_BulkInsert(quoteLineDayBulkEntry, root.ToString(), User.GetUserID());
                // await _schedulerHubContext.Clients.All.SendAsync("SchedulerUpdate", new SchedulerChangeMsg { OrganizationID = quoteLineDayBulkEntry.OrganizationID });
                return Ok(JSONUtils.JsonUTC(res));
            }
            catch (Exception e) {
                return Ok(new { Success = false, Errors = e.Message });
            }
        }

        [HttpGet, Route("userschedulesettings"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> UserSchedulerSettingsGetImpl()
        {
            var settings = await _data.ConfigUser_Select("SCHEDULER_GRID", User.GetUserID());
            return Ok(JSONUtils.JsonUTC(new
            {
                HasSettings = settings != null,
                Settings = settings
            }));
        }

        [HttpPost, Route("userschedulesettings"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> UserSchedulerSettingsPostImpl([FromBody] ConfigUser config)
        {
            var setting = await _data.ConfigUser_Update("SCHEDULER_GRID", config.ConfigValue, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(setting));
        }

        [HttpPost, Route("usermonthlyschedulesettings"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> UserMonthlySchedulerSettingsPostImpl([FromBody] MonthlySchedulerConfig config)
        {
            var setting = await _data.ConfigUser_Update($"SCHEDULER_MONTHLY_ORG_{config.OrganizationID}", JsonConvert.SerializeObject(config), User.GetUserID());
            return Ok(JSONUtils.JsonUTC(setting));
        }

        [HttpGet, Route("dayjobsunnasigned"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> DayJobsUnassignedImpl(long OrganizationID, DateTime ForDate)
        {

            var jobs = await _data.Scheduler_DayUnassigned_Select(OrganizationID, ForDate.ToUniversalTime());
            return Ok(JSONUtils.JsonUTC(jobs));
        }

        [HttpPost, Route("scheduledayupdate")]
        public async Task<IActionResult> ScheduleDayUpdatePostImpl([FromBody] APIScheduleDayUpdate update)
        {

            var upd = await _data.Scheduler_Day_Update(update.RequestScheduleId, update.ProjectManagerId, update.WseStartTime, update.FieldStartTime, update.Notes, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(upd));
        }

        [HttpGet, Route("emailjob"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> EmailJobGetImpl(long RequestScheduleID)
        {
            var recipients = await _data.Quote_Contacts_Select(null, RequestScheduleID);
            var emailbody = await _data.Scheduler_DayJobDetail_Select(RequestScheduleID, User.GetUserID());

            return Ok(JSONUtils.JsonUTC(new { recipients, emailbody }));
        }

        [HttpPost, Route("emailjob"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> EmailJobPostImpl([FromBody] APIEmailDayJob emaildata)
        {
            await _data.Scheduler_DayJobDetail_Email(emaildata.RequestScheduleID, string.Join(';', emaildata.EmailRecipientList), emaildata.EmailText, User.GetUserID());
            //await _data.Scheduler_DayJobDetail_Email(emaildata.RequestScheduleID, "silvio.malatini@empactit.com", emaildata.EmailText, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(new { succeeded = true }));
        }

        [HttpPost, Route("updatejobdaterange"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> UpdateJobDateRangePostImpl([FromBody] APIUpdateJobDateRange jobupdate)
        {
            await _data.Scheduler_DateRange_Update(jobupdate.RequestScheduleId, jobupdate.StartDate, jobupdate.EndDate, jobupdate.HoursPerShift, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(new { succeeded = true }));
        }



        [HttpGet, Route("schedulermanpower")]
        public async Task<IActionResult> SchedulerManpowerMonthlyGet(long OrganizationID, DateTime? StartDate, long LocationID)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.SchedulerDayRead, Permissions.ServiceRequestSoftSchedule, Permissions.ServiceRequestSetHardSchedule }))
            {
                return Unauthorized();
            }

            var fullDays = await _data.Scheduler_Manpower_Monthly(OrganizationID, StartDate.Value.ToUniversalTime(), LocationID);
            var days = fullDays.GroupBy(d => d.Date).Select(g => new { Date = g.Key, Color = g.Max(c => c.DateColor) }).OrderBy(d => d.Date);
            return Ok(JSONUtils.JsonUTC(days));
        }


        [HttpPost, Route("sendschedulercustomeremail"), HasPermission(Permissions.SchedulerDayResourceUpdateAssign)]
        public async Task<IActionResult> SendSchedulerCustomerEmailPostImpl([FromBody] APICustomerEmail data)
        {
            await _data.Scheduler_DayJobSendCustomer_Email(data.RequestScheduleID, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(new { succeeded = true }));
        }


        [HttpGet, Route("schedulerexceptions"), HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> SchedulerExceptionsGetImpl(long OrganizationID)
        {
            var exceptions = await _data.Scheduler_Exceptions_Select(OrganizationID, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(exceptions));
        }


        [HttpPost, Route("sendschedulersavepositions"), HasPermission(Permissions.SchedulerDayArrangeJobPositions)]
        public async Task<IActionResult> SchedulerSavePostionsPostImpl([FromBody] APISchedulerJobPositionUpdate PositionsUpdate)
        {
            var root = new XElement("SchedulerPositions");
            foreach (var jp in PositionsUpdate.JobPositions)
            {
                var field = new XElement("SchedulerPosition");
                field.Add(new XElement("RequestScheduleID", jp.RequestScheduleID));
                field.Add(new XElement("Position", jp.Position));
                root.Add(field);
            }
            var jobPositionsXML = root.ToString(SaveOptions.DisableFormatting);
            await _data.Scheduler_SavePositions(jobPositionsXML);

            // Notify Job Position change to other users having Scheduler open
            // Send the RequestScheduleId's so the local client can check if he's displaying any of it and request refresh if so or ignore the update 
            // if not displaying any of those ids
            await _schedulerHubContext.Clients.All.SendAsync("JobsPositionChanged", new
            {
                schedulerclientid = PositionsUpdate.SchedulerClientID,
                rsids = PositionsUpdate.JobPositions.Select(j => j.RequestScheduleID)
            });

            return APISucessResponse();
        }


        #endregion

        #region Time Entry


        public bool DayTimeEntriesGetValidPermissions(long? AsUserID)
        {
            if (!AsUserID.HasValue && User.UserHasAnyPermission(new Permissions[] { Permissions.TimeEntryJobCrewAddRemoveUpdate, Permissions.TimeEntryJobCrewRead, Permissions.TimeEntryJobPersonalClockInClockOut, Permissions.TimeEntryJobPersonalViewTimesheet }))
            {
                return true;
            }
            if (AsUserID.HasValue && User.UserHasThisPermission(Permissions.TimeEntryJobCrewRead))
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// Gets the time entries for the TE Job screen
        /// </summary>
        /// <param name="ForDate"></param>
        /// <param name="AsUserID"></param>
        /// <returns></returns>
        [HttpGet, Route("daytimeentries")]
        public async Task<IActionResult> DayTimeEntriesGetImpl(long OrganizationID, DateTime ForDate, long? AsUserID = null)
        {
            if (!DayTimeEntriesGetValidPermissions(AsUserID))
            {
                return Unauthorized();
            }

            var allDayTimeEntriesResult = await _data.TimeEntry_Project_Select(OrganizationID, AsUserID ?? User.GetUserID(), ForDate.ToUniversalTime(), User.GetUserID());

            var timeEntries = allDayTimeEntriesResult.AllDayTimeEntries.GroupBy(te => te.RequestScheduleId).Select(teg => new APIJobTimeEntry
            {
                //project_request_no = teg.Key.ToString(),
                project_request_no = teg.First().project_request_no,
                requestscheduleid = teg.Key,
                serviceid = teg.First().serviceid,
                Request_Name = teg.First().Request_Name,
                customer_name = teg.FirstOrDefault()?.customer_name ?? "Unknown Customer",
                job_name = teg.FirstOrDefault()?.JOB_NAME ?? "Unknown Job Name",
                requestid = teg.First().Request_Id,
                projectno = teg.First().Project_No,
                requestno = teg.First().Request_No,
                versionno = teg.First().Version_No,
                whsestarttime = teg.First().WSEStartTime,
                fieldstarttime = teg.First().FieldStartTime,
                //* isLead added by FernandoP 2022.09.26 https://dev.azure.com/EIT2020/Omni%20Portal/_workitems/edit/8986/
                isLead = User.UserHasThisPermission(Permissions.DailyStatusCreateSendUpdate) || teg.Max(x => x.IsLead),
                TimeEntries = teg.Where(t => t.ParentServiceLineTimeEntryId == null).OrderBy(te => te.RoleDisplayOrder).ThenBy(te => te.ResourceName).Select(t => new APIJobTimeEntryWithLunchs { TimeEntry = t, Lunchs = teg.Where(l => l.ParentServiceLineTimeEntryId == t.ServiceLineTimeEntryID) })// ToArray()  
            });

            var dayUsers = await _data.TimeEntry_Resources_Select(OrganizationID, ForDate.ToUniversalTime());

            var top1Entry = allDayTimeEntriesResult.AllDayTimeEntries.FirstOrDefault();
            var userControls = new
            {
                AddLunchButtonEnabled = top1Entry?.AddLunchButtonEnabled ?? false,
                CheckInOutButtonsEnabled = top1Entry?.CheckInOutButtonsEnabled ?? false,
                IsReadOnly = !(User.UserHasThisPermission(Permissions.TimeEntryJobOthersClockInClockOut) || User.UserHasThisPermission(Permissions.TimeEntryJobPersonalClockInClockOut)),
                CanClockOthers = User.UserHasThisPermission(Permissions.TimeEntryJobOthersClockInClockOut),
                CanClockSelf = User.UserHasThisPermission(Permissions.TimeEntryJobPersonalClockInClockOut)
            };

            return Ok(JSONUtils.JsonUTC(new
            {
                succeeded = allDayTimeEntriesResult.Succeeded,
                errorMessage = allDayTimeEntriesResult.ErrorMessage,
                timeEntries,
                dayUsers,
                userControls
            }));

        }


        [HttpGet, Route("jobnotes")]
        public async Task<IActionResult> DayNotesGetImpl(long OrganizationID, long RequestID, DateTime ForDate)
        {
            var daySchedule = await _data.Scheduler_Day_Select<APISchedulerDay>(OrganizationID, ForDate.ToUniversalTime(), false);
            var notes = daySchedule.Where(s => s.request_id == RequestID).FirstOrDefault()?.Notes ?? "No Project Notes were found.";

            return Ok(new { jobNotes = notes });
        }

        [HttpGet, Route("autostart")]
        public async Task<IActionResult> AutoStartGetImpl(long ServiceId, long RequestScheduleId, DateTime ForDate, long? AsUserID)
        {
            var autostarts = await _data.TimeEntry_AutoDayResource_Select(ServiceId, RequestScheduleId, ForDate, "START", User.GetUserID(), AsUserID);
            return Ok(Json(autostarts));
        }

        [HttpPost, Route("autostart")]
        public async Task<IActionResult> AutoStartPostImpl([FromBody] APIAutoStartPost data)
        {
            var autostarts = await _data.TimeEntry_AutoStart_Update(data.ServiceId, data.ForDate, data.ResourceIds, User.GetUserID());
            return Ok(Json(autostarts));
        }

        [HttpGet, Route("lunchers")]
        public async Task<IActionResult> LunchGetImpl(long ServiceId, long requestscheduleid, DateTime ForDate, long? AsUserID)
        {
            var lunchers = await _data.TimeEntry_AutoLunchResource_Select(ServiceId, requestscheduleid, ForDate.ToUniversalTime(), User.GetUserID(), AsUserID);
            return Ok(Json(lunchers));
        }

        [HttpPost, Route("lunchers")]
        public async Task<IActionResult> LunchPostImpl([FromBody] APILunchers data)
        {
            var lunchers = await _data.TimeEntry_Lunch_Insert(data.ServiceID, data.requestscheduleid, data.ForDate, data.StartTime, data.EndTime, data.ResourceIds, User.GetUserID());
            return Ok(Json(lunchers));
        }

        [HttpPost, Route("removelunch")]
        public async Task<IActionResult> LunchRemovePostImpl([FromBody] APITimeEntryUpdate data)
        {
            await _data.TimeEntry_Lunch_Delete(data.serviceLineTimeEntry, User.GetUserID());
            return APISucessResponse();
        }

        [HttpGet, Route("addteammember")]
        public async Task<IActionResult> AddTeamMemberGetImpl(long? ServiceID, long? RequestScheduleID, long? OrganizationID, DateTime ForDate)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.TimeEntryJobCrewAddRemoveUpdate, Permissions.TimeEntrySvcAcctCrewAddRemoveUpdate }))
            {
                return Unauthorized();
            }

            var members = await _data.TimeEntry_MemberResource_Select(ServiceID, RequestScheduleID, OrganizationID, ForDate.ToUniversalTime(), User.GetUserID());
            var typeOfAddition = await _data.TimeEntry_TypeOfAddition_Select();
            return Ok(Json(new { members, typeOfAddition }));
        }

        [HttpPost, Route("addteammember")]
        public async Task<IActionResult> AddTeamMemberPostImpl([FromBody] APIAddTeamMember memberInfo)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.TimeEntryJobCrewAddRemoveUpdate, Permissions.TimeEntrySvcAcctCrewAddRemoveUpdate }))
            {
                return Unauthorized();
            }

            await _data.TimeEntry_Member_Insert(memberInfo.ServiceID, memberInfo.RequestScheduleId, memberInfo.ForDate, memberInfo.ResourceID, memberInfo.TypeOfAddition, User.GetUserID());
            return Ok(Json(new { succeeded = true }));
        }

        [HttpPost, Route("timeentryupdate")]
        public async Task<IActionResult> AddTimeEntryPostImpl([FromBody] APITimeEntryUpdate update)
        {
            var result = await _data.TimeEntry_Update(update.serviceLineTimeEntry, update.time.CleanAfterMinutes(), update.type, update.forceendwolunch, update.notes, User.GetUserID());
            return Ok(Json(result));
        }


        [HttpGet, Route("shouldfilldsr")]
        public async Task<IActionResult> ShouldFillDSRGetImpl(long OrganizationID, long ServiceLineTimeEntry)
        {
            var missingDSR = await _data.TimeEntry_CheckRequestDailyStatus(OrganizationID, ServiceLineTimeEntry, User.GetUserID());
            return Ok(Json(new { ShouldCompleteDSR = missingDSR }));
        }

        [HttpGet, Route("autoend")]
        public async Task<IActionResult> AutoEndGetImpl(long ServiceId, long RequestScheduleId, DateTime ForDate, long? AsUserID)
        {
            var autoends = await _data.TimeEntry_AutoDayResource_Select(ServiceId, RequestScheduleId, ForDate.ToUniversalTime(), "END", User.GetUserID(), AsUserID);
            return Ok(Json(autoends));
        }

        [HttpPost, Route("autoend")]
        public async Task<IActionResult> AutoEndPostImpl([FromBody] APIAutoEndPost data)
        {
            var autoends = await _data.TimeEntry_AutoEnd_Update(data.ServiceId, data.RequestScheduleId, data.ForDate, data.ResourceIds, data.ForceEndWOLunch, User.GetUserID());
            return Ok(Json(autoends));
        }

        [HttpGet, Route("teleadresource")]
        public async Task<IActionResult> TeLeadResourceGetImpl(long? ServiceLineTimeEntryID, long? ServiceId, DateTime? ForDate)
        {
            var availableresources = await _data.TimeEntry_LeadResource_Select(ServiceLineTimeEntryID, ServiceId, ForDate.Value.ToUniversalTime(), User.GetUserID());
            return Ok(Json(availableresources));
        }

        [HttpPost, Route("teleadresource")]
        public async Task<IActionResult> TeLeadResourcePostImpl([FromBody] APINewTimeEntryLeadPost leadUpdate)
        {
            await _data.TimeEntry_LeadResource_Update(leadUpdate.ServiceLineTimeEntryID, leadUpdate.ServiceId, leadUpdate.ForDate, leadUpdate.ResourceId, User.GetUserID());
            return APISucessResponse();
        }




        [HttpGet, Route("serviceaccountdayresources")]
        public async Task<IActionResult> GetJobsImpl(long OrganizationID, DateTime ForDate)
        {
            var resources = await _data.TimeEntry_ServiceAccountResources_Select(OrganizationID, ForDate.ToUniversalTime(), User.GetUserID());

            // Separate the Resource headers from the child activities
            var nestedResources = resources.Where(r => r.ParentServiceLineTimeEntryId == null)
                .Select(r => new APIServiceAccountRequests { Header = r, Activities = resources.Where(a => a.ParentServiceLineTimeEntryId == r.ServiceLineTimeEntryID) });

            return Ok(JSONUtils.JsonUTC(new
            {
                resources = nestedResources,
                isReadOnly = !User.UserHasThisPermission(Permissions.TimeEntrySvcAcctOthersClockInClockOut)
            }));
        }



        [HttpGet, Route("serviceaccountjobs")]
        public async Task<IActionResult> GetJobsImpl(long OrganizationID, long? ResourceID)
        {
            var jobs = await _data.TimeEntry_ServiceAccountJob_Select(OrganizationID, ResourceID, User.GetUserID());
            return Ok(Json(jobs));
        }

        [HttpGet, Route("projectrequests")]
        public async Task<IActionResult> GetProjectRequestsImpl(long ProjectID)
        {
            var projs = await _data.TimeEntry_ServiceAccountSR_Select(ProjectID, User.GetUserID());
            return Ok(Json(projs));
        }

        [HttpGet, Route("requestcustomcolums")]
        public async Task<IActionResult> GetCustomColsImpl(long RequestID)
        {
            var customcols = await _data.CustomCols_Select(RequestID, false);
            return Ok(Json(customcols));
        }


        [HttpPost, Route("svcaccttimeentryaddjob"), HasPermission(Permissions.TimeEntrySvcAcctJobAddRemoveUpdate)]
        public async Task<IActionResult> AddJobServiceAccountTimeEntryPostImpl([FromBody] APIAddJobSvcAcctTimeEntry newjob)
        {
            // Convert Custom Field JSON to a XML string and pass it to the insert Stored Proc
            var customFields = JsonConvert.DeserializeObject<IEnumerable<RequestCustomField>>(newjob.customcols);
            var root = new XElement("CustomFields");
            foreach (var cusField in customFields)
            {
                var field = new XElement("CustomField");
                field.Add(new XElement("CustomFieldId", cusField.CustomFieldID));
                field.Add(new XElement("CustomFieldValue", cusField.CustomFieldValue));
                root.Add(field);
            }
            var customFieldsXML = root.ToString(SaveOptions.DisableFormatting);

            await _data.TimeEntry_ServiceLine_Insert(newjob.servicelinetimeentryid, newjob.requestid, newjob.fordate, newjob.hours, customFieldsXML, newjob.itemid, User.GetUserID());
            return Ok(Json(new { succeeded = true }));
        }


        [HttpPost, Route("svcaccttimeentryupdate")]
        public async Task<IActionResult> TimeEntryServiceLineUpdatePostImpl([FromBody] APITimeEntryServiceLineUpdate newvalues)
        {
            await _data.TimeEntry_ServiceLine_Update(newvalues.servicelineid, newvalues.hours, User.GetUserID());
            return Ok(Json(new { succeeded = true }));
        }



        /// <summary>
        /// Service Account - Resources that can autostart
        /// </summary>
        /// <param name="OrganizationId"></param>
        /// <param name="ForDate"></param>
        /// <returns></returns>
        [HttpGet, Route("svcacctautostart")]
        public async Task<IActionResult> ServiceAccountAutoStartGetImpl(long OrganizationId, DateTime ForDate)
        {
            var autostart = await _data.TimeEntry_ServiceAccountAutoDayResources_Select(OrganizationId, ForDate.ToUniversalTime(), "START", User.GetUserID());
            return Ok(Json(autostart));
        }


        /// <summary>
        /// Service Account - Resources that will be autostarted
        /// </summary>
        /// <param name="AutostartInfo"></param>
        /// <returns></returns>
        [HttpPost, Route("svcacctautostart")]
        public async Task<IActionResult> ServiceAccountAutoStartPostImpl([FromBody] APIAutoStartPost AutostartInfo)
        {
            var res = await _data.TimeEntry_ServiceAccountAutoStart_Update(AutostartInfo.ForDate, AutostartInfo.ResourceIds, User.GetUserID());
            return Ok(Json(res));
        }


        [HttpGet, Route("svcacctautoend")]
        public async Task<IActionResult> ServiceAccountAutoEndGetImpl(long OrganizationId, DateTime ForDate)
        {
            var autoends = await _data.TimeEntry_ServiceAccountAutoDayResources_Select(OrganizationId, ForDate.ToUniversalTime(), "END", User.GetUserID());
            return Ok(Json(autoends));
        }

        [HttpPost, Route("svcacctautoend")]
        public async Task<IActionResult> ServiceAccountAutoEndPostImpl([FromBody] APIAutoEndPost data)
        {
            var result = await _data.TimeEntry_ServiceAccountAutoEnd_Update(data.ForDate, data.ResourceIds, data.ForceEndWOLunch, User.GetUserID());
            return Ok(Json(result));
        }


        [HttpGet, Route("svcacctaddlunch")]
        public async Task<IActionResult> ServiceAccountAddLunchGetImpl(long OrganizationId, DateTime ForDate)
        {
            var autoluchers = await _data.TimeEntry_ServiceAccountAutoLunchResources_Select(OrganizationId, ForDate.ToUniversalTime(), User.GetUserID());
            return Ok(Json(autoluchers));
        }


        [HttpPost, Route("svcacctaddlunch")]
        public async Task<IActionResult> ServiceAccountAddLunchPostImpl([FromBody] APILunchers lunchers)
        {
            var result = await _data.TimeEntry_Lunch_Insert(null, null, lunchers.ForDate, lunchers.StartTime, lunchers.EndTime, lunchers.ResourceIds, User.GetUserID());
            return Ok(Json(result));
        }

        [HttpPost, Route("timeentryresourcenoshow")]
        public async Task<IActionResult> ServiceAccountAddLunchPostImpl([FromBody] APIResourceNoShow noshowinfo)
        {
            await _data.TimeEntry_NoShowResource_Update(noshowinfo.servicelinetimeentryid,
                noshowinfo.serviceid,
                noshowinfo.timeentrydate,
                noshowinfo.resourceid,
                noshowinfo.noshowid,
                noshowinfo.noshownotes,
                User.GetUserID());

            return APISucessResponse();
        }


        private bool ValidMyWeekApprovalGetPermissions()
        {
            if (User.UserHasThisPermission(Permissions.ApproveMyWeekProxyApproveReject))
            {
                return true;
            }
            if (User.UserHasThisPermission(Permissions.ApproveMyWeekPersonalApproveReject))
            {
                return true;
            }

            return false;
        }


        [HttpGet, Route("myweekapproval")]
        public async Task<IActionResult> MyWeekApprovalGetImpl(long organizationID, DateTime ForDate, long? AsResourceID)
        {
            if (!ValidMyWeekApprovalGetPermissions())
            {
                return Unauthorized();
            }

            Log.Information("MyWeekApprovalGetImpl: Before calling TimeApproval_TimeEntry_Select");
            var start = DateTime.UtcNow;
            var myapprovallist = await _data.TimeApproval_TimeEntry_Select(organizationID, ForDate.ToUniversalTime(), AsResourceID, User.GetUserID());
            var end = DateTime.UtcNow;
            var elapsedInSecs = (end - start).TotalSeconds;
            Log.Information($"MyWeekApprovalGetImpl: After calling TimeApproval_TimeEntry_Select - {elapsedInSecs} seconds");
            start = DateTime.UtcNow;
            var myapprovallistbyDay = myapprovallist.GroupBy(i => new { i.TimeEntryDate, i.TimeSheetID })
                .Select(g =>
                {
                    var jobs = g.Where(l => l.TimeSheetID != null).GroupBy(j => j.ServiceLineTimeEntryID).Select(jobsGroup => new
                    {
                        TimeIn = jobsGroup.First().TimeEntryStartTime,
                        TimeOut = jobsGroup.First().TimeEntryEndTime,
                        Lunchs = jobsGroup.First().QtyLunch,
                        LunchTime = jobsGroup.First().TotalLunchHours,
                        TotalHours = jobsGroup.First().TotalHours,

                        JobsData = jobsGroup.Select(jd => new
                        {
                            Job = jd.JobNumber,
                            Request = jd.RequestNumber,
                            JobDescription = jd.JobDescription
                        }),
                        JobsDataLength = jobsGroup.Count()
                    });


                    return new
                    {
                        ForDate = g.Key.TimeEntryDate,
                        g.Key.TimeSheetID,
                        g.First().IsApproved,
                        g.First().CanUndo,
                        g.First().IsPTO,
                        BSCollapseGroupID = "g" + Guid.NewGuid().ToString("N"),
                        Jobs = jobs
                    };
                })
                .OrderBy(d => d.ForDate);

            end = DateTime.UtcNow;
            elapsedInSecs = (end - start).TotalSeconds;
            Log.Information($"MyWeekApprovalGetImpl: After filling myapprovallistbyDay - {elapsedInSecs} seconds");
            start = DateTime.UtcNow;

            // Get the list of Resources that this User is allowed to see
            var dayResources = await _data.TimeApproval_Resources_Select(organizationID, ForDate.ToUniversalTime(), User.GetUserID(), User.UserHasThisPermission(Permissions.ApproveMyWeekProxyApproveReject));
            end = DateTime.UtcNow;
            elapsedInSecs = (end - start).TotalSeconds;
            Log.Information($"MyWeekApprovalGetImpl: After filling dayResources - {elapsedInSecs} seconds");
            start = DateTime.UtcNow;

            // Sum all the Jobs hours
            var totalHoursSum = myapprovallistbyDay.SelectMany(d => d.Jobs).Sum(j => j.TotalHours);
            end = DateTime.UtcNow;
            elapsedInSecs = (end - start).TotalSeconds;
            Log.Information($"MyWeekApprovalGetImpl: After filling totalHoursSum - {elapsedInSecs} seconds");
            start = DateTime.UtcNow;
            return Ok(JSONUtils.JsonUTC(new { myapprovallistbyDay, dayResources, totalHoursSum }));
        }


        [HttpPost, Route("daytimesheet")]
        public async Task<IActionResult> ApproveTimePostImpl([FromBody] APIDayApprovePost data)
        {
            var reply = await _data.TimeSheet_Update(data.TimeSheetId, data.Approved, data.RejectReason, User.GetUserID());
            return Ok(Json(reply));
        }

        [HttpPost, Route("dayremovepto")]
        public async Task<IActionResult> RemovePTOImpl([FromBody] APIRemovePTO data) {

            var reply = await _data.Timesheet_RemovePTO(data.ForDate, data.ResourceId, data.OrganizationId, User.GetUserID());
            return Ok(Json(reply));
        }

        [HttpPost, Route("weektimesheet")]
        public async Task<IActionResult> ApproveTimePostImpl([FromBody] APIWeekApprovePost data)
        {
            var reply = await _data.TimeSheet_Bulk_Update(data.Date, data.Approved, data.RejectReason, User.GetUserID(), data.AsResourceID);
            return Ok(Json(reply));
        }

        [HttpPost, Route("undoapproval")]
        public async Task<IActionResult> UndoApprovalPostImpl([FromBody] APIDayApprovePost data)
        {
            var reply = await _data.TimeSheet_UndoApproval(data.TimeSheetId, User.GetUserID());
            return Ok(Json(reply));
        }

        [HttpGet, Route("workcodes")]
        public async Task<IActionResult> BulkTimeEntryWorkCodesGetImpl(long? JobID, long? JobNo, string members, bool isForSA = false)
        {
            var wc = await _data.BulkTimeEntry_WorkCode_Select(JobID, JobNo, members, User.GetUserID(), isForSA);
            return Ok(Json(wc));
        }

        [HttpGet, Route("bulktimeentryrequests"), HasPermission(Permissions.TimeEntryBulkEnterTime)]
        public async Task<IActionResult> BulkTimeEntryRequestsGetImpl(long OrganizationID, long? Resource, long ProjectID)
        {
            var rq = await _data.BulkTimeEntry_Request_Select(OrganizationID, Resource, ProjectID, User.GetUserID());
            return Ok(Json(rq));
        }

        [HttpPost, Route("bulktimeentry"), HasPermission(Permissions.TimeEntryBulkEnterTime)]
        public async Task<IActionResult> BulkTimeEntryPostImpl([FromBody] APIBulkTimeEntryInsert data)
        {
            var reply = await _data.TimeEntry_BulkServiceLine_Insert(data.Date.ToUniversalTime(), data.JobId, string.Join(',', data.LstResourcesId), string.Join(',', data.LstServiceRequests), data.WorkCodeId, data.PayCodeId, User.GetUserID(), data.IsOT, data.StartTime, data.EndTime);
            return Ok(Json(reply));
        }

        [HttpGet, Route("bulktimeentry"), HasPermission(Permissions.TimeEntryBulkEnterTime)]
        public async Task<IActionResult> BulkTimeEntryGetImpl(long OrganizationId, long JOBID, DateTime? STARTDATE, DateTime? ENDDATE)
        {
            var timeEntries = (await _data.TimeEntry_Select(OrganizationId, JOBID, STARTDATE, ENDDATE, User.GetUserID())).OrderByDescending(t1 => t1.service_line_date_varchar).ThenBy(t2 => t2.job_name).ThenBy(t3 => t3.resource_name);
            return Ok(Json(timeEntries));
        }

        [HttpGet, Route("emaildailystatusreport")] //, HasPermission(Permissions.DailyStatusCreateSendUpdate)]
        public async Task<IActionResult> EmailDailyStatusReportGetImpl(long OrganizationID, long ServiceID, DateTime ForDate)
        {
            //* Checks if current user has permission or he/she is the Lead of the service for ForDate date.
            if (!User.UserHasThisPermission(Permissions.ServiceRequestDailyStatusReport) && !User.UserHasThisPermission(Permissions.DailyStatusCreateSendUpdate) && !await _data.TimeEntry_CheckLeadForServiceAndDate(ServiceID, ForDate == default ? DateTime.Now : ForDate, User.GetUserID()))
                return StatusCode((int)HttpStatusCode.BadRequest, $"Page not found");

            var data = await _data.RequestDailyStatus_Select(ServiceID, ForDate.ToUniversalTime(), OrganizationID, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(data ?? new Models.DBModels.TimeEntry.DailyStatusReportSelect()));
        }

        [HttpPost, Route("emaildailystatusreport")] //, HasPermission(Permissions.DailyStatusCreateSendUpdate)]
        public async Task<IActionResult> EmailDailyStatusReportPostImpl(APIEmailDailyStatusReport ReportData)
        {
            var report = JsonConvert.DeserializeObject<APIEmailDailyStatusReportReportData>(ReportData.report);
            var request = JsonConvert.DeserializeObject<APIEmailDailyStatusReportRequestData>(ReportData.request);

            //* Checks if current user has permission or he/she is the Lead of the service for ForDate date.
            if (!User.UserHasThisPermission(Permissions.ServiceRequestDailyStatusReport) && !User.UserHasThisPermission(Permissions.DailyStatusCreateSendUpdate) && !await _data.TimeEntry_CheckLeadForServiceAndDate(request.projectno, request.requestno, request.versionno, report.statusdate, User.GetUserID()))
                return StatusCode((int)HttpStatusCode.BadRequest, $"Page not found");


            var newImages = new List<long>();
            // Create the file entries and save them to disk 
            foreach (var httpFile in ReportData.files ?? Enumerable.Empty<Microsoft.AspNetCore.Http.IFormFile>())
            {
                var ImageId = await _data.RequestDailyStatusImage_Insert(report.serviceid, report.statusdate, User.GetUserID());
                if (ImageId > 0)
                {
                    var imageInfo = await _fileStorage.SaveDailyStatusReportImage(request.projectno, request.requestno, request.versionno, report.statusdate, ImageId, httpFile);
                    await _data.RequestDailyStatusImage_Update(ImageId, imageInfo.Filename, imageInfo.RelativePath, imageInfo.ContentType);
                    newImages.Add(ImageId);
                }
            }

            // Add the new images to the Report images data
            if (newImages.Count > 0)
            {
                report.images = string.IsNullOrEmpty(report.images) ? string.Join(',', newImages) : $"{report.images},{string.Join(',', newImages)}";
            }

            // Save the Report Entry
            await _data.RequestDailyStatus_Insert(report, User.GetUserID());

            return APISucessResponse();
        }




        [HttpGet, Route("sendemaildailystatusreport")] //, HasPermission(Permissions.DailyStatusCreateSendUpdate)]
        public async Task<IActionResult> SendEmailDailyStatusReportGetImpl(long OrganizationID, long ServiceID, DateTime ForDate, string JobName)
        {
            //* Checks if current user has permission or he/she is the Lead of the service for ForDate date.
            if (!User.UserHasThisPermission(Permissions.DailyStatusCreateSendUpdate) && !await _data.TimeEntry_CheckLeadForServiceAndDate(ServiceID, ForDate == default ? DateTime.Now : ForDate, User.GetUserID()))
                return StatusCode((int)HttpStatusCode.BadRequest, $"Page not found");

            var emailRecipients = await _data.RequestDailyStatus_GetEmailAddress(ServiceID);

            if (!string.IsNullOrEmpty(emailRecipients))
            {
                try
                {
                    var emailbuilder = new DailyStatusReportBuilder(_emailSender, _siteConfig, Request.Cookies, _data);
                    await emailbuilder.EmailReport(OrganizationID, ServiceID, ForDate, emailRecipients, JobName ?? "Job Name not Found");
                    await _data.RequestDailyStatus_Emailed(ServiceID, ForDate.ToUniversalTime(), OrganizationID, User.GetUserID());
                    return APISucessResponse();
                }
                catch (Exception e)
                {
                    Log.Error(e, "API - sendemaildailystatusreport");
                    return Ok(Json(new { succeeded = false, errormsg = e.Message }));
                }
            }
            else
            {
                var msg = "API - sendemaildailystatusreport - Empty email recipient list.";
                Log.Error(msg);
                return Ok(Json(new { succeeded = false, errormsg = msg }));
            }
        }

        [HttpGet, Route("expensesservices")]
        public async Task<IActionResult> ExpensesServicesGetImpl(long OrganizationID, long JobID)
        {
            var rq = await _data.Expenses_Service_Select(OrganizationID, JobID, User.GetUserID());
            return Ok(Json(rq));
        }
        [HttpGet, Route("expensesworkcodes")]
        public async Task<IActionResult> ExpensesWorkCodesGetImpl(long OrganizationID, long JobID)
        {
            var rq = await _data.Expenses_WorkCode_Select(OrganizationID, JobID, User.GetUserID());
            return Ok(Json(rq));
        }

        [HttpGet, Route("expensesresources")]
        public async Task<IActionResult> ExpensesResourcesGetImpl(long OrganizationID)
        {
            var rq = await _data.Expenses_Resource_Select(OrganizationID, User.GetUserID());
            return Ok(Json(rq));
        }

        [HttpPost, Route("expenses")]
        public async Task<IActionResult> ExpensesPostImpl([FromBody] APIExpenseAppend data)
        {
            await _data.Expenses_ServiceLine_Insert(data.Date, data.JobId, data.ResourcesId, data.serviceId, data.WorkCodeId, data.QtyHours, /*data.PayCodeId,*/ data.ItemCost, data.BillRate, User.GetUserID());
            return APISucessResponse();
        }

        [HttpGet, Route("expenses")]
        public async Task<IActionResult> ExpensesPostImpl(long OrganizationID)
        {
            var rq = await _data.Expenses_Select(OrganizationID, User.GetUserID());
            return Ok(Json(rq));
        }
        [HttpPost, Route("expensessubmitlines")]
        public async Task<IActionResult> ExpensesSubmitLinesPostImpl([FromBody] APIExpenseSubmitLines data)
        {
            await _data.Expenses_SubmitLines(string.Join(',', data.LstLineIds), User.GetUserID());
            return APISucessResponse();
        }

        #endregion

        #region Misc

        [HttpGet, Route("noshowoptions")]
        public async Task<IActionResult> NoShowOptionsGetImpl()
        {
            var options = await _data.CallOut_Lookup_Select();
            return Ok(Json(options));
        }


        [HttpGet, Route("organizationcustomers")]
        public async Task<IActionResult> OrganizationCustomersGetImpl(long OrganizationID)
        {
            var customers = await _data.Request_Customer_Select(OrganizationID);
            return Ok(Json(customers));
        }

        [HttpGet, Route("customersforuser"), HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> UserCustomersGetImpl(long UserID)
        {
            var customers = await _data.Customer_Select(UserID);
            return Ok(Json(customers));
        }

        [HttpPost, Route("customersforuser"), HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> UserCustomersPostImpl([FromBody] AspNetUserCustomersUpsert data)
        {
            await _data.AspNetUserCustomers_Upsert(data.userid, data.customerid, data.istoremove);
            return APISucessResponse();
        }

        [HttpGet, Route("rolesfororganization"), HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> RolesFororganizationGetImpl(int OrganizationID)
        {
            var roles = (await _data.Role_select(OrganizationID, null, null, null)).Select(r => new { r.Role_ID, r.Name });
            return Ok(Json(roles));
        }

        [HttpPost, Route("syncpermissions"), HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> SyncPermissionsPostImpl([FromBody] string data)
        {
            try
            {
                await _data.AspNetRolePagePermission_Insert(data);
            }
            catch (Exception ex)
            {
                var m =  ex.Message;

            }
            return APISucessResponse();
        }

        [HttpGet, Route("validprojectno"), HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> ValidProjectNoGetImpl(long ProjectNo)
        {
            var isValid = await _data.Request_ValidateProjectNo(ProjectNo);
            return Ok(Json(new { IsValid = isValid }));
        }

        [HttpPost, Route("createjobheader"), HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> CreateJobHeaderPostImpl([FromBody] APICreateJobHeader data)
        {
            await _data.Job_CreateHeader(data.ProjectNo, data.JobTypeID, data.CustomerID, data.EndUserID, data.JobName, User.GetUserID(), data.IsPooledHours);
            return APISucessResponse();
        }


        #endregion

        #region Hot Sheet

        [HttpGet, Route("gethotsheetdata"), HasPermission(Permissions.HotSheetsBOLRead)]
        public async Task<IActionResult> Request_Schedule_Select(long RequestID, DateTime? WorkDate)
        {
            var DateData = await _data.Request_Schedule_Select(RequestID, WorkDate, User.GetUserID());
            return Ok(JSONUtils.JsonUTC(DateData));
        }

        [HttpPost, Route("savehotsheet"), HasPermission(Permissions.HotSheetsBOLCreateUpdate)]
        public async Task<IActionResult> SaveHotSheetImpl([FromBody] HotSheetAPIData hsd)
        {
            var root = new XElement("HotsheetDetails");

            var equipments = new XElement("Equipments");
            foreach (var equipment in hsd.savedEquipment)
            {
                var xequipment = new XElement("Equipment");
                xequipment.Add(new XElement("EquipmentID", equipment.EquipmentID));
                xequipment.Add(new XElement("EquipmentOutQty", equipment.EquipmentIN));
                xequipment.Add(new XElement("EquipmentReturnedQty", equipment.EquipmentOUT));
                xequipment.Add(new XElement("EquipmentName", equipment.EquipmentName));
                equipments.Add(xequipment);
            }
            root.Add(equipments);

            var vehicles = new XElement("Vehicles");
            foreach (var vehicle in hsd.savedVehicle)
            {
                var xvehicle = new XElement("Vehicle");
                xvehicle.Add(new XElement("VehicleID", vehicle.VehicleID));
                xvehicle.Add(new XElement("VehicleOutQty", vehicle.VehicleQTY));
                vehicles.Add(xvehicle);
            }
            root.Add(vehicles);


            var contacts = new XElement("HotsheetContacts");
            foreach (var contact in hsd.originContacts)
            {
                var xContact = new XElement("Contact");
                xContact.Add(new XElement("ContactId", contact));
                xContact.Add(new XElement("HSContactTypeCode", "origin"));
                contacts.Add(xContact);
            }
            foreach (var contact in hsd.destinationContacts)
            {
                var xContact = new XElement("Contact");
                xContact.Add(new XElement("ContactId", contact));
                xContact.Add(new XElement("HSContactTypeCode", "destination"));
                contacts.Add(xContact);
            }
            root.Add(contacts);

            var DetailsXML = root.ToString(SaveOptions.DisableFormatting);
            var hs = await _data.Request_Hotsheet_Insert(hsd.requestID, hsd.workDate, hsd.origLocationID,
                hsd.origContactID, hsd.OriginContactName, hsd.OriginContactPhone,
                hsd.contactID, hsd.jobLocationID, hsd.specialInstructions,
                DetailsXML, User.GetUserID(), hsd.JobLength,
                ConvertToMilitaryTime(hsd.WarehouseStartTime), ConvertToMilitaryTime(hsd.OnSiteStartTime), hsd.RequestScheduleId);
            return Ok(Json(hs));

            //
            // Local funciton to covert the hour part of a datetime? to military hour notation
            //
            int ConvertToMilitaryTime(DateTime? d)
            {
                if (d.HasValue)
                {
                    if (int.TryParse(d.Value.ToString("HHmm"), out int result))
                    {
                        return result;
                    }
                }
                return 0;
            }
        }

        [HttpGet, Route("gethotsheets"), HasPermission(Permissions.HotSheetsBOLRead)]
        public async Task<IActionResult> Request_Hotsheets_Select(long RequestID)
        {
            var DateData = await _data.Request_Hotsheets_Select(RequestID, User.GetUserID());
            return Ok(Json(DateData));
        }

        #endregion

        #region Sync Interface


        [HttpPost, Route("HDQRDeleted"), AllowAnonymous, ServiceFilter(typeof(authSync))]
        public async Task<IActionResult> HDQRDeletedRecordsPostImpl(string s)
        {
            try
            {
                // Save data in staging table (dbo.STAGE_HDS_DeletedQuote)
                DataSync syncData = new DataSync(s);
                SyncResponseData response = _data.PostHDRecords(syncData);

                // Run SP to flag QRs as Cancelled
                await _data.Sync_HDS_UpdateQRCancelled();
                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Saving Hedberg Deleted QRs");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }
        }

        [HttpPost, Route("postGPRecords")]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public IActionResult postGPRecords(string s)
        {
            try
            {
                DataSync syncData = new DataSync(s);
                var response = _data.PostGPRecords(syncData);
                return Ok("true");
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Saving PostRecords");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }

        }
        [HttpPost, Route("postHDRecords")]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public async Task<IActionResult> postHDRecords(string s)
        {
            try
            {
                DataSync syncData = new DataSync(s);
                SyncResponseData response = _data.PostHDRecords(syncData);

                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Saving PostRecords");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }
            finally
            {
                // Check if there is SR attachments to copy after SR import (run even on case of previous SP call failure)
                await CopyImportedServiceAttachments();
            }
        }

        private async Task CopyImportedServiceAttachments()
        {
            var pendingDocs = await _data.RequestDocumentToCopy_Select(true);
            if (pendingDocs.Count() > 0)
            {
                foreach (var docToCopy in pendingDocs)
                {
                    bool copySucceeded = false;
                    string failureReason = string.Empty;
                    try
                    {
                        var targetRequest = new Request_Data
                        {
                            project_no = docToCopy.ProjectNoTarget,
                            request_id = docToCopy.RequestIDTarget,
                            request_no = docToCopy.RequestNoTarget,
                            version_no = docToCopy.RequestVersionNoTarget
                        };
                        // Copy the physical files
                        copySucceeded = await CopyRequestAttachments(docToCopy.RequestIDSource, docToCopy.RequestNoSource, docToCopy.RequestVersionNoSource, targetRequest, true);
                    }
                    catch (Exception e)
                    {
                        failureReason = $"{e.Message}\n{e.StackTrace}";
                        failureReason = failureReason.Substring(0, Math.Min(4095, failureReason.Length - 1));
                    }
                    finally
                    {
                        // Flag entry as copied/failed
                        // Always update the attachment as processed so the process does not get stuck (i.e. because of a missing attachment file)
                        await _data.RequestDocumentToCopy_Update(docToCopy.RequestDocToCopyID, true, copySucceeded, failureReason);
                    }
                }
            }
        }

        [HttpPost, Route("postADPRecords")]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public IActionResult postADPRecords(string s)
        {
            try
            {
                DataSync syncData = new DataSync(s);
                var response = _data.PostADPRecords(syncData);
                return Ok("true");
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Saving PostRecords");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }

        }
        [HttpGet, Route("getQRRecords")]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public IActionResult getQRRecords(int page)
        {
            try
            {
                int recordsPerPage = 100;
                string xmlFolder = _siteConfig.SyncTempPath;
                removeOldXmlFiles();
                string xmlName = "Data_QRRecords.xml";

                string xmlFilePath = Path.Combine(xmlFolder, xmlName);


                if (page == 1)
                {

                    DataSet oDataset = _data.getQRRecords();
                    if (oDataset.Tables.Count > 0)
                    {
                        oDataset.Tables[0].TableName = "QuoteRequest";
                        createXML(xmlFilePath, oDataset);
                    }
                }

                string strXML = getXMLToResponse(page, recordsPerPage, xmlFilePath);

                return Ok(strXML);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Saving PostRecords");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }

        }
        [HttpGet, Route("getGPInvoices")]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public IActionResult getGPInvoices(int page)
        {
            try
            {
                int recordsPerPage = 100;
                string xmlFolder = _siteConfig.SyncTempPath;
                removeOldXmlFiles();
                string xmlName = "Data_GPInvoicesRecords.xml";

                string xmlFilePath = Path.Combine(xmlFolder, xmlName);

                if (page == 1)
                {

                    DataSet oDataset = _data.getGPInvoicesRecords();
                    if (oDataset.Tables.Count > 0)
                    {
                        createXML(xmlFilePath, oDataset);
                    }
                }

                string strXML = getXMLToResponse(page, recordsPerPage, xmlFilePath);

                return Ok(strXML);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Getting GP Innvoices");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }
        }


        [HttpGet, Route("setInvoiceCompleted")]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public IActionResult setGPInvoiceCompleted(string invoices, string BATCHID)
        {
            try
            {
                _data.setGPInvoiceCompleted(invoices, BATCHID);
                return Ok();
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Setting Invoice Completed");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }

        }


        [HttpGet, Route("getLatestLoadInfo")]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public IActionResult getLatestLoadInfo(string key)
        {
            try
            {
                string strDate = _data.GetLatestLoadInfo(key);
                return Ok(strDate);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure REading LoadInfoData");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }

        }

        private void removeOldXmlFiles()
        {
            try
            {
                System.IO.DirectoryInfo di = new DirectoryInfo(_siteConfig.SyncTempPath);
                foreach (FileInfo file in di.GetFiles())
                {
                    if (file.CreationTime.AddDays(2) < DateTime.Now)
                        file.Delete();
                }
            }
            catch { }
        }
        private string getXMLToResponse(int numPage, int recordsPerPage, string xmlName)
        {
            string strXML = "";
            if (System.IO.File.Exists(xmlName))
            {
                XmlDocument oDoc = new XmlDocument();
                oDoc.Load(xmlName);

                int TotalRecords = int.Parse(oDoc.SelectNodes("//TOTALRECORDS")[0].InnerText);
                int TotalPages = Decimal.ToInt32(Math.Ceiling(System.Convert.ToDecimal(TotalRecords) / System.Convert.ToDecimal(recordsPerPage)));

                strXML = "<RESPONSE><TOTALPAGES>" + TotalPages.ToString() + "</TOTALPAGES><TOTALRECORDS>" + TotalRecords.ToString() + "</TOTALRECORDS><NUMPAGE>" + numPage.ToString() + "</NUMPAGE><ROWS>";
                if (TotalPages >= numPage)
                {

                    int FromRecord = ((numPage - 1) * recordsPerPage);
                    int ToRecord = Math.Min((recordsPerPage * numPage) - 1, TotalRecords - 1);
                    XmlNodeList oRows = oDoc.SelectNodes("/ROWS");
                    if (oRows != null)
                    {
                        if (oRows.Count > 0)
                        {
                            XmlNodeList listaXml = oRows[0].ChildNodes;
                            if (listaXml.Count >= ToRecord)
                            {
                                for (int i = FromRecord; i <= ToRecord; i++)
                                {
                                    XmlNode node = listaXml[i];
                                    strXML += node.OuterXml;
                                }
                            }
                        }
                    }
                }
                strXML += "</ROWS></RESPONSE>";
            }
            return strXML;
        }


        private int createXML(string xmlFile, DataSet oDataSet)
        {
            int TotalRecords = 0;

            if (System.IO.File.Exists(xmlFile))
                System.IO.File.Delete(xmlFile);

            System.IO.File.AppendAllText(xmlFile, "<ROWS>");
            for (int i = 0; i < oDataSet.Tables.Count; i++)
            {
                DataTable table = oDataSet.Tables[i];
                foreach (DataRow R in table.Rows)
                {
                    System.IO.File.AppendAllText(xmlFile, recordToXml(R, clsLibrary.dBReadString(R["TableName"])));
                    TotalRecords++;
                }
            }
            System.IO.File.AppendAllText(xmlFile, "<TOTALRECORDS>" + TotalRecords.ToString() + "</TOTALRECORDS>");
            System.IO.File.AppendAllText(xmlFile, "</ROWS>");

            return TotalRecords;
        }

        private string recordToXml(DataRow row, string TableName)
        {
            var xml = new XElement(TableName.ToUpper());
            foreach (DataColumn col in row.Table.Columns)
            {
                if (col.ColumnName.ToUpper() != "TABLENAME")
                {
                    xml.Add(new XElement(col.ColumnName.ToUpper(), ToXMLContent(row[col.ColumnName])));
                }
            }
            return xml.ToString(SaveOptions.None);

            //
            // Convert a string to valid XML content
            //
            string ToXMLContent(object o)
            {
                var s = o?.ToString() ?? string.Empty;
                s = new string(HttpUtility.HtmlEncode(s).Where(ch => XmlConvert.IsXmlChar(ch)).ToArray());
                return s.Trim();
            }
        }

        //[HttpGet, Route("ReportingData"), AllowAnonymous, ServiceFilter(typeof(authSync))]
        private async Task<IActionResult> ReportingDataGetImpl(int page)
        {
            //
            // Note this endpoing was developed but found later that it was not necessary 
            //
            try
            {
                int recordsPerPage = 100;
                string xmlFolder = _siteConfig.SyncTempPath;
                removeOldXmlFiles();
                string xmlName = "Data_ReportingData.xml";

                string xmlFilePath = Path.Combine(xmlFolder, xmlName);

                if (page == 1)
                {

                    DataSet oDataset = await _data.Sync_IntegrationDB_SendSTData();
                    if (oDataset.Tables.Count > 0)
                    {
                        createXML(xmlFilePath, oDataset);
                    }
                }

                string strXML = getXMLToResponse(page, recordsPerPage, xmlFilePath);

                return Ok(strXML);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Getting GP Innvoices");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }
        }


        private async Task<IActionResult> GetDataAsXML(int Page, string XmlFilename)
        {
            try
            {
                int recordsPerPage = 100;
                string xmlFolder = _siteConfig.SyncTempPath;
                removeOldXmlFiles();
                string xmlFilePath = Path.Combine(xmlFolder, XmlFilename);

                if (Page == 1)
                {
                    DataSet oDataset = await _data.Sync_IntegrationDB_SendSTData();
                    if (oDataset.Tables.Count > 0)
                    {
                        createXML(xmlFilePath, oDataset);
                    }
                }
                string strXML = getXMLToResponse(Page, recordsPerPage, XmlFilename);
                return Ok(strXML);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failure Getting GP Innvoices");
                return StatusCode((int)HttpStatusCode.NotAcceptable, new { responseText = e.Message });
            }
        }


        #endregion

        #region Search


        #endregion

        #region Billing 


        [HttpPost, Route("invoice")]
        public async Task<IActionResult> NewInvoicePostImpl([FromBody] APINewInvoice data)
        {
            var invc = await _data.Billing_Invoice_Insert(data.OrganizationId, data.InvoiceTypeId, data.BillingTypeId, null,/* data.AssignedToUserId, */ data.JobId, data.Description, data.BillCustomerId, User.GetUserID(), data.AMTTOBILL, data.BillingPeriod);
            return Ok(Json(new { succeeded = invc != null, invoice_id = invc?.invoice_id }));
        }

        [HttpPost, Route("invoiceupdate")]
        public async Task<IActionResult> InvoiceUpdatePostImpl([FromBody] APIInvoiceUpdate data)
        {
            var result = await _data.Billing_Invoice_Update(data.InvoiceId, data.Description, data.PO_NO, data.StatusID, data.BillingTypeId, User.GetUserID(), data.BillingPeriod);
            return Json(result);
        }


        [HttpGet, Route("invoices")]
        public async Task<IActionResult> InvoicesGetImpl(long JobID)
        {
            var invoices = await _data.Billing_Invoice_Select(JobID, User.GetUserID());
            return Ok(Json(invoices));
        }

        [HttpGet, Route("invoiceaddfuelsurcharge")]
        public async Task<IActionResult> InvoiceAddFuelSurcharge(long InvoiceID)
        {
            var invc = await _data.Billing_Invoice_AddFuelSurcharge(InvoiceID, User.GetUserID());
            return Ok(Json(new { succeeded = invc != null, invoice_id = InvoiceID }));
        }

        [HttpGet, Route("invoiceaddadminfee")]
        public async Task<IActionResult> InvoiceAdAdminFee(long InvoiceID)
        {
            var invc = await _data.Billing_Invoice_AddAdminFee(InvoiceID, User.GetUserID());
            return Ok(Json(new { succeeded = invc != null, invoice_id = InvoiceID }));
        }

        [HttpPost, Route("servicelinesbillable")]
        public async Task<IActionResult> ServiceLinesBillablePostImpl([FromBody] APIServiceLinesBillable data)
        {
            if (ModelState.IsValid)
            {
                await _data.Billing_ServiceLinesBillable_Update(data.JobID, string.Join(',', data.ItemIDList), data.GRIDTYPE, data.ISBILLABLE, User.GetUserID());
                return Ok(Json(new { succeeded = true }));
            }
            return Ok(Json(new { succeeded = false }));
        }


        [HttpPost, Route("invoiceservicelines")]
        public async Task<IActionResult> InvoiceServiceLinesPostImpl([FromBody] APIServiceLineInvoice data)
        {
            if (ModelState.IsValid)
            {
                await _data.Billing_InvoiceServiceLines_Update(data.JobID, string.Join(',', data.ItemIDList), data.GRIDTYPE, data.INVOICEID, User.GetUserID());
                return Ok(Json(new { succeeded = true }));
            }
            return Ok(Json(new { succeeded = false }));
        }


        [HttpPost, Route("moveservicelines")]
        public async Task<IActionResult> MoveServiceLinesPostImpl([FromBody] APIMoveServiceLines data)
        {
            await _data.Billing_MoveLines_Update(data.SourceJobID, data.JobID, data.ReqID, string.Join(',', data.ServiceLinesToMove), data.GRIDTYPE, User.GetUserID());
            return Ok(Json(new { succeeded = true }));
        }

        [HttpPost, Route("quotedbyjob")]
        public async Task<IActionResult> QuotedByJobGetImpl([FromBody] APIQuotedByJob data)
        {
            decimal quotedAmount = 0;
            
            if (data?.ItemIDList?.Length > 0)
            {
                quotedAmount = await _data.Billing_QuotedAmtByJob_Select(data.JobID, string.Join(',', data.ItemIDList), data.GRIDTYPE, User.GetUserID(), data.InvoiceID);
            }
            else
            {
                quotedAmount = await _data.Billing_QuotedAmtByJob_Select(data.JobID, null, data.GRIDTYPE, User.GetUserID(), data.InvoiceID);
            }
            return Ok(Json(quotedAmount));
        }

        [HttpGet, Route("invoicebillamt")]
        public async Task<IActionResult> BillAmtGetImpl(long JobID)
        {
            var quotedAmount = await _data.Billing_BillAmt_Select(JobID, User.GetUserID());
            return Ok(Json(quotedAmount));
        }

        [HttpPost, Route("getpoopenwithoutinvoices")]
        public async Task<IActionResult> GetPOOpenWithoutInvoicesImpl([FromBody] APIInvoiceProcess data)
        {
            var result = await _data.POHeader_GetOpenWithoutInvoices(string.Join(',', data.KEYIDTABLE), User.GetUserID());
            return Ok(Json(result));
        }

        [HttpPost, Route("invoiceprocess")]
        public async Task<IActionResult> InvoiceProcessPostImpl([FromBody] APIInvoiceProcess data)
        {
            var result = await _data.Billing_Invoice_Process(string.Join(',', data.KEYIDTABLE), User.GetUserID());
            return Ok(Json(result));
        }


        [HttpPost, Route("invoiceservicelinesunassign")]
        public async Task<IActionResult> InvoiceServiceLinesUnassignPostImpl([FromBody] APIServiceLinesUnassign data)
        {
            //await _data.Billing_InvoiceServiceLines_Unassign(data.INVOICEID, string.Join(',', data.KEYIDTABLE), User.GetUserID());
            await _data.Billing_InvoiceServiceLines_UnassignInvoice(data.JOBID, string.Join(',', data.KEYIDTABLE), data.GRIDTYPE, data.INVOICEID, User.GetUserID());
            return APISucessResponse();
        }

        [HttpPost, Route("flaginvoicesascomplete")]
        public async Task<IActionResult> InvoicesFlagAsCompletePostImpl([FromBody] APIInvoiceIDs data)
        {
            await _data.Billing_Invoice_FlagComplete(string.Join(',', data.InvoiceIDs), User.GetUserID());
            return APISucessResponse();
        }


        [HttpGet, Route("customlineinitprops")]
        public async Task<IActionResult> CustomLineInitPropsGetImpl(long JobID)
        {
            var items = await _data.BillingCustomLine_Item_Select(JobID, User.GetUserID());
            var requests = await _data.BillingCustomLine_Request_Select(JobID, User.GetUserID());
            return Json(new { items, requests });
        }

        [HttpPost, Route("invoicecustomline")]
        public async Task<IActionResult> InvoiceCustomLinePostImpl([FromBody] APIInvoiceCustomLine LineData)
        {
            var result = await _data.BillingCustomLine_Insert(LineData.invoice_id, LineData.item_id, LineData.description, LineData.unit_price, LineData.qty, LineData.po_no, LineData.taxable, LineData.bill_service_id, User.GetUserID());
            return Ok(Json(new { succeeded = true, po = result }));
        }


        [HttpGet, Route("adpexpensereport")]
        public async Task<IActionResult> ADPExpensesReportImpl(APIADPExpenses RequestData)
        {
            var content = await _data.GetADPExpensesReportData(RequestData.StartDate, RequestData.EndDate, RequestData.BatchID, RequestData.CompanyCode, User.GetUserID());
            string header = "CO CODE, BATCH ID, FILE #, Adjust DED Code, Adjust DED Amount";
            var linescsv = new StringBuilder();
            linescsv.AppendJoin("\r\n", content.Select(line => LineCommaSeparatedBuilder(line)));
            return File(Encoding.ASCII.GetBytes($"{header}\r\n{linescsv}"), "text/csv", $"ADP_Expenses_Report_{DateTime.Now.ToString("yyyyMMdd")}.csv");

            //
            // Local fx for creating a comma separated line
            //
            string LineCommaSeparatedBuilder(ADPExpenseReportResult line)
            {
                return string.Join(',', new object[]{
                                   line.CompanyCode,
                                   line.BatchID,
                                   line.FileNo,
                                   line.AdjustDEDCode,
                                   line.AdjustDEDAmount
                           });
            }
        }


        #endregion

        #region PooledHours

        [HttpPost, Route("savereqallocation"), HasPermission(Permissions.BillingPooledHours)]
        public async Task<IActionResult> SaveReqAllocation([FromBody] AllocationsToDB dataToSend)
        {
            var root = new XElement("SERVICELINES");

            foreach (var alloc in dataToSend.Allocations)
            {
                var xalloc = new XElement("SERVICELINE");
                xalloc.Add(new XElement("SERVICEID", alloc.ServiceID));
                xalloc.Add(new XElement("QTYALLOCATE", alloc.QtyToAllocate));
                root.Add(xalloc);
            }

            var DetailsXML = root.ToString(SaveOptions.DisableFormatting);
            var hs = await _data.SaveReqAllocation(dataToSend.JobID, dataToSend.ServiceID, int.Parse(dataToSend.ItemID), Math.Round(dataToSend.Rate, 2), dataToSend.QtyLeft, DetailsXML, dataToSend.OrganizationID, User.GetUserID());
            return Ok(Json(hs));
        }

        #endregion


        #region Document Signing


        [HttpPost, Route("signdocumentpartial")]
        public async Task<IActionResult> SignDocumentPartialPostImpl([FromBody] APIDocSignature SignatureInfo)
        {

            // Generate current document PDF
            var signer = new PDFeSignOff(_siteConfig.BaseURL, Request.Cookies);
            var orgDateTime = await _data.GetLocalOrganizationDateTime(SignatureInfo.OrganizationId);

            string filename;
            if (SignatureInfo.Request_Document_Id.HasValue && SignatureInfo.Request_Document_Id.Value > 0) // Processing an Attachment
            {
                var RequestDocument = await _data.Request_Documents_Select(SignatureInfo.Request_Document_Id.Value);
                filename = RequestDocument.name;
            }
            else
            {
                filename = $"SignFile-{DateTime.Now.Ticks}.pdf";
                using (var stream = new System.IO.MemoryStream())
                {
                    signer.PrintToPDF(SignatureInfo, stream);
                    IFormFile file = new FormFile(stream, 0, stream.Length, filename, filename);
                    var Request_Data = await _data.Request_Data_Select(SignatureInfo.OrganizationId, SignatureInfo.RequestId, User.GetUserID());
                    await _fileStorage.SaveQuoteRequestAttachment(Request_Data.project_no.ToString(), Request_Data.request_id.ToString(), Request_Data.request_no.ToString(), Request_Data.version_no.ToString(), new IFormFile[] { file });
                }
            }

            var signatureOutcome = await _data.Request_Documents_Sign_Partial(SignatureInfo.Request_Document_Id, SignatureInfo.DocumentType, SignatureInfo.DocumentId, SignatureInfo.RequestId, SignatureInfo.OrganizationId, SignatureInfo.DeliveredBy, orgDateTime, SignatureInfo.Signature_ReceivedByEmail, filename, User.GetUserID());

            if (signatureOutcome.Succeeded)
            {
                var anonymousSignatureUrl = $"{_siteConfig.BaseURL}/AnonymousSignature?DocId={signatureOutcome.Document.request_document_id}&TempAccessCode={signatureOutcome.Document.Signature_ReceivedByEmailSentCode}";
                _notificationEmailer.SendDocumentPendingSignatureEmail(signatureOutcome.Document.Signature_ReceivedByEmail, anonymousSignatureUrl);
            }

            return Ok(Json(signatureOutcome));
        }


        [HttpPost, Route("signdocumentfull")]
        public async Task<IActionResult> SignDocumentFullPostImpl([FromBody] APIDocSignature SignatureInfo)
        {
            // Generate current document PDF
            var signer = new PDFeSignOff(_siteConfig.BaseURL, Request.Cookies);
            var orgDateTime = await _data.GetLocalOrganizationDateTime(SignatureInfo.OrganizationId);


            string filename;
            if (SignatureInfo.Request_Document_Id.HasValue && SignatureInfo.Request_Document_Id.Value > 0) // Processing an Attachment
            {
                var RequestDocument = await _data.Request_Documents_Select(SignatureInfo.Request_Document_Id.Value);
                var Request_Data = await _data.Request_Data_Select(SignatureInfo.OrganizationId, SignatureInfo.RequestId, User.GetUserID());
                var DocFilename = _fileStorage.QuoteRequestAttachmentPath(Request_Data.project_no, Request_Data.request_id, Request_Data.request_no, Request_Data.version_no, RequestDocument.name);


                var signatures = new PDFeSignOffSignature[] {
                    new PDFeSignOffSignature
                {
                    Label = "Delivered By:",
                    SignerName = SignatureInfo.DeliveredBy,
                    Footer = $"Date: {orgDateTime:g}"
                },
                    new PDFeSignOffSignature
                {
                    Label = "Received By:",
                    SignerName = SignatureInfo.ReceivedBy,
                    Footer = $"Date: {orgDateTime:g}"
                }};

                var outputStream = signer.SignGeneralDoc(DocFilename, signatures, 20, 0.18, 0.97);
                filename = RequestDocument.name;

                using (FileStream fs = new FileStream(DocFilename, FileMode.Create))
                {
                    outputStream.CopyTo(fs);
                    fs.Flush();
                }
            }
            else // Processing a new Document (printed SR or HS)
            {

                filename = $"SignFile-{DateTime.Now.Ticks}.pdf";
                using (var stream = new System.IO.MemoryStream())
                {
                    signer.PrintToPDF(SignatureInfo, stream);

                    var signatures = new PDFeSignOffSignature[] {
                    new PDFeSignOffSignature
                {
                    Label = "Delivered By:",
                    SignerName = SignatureInfo.DeliveredBy,
                    Footer = $"Date: {orgDateTime:g}"
                },
                    new PDFeSignOffSignature
                {
                    Label = "Received By:",
                    SignerName = SignatureInfo.ReceivedBy,
                    Footer = $"Date: {orgDateTime:g}"
                }};

                    using (var outputStream = signer.SignGeneralDoc(stream, signatures, 20, 0.18, 0.97))
                    {
                        IFormFile file = new FormFile(outputStream, 0, outputStream.Length, filename, filename);
                        var Request_Data = await _data.Request_Data_Select(SignatureInfo.OrganizationId, SignatureInfo.RequestId, User.GetUserID());
                        await _fileStorage.SaveQuoteRequestAttachment(Request_Data.project_no.ToString(), Request_Data.request_id.ToString(), Request_Data.request_no.ToString(), Request_Data.version_no.ToString(), new IFormFile[] { file });
                    }
                }

            }
            var signatureOutcome = await _data.Request_Documents_Sign_Full(SignatureInfo.Request_Document_Id, SignatureInfo.DocumentType, SignatureInfo.DocumentId, SignatureInfo.RequestId, SignatureInfo.OrganizationId, SignatureInfo.DeliveredBy, orgDateTime, SignatureInfo.ReceivedBy, orgDateTime, filename, User.GetUserID());
            return Ok(Json(signatureOutcome));
        }

        [HttpPost, Route("addlspuser"), HasPermission(Permissions.AdminAllScreens)]
        public async Task<IActionResult> AddLSPUserPostImpl([FromBody] APILSPUser apiLSPUser)
        {
            var res = await _data.AddLSPUser(apiLSPUser.lspName, "", apiLSPUser.address1, apiLSPUser.address2, apiLSPUser.city, apiLSPUser.state, apiLSPUser.zip, "USA", User.GetUserID(), true);
            return Ok(Json(new { succeeded = true, value = res }));
        }

        [HttpGet, Route("signdocumentfulfillreceive"), AllowAnonymous]
        public async Task<IActionResult> SignDocumentFulfillReceivePostImpl(long DocID, string AccessCode, string ReceivedBy)
        {
            var RequestDocument = await _data.Request_Documents_Sign_ValidateCode(DocID, AccessCode);

            if (RequestDocument != null && RequestDocument.Succeeded)
            {
                var orgDateTime = await _data.GetLocalOrganizationDateTime(RequestDocument.Document.Signature_OrigDocumentOrganization.Value);
                var signer = new PDFeSignOff(_siteConfig.BaseURL, Request.Cookies);
                var Request_Data = await _data.Request_Data_Select(RequestDocument.Document.Signature_OrigDocumentOrganization.Value, RequestDocument.Document.request_id.Value, RequestDocument.Document.Signature_DeliveredBy_UserId.Value);

                var DocFilename = _fileStorage.QuoteRequestAttachmentPath(Request_Data.project_no, Request_Data.request_id, Request_Data.request_no, Request_Data.version_no, RequestDocument.Document.name);

                //var signature = new PDFeSignOffSignature
                //{
                //    Label = "Received By:",
                //    SignerName = RequestDocument.Document.Signature_ReceivedBy,
                //    Footer = $"Date: {orgDateTime:g}"
                //};



                var signatures = new PDFeSignOffSignature[] {
                    new PDFeSignOffSignature
                {
                    Label = "Delivered By:",
                    SignerName = RequestDocument.Document.Signature_DeliveredBy,
                    Footer = $"Date: {RequestDocument.Document.Signature_DeliveredBySignedDate:g}"
                },
                    new PDFeSignOffSignature
                {
                    Label = "Received By:",
                    SignerName = ReceivedBy,
                    Footer = $"Date: {orgDateTime:g}"
                }};

                var outputStream = signer.SignGeneralDoc(DocFilename, signatures, 20, 0.18, 0.97);

                using (FileStream fs = new FileStream(DocFilename, FileMode.Create))
                {
                    outputStream.CopyTo(fs);
                    fs.Flush();
                }

                //var signatureOutcome = await _data.Request_Documents_Sign_FulfillReceive(SignatureInfo.Request_Document_Id, SignatureInfo.Signature_ReceivedByEmailSentCode, SignatureInfo.ReceivedBy, SignatureInfo.ReceivedBySignedDate);
                var signatureOutcome = await _data.Request_Documents_Sign_FulfillReceive(RequestDocument.Document.request_document_id, RequestDocument.Document.Signature_ReceivedByEmailSentCode, ReceivedBy, orgDateTime);
                return Ok(Json(signatureOutcome));
            }
            else if (RequestDocument != null && !RequestDocument.Succeeded)
            {
                RequestDocument.Document = null; // Clear doc just in case
                return Ok(Json(RequestDocument));
            }
            else
            {
                return Ok(Json(new SignatureActionResult
                {
                    CodeResult = "FAILEDUNKNOWN001",
                    ErrorMessage = "Unknown failure",
                    Succeeded = false
                }));
            }
        }

        #endregion

    }
}


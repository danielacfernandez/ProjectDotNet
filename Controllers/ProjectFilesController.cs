using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration.UserSecrets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.ViewModels;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class ProjectFilesController : Controller
    {
        private readonly ServiceTRAXData _data;
        private readonly ILogger<RequestController> _logger;
        private readonly string _attachmentsBasePath;
        private readonly string _masterDocumentBasePath;

        public ProjectFilesController(ServiceTRAXData data, ILogger<RequestController> logger, IOptions<SiteConfiguration> siteSettings)
        {
            _data = data;
            _logger = logger;
            _attachmentsBasePath = siteSettings.Value.AttachmentStorageRootPath;
            _masterDocumentBasePath = siteSettings.Value.MasterDocumentStorageRootPath;
        }

        public IActionResult Index(int OrganizationID, long ProjectID, long RequestID)
        {
            var vm = new ProjectFilesViewModel
            {
                OrganizationID = OrganizationID,
                ProjectID = ProjectID,
                RequestID = RequestID,
                UserID= User.GetUserID()
            };

            return View(vm);
        }

        [Route("[controller]/SignDocumentVault/{DOCID}/{ACCESSCODE}"), AllowAnonymous]
        public async Task<IActionResult> GetFileImplAnonymousAttachement(long DOCID, string ACCESSCODE)
        {
            // Check that the user has access to the file
            var Document = await _data.Request_Documents_Sign_ValidateCode(DOCID, ACCESSCODE);
            if (Document.Succeeded)
            {
                return GetFileImpl(Document.Document.project_no.Value, Document.Document.request_id, Document.Document.request_no.Value, Document.Document.version_no.Value, Document.Document.name).Result;
            }

            return Ok(Document?.ErrorMessage ?? "Unknown error retrieving document.");
        }

        [Route("[controller]/{PROJECT_NO}/{REQUESTID}/{REQUESTNO}/{VERSIONNO}/{FILENAME}")]
        public IActionResult GetFileImplAttachement(long PROJECT_NO, long REQUESTID, long REQUESTNO, long VERSIONNO, string FILENAME)
        {
            return GetFileImpl(PROJECT_NO, REQUESTID, REQUESTNO, VERSIONNO, FILENAME).Result;
        }

        [Route("[controller]/{PROJECT_NO}/{REQUESTNO}/{VERSIONNO}/{FILENAME}")]
        public IActionResult GetFileImplQuote(long PROJECT_NO, long REQUESTNO, long VERSIONNO, string FILENAME)
        {
            return GetFileImpl(PROJECT_NO, null, REQUESTNO, VERSIONNO, FILENAME).Result;
        }

        [Route("[controller]/ProspectCustomerForm/{ORGANIZATIONID}/{CUSTOMERID}")]
        public async Task<IActionResult> GetFileImplProspectCustomerForm(long ORGANIZATIONID, long CUSTOMERID)
        {
            string filePath = await _data.ConfigSystem_Select<string>(ORGANIZATIONID, "ProspectCustomerFilePath");
            string orgIDCode = ORGANIZATIONID switch { 2 => "MN", 4 => "WI", 12 => "ICS", 14 => "ECMS", 21 => "AZ", _ => ORGANIZATIONID.ToString() };

            if (System.IO.File.Exists(filePath))
            {
                return new PhysicalFileResult(filePath, "application/octet-stream")
                {
                    FileDownloadName = $"ProspectCustomerForm-{orgIDCode}-{CUSTOMERID}.xlsx"
                };
            }
            else
            {
                return NotFound();
            }
        }

        [Route("[controller]/DocumentsCenter/{OrganizationID}/{DocumentID}")]
        public async Task<IActionResult> GetFileImplDocumentCenterItem(long OrganizationID, long? DocumentID)
        {
            var file = (await _data.DocumentCenterItems_Select(OrganizationID, DocumentID, User.GetUserID())).FirstOrDefault();

            if (file != null && System.IO.File.Exists(file.DocumentPath))
            {
                return new PhysicalFileResult(file.DocumentPath, GetContentType(file.DocumentPath))
                {
                    FileDownloadName = file.DocumentName
                };
            }
            else
            {
                return NotFound();
            }
        }


        //
        //
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

        private async Task<IActionResult> GetFileImpl(long PROJECT_NO, long? REQUESTID, long REQUESTNO, long VERSIONNO, string FILENAME)
        {
            try

            {
                string fullpath = ""; 
                if (REQUESTID.HasValue) {
                    IEnumerable<ServiceTRAX.Models.DBModels.Attachment> attachments = await _data.Request_Attachment_Select(REQUESTID, PROJECT_NO, REQUESTNO, VERSIONNO, null, FILENAME);

                    if (attachments != null)
                    {

                        fullpath = Path.Combine(_masterDocumentBasePath, attachments.First().filename);
                    }
                }
                else
                    fullpath = Path.Combine(_attachmentsBasePath, PROJECT_NO.ToString(), REQUESTNO.ToString(), VERSIONNO.ToString(), FILENAME);

                // PhysicalFileResult does not throw an exception if the file is not found  (file is resolved later in the rquest response)
                // so do a manual check for the file exisntence
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
    }
}

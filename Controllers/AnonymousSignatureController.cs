using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ServiceTRAX.Data;
using ServiceTRAX.Models.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Controllers
{
    public class AnonymousSignatureController : Controller
    {
        private readonly ServiceTRAXData _data;
        private readonly string _attachmentsBasePath;
        private readonly string _baseURL;

        public AnonymousSignatureController(ServiceTRAXData data, IOptions<SiteConfiguration> siteSettings)
        {
            _data = data;
            _attachmentsBasePath = siteSettings.Value.AttachmentStorageRootPath;
            _baseURL = siteSettings.Value.BaseURL;
        }

        [AllowAnonymous]
        public async Task<IActionResult> Index(long docid, string tempaccesscode)
        {
            var RequestDocument = await _data.Request_Documents_Sign_ValidateCode(docid, tempaccesscode);
            
            var vm = new AnonymousSignatureViewModel
            {
                CodeIsValid = RequestDocument?.Succeeded ?? false,
                ErrorMessage = RequestDocument?.ErrorMessage ?? "Unknown Error.",
                AccessCode = RequestDocument?.Document?.Signature_ReceivedByEmailSentCode ?? tempaccesscode ?? "0",
                DocId = RequestDocument?.Document?.request_document_id ?? docid,
                Signature_DeliveredBy = RequestDocument.Document?.Signature_DeliveredBy,
                Signature_DeliveredBySignedDate = RequestDocument.Document?.Signature_DeliveredBySignedDate.Value.ToString("g"),
                BaseURL = _baseURL
            };

            return View(vm);
        }
    }
}

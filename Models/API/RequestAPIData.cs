using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{

    public class RequestAPIData
    {
        public bool isNew { get; set; }
        public string request { get; set; }
        public string requestProducts { get; set; }
        public string requestContacts { get; set; }
        public string requestProduct { get; set; }
        public string requestProductOther { get; set; }
        public string requestAttachments { get; set; }
        public string requestLocationContacts { get; set; }
        public string requestHeaderResources { get; set; }
        public string requestScopeResources { get; set; }
        public string customFields { get; set; }
        public IFormFile[] newFiles { get; set; }
        public int clientTimeZone { get; set; }
        public int clientTimeZoneEndDate { get; set; }

    }
}

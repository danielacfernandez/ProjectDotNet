using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{

    public class QuoteRequestAPIData
    {
        public bool isNew { get; set; }
        public string quoteRequest { get; set; }
        public string requestProducts { get; set; }
        public string requestContacts { get; set; }
        public string requestProduct { get; set; }
        public string requestProductOther { get; set; }
        public string requestAttachments { get; set; }
        public string requestLocationContacts { get; set; }
        public IFormFile[] newFiles { get; set; }
    }
}

using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{

    public class InvoiceAPIData
    {
        public long POId { get; set; }
        public string InvoiceNumber { get; set; }
        public String InvoiceDate { get; set; }
        public float Amount { get; set; }
        public IFormFile InvoiceFile { get; set; }

        public long OrganizationID { get; set; }
        public long RequestID { get; set; }
        public long ProjectID { get; set; }
        public bool RedirectToBilling { get; set; } = false;
        public long JobID { get; set; }

    }
}
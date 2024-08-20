using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{

    public class InvoiceEmailAPIData
    {
        public long POInvoiceId { get; set; }
        public string FileName { get; set; }
        public string MDFileName { get; set; }
        public long OrganizationID { get; set; }

        public double Total { get; set; }


    }
}
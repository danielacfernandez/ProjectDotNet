using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APIInvoiceUpdate
    {
        public long InvoiceId { get; set; }
        public string Description { get; set; }
        public string PO_NO { get; set; }
        public long? StatusID { get; set; }
        public long? BillingTypeId { get; set; }
        public string BillingPeriod { get; set; }
    }
}

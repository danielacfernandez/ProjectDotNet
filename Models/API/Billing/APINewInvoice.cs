using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APINewInvoice
    {
        public long OrganizationId { get; set; }
        public long InvoiceTypeId { get; set; }
        public long BillingTypeId { get; set; }
        public long JobId { get; set; }
        public string Description { get; set; }
        public long? BillCustomerId { get; set; }
        public decimal AMTTOBILL { get; set; }
        public string BillingPeriod { get; set; }
    }
}

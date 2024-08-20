using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class InvoiceStatuses
    {
        public long StatusId { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public bool CanBeSelected { get; set; } // "Invoiced" invoices cannot be changed from status
    }
}

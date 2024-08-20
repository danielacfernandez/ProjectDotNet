using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class BillingInvoiceProcessResult
    {
        public string ResultMessage { get; set; }
        public bool Succeeded { get; internal set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class InvoiceSelect
    {
        public long invoice_id { get; set; }
        public string invoice_no { get; set; }
    }
}

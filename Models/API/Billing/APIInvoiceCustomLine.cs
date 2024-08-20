using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APIInvoiceCustomLine
    {
        public long invoice_id { get; set; }
        public long item_id { get; set; }
        public string description { get; set; }
        public decimal unit_price { get; set; }
        public decimal qty { get; set; }
        public string po_no { get; set; }
        public bool taxable { get; set; }
        public long bill_service_id { get; set; }
    }
}

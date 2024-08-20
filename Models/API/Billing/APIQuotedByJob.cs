using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APIQuotedByJob
    {
        public long JobID { get; set; }
        public string[] ItemIDList { get; set; }
        public string GRIDTYPE { get; set; }
        public long? InvoiceID { get; set; }
    }
}

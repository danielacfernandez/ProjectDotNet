using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class QuoteRequestChangeStatusAPI
    {
        public long RequestID { get; set; }
        public string StatusLookupCode { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class CustomLineRequest
    {
        public long Service_ID { get; set; }
        public long Service_No { get; set; }
        public string Description { get; set; }
        public string po_no { get; set; }
    }
}

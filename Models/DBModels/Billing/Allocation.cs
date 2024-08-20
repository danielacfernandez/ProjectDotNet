using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class Allocation
    {
        public int service_id { get; set; }
        public int ReqNo { get; set; }
        public int job_id { get; set; }
        public string description { get; set; }
    }
}

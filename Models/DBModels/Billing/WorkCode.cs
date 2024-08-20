using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class WorkCode
    {
        public long item_id { get; set; }
        public string name { get; set; }

        public string IsDefault { get; set; }
    }
}

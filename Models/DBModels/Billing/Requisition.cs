using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class Requisition
    {
        public int service_id { get; set; }
        public int service_no { get; set; }
        public string description { get; set; }
        public string item_type_code { get; set; }
        public string item_id { get; set; }
        public string item_name { get; set; }
        public float qty_pooled { get; set; }
        public float qty_dist { get; set; }
        public float qty_left { get; set; }
        public float rate { get; set; }
        public int rate_id { get; set; }
        public int JOB_NO { get; set; }
        public string JOB_NAME { get; set; }

    }
}

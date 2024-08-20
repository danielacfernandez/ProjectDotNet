using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Job_Select
    {
        public long job_id { get; set; }
        public long job_no { get; set; }
        public long customer_id { get; set; }
        public string customer_name { get; set; }
        public string dealer_name { get; set; }
        public string ext_dealer_id { get; set; }
        public long? billing_user_id { get; set; }
        public string billing_user_name { get; set; }
        public string end_user_name { get; set; }
        public bool is_end_period_required { get; set; }

        public string RequestId { get; set; }
        public long Project_id { get; set; }

        public long NumberOfOpenPOs { get; set; }

    }
}

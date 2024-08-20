using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIWeekApprovePost
    {
        public DateTime Date { get; set; }
        public bool Approved { get; set; }
        public string RejectReason { get; set; }
        public long AsResourceID { get; set; }
    }
}

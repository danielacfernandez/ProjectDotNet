using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class SchedulerChangeMsg
    {
        public long OrganizationID { get; set; }
        public long SchedulerID { get; set; }
    }
}

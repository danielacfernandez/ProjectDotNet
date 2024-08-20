using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class APIScheduleDayUpdate
    {
        public long RequestScheduleId { get; set; }
        public long ProjectManagerId { get; set; }
        public string Notes { get; set; }
        public DateTime WseStartTime { get; set; }
        public DateTime FieldStartTime { get; set; }
    }
}

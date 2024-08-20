using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class DayUnnasigned
    {
        public long JOB_NO { get; set; }
        public string JOB_NAME { get; set; }
        public string RoleName { get; set; } = "UNKNOWN";
        public DateTime Date { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class SchedulerDayCrew : TSchedulerDayCrew
    {
        public long RequestScheduleId { get; set; }

        public bool IsOverWeeklyLimit { get; set; }
        public bool IsNotOff10Hrs { get; set; }
        public bool IsOver14Hrs { get; set; }
    }
}

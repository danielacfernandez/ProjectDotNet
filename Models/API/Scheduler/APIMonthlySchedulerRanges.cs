using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class APIMonthlySchedulerRanges
    {
        public double ScheduleMonthlyGreenFrom { get; set; }
        public double ScheduleMonthlyGreenTo { get; set; }
        public double ScheduleMonthlyYellowFrom { get; set; }
        public double ScheduleMonthlyYellowTo { get; set; }
        public double ScheduleMonthlyOrangeFrom { get; set; }
        public double ScheduleMonthlyOrangeTo { get; set; }
        public double ScheduleMonthlyRedFrom { get; set; }
        public double ScheduleMonthlyRedTo { get; set; }
    }
}

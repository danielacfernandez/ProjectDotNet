using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class SchedulerManpowerMonhtly
    {
        public int WeekNbr { get; set; }
        public int YearWeekNbr { get; set; }
        public DateTime Date { get; set; }
        public string RoleName { get; set; }
        public long Total { get; set; }
        public long Assigned { get; set; }
        public int RolOrder { get; set; }
        public string PrctAssignedColor { get; set; }
        public int ColorPriority { get; set; }
        public string DateColor { get; set; }
        public double TotalHoursForWeek { get; set; }
    }
}

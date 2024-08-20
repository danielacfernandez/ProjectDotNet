using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class SchedulerException
    {
        public long RequestScheduleExpectionId { get; set; }
        public long RequestID { get; set; }
        public DateTime Date { get; set; }
        public DateTime CreateTime { get; set; }
        public long ORGANIZATION_ID { get; set; }
        public string ResourceName { get; set; }
        public string RoleName { get; set; }
        public string ExceptionName { get; set; }
    }
}
 
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{

    public class APISchedulerJobPositionUpdate
    {
        public string SchedulerClientID { get; set; }
        public IEnumerable<APISchedulerJobPosition> JobPositions { get; set; }
    }
    

    public class APISchedulerJobPosition
    {
        public long RequestScheduleID { get; set; }
        public long Position { get; set; }
    }
}

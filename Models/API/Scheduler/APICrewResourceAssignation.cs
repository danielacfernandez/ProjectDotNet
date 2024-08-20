using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class APIResourceAssignation
    {
        public long OrganizationID { get; set; }
        public long? Resource_ID { get; set; }
        public long RequestScheduleCrewId { get; set; }
        public long? DriverID { get; set; }
        public string ResourceType { get; set; }
    }
}

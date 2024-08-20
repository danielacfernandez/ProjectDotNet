using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{

    public class APIScheduleRolesAndQtysDetails
    {
        public long roleId { get; set; }
        public long quantity { get; set; }
    }

    public class APIScheduleRolesAndQtys
    {
        public long OrganizationID { get; set; }
        public long RequestScheduleId { get; set; }
        public IEnumerable<APIScheduleRolesAndQtysDetails> RolesAndQts { get; set; }
    }
}

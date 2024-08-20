using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class DaySummaryByRole
    {
        public long Role_Id { get; set; }
        public string RolName { get; set; }
        public bool RoleIsVehicle { get; set; }
        public long TotalHours { get; set; }
        public long HumanResourcesRequired { get; set; }
        public long HumanResourcesAllocated { get; set; }
        public long VehicleResourcesRequired { get; set; }
        public long VehicleResourcesAllocated { get; set; }
        public long RoleCapacity { get; set; }
    }
}

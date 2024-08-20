using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class RequestScheduleRolesAndQuantities
    {
        public long RoleId { get; set; }
        public string Name { get; set; }
        public long Quantity { get; set; }
        public long QtyAssigned { get; set; }
        public bool IsVehicle { get; set; }
    }
}

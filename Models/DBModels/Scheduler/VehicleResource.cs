using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class VehicleResource
    {
        public long Resource_ID { get; set; }
        public string ResourceName { get; set; }
        public string ResourceGroupName { get; set; }
        public decimal Length { get; set; }
        public decimal Width { get; set; }
        public decimal Height { get; set; }
        public int Seats { get; set; }
        public string ResourceType { get; set; }
        public DateTime? startTime { get; set; }
        public DateTime? endTime { get; set; }
        public long PrctAssigned { get; set; }
        public bool IsOutOfService { get; set; }
        public string PrctAssignedColor { get; set; }

        public string APIResourceType { get; } = "VEHICLE";

        public long LocationLookupID { get; set; }
        public string LocationName { get; set; }
        public bool IsAssignedToSvcAcctJob { get; set; }

    }
}

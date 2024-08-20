using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class AllocationsToDB
    {
        public int OrganizationID { get; set; }
        public int JobID { get; set; }
        public int ServiceID { get; set; }
        public string ItemID { get; set; }
        public decimal Rate { get; set; }
        public float QtyLeft { get; set; }
        public List<AllocationsUpdates> Allocations { get; set; }
    }

    public class AllocationsUpdates
    {
        public int ServiceID { get; set; }
        public float QtyToAllocate { get; set; }
    }
}

using ServiceTRAX.Models.DBModels.Billing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class PooledReqDetailViewModel : ServiceTRAXPageViewModel
    {
        public int JobNo { get; set; }
        public int JobID { get; set; }
        public Requisition Requisition { get; set; }
        public List<Allocation> Allocations { get; set; }
    }
}

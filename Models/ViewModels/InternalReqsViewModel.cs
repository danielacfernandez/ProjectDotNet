using ServiceTRAX.Models.DBModels.Billing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class InternalReqsViewModel : ServiceTRAXPageViewModel
    {
        public int JobNo { get; set; }
        public int JobID { get; set; }
        public List<(int ReqNo, string ReqName)> Reqs { get; set; }
        public List<Requisition> Requisitions { get; set; }
    }
}

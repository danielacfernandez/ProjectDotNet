using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXPurchaseOrdersViewModel : ServiceTRAXPageViewModel
    {
        public long RequestID { get; set; }
        public int UserID { get; internal set; }
        public long ProjectID { get; internal set; }

        public bool IsEnableEdit { get; set; }
        public bool IsAllowedToApprove { get; set; }

        public bool IsLSPUser { get; set; }
        public bool IsOnlyLSPUser { get; set; }
        
    }
}

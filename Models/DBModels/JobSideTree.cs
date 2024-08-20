using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class JobSideTree
    {
        public string TypeName { get; set; }
        public long? RequestNo { get; set; }
        public long? VersionNo { get; set; }
        public long? RequestID { get; set; }
        public string Request_Name { get; set; }
        public long? QuoteID { get; set; }
        public string Number { get; set; }
        public bool IsActive { get; set; }
        public bool ShowBillingButton { get; set; }
        
    }
}

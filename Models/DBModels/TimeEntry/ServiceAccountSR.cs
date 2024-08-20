using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class ServiceAccountSR
    {
        public long RequestID { get; set; }
        public string RequestNumber { get; set; }
        public string Description { get; set; }
    }
}

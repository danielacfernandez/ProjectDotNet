using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class ServiceAccountJob
    {
        public long ProjectID { get; set; }
        public string JobName { get; set; }
        public string JobNo { get; set; }
    }
}

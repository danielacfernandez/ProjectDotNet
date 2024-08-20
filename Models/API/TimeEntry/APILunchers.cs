using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APILunchers
    {
        public long? ServiceID { get; set; }
        public long? requestscheduleid { get; set; }
        public DateTime ForDate { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public IEnumerable<int> ResourceIds { get; set; }
    }
}

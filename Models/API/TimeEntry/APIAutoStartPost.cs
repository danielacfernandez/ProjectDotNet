using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIAutoStartPost
    {
        public long? ServiceId { get; set; }
        public long? RequestScheduleId { get; set; }
        public DateTime ForDate { get; set; }
        public IEnumerable<int> ResourceIds { get; set; }
    }
}

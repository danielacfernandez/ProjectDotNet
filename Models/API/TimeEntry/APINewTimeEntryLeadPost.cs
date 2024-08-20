using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APINewTimeEntryLeadPost
    {
        public long? ServiceLineTimeEntryID { get; set; }
        public long? ServiceId { get; set; }
        public long ResourceId { get; set; }
        public DateTime? ForDate { get; set; }
    }
}

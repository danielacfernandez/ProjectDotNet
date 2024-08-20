using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APITimeEntryUpdate
    {
        public long serviceLineTimeEntry { get; set; }
        public string type { get; set; }
        public DateTime? time { get; set; }
        public bool forceendwolunch { get; set; }
        public string notes { get; set; }
    }
}

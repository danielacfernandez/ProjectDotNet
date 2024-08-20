using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class BulkTimeEntryJob
    {
        public long ProjectId { get; set; }
        public long JobName { get; set; }
    }
}

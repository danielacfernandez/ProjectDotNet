using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class BulkTimeEntrySelect
    {
        public long ProjectId { get; set; }
        public long JobId { get; set; }
        public string JobName { get; set; }
        public string DESCRIPTION { get; set; }
        public string RequestNumber { get; set; }
        public long RequestID { get; set; }
        public string RequestType { get; set; }
    }
}

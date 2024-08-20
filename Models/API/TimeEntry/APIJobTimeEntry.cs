using ServiceTRAX.Models.DBModels.TimeEntry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{

    public class APIJobTimeEntryWithLunchs {
        public JobTimeEntry TimeEntry { get; set; }
        public IEnumerable<JobTimeEntry> Lunchs { get; set; }
    }

    public class APIJobTimeEntry
    {
        public string job_name { get; set; }
        public string project_request_no { get; set; }
        public long requestscheduleid { get; set; }
        public string Request_Name { get; set; }
        public string customer_name { get; set; }
        public long serviceid { get; set; }
        public long? requestid { get; set; }
        public long? projectno { get; set; }
        public long? requestno { get; set; }
        public long? versionno { get; set; }
        public DateTime? whsestarttime { get; set; }
        public DateTime? fieldstarttime { get; set; }
        public IEnumerable<APIJobTimeEntryWithLunchs> TimeEntries { get; set; }
        public bool isLead { get; set; }
    }
}

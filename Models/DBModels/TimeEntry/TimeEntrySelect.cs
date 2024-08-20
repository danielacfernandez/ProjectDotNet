using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class TimeEntrySelect
    {
        public long jobnumber { get; set; }
        public long service_line_id { get; set; }
        public long srnumber { get; set; }
        public string job_name { get; set; }
        public string resource_name { get; set; }
        public string item_name { get; set; }
        public DateTime service_line_date_varchar { get; set; }
        public decimal hoursqty { get; set; }
        public decimal rate { get; set; }
        public decimal total { get; set; }
        public string reqnbr { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIBulkTimeEntryInsert
    {
        public DateTime Date { get; set; }
        public long JobId { get; set; }
        public IEnumerable<int> LstResourcesId { get; set; }
        public IEnumerable<int> LstServiceRequests { get; set; }
        public long WorkCodeId { get; set; }
        //public double QtyHours { get; set; }
        public long PayCodeId { get; set; }
        public bool IsOT { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}

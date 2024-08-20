using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class AutoDayResource
    {
        public long ServiceLineTimeEntryID { get; set; }
        public long ResourceId { get; set; }
        public string ResourceName { get; set; }
        public bool AutoFlagValue { get; set; }
        public long LunchQty { get; set; }
        public bool? CanAutoEnd { get; set; }
        public string ExceptionMsg { get; set; }
    }
}

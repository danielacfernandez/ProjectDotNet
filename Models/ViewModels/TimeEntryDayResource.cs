using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class TimeEntryDayResource
    {
        public long? UserID { get; set; }
        public long ResourceID { get; set; }
        public string ResourceName { get; set; }
    }
}

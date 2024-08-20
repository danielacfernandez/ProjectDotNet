using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class AutoDayResourceResult
    {
        public bool Succeded { get; set; }
        public IEnumerable<AutoDayResource> AutoDayResources { get; set; }
        public string ErrorMessage { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{

    public class APIResourcePropertiesCallOut 
    {
        public long? NoShowLookupID { get; set; }
        public string NoShowReason { get; set; }
    }



    public class APIResourceProperties
    {
        public long RequestScheduleCrewId { get; set; }
        public APIResourcePropertiesCallOut CallOut { get; set; }
        public string Notes { get; set; }
    }
}

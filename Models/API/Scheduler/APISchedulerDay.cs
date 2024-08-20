using ServiceTRAX.Models.DBModels.Scheduler;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class APISchedulerDay : SchedulerDay
    {
        public string SRNumber { get; set; }

        public string Address
        {
            get
            {
                string[] addressArray = { JobLocationStreet, JobLocationCity, JobLocationState, JobLocationZip };
                return string.Join(", ", addressArray.Where(s => !string.IsNullOrEmpty(s)));
            }
        }

        public IEnumerable<SchedulerDayCrew> Lead { get; set; }
        public IEnumerable<SchedulerDayCrew> Crew { get; set; }
        public IEnumerable<SchedulerDayVehicle> Vehicles { get; set; }
    }
}

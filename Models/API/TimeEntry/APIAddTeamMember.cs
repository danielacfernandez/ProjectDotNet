using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIAddTeamMember
    {
        public long? ServiceID { get; set; }
        public long? RequestScheduleId { get; set; }
        public DateTime ForDate { get; set; }
        public long ResourceID { get; set; }
        public long TypeOfAddition { get; set; }
    }
}

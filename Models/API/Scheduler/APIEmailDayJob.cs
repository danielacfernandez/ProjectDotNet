using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class APIEmailDayJob
    {
        public long RequestScheduleID { get; set; }
        public IEnumerable<string> EmailRecipientList { get; set; }
        public string EmailText { get; set; }
    }
}

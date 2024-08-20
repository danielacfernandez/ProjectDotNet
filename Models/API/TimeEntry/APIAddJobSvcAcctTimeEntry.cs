using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIAddJobSvcAcctTimeEntry
    {
        public long servicelinetimeentryid { get; set; }
        public long requestid { get; set; }
        public DateTime? fordate { get; set; }
        public double hours { get; set; }
        public string customcols { get; set; }
        public long? itemid { get; set; }
    }
}

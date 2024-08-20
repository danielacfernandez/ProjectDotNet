using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIResourceNoShow
    {
        public long? servicelinetimeentryid { get; set; }
        public long? serviceid { get; set; }
        public DateTime? timeentrydate { get; set; }
        public long resourceid { get; set; }
        public long? noshowid { get; set; }
        public string noshownotes { get; set; }
    }
}

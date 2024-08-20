using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Admin
{
    public class APICreateJobHeader
    {
        public long ProjectNo { get; set; }
        public long JobTypeID { get; set; }
        public long CustomerID { get; set; }
        public long EndUserID { get; set; }
        public string JobName { get; set; }
        public bool IsPooledHours { get; set; }
    }
}

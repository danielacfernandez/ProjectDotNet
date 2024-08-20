using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APIServiceLinesBillable
    {
        public long JobID { get; set; }
        public IEnumerable<string> ItemIDList { get; set; }
        public string GRIDTYPE { get; set; }
        public string ISBILLABLE { get; set; }

    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APIServiceLinesUnassign
    {
        public long JOBID { get; set; }
        public long INVOICEID { get; set; }
        public string GRIDTYPE { get; set; }
        public IEnumerable<string> KEYIDTABLE { get; set; }
    }
}

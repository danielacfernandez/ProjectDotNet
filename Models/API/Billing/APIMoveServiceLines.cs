using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APIMoveServiceLines
    {
        public long SourceJobID { get; set; }
        public long JobID { get; set; }
        public long ReqID { get; set; }
        public string GRIDTYPE { get; set; }
        public IEnumerable<string> ServiceLinesToMove { get; set; }
    }
}

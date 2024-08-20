using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Organization
    {
        public long organization_id { get; set; }
        public string name { get; set; }
        public string code { get; set; }
        public bool isactive { get; set; }
        public int sequence_no { get; set; }
    }

}

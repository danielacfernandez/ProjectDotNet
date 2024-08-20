using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteRole
    {
        public int Role_ID { get; set; }
        public string Name { get; set; }
        public float RateOT { get; set; }
        public float RateReg { get; set; }
        public bool IsCrew { get; set; }
        public long OrganizationId { get; set; }
    }
}

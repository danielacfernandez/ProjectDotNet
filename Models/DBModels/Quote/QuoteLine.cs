using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteLine
    {
        public long QuoteLineID { get; set; }
        public long? Role_ID { get; set; }
        public string RoleWriteIn { get; set; }
        public float Hours { get; set; }
        public float Rate { get; set; }
        public bool IsOT { get; set; }
        public bool IsActive { get; set; }
        public long QuoteID { get; set; }
        public bool IsCrew { get; set; }

        public bool IsFuelSurcharge { get; set; }
    }
}

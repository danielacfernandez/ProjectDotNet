using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class QuoteEmailRow
    {
        public string RoleName { get; set; }
        public decimal TotalReg { get; set; }
        public decimal TotalOT { get; set; }
    }
}

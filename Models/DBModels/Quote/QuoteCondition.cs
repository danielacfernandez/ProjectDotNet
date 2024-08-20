using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class QuoteCondition
    {
        public int QuoteConditionID { get; set; }
        public string Name { get; set; }
        public bool Checked { get; set; }
    }
}

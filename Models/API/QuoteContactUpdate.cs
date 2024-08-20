using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class QuoteContactUpdate
    {
        public long QuoteID { get; set; }
        public long ContactID { get; set; }
    }
}

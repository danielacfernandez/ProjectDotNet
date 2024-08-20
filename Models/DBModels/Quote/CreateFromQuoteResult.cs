using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class CreateFromQuoteResult : DBActionResult
    {
        public long? QuoteID { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class QuoteByJobInfo
    {
        public long Job_no { get; set; }
        public long Request_No { get; set; }
        public long Version_No { get; set; }
        public long QuoteId { get; set; }
        public string Quote_Number { get; set; }
    }
}

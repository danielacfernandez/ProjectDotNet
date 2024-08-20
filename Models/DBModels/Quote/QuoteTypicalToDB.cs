using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteTypicalToDB
    {
        public long QuoteID { get; set; }
        public string TabName { get; set; }
        public string PageName { get; set; }
        public long QuoteDataTypicalID { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteDataTab
    {
        public string TabName { get; set; }
        public List<QuoteDataPage> Pages { get; set; }
    }
}

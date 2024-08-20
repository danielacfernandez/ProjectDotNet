using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteDataPage
    {
        public string PageName { get; set; }
        public List<QuoteDataSection> Sections { get; set; }
    }
}

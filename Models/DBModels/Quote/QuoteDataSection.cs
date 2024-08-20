using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteDataSection
    {
        public string SectionName { get; set; }
        public List<QuoteDataItem> Items { get; set; }
    }
}

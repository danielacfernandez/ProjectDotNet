using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteTypicalSection
    {
        public string SectionName { get; set; }
        public List<QuoteTypicalItem> Items { get; set; }
    }
}

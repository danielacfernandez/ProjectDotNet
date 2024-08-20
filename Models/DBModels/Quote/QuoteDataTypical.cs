using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteDataTypical
    {
        public long QuoteDataTypicalID { get; set; }
        public long QuoteID { get; set; }
        public long QuoteDataID { get; set; }
        public long QuoteDataTemplateID { get; set; }
        public string TabName { get; set; }
        public string PageName { get; set; }
        public string SectionName { get; set; }
        public string ItemName { get; set; }
        public float ItemTime { get; set; }
        public float ItemQuantity { get; set; }
        public bool IsActive { get; set; }
    }
}

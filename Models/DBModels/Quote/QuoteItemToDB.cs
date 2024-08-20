using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteItemToDB
    {
        public long QuoteID { get; set; }
        public string TabName { get; set; }
        public string PageName { get; set; }
        public string SectionName { get; set; }
        public string ItemName { get; set; }
        public long? QuoteDataTypicalID { get; set; }
        public bool IsActive { get; set; }
        public long CreatedBy { get; set; }
    }
}

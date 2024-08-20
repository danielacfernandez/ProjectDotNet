using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteTypical
    {
        public long OrganizationID { get; set; }
        public long QuoteID { get; set; }
        public string TabName { get; set; }
        public string PageName { get; set; }
        public string TypicalName { get; set; }
        public List<QuoteTypicalSection> Sections {get; set;}
    }
}

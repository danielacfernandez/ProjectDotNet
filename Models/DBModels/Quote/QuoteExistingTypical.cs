using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteExistingTypical
    {
        public long OrganizationID { get; set; }
        public long QuoteDataTypicalID { get; set; }
        public string PageName { get; set; }
        public string TypicalName { get; set; }
        public bool IsActive { get; set; }
    }
}

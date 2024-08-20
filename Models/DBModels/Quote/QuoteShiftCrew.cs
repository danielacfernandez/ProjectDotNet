using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class QuoteShiftCrew
    {
        public long QuoteID { get; set; }
        public float? HrsPerShift { get; set; }
        public float? DaysOnSite { get; set; }
        public float? NumberOfShifts { get; set; }
        public float? CrewSize { get; set; }
    }
}

using ServiceTRAX.Models.WidgetModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{

    public class APIQuoteLineDayDetail
    {
        public long roleId { get; set; }
        public long quantity { get; set; }
    }

    public class APIQuoteLineDay {
        public long OrganizationID { get; set; } = 2;
        public long QuoteID { get; set; }
        public string StartDate { get; set; } = "";
        public string EndDate { get; set; } = "";
        public string StartTime { get; set; } = "";
        public string OnSiteTime { get; set; } = "";

        public string Description { get; set; } = "";

        public double HoursReg { get; set; } = 0;
        public double HoursOT { get; set; } = 0;
        public IEnumerable<APIQuoteLineDayDetail> RolesAndQtties { get; set; } = null;
    }
}

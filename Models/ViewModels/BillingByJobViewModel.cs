using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.Billing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class BillingByJobViewModel : ServiceTRAXPageViewModel
    {

        public IEnumerable<object> BillingGridViews { get; } = new object[] {
            new { name= "Summary By Item", id="ITEM" }
            , new { name = "Summary By Req/Item", id = "REQITEM" }
            , new { name = "Summary By Req", id = "REQ" }
            , new { name = "Detail", id = "DETAIL" }
        };
        public string ViewType { get; internal set; }
        public long JobID { get; internal set; }
        public string ViewXMLFileName { get; internal set; }
        public IEnumerable<Lookup> BillingTypes { get; internal set; }
        public IEnumerable<Lookup> InvoiceTypes { get; internal set; }
        //public IEnumerable<AccountingUser> BillingAssignCandidates { get; internal set; }
        public IEnumerable<object> Jobs { get; internal set; }
        public decimal InvoicedTotal { get; internal set; }
        public int UserID { get; internal set; }
        public Job_Select JobDetails { get; internal set; }
        public string SelectedTab { get; internal set; }
        public IEnumerable<BillingPeriods> BillingPeriods { get; internal set; }
        public bool POIsEnabledEdit { get; set;  }
        public bool IsAllowedToApprove { get; set; }
    }
}

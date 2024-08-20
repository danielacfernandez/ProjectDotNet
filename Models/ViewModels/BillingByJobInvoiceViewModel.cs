using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.Billing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class BillingByJobInvoiceViewModel : ServiceTRAXPageViewModel
    {
        //public long JobID { get; set; }
        public long InvoiceID { get; set; }
        public JobInvoiceData InvoiceData { get; internal set; }



        public IEnumerable<object> BillingGridViews { get; } = new object[] {
            new { name= "Summary By Item", id="ITEM" }
            , new { name = "Summary By Req/Item", id = "REQITEM" }
            , new { name = "Summary By Req", id = "REQ" }
            , new { name = "Detail", id = "DETAIL" }
        };
        public string ViewType { get; internal set; }
        public string AssignedXMLName { get; internal set; }
        public string UnassignedXMLName { get; internal set; }

        public long UserID { get; set; }
        public decimal InvoicedTotal { get; internal set; }
        public bool ReadOnly { get; internal set; }
        public string SelectedTab { get; internal set; }
        public IEnumerable<InvoiceStatuses> InvoiceStatuses { get; internal set; }
        public bool CanChangeInvoiceStatus { get; internal set; }
        public IEnumerable<Lookup> BillingTypes { get; internal set; }
        public IEnumerable<BillingPeriods> BillingPeriods { get; internal set; }
        public double FuelSurchargeTotal { get; set; }
        public bool AddFuelSurcharge { get; set; }
        public bool AddAdminFee { get; set; }
    }

}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.WidgetModels
{
    public class HoursSubmittedNotInvoicedModel
    {
        public decimal? TotalBillQty { get; set; }
        public decimal? BillableTotal { get; set; }
    }
}

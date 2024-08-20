using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXProjectDocumentsViewModel : ServiceTRAXPageViewModel
    {
        public long Project_No { get; set; }
        public bool QuoteRequests { get; internal set; }
        public bool Quotes { get; internal set; }
        public bool ServiceRequests { get; internal set; }
        public bool HotSheets { get; internal set; }
        public bool ReportDailyStatus { get; internal set; }
        public bool RDSEmailed { get; internal set; }
        public bool PurchaseOrders { get; internal set; }
        public bool FileAttachments { get; internal set; }
    }
}

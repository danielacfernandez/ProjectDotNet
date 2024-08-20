using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXSearchViewModel : ServiceTRAXPageViewModel
    {
        public long UserID { get; set; }
        public IEnumerable<EndUser> EndUsers { get; set; }
        public IEnumerable<Request_Customer> Customers { get; set; }
        public string EndUser { get; internal set; }
        public string ProjectName { get; internal set; }
        public string ProjectNumber { get; internal set; }
        public string InvoiceNumber { get; internal set; }
        public string PONumber { get; internal set; }
        public string HBQuote { get; internal set; }
        public string Customer { get; internal set; }
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

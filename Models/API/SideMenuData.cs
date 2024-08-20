using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class SideMenuQuoteRequestVersion
    {
        public bool IsActive { get; set; }
        public string Description { get; set; }
        public long Id { get; set; }
        public string Request_Name { get; set; }
    }

    public class SideMenuQuoteRequests
    {
        public long Number { get; set; }
        public IEnumerable<SideMenuQuoteRequestVersion> Versions { get; set; }
    }

    public class SideMenuQuote
    {
        public string Description { get; set; }
        public long Number { get; set; }
        public long QuoteID { get; set; }
    }

    public class SideMenuServiceRequest
    {
        public string Description { get; set; }
        public long Number { get; set; }
        public long RequestID { get; set; }
        public string Request_Name { get; set; }
    }


    public class SideMenuDocuments
    {
        public IEnumerable<SideMenuQuoteRequests> QuoteRequests { get; set; }
        public IEnumerable<SideMenuServiceRequest> ServiceRequests { get; set; }
        public IEnumerable<SideMenuQuote> Quotes { get; set; }
    }


    public class SideMenuData
    {
        public int OrganizationID { get; set; }
        public long? UserID { get; set; }
        public long? RequestID { get; set; }
        public long ProjectID { get; set; }
        public bool ShowBillingButton { get; set; }

        public SideMenuDocuments Documents { get; set; } = new SideMenuDocuments
        {
            QuoteRequests = Enumerable.Empty<SideMenuQuoteRequests>(),
            ServiceRequests = Enumerable.Empty<SideMenuServiceRequest>(),
            Quotes = Enumerable.Empty<SideMenuQuote>()
        };
    }
}

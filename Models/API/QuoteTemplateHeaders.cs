using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class QuoteTemplateHeaders
    {
        public long QuoteId { get; set; }
        public string ProjectManagerTitle { get; set; } = "Project Manager";
        public string ProjectManagerName { get; set; } = "ProjectManagerName";
        public string CreatedByPhone { get; set; } = "(555) 555-5555";
        public string ATTNBoxContact { get; set; } = "ATTNBoxContact";
        public string LSPName { get; set; } = "LSPName";
        public string CustomerName { get; set; } = "CustomerName";
        public string EndUserName { get; set; } = "EndUserName";
        public string RequestName { get; set; } = "RequestName";
        public int OrganizationId { get; set; } = 0;

    }
}

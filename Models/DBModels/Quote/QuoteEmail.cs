using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class QuoteEmail
    {
        public string CustomerContact { get; set; }
        public string WorkRequest { get; set; }
        public float NumberOfShifts { get; set; }
        public List<QuoteLine> Lines { get; set; }
        public List<QuoteLine> LinesFee { get; set; }
        public List<QuoteLine> LinesPMMarkup{ get; set; }
        public float CrewSize { get; set; }
        public float HoursPerShift { get; set; }
        public string ProjectManager { get; set; }
        public string EndUserName { get; set; }
        public long ProjectNo { get; set; }
        public int RequestNo { get; set; }
        public int VersionNo { get; set; }
        public long QuoteID { get; set; }
        public string Template { get; set; }
        public int OrganizationID { get; set; }
        public string ProjectName { get; set; }
        public string CustomerName { get; set; }
        public string[] To { get; set; }
        public string[] CC { get; set; }
        public string JobLocationAddress { get; set; }
        public string JobLocationContactName { get; set; }
        public string QRDate { get; set; }
        public bool EmailTestNotifyActive { get; set; }
        public string EmailTestNotifyAddress { get; set; }
        public List<string> Conditions { get; set; }
        public string Comments { get; set; }
        public float DaysOnSite { get; set; }
        public string HDSQuoteNo { get; set; }

        public string Url { get; set; }
    }
}

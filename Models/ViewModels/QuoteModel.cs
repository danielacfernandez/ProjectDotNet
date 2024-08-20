using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.Quote;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class QuoteModel : ServiceTRAXPageViewModel
    {
        public List<QuoteDataTab> Tabs { get; set; }
        public long QuoteID { get; set; }
        public long RequestID { get; set; }
        public long QuoteOrganizationId { get; set; }
        public IEnumerable<QuoteLine> Lines { get; set; }
        public IEnumerable<QuoteLine> LinesFee { get; set; }
        public IEnumerable<QuoteLine> LinesPMMarkup { get; set; }
        public IEnumerable<QuoteRole> Roles { get; set; }
        public QuoteShiftCrew ShiftCrews { get; set; }
        public IEnumerable<EmailContact> EmailContacts { get; set; }
        public QuoteHeader Header { get; set; }
        public long UserID { get; set; }
        public IEnumerable<QuoteCondition> Conditions { get; set; }
        public bool IsReadOnlyView { get; internal set; }
        public bool CanSetReadyToSchedule { get; internal set; }
        public long? ServiceRequestID { get; internal set; }
        public bool AddAdminFee { get; set; }
        public bool AddFuelSrucharge { get; set; }

        public bool UserHasLSPRole { get; set; }

        public IEnumerable<Lookup> Time15min { get; internal set; }

        public bool UseLSPRole { get; set; }
    }
}

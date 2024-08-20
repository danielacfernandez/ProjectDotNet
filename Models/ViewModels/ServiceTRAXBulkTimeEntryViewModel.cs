using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.TimeEntry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXBulkTimeEntryViewModel : ServiceTRAXPageViewModel
    {
        public IEnumerable<Lookup> PayCodes { get; internal set; }
        public IEnumerable<BulkResource> Members { get; internal set; }
        public IEnumerable<object> Jobs { get; internal set; }
        public DateTime? StartDate { get; internal set; }
        public DateTime? EndDate { get; internal set; }
        public IEnumerable<object> Requests { get; internal set; }
    }
}

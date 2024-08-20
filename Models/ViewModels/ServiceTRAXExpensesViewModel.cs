using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.TimeEntry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXExpensesViewModel : ServiceTRAXPageViewModel
    {
        public IEnumerable<object> Jobs { get; internal set; }
        //public IEnumerable<Lookup> PayCodes { get; internal set; }
        public IEnumerable<BulkResource> Resources { get; internal set; }
        public int UserID { get; internal set; }
    }
}

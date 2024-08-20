using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class ExpensesEntrySelect
    {
        public long ProjectId { get; set; }
        public long JobNumber { get; set; }
        public string JobName { get; set; }
        public long JobID { get; set; }
        public long ServiceId { get; set; }
        public string ServiceNoDesc { get; set; }
    }
}

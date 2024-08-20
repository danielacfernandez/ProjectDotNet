using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class TimeEntryApproval : ServiceTRAXPageViewModel
    {
        public DateTime? Date { get; internal set; }
        public long? AsUserID { get; internal set; }
        public long? AsResourceID { get; internal set; }
        public bool CanUndoRejectedTime { get; internal set; }
    }
}

using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class TimeEntryServiceAccount : ServiceTRAXPageViewModel
    {
        public DateTime? Date { get; internal set; }
        public long? ForUserID { get; internal set; }
    }
}

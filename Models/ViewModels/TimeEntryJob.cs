using ServiceTRAX.Models.API.TimeEntry;
using System;
using System.Collections.Generic;

namespace ServiceTRAX.Models.ViewModels
{
    public class TimeEntryJob : ServiceTRAXPageViewModel
    {
        public DateTime? Date { get; internal set; }
        //public IEnumerable<TimeEntryDayResource> DayResources { get; internal set; }
        public long? ForUserID { get; internal set; }
    }
}

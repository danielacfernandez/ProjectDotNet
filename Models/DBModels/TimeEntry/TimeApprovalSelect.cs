using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class TimeApprovalSelect
    {
        public long? ServiceLineTimeEntryID { get; set; }
        public long? TimeSheetID { get; set; }
        public DateTime TimeEntryDate { get; set; }
        public double TotalHours { get; set; }
        public string JobDescription { get; set; }
        public string RequestNumber { get; set; }
        public long JobNumber { get; set; }

        /// <summary>
        /// 1 = approved; -1 = rejected; 0 = no desition yet
        /// </summary>
        public int? IsApproved { get; set; }

        public double TotalLunchHours { get; set; }
        public DateTime? TimeEntryStartTime { get; set; }
        public DateTime? TimeEntryEndTime { get; set; }
        public int QtyLunch { get; set; }
        public bool CanUndo { get; set; }

        public bool IsPTO { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class ServiceAccountRequests
    {
        public long? ServiceLineTimeEntryID { get; set; }
        public long ResourceID { get; set; }
        public string ResourceName { get; set; }
        public DateTime? TimeEntryStartTime { get; set; }
        public DateTime? TimeEntryEndTime { get; set; }
        public string LineType { get; set; }
        public double HoursQty { get; set; }
        public long? ParentServiceLineTimeEntryId { get; set; }
        public string ProjectName { get; set; }
        public long? ServiceLineId { get; set; }

        public long? NoShowLookupID { get; set; }
        public string NoShowLookupCode { get; set; }
        public string NoShowLookupDesc { get; set; }
        public string TypeOfAdditionName { get; set; }

        public bool AddLunchButtonEnabled { get; set; }
        public bool CheckInOutButtonsEnabled { get; set; }
        public bool IsApproved { get; set; }

        public string Notes { get; set; }
        public string NoShowNotes { get; set; }
        public long? ItemId { get; set; }
        public string ItemName { get; set; }
        public bool IsReadOnly { get; set; }
    }
}

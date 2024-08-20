using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class JobTimeEntry
    {
        public long serviceid { get; set; }
        public long ServiceLineTimeEntryID { get; set; }
        public string JOB_NAME { get; set; }
        public string project_request_no { get; set; }
        public string customer_name { get; set; }
        /// <summary>
        /// UserId of the resource
        /// </summary>
        public long? UserId { get; set; }
        public long resource_id { get; set; }
        public string ResourceName { get; set; }
        public bool CheckInOutButtonsEnabled { get; set; }
        public bool AddLunchButtonEnabled { get; set; }
        public DateTime? TimeEntryStartTime { get; set; }
        public DateTime? TimeEntryEndTime { get; set; }
        public double TotalHoursWorked { get; set; }
        public long? ParentServiceLineTimeEntryId { get; set; }
        public string RoleIconName { get; set; }
        public string RoleAltIconCode { get; set; }
        public string TypeOfAdditionName { get; set; }
        public long? NoShowLookupID { get; set; }
        public string NoShowLookupCode { get; set; }
        public string NoShowLookupDesc { get; set; }
        public bool HasDailyStatusReport { get; set; }
        public long? Request_Id { get; set; }
        public long? Project_No { get; set; }
        public long? Request_No { get; set; }
        public string Request_Name { get; set; }
        public long? Version_No { get; set; }
        public int RoleDisplayOrder { get; set; }
        public DateTime? WSEStartTime { get; set; }
        public DateTime? FieldStartTime { get; set; }
        
        /// <summary>
        /// Time entry has been approved - this makes the TE readonly
        /// </summary>
        public bool IsApproved { get; set; }

        public string Notes { get; set; }
        public string NoShowNotes { get; set; }

        public long RequestScheduleId { get; set; }
        public bool IsLead { get; set; }

    }


}

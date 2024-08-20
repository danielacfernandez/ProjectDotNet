using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public abstract class TSchedulerDayCrew
    {
        public long RequestScheduleCrewId { get; set; }
        public long RequestID { get; set; }
        public long? CrewResourceID { get; set; }
        public string CrewName { get; set; }
        public long RoleId { get; set; }
        public string RoleCode { get; set; }
        public string RoleIconName { get; set; }
        public string RoleAltIconCode { get; set; }
        public decimal RateReg { get; set; }
        public decimal RateOT { get; set; }
        public string ExceptionLookupCode { get; set; }
        public string ExceptionNotes { get; set; }
        public long NoShowLookupID { get; set; }
        public string NoShowReason { get; set; }
        public string NoShowLookupCode { get; set; }
        public string NoShowLookupName { get; set; }
        public bool IsLead { get; set; }
        public bool IsHardScheduled { get; set; }
        public bool IsDoubleBooked { get; set; }
        public bool IsCallIn { get; set; }
        public bool IsOnPTO { get; set; }
        public string RoleGroupName { get; set; }

        public string APIResourceType { get; } = "HUMAN";
        public bool IsDriver { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class SchedulerDayVehicle
    {
        public long RequestScheduleId { get; set; }
        public long RequestScheduleCrewId { get; set; }
        public long RequestID { get; set; }
        public string VehicleName { get; set; }
        public string CrewName
        {
            get
            {
                return VehicleName;
            }
        }
        public long CrewResourceID { get; set; }
        public long? DriverID { get; set; }
        public string DriverName { get; set; }
        public long RoleId { get; set; }
        public string RoleCode { get; set; }
        public string RoleIconName { get; set; }
        public string RoleAltIconCode { get; set; }
        public decimal RateReg { get; set; }
        public decimal RateOT { get; set; }
        public string ExceptionNotes { get; set; }
        public long NoShowLookupID { get; set; }
        public string NoShowReason { get; set; }
        public string NoShowLookupCode { get; set; }
        public string NoShowLookupName { get; set; }
        public bool IsHardScheduled { get; set; }
        public string RoleGroupName { get; set; }
        public string APIResourceType { get; } = "VEHICLE";
        public bool IsDoubleBooked { get; set; }
    }
}

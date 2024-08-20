using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class RequestScheduleCrew
    {
        public bool ISEMPTY { get; set; }
        public bool ISPTO { get; set; }
        public bool ISDOUBLE { get; set; }
        public bool ISCALLIN { get; set; }
        public bool ISNORMAL { get; set; }


        public long RequestScheduleId { get; set; }
        public long RequestID { get; set; }
        public string CrewName { get; set; }
        public long RoleId { get; set; }
        public long RoleCode { get; set; }
        public string RoleIconName { get; set; }
        public string RoleAltIconCode { get; set; }
        public long RateReg { get; set; }
        public long RateOT { get; set; }
        public long ExceptionNotes { get; set; }
        public long NoShowLookupID { get; set; }
        public long NoShowReason { get; set; }
        public long NoShowLookupCode { get; set; }
        public long NoShowLookupName { get; set; }
    }
}

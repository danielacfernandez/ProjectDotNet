using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace ServiceTRAX.Models.DBModels.Scheduler
{
    public class HumanResource
    {
        public long Resource_ID { get; set; }
        public string ResourceName { get; set; }
        public string ResourceGroupName { get; set; } = "Unknown";

        public int InstallerLevel { get; set; }
        public int MoverLevel { get; set; }
        public int LeadLevel { get; set; }
        public int DriverLevel { get; set; }

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public double PrctAssigned { get; set; }
        public string PrctAssignedColor { get; set; }

        public double WeekToDateHs { get; set; }
        public double Past7DaysHs { get; set; }
        public double Past8DaysHs { get; set; }

        public string ResourceType { get; set; }
        public bool IsOnPTO { get; set; }

        public string Skills { get; set; }

        public long LocationLookupID { get; set; }
        public string LocationName { get; set; }
        public bool IsAssignedToSvcAcctJob { get; set; }
    }
}

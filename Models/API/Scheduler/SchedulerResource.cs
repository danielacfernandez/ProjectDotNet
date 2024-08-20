using ServiceTRAX.Models.DBModels.Scheduler;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Xml.Serialization;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class SchedulerResource 
    {
        private static XmlSerializer _xmlserializer = new XmlSerializer(typeof(SchedulerResourceSkillsArray));
        private static readonly string[] DefaultSkills = { "move", "lead", "driver", "install" };

        public SchedulerResource(HumanResource row)
        {
            Resource_ID = row.Resource_ID;
            ResourceName = row.ResourceName;
            MoveSkill = row.MoverLevel;
            DriverSkill = row.DriverLevel;
            LeadSkill = row.LeadLevel;
            InstallSkill = row.InstallerLevel;
            ResourceGroupName = row.ResourceGroupName;
            StartTime = row.StartTime;
            EndTime = row.EndTime;
            PrctAssigned = row.PrctAssigned;
            PrctAssignedColor = row.PrctAssignedColor;
            WeekToDateHs = row.WeekToDateHs;
            Past7DaysHs = row.Past7DaysHs;
            Past8DaysHs = row.Past8DaysHs;
            ResourceType = row.ResourceType;
            IsOnPTO = row.IsOnPTO;
            LocationLookupID = row.LocationLookupID;
            LocationName = row.LocationName;
            IsAssignedToSvcAcctJob = row.IsAssignedToSvcAcctJob;

        Skills = (_xmlserializer.Deserialize(new StringReader(row.Skills)) as SchedulerResourceSkillsArray)?.Skills ?? new SchedulerResourceSkills[0];
        }


        public long Resource_ID { get; set; }
        public string ResourceName { get; set; }
        public IEnumerable<SchedulerResourceSkills> Skills { get; set; }

        public int MoveSkill { get; set; }
        public int DriverSkill { get; set; }
        public int LeadSkill { get; set; }
        public int InstallSkill { get; set; }
        public string ResourceGroupName { get; set; }

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public double PrctAssigned { get; set; }
        public string PrctAssignedColor { get; set; }

        public double WeekToDateHs { get; set; }
        public double Past7DaysHs { get; set; }
        public double Past8DaysHs { get; set; }

        public string ResourceType { get; set; }
        public bool IsOnPTO { get; set; }

        public string APIResourceType { get; } = "HUMAN";

        public long LocationLookupID { get; set; }
        public string LocationName { get; set; }
        public bool IsAssignedToSvcAcctJob { get; private set; }
    }

}

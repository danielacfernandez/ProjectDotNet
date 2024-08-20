using System;
using System.Diagnostics.Contracts;
using System.Xml.Serialization;

namespace ServiceTRAX.Models.API.Scheduler
{
    [Serializable, XmlRoot("Skills")]
    public class SchedulerResourceSkillsArray
    {
        [XmlElement("Skill")]
        public SchedulerResourceSkills[] Skills { get; set; }
    }

    public class SchedulerResourceSkills
    {
        [XmlElement("SkillName")]
        public string Name { get; set; }
        [XmlElement("SkillLevel")]
        public int Level { get; set; }
        [XmlElement("SkillType")]
        public string Type { get; set; }
    }
}
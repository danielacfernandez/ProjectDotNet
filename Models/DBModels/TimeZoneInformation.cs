using System;

namespace ServiceTRAX.Models.DBModels
{
    public class TimeZoneInformation
    {
        public long OrganizationId { get; set; }
        public string TimeZoneName { get; set; }
        public string TimeZoneAbbreviation { get; set; }
    }

}

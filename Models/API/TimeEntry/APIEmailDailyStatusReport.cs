using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIEmailDailyStatusReportReportData
    {
        public long serviceid { get; set; }
        public DateTime statusdate { get; set; }
        public long workstationcount { get; set; }
        public long privateofficecount { get; set; }
        public long confroomcount { get; set; }
        public long ancillaryareacount { get; set; }
        public long seatingcount { get; set; }
        public long pctcomplete { get; set; }
        public string notestoday { get; set; }
        public string notestomorrow { get; set; }
        public string notesissue { get; set; }
        public string images { get; set; }
        public bool punchOrChange { get; set; }
        public bool cleanedAndCollected { get; set; }
        public bool checkWithClient { get; set; }
        public bool gearsAndToolsCollected { get; set; }
        public bool isPaperworkSignedOff { get; set; }
        public bool vendorBadgesOrKeysReturned { get; set; }
        public bool productReturnFormsCompleted { get; set; }
    }

    public class APIEmailDailyStatusReportRequestData
    {
        public long projectno { get; set; }
        public long requestno { get; set; }
        public long versionno { get; set; }
    }

    public class APIEmailDailyStatusReport
    {
        public string report { get; set; }
        public string request { get; set; }
        public IFormFile[] files { get; set; }
    }
}

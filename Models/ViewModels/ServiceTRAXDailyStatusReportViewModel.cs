using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXDailyStatusReportViewModel : ServiceTRAXPageViewModel
    {
        public string Date { get; internal set; }
        public string AcctMgr { get; internal set; }
        public string ServiceTraxNo { get; internal set; }
        public string ProjMng { get; internal set; }
        public string PoNo { get; internal set; }
        public string Request_Name { get; internal set; }
        public string InstallForeman { get; internal set; }
        public string ProjectName { get; internal set; }
        public string ProjectScope { get; internal set; }
        public long Workstations { get; internal set; }
        public long PrivateOffices { get; internal set; }
        public long ConfRooms { get; internal set; }
        public long AncillaryAreas { get; internal set; }
        public long Seating { get; internal set; }
        public long ProjectCompletionPctg { get; internal set; }
        public string InstallationCompletedToday { get; internal set; }
        public string InstallationScheduledForTotay { get; internal set; }
        public string ProductIssuesJobConcerns { get; internal set; }
        public string ProjectStreet { get; internal set; }
        public string ProjectCity { get; internal set; }
        public string ProjectState { get; internal set; }
        public string ProjectZip { get; internal set; }
        public bool IsSaved { get; set; }
        public IEnumerable<long> ImageIDs { get; internal set; }
        public bool? PunchOrChange { get; set; }
        public bool? CleanedAndCollected { get; set; }
        public bool? CheckWithClient { get; set; }
        public bool? GearsAndToolsCollected { get; set; }
        public bool? IsPaperworkSignedOff { get; set; }
        public bool? VendorBadgesOrKeysReturned { get; set; }
        public bool? ProductReturnFormsCompleted { get; set; }
    }
}

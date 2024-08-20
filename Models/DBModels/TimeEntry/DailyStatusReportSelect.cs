using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class DailyStatusReportSelect
    {
        public DateTime StatusDate { get; set; }
        public string REQNO { get; set; }
        public long PROJECTMGRID { get; set; }
        public string PROJMGRNAME { get; set; }
        public long SALESPERSONID { get; set; }
        public string SALESPERSONNAME { get; set; }
        public string PONUMBER { get; set; }
        public string LEADNAME { get; set; }
        public string PROJECTSCOPE { get; set; }
        public string JobLocationStreet { get; set; }
        public string JobLocationCity { get; set; }
        public string JobLocationState { get; set; }
        public string JobLocationZip { get; set; }
        public long WorkstationCount { get; set; }
        public long PrivateOfficeCount { get; set; }
        public long ConfRoomCount { get; set; }
        public long AncillaryAreaCount { get; set; }
        public long SeatingCount { get; set; }
        public long PctComplete { get; set; }
        public string NotesToday { get; set; }
        public string NotesTomorrow { get; set; }
        public string NotesIssue { get; set; }
        public string ProjectName { get; set; }
        public string Request_Name { get; set; }
        /// <summary>
        /// Indicates whether a report has been saved or not (saved if a record in [RequestDailyStatus] exists for this Request/Date)
        /// </summary>
        public bool IsSaved { get; set; }
        public bool? PunchOrChange { get; set; }
        public bool? CleanedAndCollected { get; set; }
        public bool? CheckWithClient { get; set; }
        public bool? GearsAndToolsCollected { get; set; }
        public bool? IsPaperworkSignedOff { get; set; }
        public bool? VendorBadgesOrKeysReturned { get; set; }
        public bool? ProductReturnFormsCompleted { get; set; }
/// <summary>
/// Comma separated string of RequestDailyStatusImage table id's
/// </summary>
public string Images { get; set; }

        public IEnumerable<long> ImageIDs
        {
            get
            {
                if (!string.IsNullOrEmpty(Images))
                {
                    var imgsIds = (Images.Split(new char[] { ',' })).Where(v => Int32.TryParse(v, out _)).Select(i => Int64.Parse(i));
                    return imgsIds;
                }
                return Enumerable.Empty<long>();
            }
        }
    }
}

using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIDayApprovePost
    {
        public long TimeSheetId { get; set; }
        public bool Approved { get; set; }
        public string RejectReason { get; set; }
    }
}

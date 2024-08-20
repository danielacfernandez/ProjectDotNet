using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.WidgetModels
{
    public class TimesheetSubmitApprovedStatus
    {
        public bool IsAllApproved { get; set; }
        public DateTime? Date { get; set; }
    }
}

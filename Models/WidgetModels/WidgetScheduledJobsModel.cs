using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.WidgetModels
{
    public class WidgetScheduledJobsModel
    {
        public string JobName { get; set; }
        public DateTime Date { get; set; }
        public DateTime OnSiteStartTime { get; set; }
        public string LeadName { get; set; }
        public string SRStatusName { get; set; }
        public long RequestId { get; set; }
    }
}

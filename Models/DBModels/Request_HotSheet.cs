using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Request_HotSheet
    {
        public long HotSheet_ID { get; set; }
        public string HotSheetDesc { get; set; }
        public string HotSheetFriendlyName { get; set; }
        public string StartTimes { get; set; }
        public long? RequestScheduleId { get; set; }
    }
}

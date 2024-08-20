using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.WidgetModels
{
    public class TimesheetSubmitStatusCount
    {
        public string TIMESHEETSTATUS { get; set; }
        public string SUNDAYDATE { get; set; }
        public long CNT { get; set; }
    }
}

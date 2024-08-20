using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class WidgetInfo
    {
        public int WidgetID { get; set; }
        public string WidgetName { get; set; }
        public string WidgetTitle { get; set; }
        public string WidgetWidth { get; set; }
        public string WidgetComponentName { get; set; }
        public bool IsActive { get; set; }
    }
}

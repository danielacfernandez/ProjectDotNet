using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXListHotSheetsViewModel : ServiceTRAXPageViewModel
    {
        public long RequestID { get; set; }
        public int UserID { get; internal set; }
        public long ProjectID { get; internal set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXSRListTEGViewModel : ServiceTRAXPageViewModel
    {
        public string SRStatus { get; set; }
        public string PageTitle { get; set; }
        public long UserID { get; set; }
        public string UserType { get; set; }
        public int? XDays { get; internal set; }
        public bool OnlyNotAssigned { get; internal set; }
        public int IncludePunchlist { get; internal set; } = 1;
    }
}

using ServiceTRAX.Models.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXPunchViewModel : ServiceTRAXGridViewModel
    {
        public long RequestID { get; set; }
        public long ProjectID { get; set; }
    }
}

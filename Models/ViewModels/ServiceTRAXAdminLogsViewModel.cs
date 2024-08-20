using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXAdminLogsViewModel : ServiceTRAXPageViewModel
    {
        public FileInfo[] Files { get; internal set; }
    }
}

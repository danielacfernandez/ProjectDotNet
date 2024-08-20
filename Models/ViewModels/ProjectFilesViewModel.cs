using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ProjectFilesViewModel : ServiceTRAXPageViewModel
    {
        public long ProjectID { get; set; }
        public long RequestID { get; internal set; }

        public long UserID { get; internal set; }
    }
}

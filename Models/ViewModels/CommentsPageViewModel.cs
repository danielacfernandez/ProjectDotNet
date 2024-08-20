using ServiceTRAX.Models.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class CommentsPageViewModel : ServiceTRAXPageViewModel
    {
        public long ProjectID { get; internal set; }
        public long ProjectNo { get; internal set; }
        public string ProjectName { get; internal set; }
        public long RequestID { get; internal set; }
    }
}

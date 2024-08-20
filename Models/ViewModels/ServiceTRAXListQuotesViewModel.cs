using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXListQuotesViewModel : ServiceTRAXPageViewModel
    {
        public int UserID { get; internal set; }
        public string QRStatus { get; internal set; }
        public string UserType { get; internal set; }
        public string PageTitle { get; internal set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXQRListTEGViewModel : ServiceTRAXPageViewModel
    {
        public string QRStatus { get; set; }
        public string UserType { get; set; }
        public string PageTitle { get; internal set; }
    }
}

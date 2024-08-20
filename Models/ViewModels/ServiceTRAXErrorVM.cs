using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXErrorVM : ServiceTRAXPageViewModel
    {
        public string ErrorTitle { get; set; }
        public string ErrorDescription { get; set; }
    }
}

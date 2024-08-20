using ServiceTRAX.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class UserProfileViewModel : ServiceTRAXPageViewModel
    {
        public ServiceTRAXUser User { get; set; }
        public IList<string> Roles { get; internal set; }
    }
}

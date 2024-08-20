using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class AspNetUsersMgmtViewModel : ServiceTRAXPageViewModel
    {
        public IEnumerable<AspNetRole> Roles { get; internal set; }
        public IEnumerable<UserOrganization> Organizations { get; internal set; }
        public IEnumerable<Lookup> ContactTypes { get; internal set; }

        public IEnumerable<object> OrganizationRoles { get; set; }

        public IEnumerable<LocalServiceProvider> LSPUsers { get; internal set; }

    }
}

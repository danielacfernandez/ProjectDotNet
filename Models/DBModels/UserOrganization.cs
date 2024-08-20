using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class UserOrganization
    {
        public long AspNetUsersOrganizations { get; set; }
        public int UserId { get; set; }
        public long OrganizationId { get; set; }
        public bool IsDefaultLocation { get; set; }
        public DateTime LastLoggedTime { get; set; }
        public DateTime CreateTime { get; set; }
        public int CreatedBy { get; set; }
        public bool IsActive { get; set; }
        public string OrganizationName { get; set; }
    }
}

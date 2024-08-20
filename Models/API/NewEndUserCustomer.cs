using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class NewEndUserCustomer
    {
        public int OrganizationID { get; set; }
        public string EndUserName { get; set; }
        public long BelongsToCustomerID { get; set; }
    }
}

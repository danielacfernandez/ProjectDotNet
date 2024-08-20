using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class NewCustomer
    {
        public long OrganizationID { get; set; }
        public string CustomerName { get; set; }
        public long CustomerTypeID { get; set; }
        public string CustomerTypeCode { get; set; }
    }
}

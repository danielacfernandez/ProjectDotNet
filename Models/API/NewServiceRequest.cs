using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class NewServiceRequest
    {
        public long OrganizationId { get; set; }
        public long RequestID { get; set; }
    }
}

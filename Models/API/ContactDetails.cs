using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class ContactDetails
    {
        public long contact_id { get; set; }
        public long organization_id { get; set; }
        public string contact_name { get; set; }
        public string phone_work { get; set; }
        public string phone_cell { get; set; }
        public string phone_home { get; set; }
        public string email { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class NewContact
    {
        public long organizationid { get; set; }
        public long customer_id { get; set; }
        public string name { get; set; }
        public string workphone { get; set; }
        public string cellphone { get; set; }
        public string homephone { get; set; }
        public string email { get; set; }
        public bool active { get; set; }
        public string contact_type { get; set; }
        public long? joblocationid { get; set; }
    }
}

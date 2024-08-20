using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class JobLocationContact
    {
        public long contact_id { get; set; }
        public string contact_name { get; set; }
        public string Contact_Phone { get; set; }
        public string Email { get; set; }
    }
}

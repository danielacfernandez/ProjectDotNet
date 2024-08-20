using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Request_Contact
    {
        public int Contact_ID { get; set; }
        public string Contact_Name { get; set; }
        public string Contact_Phone { get; set; }
        public string Email { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
namespace ServiceTRAX.Models.API
{
    public class APILSPUser
    {

        public long? lspId { get; set; }
        public string lspName { get; set; }
        public string address1 { get; set; }
        public string address2 { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string zip { get; set; }
        public string country { get; set; }
        public long createdBy { get; set; }
        public bool isActive { get; set; }
        public string phone { get; set; }
        
    }
}

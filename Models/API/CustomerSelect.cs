using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class CustomerSelect
    {
        public long customer_id { get; set; }
        public string customer_name { get; set; }
        public bool assigned { get; set; }
    }
}

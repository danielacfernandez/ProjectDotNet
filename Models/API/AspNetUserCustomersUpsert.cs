using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class AspNetUserCustomersUpsert
    {
        public long userid { get; set; } 
        public long customerid { get; set; } 
        public bool istoremove { get; set; }
    }
}

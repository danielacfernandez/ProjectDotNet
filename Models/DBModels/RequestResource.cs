using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class RequestResource
    {
        public int ResourceID { get; set; }
        public string ResourceName { get; set; }
        public bool HeaderOption { get; set; }
        public bool ScopeOption { get; set; }
    }
}

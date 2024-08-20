using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Resource
    {
        public long ResourceId { get; set; }
        public string ResourceName { get; set; }
        public long RoleId { get; set; }
    }
}

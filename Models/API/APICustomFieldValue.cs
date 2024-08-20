using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class APICustomFieldValue
    {
        public long? customColumnId { get; set; }
        public long? id { get; set; }
        public string name { get; set; }
        public long? order { get; set; }
    }
}

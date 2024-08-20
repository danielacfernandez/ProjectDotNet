using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class ServiceType
    {
        public long ServiceTypeID { get; set; }
        public string ServiceName { get; set; }
        public string ServiceCode { get; set; }
    }
}

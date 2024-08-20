using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class RequestQuotes
    {
        public string name { get; set; }
        public string estimate_id { get; set; }
        public string version { get; set; }
        public string sub_version { get; set; }
        public string updated_by { get; set; }
        public string updated_on { get; set; }
        public string sent { get; set; }
        public string organizationid { get; set; }
        public string requestid { get; set; }
    }
}

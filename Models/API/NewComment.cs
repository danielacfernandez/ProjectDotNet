using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class NewComment
    {
        public long projectid { get; set; }
        public long? requestid { get; set; }
        public long? quoteid { get; set; }
        public string comment { get; set; }
        public bool clientvisible { get; set; }
    }
}

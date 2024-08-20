using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class RequestDocumentToCopy
    {
        public long RequestDocToCopyID { get; set; }
        public long RequestIDSource { get; set; }
        public int RequestNoSource { get; set; }
        public int RequestVersionNoSource { get; set; }
        public long ProjectNoTarget { get; set; }
        public long RequestIDTarget { get; set; }
        public int RequestNoTarget { get; set; }
        public int RequestVersionNoTarget { get; set; }
        //public DateTime CreateTime { get; set; }
        //public long CreatedBy { get; set; }
        //public DateTime ModifyTime { get; set; }
        //public bool Copied { get; set; }
    }
}

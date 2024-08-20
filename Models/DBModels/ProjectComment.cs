using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class ProjectComment
    {
        public long? ProjectCommentID { get; set; }
        public long? ProjectID { get; set; }
        public long? RequestID { get; set; }
        public long? QuoteID { get; set; }
        public string Comment { get; set; }
        public bool ClientVisible { get; set; }
        public long CreatedBy { get; set; }
        public string CreatedByName { get; set; }
        public DateTime CreateTime { get; set; }
        public string UserPhoto { get; set; }
    }
}

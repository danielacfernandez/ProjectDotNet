using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class DocumentSignatureModel
    {
        public long Document_Signature_Id { get; set; }
        public string Document_Type { get; set; }
        public long Document_Id { get; set; }
        public string Delivered_By { get; set; }
        public string Received_By { get; set; }
        public DateTime Signed_Date { get; set; }
        public DateTime CreateTime { get; set; }
        public string CreatedBy { get; set; }
        public bool IsActive { get; set; }
    }
}

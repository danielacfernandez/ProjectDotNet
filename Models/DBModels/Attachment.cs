using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Attachment
    {
        public long request_document_id { get; set; }
        public string name { get; set; }
        public string filename { get; set; }
        public string created_by { get; set; }
        public DateTime? date_created { get; set; }
        public long? project_no { get; set; }
        public long? request_id { get; set; }
        public long? request_no { get; set; }
        public long? version_no { get; set; }

        public string Signature_DocumentType { get; set; }
        public long? Signature_OrigDocumentID { get; set; }
        public long? Signature_OrigDocumentOrganization { get; set; }
        public string Signature_DeliveredBy { get; set; }
        public long? Signature_DeliveredBy_UserId { get; set; }
        public DateTime? Signature_DeliveredBySignedDate { get; set; }
        public string Signature_ReceivedBy { get; set; }
        public DateTime? Signature_ReceivedBySignedDate { get; set; }
        public string Signature_ReceivedByEmail { get; set; }
        public DateTime? Signature_ReceivedByEmailSentDate { get; set; }
        public string Signature_ReceivedByEmailSentCode { get; set; }
    }
}

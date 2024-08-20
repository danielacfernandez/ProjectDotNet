using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class APIDocSignature
    {
        public long? Request_Document_Id { get; set; }
        public string DocumentType { get; set; }
        public long RequestId { get; set; }
        public long DocumentId { get; set; }
        public long OrganizationId { get; set; }
        public string DeliveredBy { get; set; }
        public long DeliveredBy_UserId { get; set; }
        public DateTime DeliveredBySignedDate { get; set; }
        public string ReceivedBy { get; set; }
        public DateTime? ReceivedBySignedDate { get; set; }
        public string Signature_ReceivedByEmail { get; set; }
        public DateTime? Signature_ReceivedByEmailSentDate { get; set; }
        public string Signature_ReceivedByEmailSentCode { get; set; }

    }
}

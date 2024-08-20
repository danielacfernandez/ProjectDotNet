using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class AnonymousSignatureViewModel
    {
        public bool CodeIsValid { get; set; }
        public string ErrorMessage { get; set; }
        public string AccessCode { get; internal set; }
        public long? DocId { get; internal set; }
        public string Signature_DeliveredBy { get; internal set; }
        public string Signature_DeliveredBySignedDate { get; internal set; }
        public string BaseURL { get; internal set; }
    }
}

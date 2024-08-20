using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class SignatureActionResult : DBActionResult
    {
        public Attachment Document { get; set; }
    }
}

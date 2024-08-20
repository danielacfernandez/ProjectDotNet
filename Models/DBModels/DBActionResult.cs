using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class DBActionResult
    {
        public bool Succeeded { get; set; }
        public string CodeResult { get; set; }
        public string ErrorMessage { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Account
{
    public class APIPasswordResetOutcome
    {
        public bool Succeded { get; set; }
        public string OutcomeDescription { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Account
{
    public class APIChangePassword
    {
        public string Current { get; set; }
        public string New { get; set; }
    }
}

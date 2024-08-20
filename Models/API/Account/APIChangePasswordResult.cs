using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Account
{
    public class APIChangePasswordResult
    {
        public bool Succeeded { get; set; } = false;
        public string Description { get; set; } = "Unknown";
    }
}

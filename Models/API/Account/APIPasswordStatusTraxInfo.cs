using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Account
{


    public class APIPasswordStatusTraxInfo
    {
        public string Username { get; set; }
        public string Password { get; set; }

        public string PasswordResetToken { get; set; }

        public bool IsValid()
        {
            return (Username != null && Password != null);
        }


    }
}

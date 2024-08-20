using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Account
{
    public class APINewUserStatusTraxInfo
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string Title { get; set; }
        public string SignOffPIN { get; set; }

        public bool ServiceTRAX { get; set; }

        public bool StatusTRAX { get; set; }

        public IEnumerable<long> Organizations { get; set; }
        public bool SMSEmails
        {
            get
            {
                // We are predicting a SMS email reader if the address is a 10 digit number before the @
                var receivesBySMS = Email != null && Email.IndexOf('@') == 10 && long.TryParse(Email.Substring(0, 9), out long _);
                return receivesBySMS;
            }
        }

    }
}
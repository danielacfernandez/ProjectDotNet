using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Account
{
    public class APINewUserInfoResourcesToCreate
    {
        public long OrganizationID { get; set; }
        public long RoleID { get; set; }
    }


    public class APINewUserInfo
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public IEnumerable<long> Roles { get; set; }
        public IEnumerable<long> Organizations { get; set; }
        public IEnumerable<long> Customers { get; set; }

        public string ContactType { get; set; }
        public long DefaultUserOrganization { get; set; }

        public string Title { get; set; }
        public string SignOffPIN { get; set; }
        public IEnumerable<APINewUserInfoResourcesToCreate> ResourcesToCreate { get; set; }

        public bool StatusTRAX { get; set; }
        public bool ServiceTRAX { get; set; }

        public bool LSPUser { get; set; }

        public bool PrimaryContact { get; set; }

        public IEnumerable<long> LspUsersSelected { get; set; }

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
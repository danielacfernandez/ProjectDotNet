using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Request
{
    public class APIServiceDate
    {
        public long RequestID { get; set; }
        public DateTime SERVICEDATE { get; set; }
        public bool? ISAPPROVED { get; set; }
        /// <summary>
        /// What the API call is intended to do (use this with the User Permissions to grant/deny access to the Action)
        /// </summary>
        public string Action { get; set; }
    }
}

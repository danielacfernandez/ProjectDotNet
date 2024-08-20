using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class AspNetUserToken_Data
    {
        public long UserID { get; set; }
        public string Username { get; set; }
        public string Token { get; set; }
    }
}

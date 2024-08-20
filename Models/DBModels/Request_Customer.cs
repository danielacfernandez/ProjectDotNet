using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Request_Customer
    {
        public int Customer_Id { get; set; }
        public string Customer_Name { get; set; }
        public bool IsProspect { get; set; }
    }
}

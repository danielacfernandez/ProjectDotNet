using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class SalesPerson
    {
        public int SalespersonID { get; set; }
        public string SalespersonName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Billing
{
    public class APIADPExpenses
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string BatchID { get; set; }
        public string CompanyCode { get; set; }
    }
}

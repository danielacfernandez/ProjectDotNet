using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class PayrollViewModel : ServiceTRAXPageViewModel
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string BatchID { get; set; }
        public List<string> PayrollCompanies { get; set; }
        public string PayrollCompany { get; set; }
    }
}

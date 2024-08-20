using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ADPExpenseReportViewModel : ServiceTRAXPageViewModel
    {
        public IEnumerable<Organization> Companies { get; set; }
    }
}

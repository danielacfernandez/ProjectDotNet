using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class ADPExpenseReportResult
    {
        public string CompanyCode { get; set; }
        public string BatchID { get; set; }
        public string FileNo { get; set; }
        public string AdjustDEDCode { get; set; }
        public string AdjustDEDAmount { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class PayRollData
    {
        public string CoCode { get; set; }
        public string Batch { get; set; }
        public string ExtEmployeeID { get; set; }
        public float RegHours { get; set; }
        public float OTHours { get; set; }
        public string TempCost { get; set; }
        public string RateCode { get; set; }
        public string Hours3Code { get; set; }
        public float Hours3Amount { get; set; }
        public string RegEarnings { get; set; }
        public string OTEarnings { get; set; }
        public string Earnings3Code { get; set; }
        public string Earnings3Amount { get; set; }
        public string AdjustDEDCode { get; set; }
        public string AdjustDEDAmount { get; set; }
        public string CancelPay { get; set; }
        public string PayNo { get; set; }

    }

    public class PayRollAPI
    {
        public string PayrollCompany { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? StartDate { get; set; }
        public string BatchID { get; set; }
    }
}

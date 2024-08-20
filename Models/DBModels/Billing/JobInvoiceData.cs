using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Billing
{
    public class JobInvoiceData
    {
        public long Invoice_id { get; set; }
        public long Job_id { get; set; }
        public long Job_no { get; set; }
        public long Organization_id { get; set; }
        public string Invoice_type_name { get; set; }
        public string Billing_type_name { get; set; }
        public string Po_no { get; set; }
        public string Assigned_to_user { get; set; }
        public string Description { get; set; }
        public string Customer_name { get; set; }
        public string Invoice_status { get; set; }
        public string Invoice_statuscode { get; set; }
        public long Invoice_statusid { get; set; }
        public long? Billing_type_id { get; set; }
        public bool CanChangeBillingType { get; set; }
        public DateTime? End_Date { get; set; }
        public string BillingPeriod { get; set; }
        public bool AddAdminFee { get; set; }   
        public bool AddFuelSurcharge { get; set; }  
        public double FuelSurchargeRate { get; set; }
        public double FuelSurchargeTotal { get; set; }
        public int NumberOfOpenPOs { get; set; }
    }
}

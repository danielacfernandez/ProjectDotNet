using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class ExpenseRow
    {
        public long tc_job_no { get; set; }
        public long tc_service_no { get; set; }
        public long tc_service_line_no { get; set; }
        public long tc_job_id { get; set; }
        public long tc_service_id { get; set; }
        public long service_line_id { get; set; }
        public DateTime service_line_date { get; set; }
        public string service_description { get; set; }
        public string resource_name { get; set; }
        public string item_name { get; set; }
        public long ext_pay_code { get; set; }
        public string item_type_code { get; set; }
        public decimal payroll_qty { get; set; }
        public decimal payroll_rate { get; set; }
        public decimal payroll_total { get; set; }
        public decimal expense_qty { get; set; }
        public decimal expense_rate { get; set; }
        public decimal expense_total { get; set; }
        public decimal bill_exp_rate { get; set; }
        public decimal tc_qty { get; set; }
        public decimal tc_rate { get; set; }
        public decimal tc_total { get; set; }

    }
}

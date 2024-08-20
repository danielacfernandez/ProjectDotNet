using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Request_Data
    {
        public long project_id { get; set; }
        public long request_id { get; set; }
        public int request_no { get; set; }
        public long? project_type_id { get; set; }
        public int version_no { get; set; }
        public long project_no { get; set; }
        public long? jobid { get; set; }
        public long request_status_id { get; set; }
        //public long? job_type { get; set; }
        public string Quote_Number { get; set; }
        public int? Project_Manager_Id { get; set; }
        public int? SchedulerPMContactID { get; set; }
        public long? customer_id { get; set; }
        public string project_name { get; set; }
        public string Request_Name { get; set; }
        public long schedule_type_id { get; set; }
        public char? schedule_with_client_flag { get; set; }
        public char? include_weekends_flag { get; set; } = 'N';
        public char? include_holidays_flag { get; set; }
        public long? work_type_lookup_id { get; set; }
        public DateTime? est_start_date { get; set; }
        public DateTime? est_end_date { get; set; }
        public int? days_to_complete { get; set; }
        public long? end_user_id { get; set; }
        public long? job_location_id { get; set; }
        public long job_location_contact_id { get; set; }
        public long? quote_type_id { get; set; }
        public char? taxable_flag { get; set; }
        public long? customer_costing_type_id { get; set; }
        public long? quote_or_order_type_id { get; set; }
        public char? req_specific_loc_conditions_flag { get; set; }
        public string dock_available_time { get; set; }
        public char? stair_carry_req { get; set; }
        public string stair_carry_addl_info { get; set; }
        public char? badge_access_required { get; set; }
        public long security_type_id { get; set; }
        public long? bldg_mgr_contact_id { get; set; }
        /// <summary>
        /// Salesperson
        /// </summary>
        public int? a_m_sales_contact_id { get; set; }
        /// <summary>
        /// This fields is mapped to UI Work Request
        /// </summary>
        public string description { get; set; }
        /// <summary>
        /// This fields is mapped to UI Work Request (internal)
        /// </summary>
        public string other_conditions { get; set; }

        public string record_type_code { get; set; }
        public bool within_srstart_lockperiod { get; set; }
        public long srstart_lockperiod_days { get; set; }
        public bool IsSendToSchedule { get; set; }
        public string dealer_po_no { get; set; }
        public long dealer_po_line_no { get; set; }
        public bool ispunchlist { get; set; }
        public long quoteid { get; set; }
        public char? bring_ppe { get; set; }

        public string CreatedByName { get; set; }
        public DateTime? CreateTime { get; set; }
        public string ModifiedByName { get; set; }
        public DateTime? ModifyTime { get; set; }
        public bool IsActiveSR { get; set; } = true;
        public string ExternalHeaderNumber { get; set; }
        public bool? IsInternalRequest { get; set; }
        public bool CanReOpen { get; set; } = false;
        
        /// <summary>
        /// Organization Location assigned to this SR
        /// </summary>
        public long? LocationLookupId { get; set; }

        public bool AddAdminFee { get; set; }
        public bool AddFuelSurcharge { get; set; }
        public double AdminFeeRate { get; set; }

        public double FuelSurchargeRate { get; set; }

        public int lspId { get; set; }

        public int organization_id { get; set; }

        public bool? conditionalLW { get; set; }
        public bool? unconditionalLW { get; set; }  
        
        public long serviceid { get; set; }
        public int TimeZoneOffset { get; set; }
        public bool ShowQRLink{ get; set; }
        public bool ShowSRLink { get; set; }
        public bool ShowQuoteLink { get; set; }
        public bool ShowOperationalPlanLink { get; set; }
        public int QRRequestId { get; set; }
        public int SRRequestId { get; set; }
        public int QuoteIdForLink { get; set; }

    }
}

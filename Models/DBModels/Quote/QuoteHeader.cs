using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class QuoteHeader
    {
        public long QuoteID { get; set; }
        public int Version_No { get; set; }
        public string EndUserName { get; set; }
        public string EstimatedServiceDate { get; set; }
        public long Project_No { get; set; }
        public int Request_No { get; set; }
        public long Project_ID { get; set; }
        public string Description { get; set; }
        public string Other_Conditions { get; set; }
        public float RegularHoursPercentage { get; set; }
        public List<QuoteContact> Contacts { get; set; }
        public int ATTNContact { get; set; }
        public bool IsActiveVersion { get; set; }
        public string ProjectManagerName { get; set; }
        public string AttachmentStorage { get; set; }
        public string ProjectName { get; set; }
        public string CustomerName { get; set; }
        public string JobLocationAddress { get; set; }
        public string JobLocationContactName { get; set; }
        public DateTime QRDate { get; set; }
        public bool EmailTestNotifyActive { get; set; }
        public string EmailTestNotifyAddress { get; set; }
        public long REQUEST_ID { get; set; }
        public string Comments { get; set; }
        public bool IsOpPlanEditable { get; set; }
        public bool IsSent { get; set; }

        public string CreatedByName { get; set; }
        public DateTime? CreateTime { get; set; }
        public string ModifiedByName { get; set; }
        public DateTime? ModifyTime { get; set; }
        public bool CanSetReadyToSchedule { get; set; } = false;
        public long? ServiceRequestID { get; set; }
        public string MissingLocationInSR { get; set; }
        public string HDSQuoteNo { get; set; }
        public bool AddAdminFee { get; set; }
        public bool AddFuelSrucharge { get; set; }

        public string ProjectManagerEmail { get; set; }
        public bool IsRequestLSP { get; set; }

        public double LSPPMMarkup { get; set; }
        public long QuoteOrganizationId { get; set; }

        public bool UseLSPRole { get; set; }
        public bool ShowQRLink { get; set; }
        public bool ShowSRLink { get; set; }
        public int QRRequestId { get; set; }
        public int SRRequestId { get; set; }

    }
}

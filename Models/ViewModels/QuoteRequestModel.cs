using ServiceTRAX.Models.API;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.Scheduler;
using System;
using System.Collections.Generic;
using System.Diagnostics.Eventing.Reader;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class QuoteRequestModel : ServiceTRAXPageViewModel
    {
        /// <summary>
        /// Tells wheter the request is new or is edition
        /// </summary>
        public bool IsNew { get; set; }
        public IEnumerable<ServiceType> ServiceTypes { get; set; }
        public IEnumerable<SalesPerson> Salespersons { get; internal set; }
        public IEnumerable<SystemFurniture> SystemsFurniture { get; internal set; }
        public IEnumerable<Lookup> ShippingMethod { get; internal set; }
        
        public Request_Data Request_Data { get; internal set; }
        public IEnumerable<int> RequestContacts { get; internal set; }
        public IEnumerable<Request_Contact> AllContacts { get; internal set; }
        public IEnumerable<Project_Manager> ProjectManagers { get; internal set; }
        public IEnumerable<Request_Customer> AllCustomers { get; internal set; }
        public IEnumerable<RequestProduct> RequestProduct { get; internal set; }
        public IEnumerable<RequestProduct> RequestProductOther { get; internal set; }
        public IEnumerable<Lookup> CustomerTypes { get; internal set; }
        public IEnumerable<Attachment> Attachments { get; internal set; }
        public IEnumerable<Lookup> ElevatorTypes { get; internal set; }
        public IEnumerable<Lookup> BillingTypes { get; internal set; }
        public IEnumerable<Lookup> ScheduleTypes { get; internal set; }
        public IEnumerable<Lookup> WorkTypes { get; internal set; }
        public IEnumerable<EndUser> EndUsers { get; internal set; }
        public IEnumerable<JobLocation> JobLocations { get; internal set; }
        public IEnumerable<Lookup> CustomerCostings { get; internal set; }
        public IEnumerable<Lookup> SecurityAccessKinds { get; internal set; }
        public IEnumerable<Lookup> MultiLevelTypes { get; internal set; }
        public IEnumerable<RequestResource> Resources { get; internal set; }
        public IEnumerable<RequestCustomField> CustomFields { get; internal set; }
        public IEnumerable<Request_HotSheet> HotSheets { get; internal set; }
        public string QuoteRequestStatus { get; internal set; }
        public bool IsReadOnly { get; internal set; }
        public bool IsSR { get; internal set; }
        public bool CanSave { get; internal set; }
        public bool CanSend { get; internal set; }
        public bool CanApprove { get; internal set; }
        public bool CanCancel { get; internal set; }
        public bool CanQuote { get; internal set; }
        public bool CanOpenQR { get; internal set; }
        public bool ShowStartDateWarning { get; internal set; }

        /// <summary>
        /// All Location Contacts for a Location
        /// </summary>
        public IEnumerable<Request_Contact> LocationContacts { get; internal set; }
        /// <summary>
        /// Location Contacts for the Request
        /// </summary>
        public IEnumerable<int> RequestLocationContacts { get; internal set; }
        public bool IsAdditionalRequest { get; internal set; }
        public IEnumerable<Request_Contact> AllCustomerContacts { get; internal set; }

        /// <summary>
        /// This is True when the customer type is prospect --> the customer should be created/sync from GP
        /// </summary>
        public bool NeedsCustomer { get; internal set; }
        public bool CanSoftSchedule { get; internal set; }
        public bool CanHardSchedule { get; internal set; }
        public bool CanSeeSurcharge { get; internal set; }
        public QuoteEstimatorData QuoteEstimatorData { get; internal set; }
        public bool CanCreateNewQRVersion { get; set; }
        public bool IsMACServiceRequest { get; internal set; }
        public bool CommentsCanReadAdd { get; internal set; }
        public bool RequiresServiceDateApproval { get; internal set; }
        public bool RequiresReScheduleApproval { get; internal set; }
        public bool IsReadyToSchedule { get; internal set; }
        public bool IsHardScheduled { get; internal set; }
        public bool ReadOnlyServiceDate { get; internal set; }
        public bool ReadOnlyLSP { get; internal set; }
        public bool CanCreateNewSRVersion { get; internal set; }
        public bool CanReschedule { get; internal set; }
        public bool CanCloseSR { get; internal set; }
        public bool CanCancelSR { get; internal set; }
        public bool ReadonlyDueFiveDaysLimit { get; internal set; }
        public object ProspectCustomerFormEmail { get; internal set; }
        public bool ReadonlyDueServiceStartDateLockPeriod { get; internal set; }
        public long ServiceStartDateLockPeriod { get; internal set; }
        public IEnumerable<Lookup> CustomerCostingTypes { get; internal set; }
        public IEnumerable<Lookup> QuoteOrOrderTypes { get; internal set; }
        public bool CanSaveSRMissingFieldsOnSoftSchedule { get; internal set; }
        public string CurrentUserFullName { get; internal set; }
        public IEnumerable<OrganizationLocation> OrganizationLocations { get; internal set; }
        public string OrganizationLocationControl { get; internal set; }

        public IEnumerable<LocalServiceProvider> LocalServiceProviders { get; set; }

        public long CurrentUserID { get; internal set; }
        public bool IsDSRAvailable { get; internal set; }
        public bool IsLSPUser { get; internal set; }
        public int timeZoneOffset { get; set; }

    }
}

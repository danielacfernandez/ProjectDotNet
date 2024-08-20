using ServiceTRAX.Models.API.Scheduler;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.DBModels.Scheduler;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class DailySchedulerFiltersModel
    {
        public IEnumerable<long> customer { get; set; }
        public bool? showOnlyEmptyResources { get; set; }
        public string showJobsOnStatus { get; set; }
        public string lineTypes { get; set; }

    }



    public class DailySchedulerModel : ServiceTRAXPageViewModel
    {
        public long ProjectID { get; internal set; }
        public DateTime? Date { get; internal set; }
        //public IEnumerable<SchedulerResource> HumanResources { get; internal set; }
        //public IEnumerable<VehicleResource> VehicleResources { get; internal set; }
        public IEnumerable<Project_Manager> ProjectManagers { get; internal set; }
        public IEnumerable<Lookup> CallOutOptions { get; internal set; }
        public bool ReadOnlyView { get; internal set; }
        public DailySchedulerFiltersModel JobFiltersValues { get; internal set; }
        public string SchedulerClientID { get; internal set; }
        public bool IsMobileView { get; internal set; }
        public IEnumerable<OrganizationLocation> OrganizationLocations { get; internal set; }
        public bool CanSeeExceptions { get; internal set; }
    }
}

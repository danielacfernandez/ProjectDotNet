using ServiceTRAX.Models.API.Scheduler;
using ServiceTRAX.Models.DBModels.Scheduler;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{

    public class MonthlySchedulerWeekModel
    {
        public int WeekNbr { get; set; }
        public int YearWeekNbr { get; set; }
        public double TotalHoursForWeek { get; set; }
        public IEnumerable<MonthlySchedulerDayHeadersModel> WeekDays { get; set; }
    }


    public class MonthlySchedulerDayHeadersModel
    {
        public DateTime Date { get; set; }
        public string Color { get; set; }
    }

    public class MonthlySchedulerModel : ServiceTRAXPageViewModel
    {
        public DateTime? Date { get; set; }
        public Dictionary<DateTime, Dictionary<string, SchedulerManpowerMonhtly>> DaysMatrix { get; internal set; }
        public IEnumerable<string> RoleHeaders { get; internal set; }
        public IEnumerable<MonthlySchedulerWeekModel> Weeks { get; set; }
        public IEnumerable<OrganizationLocation> OrganizationLocations { get; internal set; }
        public long? ResourceLocationId { get; internal set; }
        public bool UserCanSeeDetails { get; internal set; }
        public APIMonthlySchedulerRanges OccupancyColorRanges { get; internal set; }
    }
}

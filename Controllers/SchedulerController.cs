using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.API;
using ServiceTRAX.Models.API.Scheduler;
using ServiceTRAX.Models.DBModels.Scheduler;
using ServiceTRAX.Models.ViewModels;
using ServiceTRAX.Utils;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class SchedulerController : Controller
    {
        private readonly ServiceTRAXData _data;
        private readonly ILogger<RequestController> _logger;
        private readonly EmailSender _email;

        public SchedulerController(ServiceTRAXData data, ILogger<RequestController> logger, EmailSender es)
        {
            _data = data;
            _logger = logger;
            _email = es;
        }


        [HasPermission(Permissions.SchedulerDayRead)]
        public async Task<IActionResult> Daily(int OrganizationID, DateTime? Date, bool? OnlyMissRes, string JobStatus, string LineTypes, bool IsMobileView = false)
        {
            var vm = new DailySchedulerModel
            {
                OrganizationID = OrganizationID,
                SchedulerClientID = Guid.NewGuid().ToString("N"),
                ProjectManagers = await _data.Project_Manager_Select(OrganizationID),
                CallOutOptions = await _data.CallOut_Lookup_Select(),
                Date = Date,
                ReadOnlyView = !User.UserHasThisPermission(Permissions.SchedulerDayResourceUpdateAssign) || IsMobileView,
                CanSeeExceptions = User.UserHasThisPermission(Permissions.SchedulerDayCanSeeExceptions),
                IsMobileView = IsMobileView,
                OrganizationLocations = await GetOrganizationLocations(),
                JobFiltersValues = new DailySchedulerFiltersModel
                {
                    customer = Enumerable.Empty<long>(), // CustID?.Split('|', StringSplitOptions.RemoveEmptyEntries).Select(v => long.Parse(v)) ?? Enumerable.Empty<long>(),
                    showOnlyEmptyResources = OnlyMissRes ?? false,
                    showJobsOnStatus = JobStatus,
                    lineTypes = LineTypes
                }
            };

            return View(vm);

            //
            // Local functions
            //
            async Task<IEnumerable<OrganizationLocation>> GetOrganizationLocations()
            {
                var orgLocations = new List<OrganizationLocation> { new OrganizationLocation { LocationID = null, LocationName = "-- All Locations --" } };
                orgLocations.AddRange(await _data.Resource_Location_Select(OrganizationID));
                return orgLocations;
            }
        }



        public async Task<IActionResult> Monthly(int OrganizationID, DateTime? Date)
        {
            if (User.UserHasAnyPermission(new Permissions[] { Permissions.SchedulerMonthlyReadDetails, Permissions.SchedulerMonthlyReadSummary }))
            {
                return await FullDetails(OrganizationID, Date);
            }

            return new ForbidResult();
        }


        [HasPermission(Permissions.SchedulerResourcesGeneralGrids)]
        public IActionResult WeekDayResources(int OrganizationID)
        {
            return View(new ServiceTRAXPageViewModel { OrganizationID = OrganizationID });
        }

        [HasPermission(Permissions.SchedulerResourcesGeneralGrids)]
        public IActionResult PerDateResources(int OrganizationID)
        {
            return View(new PerDateResourcesViewModel { OrganizationID = OrganizationID });
        }


        private async Task<IActionResult> FullDetails(int OrganizationID, DateTime? Date)
        {
            long? ResourceLocationId = await TryGetUserSelectedLocation();

            // Get the full days information
            var days = (await _data.Scheduler_Manpower_Monthly(OrganizationID, Date.HasValue ? Date.Value.ToUniversalTime() : Date, ResourceLocationId)).ToArray();

            //var days = await _data.Scheduler_Manpower_Monthly(OrganizationID, Date.Value.Month, Date.Value.Year);

            // Create a Group of week by WeekNbr (week number) - Include the Days of the week in the WeekDays property
            var weeks = days.GroupBy(d => d.WeekNbr).Select(w => new MonthlySchedulerWeekModel
            {
                WeekNbr = w.Key,
                YearWeekNbr = w.First().YearWeekNbr,
                TotalHoursForWeek = User.UserHasThisPermission(Permissions.SchedulerMonthlyReadDetails) ? w.First().TotalHoursForWeek : 0,
                WeekDays = w.OrderBy(d => d.Date).GroupBy(g => g.Date).Select(g => new MonthlySchedulerDayHeadersModel { Date = g.Key, Color = g.First().DateColor.ToUpper() })
            }).OrderBy(w => w.WeekNbr);

            IEnumerable<string> RoleHeaders = Enumerable.Empty<string>();
            Dictionary<DateTime, Dictionary<string, SchedulerManpowerMonhtly>> DateRoleLookupMatrix;

            // If the user does not have permissions for seeing the details then just return here
            if (!User.UserHasThisPermission(Permissions.SchedulerMonthlyReadDetails))
            {
                RoleHeaders = Enumerable.Empty<string>();
                DateRoleLookupMatrix = null;
            }
            else
            {
                // Get a list of the roles in the days (it's assumed that data has all roles defined for all days)
                RoleHeaders = days.OrderBy(r => r.RolOrder).Select(d => d.RoleName.ToLower()).Distinct();

                // Create a dictionary of the dates/roles (for easy lookup on the Javascript side)
                // The Dictionary has two levels: 1-Date 2-Role
                DateRoleLookupMatrix = new Dictionary<DateTime, Dictionary<string, SchedulerManpowerMonhtly>>();

                foreach (var day in days)
                {
                    // If the Date key is not defined create it and also create the inner Role dictionary entry
                    if (!DateRoleLookupMatrix.ContainsKey(day.Date))
                    {
                        var innerEntry = new Dictionary<string, SchedulerManpowerMonhtly>();
                        innerEntry.Add(day.RoleName.ToLower(), day);
                        DateRoleLookupMatrix.Add(day.Date, innerEntry);
                    }
                    else
                    {
                        // If the Date key already existed then check if the Role was already added to the Dictionary
                        if (!DateRoleLookupMatrix[day.Date].ContainsKey(day.RoleName))
                        {
                            var innerEntry = new Dictionary<string, SchedulerManpowerMonhtly>();
                            innerEntry.Add(day.RoleName.ToLower(), day);
                            DateRoleLookupMatrix[day.Date].Add(day.RoleName.ToLower(), day);
                        }
                        else
                        {
                            // If we get here then there is duplicated Date/Role data
                            throw new Exception("Data Problem - Duplicated entry");
                        }
                    }
                }

            }

            // Get the different Locations for this organization
            var OrganizationLocations = await _data.Resource_Location_Select(OrganizationID);

            var vm = new MonthlySchedulerModel
            {
                Date = Date,
                OrganizationID = OrganizationID,
                Weeks = weeks,
                RoleHeaders = RoleHeaders,
                DaysMatrix = DateRoleLookupMatrix,
                OrganizationLocations = OrganizationLocations.Prepend(new OrganizationLocation { LocationID = null, LocationName = "ALL LOCATIONS" }),
                ResourceLocationId = ResourceLocationId,
                UserCanSeeDetails = User.UserHasThisPermission(Permissions.SchedulerMonthlyReadDetails),
                OccupancyColorRanges = await _data.Scheduler_MonthlyColorRanges(OrganizationID)
            };

            return View(vm);


            //
            // Local functions
            //
            async Task<long?> TryGetUserSelectedLocation()
            {
                var settings = await _data.ConfigUser_Select($"SCHEDULER_MONTHLY_ORG_{OrganizationID}", User.GetUserID());
                if (!string.IsNullOrEmpty(settings?.ConfigValue))
                {
                    try
                    {
                        var userOrganizationLocation = JsonConvert.DeserializeObject<MonthlySchedulerConfig>(settings.ConfigValue);
                        return userOrganizationLocation.SelectedLocation;
                    }
                    catch
                    {
                        return null;
                    }
                }
                return null;
            }

        }
    }



}
﻿using ServiceTRAX.Models.DBModels.Scheduler;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.Scheduler
{
    public class APISchedulerDaySvcAcctPTO
    {
        public string RequestScheduleId { get; set; }
        public string Job_No { get; set; }
        public string Job_Name { get; set; }
        public string Request_Name { get; set; }
        public DateTime Date { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfDays { get; set; }
        public DateTime WSEStartTime { get; set; }
        public DateTime FieldStartTime { get; set; }
        public long ProjectManagerId { get; set; }
        public string ProjectManagerName { get; set; }
        public long LeadEmployeeId { get; set; }
        public string LeadEmployeeName { get; set; }
        public int HoursPerShift { get; set; }
        public string Notes { get; set; }
        public bool IsHardScheduled { get; set; }
        public int TotalHours { get; set; }
        public int HumanResourcesRequired { get; set; }
        public int VehicleResourcesRequired { get; set; }
        public string JobLocationStreet { get; set; }
        public string JobLocationCity { get; set; }
        public string JobLocationState { get; set; }
        public string JobLocationZip { get; set; }
        public IEnumerable<SchedulerDayPTOSvcAcctCrew> Crew { get; set; }
        public IEnumerable<SchedulerDayPTOSvcAcctCrew> Lead { get; set; }

        public string SRNumber { get; set; }

        public string Address
        {
            get
            {
                string[] addressArray = { JobLocationStreet, JobLocationCity, JobLocationState, JobLocationZip };
                return string.Join(", ", addressArray.Where(s => !string.IsNullOrEmpty(s)));
            }
        }

        public bool IsEditable { get; set; }
        public string LineType { get; set; }

        public long customer_id { get; set; }
        public string customer_name { get; set; }
        public string end_user_name { get; set; }
        public string pono { get; set; }
        public long SRLocationId { get; set; }
    }
}

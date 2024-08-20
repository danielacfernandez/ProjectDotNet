using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.HotSheet
{
    public class HotSheetDateData
    {
        public long? RequestScheduleId { get; set; }
        public int JobLength { get; set; }
        public DateTime? OnSiteStartTime { get; set; }
        public DateTime? WarehouseStartTime { get; set; }
        public int LeadQty { get; set; }
        public int DriverQty { get; set; }
        public int InstallerQty { get; set; }
        public int MoverQty { get; set; }

        /// <summary>
        /// Display value for Hotsheets 
        /// </summary>
        public string RequestScheduleDisplayValue
        {
            get
            {
                return $"Start Time - Whse {WarehouseStartTime?.ToString("t") ?? "N/D"} - On Site {OnSiteStartTime?.ToString("t") ?? "N/D" }";
            }
        }

    }
}

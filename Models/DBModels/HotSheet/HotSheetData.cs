using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class HotSheetData : ServiceTRAXPageViewModel
    {
        public int? HotSheetID { get; set; }
        public long RequestID { get; set; }
        public string JobName { get; set; }
        public string CustomerName { get; set; }
        public long EndUserID { get; set; }
        public string EndUserName { get; set; }
        public string SalesContact { get; set; }
        public string PONo { get; set; }
        public long JobLocationID { get; set; }
        public long OrigLocationID { get; set; }
        public long ContactID { get; set; }
        public string Description { get; set; }
        public long? OrigContactID { get; set; }
        public DateTime? WorkDate { get; set; }
    }
}

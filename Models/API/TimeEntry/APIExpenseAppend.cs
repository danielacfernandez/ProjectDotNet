using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIExpenseAppend
    {
        public DateTime Date { get; set; }
        public long JobId { get; set; }
        public long ResourcesId { get; set; }
        public long serviceId { get; set; }
        public long WorkCodeId { get; set; }
        public double QtyHours { get; set; }
        //public long PayCodeId { get; set; }
        public double ItemCost { get; set; }
        public double BillRate { get; set; }
    }
}

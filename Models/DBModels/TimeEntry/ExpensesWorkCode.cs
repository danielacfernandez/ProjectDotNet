using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.TimeEntry
{
    public class ExpensesWorkCode
    {
        public long ItemId { get; set; }
        public string ItemName { get; set; }
        public decimal ItemCost { get; set; }
        public decimal ItemRate { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.Quote
{
    public class EmailContact
    {
        public long ID { get; set; }
        public string ContactName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string ContactTypeID { get; set; }
        /// <summary>
        /// Lookup code for the contact type
        /// </summary>
        public string ContactTypeCode { get; set; }


        public bool DailySchedulerJobEmailRecipient { get; set; } = false;
        public bool DailySchedulerJobEmailDefaultRecipient { get; set; } = false;
    }
}

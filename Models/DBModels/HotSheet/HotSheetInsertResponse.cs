using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.HotSheet
{
    public class HotSheetInsertResponse
    {
        public string Hotsheet_Identifier { get; set; }
        public DateTime? DateCreated { get; set; }
        public string CreatedBy { get; set; }
        public long? HotSheetID { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.HotSheet
{
    public class HotSheetContact
    {
        public long HotSheetId { get; set; }
        public long ContactId { get; set; }
        public string HSContactTypeCode { get; set; }
    }
}

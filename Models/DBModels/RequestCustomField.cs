using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class RequestCustomField
    {
        public long CustomFieldID { get; set; }
        public string CustomFieldName { get; set; }
        public string CustomFieldValue { get; set; }
        public string IsDropList { get; set; }
        public string IsMandatory { get; set; }
        public List<CustomFieldDrop> DropListOptions { get; set; }
        public long? CustomCustColId { get; set; }
    }
}

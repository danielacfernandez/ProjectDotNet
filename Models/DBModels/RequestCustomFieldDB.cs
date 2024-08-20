using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class RequestCustomFieldDB
    {
        public long CustomFieldID { get; set; }
        public string CustomFieldName { get; set; }
        public string CustomFieldValue { get; set; }
        public int CustomFieldOrder { get; set; }
        public string IsDropList { get; set; }
        public string IsMandatory { get; set; }
        public string DropListOptions { get; set; }
        public string DropListOptionId { get; set; }
        public int OptionsOrder { get; set; }
        public long? Custom_Cust_Col_Id { get; set; }
    }

}

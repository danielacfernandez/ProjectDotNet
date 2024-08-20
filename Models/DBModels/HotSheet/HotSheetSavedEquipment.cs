using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.HotSheet
{
    public class HotSheetSavedEquipment
    {
        public int EquipmentID { get; set; }
        public int EquipmentIN { get; set; }
        public int EquipmentOUT { get; set; }
        public string EquipmentName { get; set; }
    }
}

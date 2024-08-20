using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels.HotSheet
{
    public class HotSheetAPIData
    {
        public long requestID { get; set; }
        public long origLocationID { get; set; }
        public long? origContactID { get; set; }
        public long jobLocationID { get; set; }
        public long? contactID { get; set; }
        public DateTime? workDate { get; set; }
        public IEnumerable<HotSheetSavedEquipment> savedEquipment { get; set; }
        public IEnumerable<HotSheetSavedVehicle> savedVehicle { get; set; }
        public string specialInstructions { get; set; }
        public DateTime? WarehouseStartTime { get; set; }
        public DateTime? OnSiteStartTime { get; set; }
        public int JobLength { get; set; }
        public int LeadQty { get; set; }
        public int DriverQty { get; set; }
        public int InstallerQty { get; set; }
        public int MoverQty { get; set; }
        public string Created_By { get; set; }
        public DateTime? Date_Created { get; set; }
        public string Modified_By { get; set; }
        public DateTime? Date_Modified { get; set; }
        public string Hotsheet_Identifier { get; set; }
        public string OriginContactName { get; set; }
        public string OriginContactPhone { get; set; }
        
        public IEnumerable<long> originContacts { get; set; }
        public IEnumerable<long> destinationContacts { get; set; }
        public long? RequestScheduleId { get; set; }
    }
}

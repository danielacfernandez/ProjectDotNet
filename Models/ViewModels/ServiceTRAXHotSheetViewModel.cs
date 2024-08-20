using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ServiceTRAX.Models.DBModels.HotSheet;
using ServiceTRAX.Models.DBModels;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXHotSheetViewModel : HotSheetData
    {
        public IEnumerable<HotSheetVehicle> Vehicles { get; set; }
        public IEnumerable<JobLocation> JobLocations { get; set; }
        public IEnumerable<Request_Contact> AllDestinationContacts { get; set; }
        public IEnumerable<Request_Contact> AllOriginContacts { get; set; }
        public IEnumerable<HotSheetEquipment> Equipment { get; set; }
        public IEnumerable<JobLocation> OrigLocations { get; set; }
        public IEnumerable<HotSheetSavedEquipment> SavedEquipment { get; set; }
        public IEnumerable<HotSheetSavedVehicle> SavedVehicle { get; set; }
        public string SpecialInstructions { get; set; }
        public DateTime? DateCreated { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? DateModified { get; set; }
        public string ModifiedBy { get; set; }
        public HotSheetDateData DateData { get; set; }
        public string Hotsheet_Identifier { get; set; }
        public bool IsNew { get; set; }
        public bool IsReadOnly { get; internal set; }
        public IEnumerable<HotSheetContact> HotSheetOriginContacts { get; internal set; }
        public IEnumerable<HotSheetContact> HotSheetDestinationContacts { get; internal set; }
        public IEnumerable<HotSheetDateData> HotSheetRequestSchedules { get; internal set; }
        public long? RequestScheduleId { get; set; }
        public long? CustomerID { get; internal set; }
        public string CurrentUserFullName { get; internal set; }
    }
}

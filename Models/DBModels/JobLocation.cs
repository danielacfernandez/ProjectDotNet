using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class JobLocation
    {
        public long organization_id { get; set; }
        public long job_location_id { get; set; }
        public long customer_id { get; set; }
        public string job_location_name { get; set; }

        public long? buildingmgmtcontactid { get; set; }
        public string buildingmgmtcontactname { get; set; }
        public string buildingmgmtcontactphone { get; set; }
        public string buildingmgmtcontactemail { get; set; }

        public char? loading_dock_type { get; set; }
        public string dock_height { get; set; }
        public char? dock_reserv_req_type { get; set; }


        public long? elevator_avail_type_id { get; set; }
        public char? elevator_reserv_req_type { get; set; }
        public long? multi_level_type_id { get; set; }
        public string sq_footage { get; set; }
        public string smallest_door_elev_width { get; set; }

        public char? floor_prot_type { get; set; }
        public char? doorway_prot_type { get; set; }
        public char? wall_protection_type { get; set; }

        public string street1 { get; set; }
        public string street2 { get; set; }
        public string street3 { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string zip { get; set; }



    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class Project_Manager
    {
        public int ProjectManagerID { get; set; }
        public string ProjectManagerName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
    }
}

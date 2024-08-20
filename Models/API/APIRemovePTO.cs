using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry {
    public class APIRemovePTO {
        public DateTime ForDate { get; set; }
        public long ResourceId { get; set; }

        public long OrganizationId { get; set; }
    }
}

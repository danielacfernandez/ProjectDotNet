using ServiceTRAX.Models.DBModels.TimeEntry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIServiceAccountRequests 
    {
        public ServiceAccountRequests Header { get; set; }

        /// <summary>
        /// The child activities that a ServiceAccountRequests "header" has
        /// </summary>
        public IEnumerable<ServiceAccountRequests> Activities { get; set; }
    }
}

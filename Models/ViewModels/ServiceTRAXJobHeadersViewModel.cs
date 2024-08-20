using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class ServiceTRAXJobHeadersViewModel : ServiceTRAXPageViewModel
    {
        public IEnumerable<ServiceType> ServiceTypes { get; internal set; }
        public IEnumerable<Request_Customer> AllCustomers { get; internal set; }
    }
}

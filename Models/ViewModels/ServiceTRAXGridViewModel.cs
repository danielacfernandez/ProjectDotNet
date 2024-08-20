using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    /// <summary>
    /// This is the "top" model for ServiceTRAX models, all ViewModels should inherit from it because we must guarantee that each page operates 
    /// over a especific LOCATION (ORGANIZATION_ID) and this model is the one having the OrganizationID property
    /// Note: this was made to make the Location Quick change possibl. Using User Claims was a problem because if the user opens several
    /// tabs in the browser and then changes the location on one of those tabs then the User Claim for location will change making the remaining pages
    /// (opened on previous locations) to behave badly until the next refresh
    /// </summary>
    public class ServiceTRAXGridViewModel : ServiceTRAXPageViewModel
    {
        public long UserID { get; set; }
    }
}

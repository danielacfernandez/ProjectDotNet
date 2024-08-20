using ServiceTRAX.Models.ViewModels;
using System;

namespace ServiceTRAX.Models
{
    public class ErrorViewModel : ServiceTRAXPageViewModel
    {
        public string RequestId { get; set; }

        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}

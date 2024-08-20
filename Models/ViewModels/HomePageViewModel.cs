using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class HomePageViewModel : ServiceTRAXPageViewModel
    {
        public int? PasswordExpirationCountdown { get; set; }
        public IEnumerable<WidgetInfo> AvailableWidgets { get; set; }
        public IEnumerable<UserWidget> WidgetsConfiguration { get; set; }
        public List<HomePageMessageModel> OrganizationMessages { get; internal set; }
        public List<HomePageMessageModel> GlobalMessages { get; internal set; }
    }
}

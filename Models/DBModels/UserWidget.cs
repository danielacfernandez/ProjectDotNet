using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class UserWidget
    {
        public int WidgetUserID { get; set; }
        public string WidgetComponentName { get; set; }

        /// <summary>
        /// This is a column on Widget table that contains a JSON with the Widgets parameters
        /// </summary>
        public string WidgetParameters { get; set; }
        public int WidgetWidth { get; set; }
        public int WidgetHeight { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public bool IsActive { get; set; }

        /// <summary>
        /// This method is used to add runtime parameters to the Widget parameters JSON (OrganizationID and RunningAsUserID are only know when the Widget has to be shown)
        /// </summary>
        /// <param name="OrganizationID"></param>
        /// <param name="RunningAsUserID"></param>
        /// <returns></returns>
        public object WidgetParametersObj(int OrganizationID, long RunningAsUserID)
        {
            // Deserialize the Widget JSON received from the DB
            var obj = JsonConvert.DeserializeObject<ExpandoObject>(WidgetParameters);
            // Try adding the runtime parameters
            obj.TryAdd("OrganizationID", OrganizationID);
            obj.TryAdd("RunningAsUserID", RunningAsUserID);
            // Return the object so it can be used by the Widget view component
            return obj;
        }
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class DataSync
    {
        public string Key { get; set; }
        public int pagesCount { get; set; }
        public int pageIndex { get; set; }
        public int recordsCount { get; set; }

        public string Xml { get; set; }

        public DataSync(string data)
        {
            Key = "";
            recordsCount = 0;
            pagesCount = 0;
            pageIndex = 0;
            Xml = "";

            string[] d = Base64Decode(data).Split('&');
            for(int i = 0; i < d.Length; i++)
            {
                string[] parts = d[i].Split('=');
                if (parts.Length > 1)
                {
                    switch (parts[0].ToUpper())
                    {
                        case "KEY": Key = parts[1];break;
                        case "PAGESCOUNT": pagesCount = dBReadInt(parts[1]); break;
                        case "PAGEINDEX": pageIndex = dBReadInt(parts[1]); break;
                        case "RECORDSCOUNT": recordsCount = dBReadInt(parts[1]); break;
                        case "XML": Xml = System.Web.HttpUtility.UrlDecode(parts[1]); break;
                    }
                }
            }

        }
        private string Base64Decode(string base64EncodedData)
        {
            var base64EncodedBytes = System.Convert.FromBase64String(base64EncodedData);
            return System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
        }
        private int dBReadInt(object objValue)
        {
            int intValue = 0;
            try
            {
                intValue = Convert.ToInt32(objValue);
            }
            catch { }

            return intValue;
        }

    }
}

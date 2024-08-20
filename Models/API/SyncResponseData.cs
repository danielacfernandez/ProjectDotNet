using System;
using System.Collections.Generic;
using System.Linq;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyModel;
using ServiceTRAX.Utils;

namespace ServiceTRAX.Models.API
{
    public class SyncResponseData
    {
        public int ProcessID { get; set; }
        public string LoadName { get; set; }
        public int SourceCount { get; set; }
        public int StageCount { get; set; }
        public int StageStatus { get; set; }
        public SyncResponseData() { }
        public SyncResponseData(DataRow oRow) {
            if (oRow != null)
            {
                ProcessID = clsLibrary.dBReadInt(oRow["ProcessID"]);
                LoadName = clsLibrary.dBReadString(oRow["LoadName"]);
                SourceCount = clsLibrary.dBReadInt(oRow["SourceCount"]);
                StageCount = clsLibrary.dBReadInt(oRow["StageCount"]);
                StageStatus = clsLibrary.dBReadInt(oRow["StageStatus"]);
            }
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteEstimatorData
    {
        public long? QuoteId { get; set; }
        public DateTime? SentDate { get; set; }
        public string SentBy { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string FilePath { get; set; }

        public long? Project_No { get; set; }
        public long? Request_No { get; set; }
        public long? Version_No { get; set; }
        public long? Organization_ID { get; set; }


        public string QuoteUrl
        {
            get
            {
                return $"/Quote?QuoteID={QuoteId}&OrganizationID={Organization_ID}";
            }
        }
        public string QuoteDocumentUrl
        {
            get
            {
                return $"ProjectFiles/{Project_No}/{Request_No}/{Version_No}/{FilePath}";
            }
        }
    }
}

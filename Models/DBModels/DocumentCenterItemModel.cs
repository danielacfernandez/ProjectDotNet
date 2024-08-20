using System;

namespace ServiceTRAX.Models.DBModels
{
    public class DocumentCenterItemModel
    {
        public long DocumentID { get; set; }
        public long OrganizationID { get; set; }

        /// <summary>
        /// Name that the fill will have when downloaded
        /// </summary>
        public string DocumentName { get; set; }

        /// <summary>
        /// Full path(filename included)
        /// </summary>
        public string DocumentPath { get; set; }

        public string EmailAddress { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreateTime { get; set; }
        public long CreatedBy { get; set; }
        public DateTime? ModifyTime { get; set; }
        public long ModifiedBy { get; set; }

    }
}

using System;

namespace ServiceTRAX.Models.DBModels
{
    public class HomePageMessageModel
    {
        public long HomePageMessageID { get; set; }
        public long OrganizationID { get; set; }
        public string MessageType { get; set; }
        public string MessageText { get; set; }
        public int MessagePriority { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreateTime { get; set; }
        public long CreatedBy { get; set; }
        public DateTime? ModifyTime { get; set; }
        public long ModifiedBy { get; set; }

        public bool IsGlobalMessage
        {
            get
            {
                return MessageType.Equals("global", StringComparison.OrdinalIgnoreCase);
            }
        }

        public bool IsOrganizationMessage
        {
            get
            {
                return MessageType.Equals("org", StringComparison.OrdinalIgnoreCase);
            }
        }

    }
}

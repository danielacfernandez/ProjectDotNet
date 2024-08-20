namespace ServiceTRAX.Models.API
{
    public class APIReply
    {
        public bool succedeed { get; set; }   
        public string errors { get; set; }
        public string message { get; set; }
        public bool success { get; set; }
        public bool error { get; set; }
    }
}

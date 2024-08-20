using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class ShortURL
    {
        public long ShortURLID { get; set; }
        public string URLKey { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime ExpirationTime { get; set; }
        public bool IsExpired { get; set; }
        public string OriginalURL { get; set; }
    }
}

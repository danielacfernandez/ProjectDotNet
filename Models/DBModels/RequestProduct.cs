using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class RequestProduct
    {
        public int RequestID { get; set; }
        public long? product_lookup_id { get; set; }
        public string Product_Other { get; set; }
        public int? Shipping_Method_Lookup_ID { get; set; }
    }
}

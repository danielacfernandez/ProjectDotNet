﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.DBModels
{
    public class QuoteDataItem
    {
        public long QuoteDataID { get; set; }
        public string ItemName { get; set; }
        public float ItemTime { get; set; }
        public float ItemQuantity { get; set; }
        public bool IsActive { get; set; }
    }
}

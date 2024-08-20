﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class BillingInvoicesOpenViewModel : ServiceTRAXPageViewModel
    {
        public DateTime DateFrom { get; set; } = DateTime.Now.AddDays(1 - DateTime.Now.Day).AddMonths(-1);
        public DateTime DateTo { get; set; } = DateTime.Now;
    }
}

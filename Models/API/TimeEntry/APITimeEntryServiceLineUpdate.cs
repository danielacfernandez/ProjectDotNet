using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APITimeEntryServiceLineUpdate
    {
        public long servicelineid { get; set; }
        public double hours { get; set; }
    }
}

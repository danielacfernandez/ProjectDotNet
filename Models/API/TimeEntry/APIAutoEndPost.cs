using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API.TimeEntry
{
    public class APIAutoEndPost : APIAutoStartPost
    {
        public bool ForceEndWOLunch { get; set; }
    }
}

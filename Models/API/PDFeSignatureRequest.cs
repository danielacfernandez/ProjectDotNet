using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.API
{
    public class PDFeSignatureRequest
    {
        public IFormFile FileToSign { get; set; }
        public double Xpos { get; set; }
        public double Ypos { get; set; }
    }
}

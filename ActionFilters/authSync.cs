using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.ActionFilters
{
    public class authSync: ActionFilterAttribute
    {
        private string localKey = "";
        public authSync(IConfiguration config)
        {
            localKey = config.GetValue<string>("API-Key");
        }
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            base.OnActionExecuting(context);
            try
            {
                var key = context.HttpContext.Request.Headers["api-key"][0].ToString();
                if (key != localKey)
                {
                    context.Result = new BadRequestResult();
                }
            }
            catch {
                context.Result = new BadRequestResult();
            }
        }
    }
}

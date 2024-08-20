using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.ActionFilters
{
    public class ValidateUserOrganizationsActionFilter : IAsyncActionFilter
    {
        private readonly ServiceTRAXData _data;

        public ValidateUserOrganizationsActionFilter(ServiceTRAXData Data)
        {
            _data = Data;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Check that it the querystr contains an "OrganizationId" parameter the user has access to that Organization
            if (context.ActionArguments.TryGetValue("organizationid", out object value))
            {
                var valid = await _data.AspNetUserOrganizations_IsValid(Convert.ToInt32(value), context.HttpContext.User.GetUserID());
                if (!valid)
                {
                    context.Result = new ForbidResult();
                    return;
                }
            }

            await next();
        }
    }
}

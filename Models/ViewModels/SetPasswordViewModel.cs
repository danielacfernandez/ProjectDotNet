using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Policy;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class SetPasswordViewModel
    {
        public string Username { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; }

        [Required(ErrorMessage = "Confirm Password is required")]
        [DataType(DataType.Password)]
        [Compare("NewPassword")]
        public string PasswordConfirm { get; set; }
        public string PasswordResetToken { get; set; }
        public string Action { get; set; }
        public IEnumerable<string> UserMsg { get; set; }
    }
}

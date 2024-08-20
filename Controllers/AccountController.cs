using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration.UserSecrets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Serilog;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.API.Account;
using ServiceTRAX.Models.DBModels;
using ServiceTRAX.Models.ViewModels;
using ServiceTRAX.Utils;
using ServiceTRAX.Utils.Notifications;
using ServiceTRAX.ActionFilters;
using ServiceTRAX.Models.API;
using Microsoft.Graph;


namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class AccountController : Controller
    {
        private readonly UserManager<ServiceTRAXUser> _userManager;
        private readonly SignInManager<ServiceTRAXUser> _signInManager;
        private readonly RoleManager<ServiceTRAXRole> _roleManager;
        private readonly SiteConfiguration _siteSettings;
        private readonly ServiceTRAXData _data;
        private readonly UserNotificationEmails _emailer;
        private readonly ILogger<AccountController> _logger;
        private readonly RandomGeneratorHelper _randomGenerator;
        private readonly ServiceTRAXUserStore _serviceTRAXUserStore;

        public AccountController(
            UserManager<ServiceTRAXUser> userManager,
            SignInManager<ServiceTRAXUser> signInManager,
            RoleManager<ServiceTRAXRole> roleManager,
            IOptions<SiteConfiguration> siteSettings,
            ServiceTRAXData data,
            UserNotificationEmails Emailer,
            ILogger<AccountController> logger,
            RandomGeneratorHelper RandomGenerator,
            ServiceTRAXUserStore serviceTRAXUserStore
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _siteSettings = siteSettings.Value;
            _data = data;
            _emailer = Emailer;
            _logger = logger;
            _randomGenerator = RandomGenerator;
            _serviceTRAXUserStore = serviceTRAXUserStore;
        }


        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Login(string returnUrl = null, string additionalInformation = null)
        {
            // Clear the existing external cookie to ensure a clean login process
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            ViewData["ReturnUrl"] = returnUrl;
            ViewBag.AdditionalInformation = additionalInformation;

            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;

            if (ModelState.IsValid)
            {
                // This doesn't count login failures towards account lockout
                // To enable password failures to trigger account lockout, set lockoutOnFailure: true
                var user = await _userManager.FindByNameAsync(model.Username);

                if (user != null && user.IsActive && user.PasswordExpirationTime > DateTime.UtcNow)
                {
                    // If the user does not has a password then set it
                    if (!await _userManager.HasPasswordAsync(user))
                    {
                        await _userManager.AddPasswordAsync(user, model.Password);
                    }

                    // Check if the user has a default Organization assigned (or any Organization at all)
                    var orgToLogIn = await AutoSelectUserOrganizationToLogIn(user, model);

                    if (orgToLogIn != null)
                    {
                        // Try sign in woth user/pwd
                        var result = await _signInManager.PasswordSignInAsync(user, model.Password, model.RememberMe, false);

                        if (result.Succeeded)
                        {
                            // Update User Last Login and Last organization logged in
                            await _data.AspNetUser_LastLogin_Update(user.UserID, orgToLogIn.Value);

                            if (ValidReturnURL(returnUrl))
                            {
                                return RedirectToLocal(returnUrl);
                            }

                            return RedirectToAction("Index", "Home", new { OrganizationID = orgToLogIn });
                        }
                        if (result.IsLockedOut)
                        {
                            return View("Lockout");
                        }
                        else
                        {
                            ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                            return View(model);
                        }
                    }
                    else
                    {
                        // If we reach here then the user does not have any Organization set -> check if it's a known user to give a proper error message
                        // return generic message otherwise
                        var isKnownUser = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

                        if (isKnownUser.Succeeded)
                        {
                            ModelState.AddModelError(string.Empty, $"User {user.UserName} does not have any Organization assigned. Please contact system support.");
                            return View(model);
                        }

                        // Unknown user (or workng password) -> return generic login error message
                        ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                        return View(model);
                    }
                }
                else
                {
                    // User not found -> return generic error
                    if (user == null)
                    {
                        _logger.Log(LogLevel.Information, $"Invalid login attempt for unknown username: [{model.Username}]");
                        ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                        return View(model);
                    }
                    if (!user.IsActive)
                    {
                        ModelState.AddModelError(string.Empty, "User inactive.");
                    }
                    else if (DateTime.UtcNow > user.PasswordExpirationTime)
                    {
                        await SendPasswordResetEmail(user, PasswordResetType.EXPIRATION);
                        ModelState.AddModelError(string.Empty, $"User Password is Expired. An email with instructions on how to reset your Password has been sent to {user.Email}.");
                    }

                    return View(model);
                }
            }
            else
            {
                ModelState.AddModelError(string.Empty, $"Invalid username {model.Username}.");
                return View(model);
            }
        }

        private async Task SendPasswordResetEmail(ServiceTRAXUser identityUser, PasswordResetType ResetType)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(identityUser);
            var passwordResetURL = $"{_siteSettings.BaseURL}/Account/SetPassword?Action=PASSWORDRESET&Username={WebUtility.UrlEncode(identityUser.UserName)}&passwordresettoken={WebUtility.UrlEncode(token)}";
            await _emailer.SendPasswordResetEmail(identityUser, passwordResetURL, ResetType);
        }


        [HttpPost, HasPermission(Identity.Authorization.Permissions.AdminAllScreens)]
        public async Task<IActionResult> ResetUserPassword([FromBody] APIUserPasswordReset ResetInfo)
        {

            try
            {
                var user = await _userManager.FindByIdAsync(ResetInfo.UserID.ToString());
                if (user == null)
                {
                    return Ok(Json(new APIPasswordResetOutcome
                    {
                        Succeded = false,
                        OutcomeDescription = "User nor found."
                    }));
                }

                // Replace current password with a random password (just to ensure that the user will reset the password)
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                string password = _randomGenerator.Password(32);
                var result = await _userManager.ResetPasswordAsync(user, token, password);

                if (result.Succeeded)
                {

                    var pwd = new APIPasswordStatusTraxInfo
                    {
                        Username = user.UserName,
                        Password = password

                    };

                    var json = JsonSerializer.Serialize(pwd);
                    var data = new StringContent(json, Encoding.UTF8, "application/json");

                    var url = _siteSettings.StatusTraxUrl + "/Account/PasswordResetExternal";
                    using var client = new HttpClient();
                    try
                    {
                        var response = await client.PostAsync(url, data);

                        var result2 = response.Content.ReadAsStringAsync().Result;

                        // Create a password reset token and email it to the user
                        await SendPasswordResetEmail(user, PasswordResetType.ADMINRESET);

                        return Ok(Json(new APIPasswordResetOutcome
                        {
                            Succeded = true,
                            OutcomeDescription = $"Password Reset Completed. An Email with instructions on how to reset the password was sent to {user.Email}."
                        }));

                    }
                    catch (Exception e)
                    {
                        return Ok(new { Success = false, Errors = e.Message });
                    }
                   
                }
                else
                {
                    return Ok(Json(new APIPasswordResetOutcome
                    {
                        Succeded = false,
                        OutcomeDescription = result.Errors.Select(e => $"{e.Description} ({e.Code})").Aggregate((current, next) => $"{current}\n{next}")
                    }));
                }
            }
            catch (Exception e)
            {
                return Ok(Json(new APIPasswordResetOutcome
                {
                    Succeded = false,
                    OutcomeDescription = e.Message
                }));
            }
        }


        private async Task<long?> AutoSelectUserOrganizationToLogIn(ServiceTRAXUser user, LoginViewModel model)
        {
            var userOrganizations = await _data.AspNetUserOrganizations_Select(user.UserID);

            // Check if the user has a default Organization set
            var defaultOrg = userOrganizations.FirstOrDefault(o => o.IsDefaultLocation == true);
            if (defaultOrg != null)
            {
                return defaultOrg.OrganizationId;
            }

            // If default organization is not set -> log in the latests he used
            var lastLogguedOrg = userOrganizations.OrderByDescending(o => o.LastLoggedTime).FirstOrDefault();
            if (lastLogguedOrg != null)
            {
                return lastLogguedOrg.OrganizationId;
            }

            return null;
        }

        /// <summary>
        /// Checks if the return url contains the OrganizationID parameter
        /// </summary>
        /// <param name="uri"></param>
        /// <returns></returns>
        private bool ValidReturnURL(string uri)
        {
            var urlKeys = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri).Keys;
            return urlKeys.Any(k => k.Equals("OrganizationID", StringComparison.OrdinalIgnoreCase));
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout(string AdditionalInformation = "")
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction(nameof(AccountController.Login), "Account", new { AdditionalInformation });
        }



        [HttpGet] //, HasPermission(Identity.Authorization.Permissions.QuoteApprove)]
        public async Task<IActionResult> Permissions(int OrganizationID)
        {
            var dbPermissions = (await _data.AspNetRolePagePermission_Select()).ToDictionary<AspNetRolePagePermission, Tuple<long, int>, bool>(e => Tuple.Create(e.RoleID, e.PermissionID), e => true);


            var PermissionsDictionary = new Dictionary<short, PermissionDisplay>();
            foreach (var permission in PermissionDisplay.GetPermissionsToDisplay(typeof(Permissions)))
            {
                PermissionsDictionary.Add((short)permission.Permission, permission);
            }
            ViewBag.PermissionsDictionary = PermissionsDictionary;

            return View(new PermissionsDisplayViewModel
            {
                OrganizationID = OrganizationID,
                Permissions = PermissionDisplay.GetPermissionsToDisplay(typeof(Permissions)),
                RolePagePermissionsInsertStatements = PermissionsHelper.PermissionsInsertStatements(),
                Matrix = RolePermissionsMatrixBuilder.Build(dbPermissions)
            }); ;
        }

        [HttpGet]
        public async Task<IActionResult> AccessDenied(string ReturnUrl)
        {
            // Try to get the request OrganizationID (so the Layout links are properly rendered)
            var OrgId = System.Web.HttpUtility.ParseQueryString(ReturnUrl.Split('?').LastOrDefault());
            if (OrgId != null)
            {
                var orgkey = OrgId.AllKeys.Where(k => k?.ToLower().Equals("organizationid") == true).FirstOrDefault();
                if (!string.IsNullOrEmpty(orgkey))
                {
                    if (int.TryParse(OrgId[orgkey], out int orgToRedirect))
                    {
                        return View(new AccessDeniedModel { OrganizationID = orgToRedirect });
                    }
                }
            }

            // Return to the User default organization if current URL OrganizationId cannot be parsed
            var userOrganizations = await _data.AspNetUserOrganizations_Select(User.GetUserID());
            var defaultOrg = userOrganizations.FirstOrDefault(o => o.IsDefaultLocation == true);
            return View(new AccessDeniedModel { OrganizationID = (int)defaultOrg.OrganizationId });
        }

        [HasPermission(Identity.Authorization.Permissions.AdminAllScreens)]
        public async Task<IActionResult> Users(int OrganizationID)
        {
            //var userOrgs = await _data.AspNetUserOrganizations_Select(User.GetUserID());
            //// Get all the Roles for the User roles
            //var orgRoles = (await userOrgs.Select(async o => (await _data.Role_select(o.OrganizationId, null, null)).ToArray().Select(r => new { o.OrganizationId, r.Role_ID, r.Name }))).ToArray();

            var vm = new AspNetUsersMgmtViewModel
            {
                OrganizationID = OrganizationID,
                Roles = await _data.AspNetRoles_Select(),
                Organizations = await _data.AspNetUserOrganizations_Select(User.GetUserID()),
                ContactTypes = await _data.Contact_Type_Select(),
                OrganizationRoles = (await _data.Role_select(null, null, null, null)).Select(r => new { r.OrganizationId, r.Role_ID, r.Name }),
                LSPUsers = await _data.LocalServiceProvider_Select()
            };

            return View(vm);
        }

        /*[HttpPost, Route("registernewuserstatus")]
        public async Task<IActionResult> RegisterNewUserStatus([FromBody] APINewUserStatusTraxInfo userInforegisternewuser
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var user = new APINewUserStatusTraxInfo
                    {
                        Username = userInfo.Username,
                        Email = userInfo.Email,
                        FirstName = userInfo.FirstName,
                        LastName = userInfo.LastName,
                        MiddleName = userInfo.MiddleName,
                        SignOffPIN = userInfo.SignOffPIN,
                        Title = userInfo.Title,
                        Organizations = userInfo.Organizations

                    };

                    var json = JsonSerializer.Serialize(user);
                    var data = new StringContent(json, Encoding.UTF8, "application/json");

                    var url = _siteSettings.StatusTraxUrl + "/Account/RegisterNewUserExternal";
                    using var client = new HttpClient();
                    try
                    {
                        var response = await client.PostAsync(url, data);

                        var result = await response.Content.ReadAsStringAsync();

                        var apiReply = JsonSerializer.Deserialize<APIReply>(result);
                        Log.Information(apiReply.message);

                        if (apiReply.success) {
                              await _emailer.SendFirstLoginEmail(userInfo, apiReply.message);
                         
                            return Ok(new { Success = true, Errors = "", Message = $"User Creation Succeeded. An account activation email was sent to {user.Email}." });
                        }
                        Log.Error("RegisterNewUserStatus: The user could not be created in StatusTRAX: " + apiReply.error);
                        return Ok(new { Success = false, Errors = "The user could not be created in StatusTRAX. " + apiReply.error });
                    }
                    catch (Exception e)
                    {
                        return Ok(new { Success = false, Errors = e.Message });
                    }

                }
                return Ok(new { Success = false, Errors = "Invalid parameters." });

            }
            catch (Exception e)
            {
                Log.Error(e, "User Creation Failure");
                return Ok(new { Success = false, Errors = e.Message });
            }

        }

        */


        [HttpPost]
        [AllowAnonymous]
        [ServiceFilter(typeof(authSync))]
        public async Task<IActionResult> ResetUserPasswordExternal([FromBody] APIPasswordStatusTraxInfo password)
        {
            if (password.IsValid())
            {

                try
                {
                    ServiceTRAXUser user = await _userManager.FindByNameAsync(password.Username);
                    if (user != null)
                    {

                        var result = _data.AspNetUsers_Update_Password(user.UserID, password.Password, new System.Threading.CancellationToken()).Result;

                        if (result)
                            return Ok(new { Success = true });
                    }
                    return Ok(new { Success = false });
                }
                catch (Exception e)
                {
                    throw e;
                }

            }
            return Ok(new { Success = false });
        }


        [HttpPost, Route("registernewuser")]
        public async Task<IActionResult> RegisterNewUser([FromBody] APINewUserInfo userInfo)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var resultServiceTRAX = new IdentityResult();
                    var resultStatusTRAX = "";
                    var pwd = "";
                    if (userInfo.ServiceTRAX)
                    {
                        var user = new ServiceTRAXUser
                        {
                            UserName = userInfo.Username,
                            Email = userInfo.Email,
                            FirstName = userInfo.FirstName,
                            LastName = userInfo.LastName,
                            MiddleName = userInfo.MiddleName,
                            IsActive = true,
                            Organizations = userInfo.Organizations
                        };

                        pwd = _randomGenerator.Password(20);
                        resultServiceTRAX = await _userManager.CreateAsync(user, pwd);
                        if (!resultServiceTRAX.Succeeded)
                            return Ok(new { Success = false, Errors = resultServiceTRAX.Errors.FirstOrDefault().Description });

                    }

                    if (userInfo.StatusTRAX)
                    {
                        var user = new APINewUserStatusTraxInfo
                        {
                            Username = userInfo.Username,
                            Email = userInfo.Email,
                            FirstName = userInfo.FirstName,
                            LastName = userInfo.LastName,
                            MiddleName = userInfo.MiddleName,
                            SignOffPIN = userInfo.SignOffPIN,
                            Title = userInfo.Title,
                            Organizations = userInfo.Organizations

                        };

                        var json = JsonSerializer.Serialize(user);
                        var data = new StringContent(json, Encoding.UTF8, "application/json");

                        var url = _siteSettings.StatusTraxUrl + "/Account/RegisterNewUserExternal";
                        using var client = new HttpClient();
                        try
                        {
                            var response = await client.PostAsync(url, data);

                            resultStatusTRAX = await response.Content.ReadAsStringAsync();

                        }
                        catch (Exception e)
                        {
                            if (userInfo.ServiceTRAX)
                                RemoveUser(userInfo);
                            return Ok(new { Success = false, Errors = e.Message });
                        }
                    }
                    if (userInfo.ServiceTRAX )
                    {
                        if (resultServiceTRAX.Succeeded)
                        {
                            // Reload the user after creation to get its ID
                            var identityUser = await _userManager.FindByNameAsync(userInfo.Username);

                            if (identityUser != null)
                            {

                                // Assign User Roles, Organization and Customers
                                await AssignUserProps(identityUser.UserID, userInfo);


                                if (!userInfo.StatusTRAX)
                                {
                                    // Create the password reset token
                                    var token = await _userManager.GeneratePasswordResetTokenAsync(identityUser);

                                    // Create the notification entry so the welcome email will be delivered
                                    //FirstTimeLogin, string UserName, string PasswordResetToken,

                                    var firstLoginUrl = $"{_siteSettings.BaseURL}/Account/SetPassword?Action=FIRSTLOGIN&Username={WebUtility.UrlEncode(identityUser.UserName)}&passwordresettoken={WebUtility.UrlEncode(token)}";
                                    // Log token for debbugin purposes 
                                    Log.Information(firstLoginUrl);
                                    // Email notification
                                    await _emailer.SendFirstLoginEmail(identityUser, firstLoginUrl);
                                
                                    return Ok(new { Success = true, Errors = $"Password: [{pwd}]", Message = $"User Creation Succeeded. An account activation email was sent to {identityUser.Email}." });
                                }
                            }
                            else
                            {
                                return Ok(new { Success = false, Errors = "User not found (0x00000001)" });
                            }
                        }
                        else
                        {
                            return Ok(new { Success = false, Errors = resultServiceTRAX.Errors.Select(e => $"{e.Description} ({e.Code})").Aggregate((current, next) => $"{current}\n{next}") });
                        }

                    }
                    if (userInfo.StatusTRAX && resultStatusTRAX != null)

                        {
                            var apiReply = JsonSerializer.Deserialize<APIReply>(resultStatusTRAX);
                            Log.Information(apiReply.message);

                            if (apiReply.success)
                            {
                                await _emailer.SendFirstLoginEmail(userInfo, apiReply.message);

                                return Ok(new { Success = true, Errors = "", Message = $"User Creation Succeeded. An account activation email was sent to {userInfo.Email}." });
                            }
                            else
                            {
                                if (userInfo.ServiceTRAX)
                                    RemoveUser(userInfo);
                            }
                            Log.Error("RegisterNewUser: The user could not be created in StatusTRAX: " + apiReply.errors);
                            return Ok(new { Success = false, Errors = "The user could not be created in StatusTRAX. " + apiReply.errors });
                        }
                
                }
                
                return Ok(new { Success = false, Errors = "Invalid parameters." });

            }


            catch (Exception e)
            {
                Log.Error(e, "User Creation Failure");
                return Ok(new { Success = false, Errors = e.Message });
            }
               
        }

        private void RemoveUser(APINewUserInfo userInfo)
        {
            try
            {
                /*var identityUser = _userManager.FindByNameAsync(userInfo.Username).Result;
                identityUser.UserName = identityUser.UserName + "DELETED";
                identityUser.IsActive = false;*/
                var result = _data.AspNetIdentity_Delete(userInfo.Username, new System.Threading.CancellationToken()).Result;
                
                if (result)
                {
                    Log.Error( "User Deletion Failure: " + userInfo.Username);
                }
            }
            catch (Exception e)
            {
                Log.Error(e, "User Deletion Failure " + e.Message);
                throw e;
            }
        }

        //private string RandomPassword(int PasswordLength)
        //{
        //    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#!()$<>.,:;*-_{}[]";
        //    return new string(chars.Select(c => chars[RandomNumberGenerator.GetInt32(chars.Length)]).Take(PasswordLength).ToArray());
        //}


        private async Task AssignUserProps(long UserID, APINewUserInfo  userInfo)
        {
            long runningUser = User.GetUserID();

            // Assign the organizations
            foreach (var org in userInfo.Organizations)
            {
                await _data.AspNetUserOrganizations_Insert(UserID, org, runningUser, org == userInfo.DefaultUserOrganization);
            }

            // Assing the User customers
            foreach (var customer in userInfo.Customers)
            {
                await _data.AspNetUserCustomer_Insert(UserID, customer, runningUser);
            }

            // Assign the Roles
            foreach (var role in userInfo.Roles)
            {
                await _data.AspNetUserRoles_Insert(UserID, role);
            }

            if (userInfo.LSPUser)
            {
                await _data.AspNetUserRoles_Insert(UserID,null, "Local Service Provider");
            }

            //Add LSPUsers
            foreach (var lspUserID in userInfo.LspUsersSelected)
            {

                await _data.AspNetUserLSP_Insert(UserID, lspUserID, runningUser);
            }
            // Create the Resources for the user
            foreach (var resource in userInfo.ResourcesToCreate)
            {
                await _data.Resource_InsertFromUser(UserID, resource.OrganizationID, resource.RoleID, runningUser);
            }

            // Create the Contact for this User
            if (userInfo.LSPUser)
            {
                await _data.Contact_User_Insert(UserID, userInfo.DefaultUserOrganization, "LSP", runningUser, userInfo.PrimaryContact);
            }
            else
            {
                await _data.Contact_User_Insert(UserID, userInfo.DefaultUserOrganization, userInfo.ContactType, runningUser, userInfo.PrimaryContact);
            }
        }




        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> SetPassword(string Action, string Username, string PasswordResetToken, IEnumerable<string> UserMsg, string additionalInformation = null)
        {
            // Clear the existing external cookie to ensure a clean login process
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            ViewBag.AdditionalInformation = additionalInformation;

            var vm = new SetPasswordViewModel
            {
                Action = Action,
                Username = Username,
                PasswordResetToken = PasswordResetToken,
                UserMsg = UserMsg
            };

            return View(vm);
        }

        [HttpPost, AllowAnonymous, ValidateAntiForgeryToken]
        public async Task<IActionResult> SetPassword(SetPasswordViewModel model, string additionalInformation = null)
        {
            if (ModelState.IsValid)
            {
                var user = await _userManager.FindByNameAsync(model.Username);
                
                if (user != null)
                {
                    // Before resetting the password verify that the user is not entering again the same password it has before
                    if (PasswordHasher.VerifyHashedPasswordV3(Convert.FromBase64String(user.PasswordHash), model.NewPassword, out int iterCount))
                    {
                        model.UserMsg = new string[] { "Old and New password MUST be different." };
                        return RedirectToAction("SetPassword", model);
                    }
                    
                    // Reset password (validate token at the same time)
                    var result = await _userManager.ResetPasswordAsync(user, model.PasswordResetToken, model.NewPassword);

                    if (result.Succeeded)
                    {
                        user = await _userManager.FindByNameAsync(model.Username);
                        var pwd = new APIPasswordStatusTraxInfo
                        {
                            Username = user.UserName,
                            Password = user.PasswordHash

                        };

                        var json = JsonSerializer.Serialize(pwd);
                        var data = new StringContent(json, Encoding.UTF8, "application/json");

                        var url = _siteSettings.StatusTraxUrl + "/Account/PasswordResetExternal";
                        using var client = new HttpClient();
                        try
                        {
                            var response = await client.PostAsync(url, data);

                            var result2 = response.Content.ReadAsStringAsync().Result;

                            var signInResult = await _signInManager.PasswordSignInAsync(user, model.NewPassword, false, false);

                            if (signInResult.Succeeded)
                            {
                                return RedirectToAction("Index", "Home");
                            }
                            else
                            {
                                model.UserMsg = new string[] { "Automatic login using new credentials failed. Please contact administrator." };
                                return RedirectToAction("SetPassword", model);
                            }

                        }
                        catch (Exception e)
                        {
                            return Ok(new { Success = false, Errors = e.Message });
                        }

                    }
                    else
                    {
                        return View(new SetPasswordViewModel { UserMsg = result.Errors.Select(e => $"{e.Description} ({e.Code})"), Action = model.Action });
                    }
                }

                model.UserMsg = new string[] { "User not found." };
                return RedirectToAction("SetPassword", model);
            }
            else
            {
                model.UserMsg = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return RedirectToAction("SetPassword", model);
            }
        }



        [HttpPost]
        public async Task<IActionResult> ChangePassword([FromBody] APIChangePassword pwds)
        {
            var user = await _userManager.FindByIdAsync(User.GetUserID().ToString());
            if (user != null)
            {
                // Check that current password is different than the new one
                if (pwds.Current.Equals(pwds.New))
                {
                    return Ok(Json(new APIChangePasswordResult { Succeeded = false, Description = "Old and New password MUST be different." }));
                }

                var result = await _userManager.ChangePasswordAsync(user, pwds.Current, pwds.New);
                // If password change succeeded then logout the user to force refresh password
                if (result.Succeeded)
                {

                    user = await _userManager.FindByNameAsync(user.UserName);
                    var pwd = new APIPasswordStatusTraxInfo
                    {
                        Username = user.UserName,
                        Password = user.PasswordHash

                    };

                    var json = JsonSerializer.Serialize(pwd);
                    var data = new StringContent(json, Encoding.UTF8, "application/json");

                    var url = _siteSettings.StatusTraxUrl + "/Account/PasswordResetExternal";
                    using var client = new HttpClient();
                    try
                    {
                        var response = await client.PostAsync(url, data);

                        var result2 = response.Content.ReadAsStringAsync().Result;
                        // Update password expiry time
                        //if (!_data.AspNetUsers_UpdateExpirationDate(user.Id, _ecmsSettings.PasswordExpirationDays))
                        //{
                        //    return RedirectToAction(nameof(AccountController.Profile), "Account", new { ChangePasswordErrors = "Password change failed (EXPIRATIONDATEUPDATE)." });
                        //}
                    }
                    catch (Exception e)
                    {
                        return Ok(Json(new APIChangePasswordResult { Succeeded = false, Description = e.Message }));
                    }
                    return Ok(Json(new APIChangePasswordResult { Succeeded = true, Description = "Password successfully changed! Please login again using your new credentials." }));
                }
                else
                {
                    // Compile the errors found
                    var errors = result.Errors.Select(e => $"{e.Description} (Code:{e.Code})").Aggregate((current, next) => $"{current}\n{next}");
                    // Return a description of the errors found 
                    return Ok(Json(new APIChangePasswordResult { Succeeded = false, Description = errors.Substring(0, Math.Min(errors.Length, 1024)) }));
                }
            }
            // I think is not possible to reach here... but just in case
            return Ok(Json(new APIChangePasswordResult { Succeeded = false, Description = "Unknown" }));
        }



        [HttpPost, AllowAnonymous, ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(string UserEmail)
        {
            if (!string.IsNullOrEmpty(UserEmail))
            {
                var user = await _userManager.FindByEmailAsync(UserEmail);
                if (user != null)
                {
                    await SendPasswordResetEmail(user, PasswordResetType.FORGOT);
                    return RedirectToAction("Login", new { additionalInformation = $"An email with instructions on how to reset your password was sent to {UserEmail}" });
                }

                return RedirectToAction("Login", new { additionalInformation = $"User email {UserEmail} not found." });
            }

            return RedirectToAction("Login");
        }


        [HttpPost]
        public async Task<IActionResult> UserImage(Microsoft.AspNetCore.Http.IFormFile file, int LoggedOrganizationID)
        {
            int MaxImageSizeMB = 1;
            var allowedExtensions = new string[] { ".png", ".jpg" };

            var user = await _userManager.FindByIdAsync(User.GetUserID().ToString());

            if (user != null)
            {
                // Check image size and reject if too big
                if (file.Length < 1024 * 1024 * MaxImageSizeMB)
                {
                    var fileExtension = Path.GetExtension(file.FileName);
                    if (allowedExtensions.Any(e => e.Equals(fileExtension, StringComparison.OrdinalIgnoreCase)))
                    {
                        var filename = $"{Guid.NewGuid().ToString("N")}{fileExtension}";
                        var fullpath = Path.Combine(_siteSettings.UserPhotosPath, filename);

                        using (var stream = System.IO.File.Create(fullpath))
                        {
                            await file.CopyToAsync(stream);
                        }

                        user.UserPhoto = filename;
                        await _userManager.UpdateAsync(user);

                        return RedirectToAction("UserProfile", new { OrganizationID = LoggedOrganizationID });
                    }
                    else
                    {
                        return BadRequest($"Image file extension is not supported.");
                    }
                }
                else
                {
                    return BadRequest($"Image file too big - Only images smaller than {MaxImageSizeMB}MB are allowed.");
                }
            }

            return BadRequest($"Unknown error.");
        }


        [HttpPost]
        public async Task<IActionResult> UserUpdate(ServiceTRAXUser updates)
        {
            var user = await _userManager.FindByIdAsync(User.GetUserID().ToString());

            if (user != null)
            {
                // Update only a subset of the user object properties
                user.FirstName = updates.FirstName;
                user.MiddleName = updates.MiddleName;
                user.LastName = updates.LastName;
                user.Email = updates.Email;
                // Update
                await _userManager.UpdateAsync(user);
                // Reload profile page
                return RedirectToAction("UserProfile", new { OrganizationID = updates.LoggedOrganizationID });
            }
            return BadRequest($"Unknown error.");
        }


        public async Task<IActionResult> UserProfile(int OrganizationID)
        {
            var user = await _userManager.FindByIdAsync(User.GetUserID().ToString());
            var roles = await _userManager.GetRolesAsync(user);

            var vm = new UserProfileViewModel
            {
                OrganizationID = OrganizationID,
                User = user,
                Roles = roles
            };
            return View(vm);
        }



        #region Helpers

        private void AddErrors(IdentityResult result)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction(nameof(HomeController.Index), "Home");
            }
        }

        #endregion
    }
}
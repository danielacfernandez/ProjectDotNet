//using Bogus.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceTRAX.Data;
using ServiceTRAX.Identity;
using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.DBModels.Billing;
using ServiceTRAX.Models.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServiceTRAX.Controllers
{
    [Authorize]
    public class BillingController : Controller
    {
        private readonly ServiceTRAXData _data;

        public BillingController(ServiceTRAXData data)
        {
            _data = data;
        }


        [HasPermission(Permissions.BillingInvoicesReadCreateSend)]
        public IActionResult Open(int OrganizationID, string UserType)
        {
            var vm = new BillingOpenViewModel
            {
                OrganizationID = OrganizationID,
                UserType = UserType
            };
            return View(vm);
        }


        [HasPermission(Permissions.BillingInvoicesReadCreateSend)]
        public async Task<IActionResult> ByJob(int OrganizationID, long JobID, string ViewType, long? ProjectID, string SelectedTab)
        {
            // If they have provided a ProjecID then override JobID
            if (ProjectID.HasValue)
            {
                var projectKeys = await _data.ProjectJob_Keys(ProjectID, null, null);
                JobID = projectKeys.JobId;
            }


            string ViewXMLName = "BillingByItem";
            switch (ViewType)
            {
                case "REQITEM": ViewXMLName = "BillingByReqItem"; break;
                case "REQ": ViewXMLName = "BillingByReq"; break;
                case "DETAIL": ViewXMLName = "BillingDetail"; break;
            }


            var vm = new BillingByJobViewModel
            {
                OrganizationID = OrganizationID,
                ViewType = ViewType ?? "ITEM",
                ViewXMLFileName = ViewXMLName,
                JobDetails = await _data.Job_Select(JobID),
                JobID = JobID,
                BillingTypes = await _data.Billing_Type_Select(),
                InvoiceTypes = await _data.Billing_InvoiceType_Select(),
                Jobs = await _data.BulkTimeEntry_Job_Select(OrganizationID, null, User.GetUserID()),
                InvoicedTotal = await _data.Billing_InvoicedByJob_Select(JobID, User.GetUserID()),
                UserID = User.GetUserID(),
                SelectedTab = SelectedTab ?? "UNBILLEDOPS",
                BillingPeriods = await _data.Billing_Periods_Select(),
                POIsEnabledEdit = User.UserHasThisPermission(Permissions.POEditable),
                IsAllowedToApprove = User.UserHasThisPermission(Permissions.CanApprovePOInvoices)
            };
            return View(vm);
        }


        [HasPermission(Permissions.BillingInvoicesReadCreateSend)]
        public IActionResult InvoicesOpen(int OrganizationID)
        {
            var vm = new BillingInvoicesOpenViewModel
            {
                OrganizationID = OrganizationID
            };
            return View(vm);
        }



        public IActionResult InvoicesSent(int OrganizationID)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.BillingInvoicesReadCreateSend, Permissions.BillingSentInvoices }))
            {
                return new ForbidResult();
            }

            var vm = new BillingInvoicesSentViewModel
            {
                OrganizationID = OrganizationID
            };
            return View(vm);
        }


        public IActionResult InvoicesComplete(int OrganizationID)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.BillingInvoicesReadCreateSend, Permissions.BillingSentInvoices }))
            {
                return new ForbidResult();
            }

            var vm = new BillingInvoicesCompleteViewModel
            {
                OrganizationID = OrganizationID
            };
            return View(vm);
        }

        public IActionResult InvoicesInvoiced(int OrganizationID)
        {
            if (!User.UserHasAnyPermission(new Permissions[] { Permissions.BillingInvoicesReadCreateSend, Permissions.BillingSentInvoices }))
            {
                return new ForbidResult();
            }

            var vm = new BillingInvoicesInvoicedViewModel
            {
                OrganizationID = OrganizationID
            };
            return View(vm);
        }

        [HasPermission(Permissions.BillingPooledHours)]
        public IActionResult PooledHours(int OrganizationID)
        {
            var vm = new PooledHoursViewModel
            {
                OrganizationID = OrganizationID
            };
            return View(vm);
        }

        [HasPermission(Permissions.BillingPooledHours)]
        public async Task<IActionResult> PooledReqs(int OrganizationID, int JobID)
        {
            List<Requisition> Requisitions = (await _data.Billing_PooledHours_Select(JobID, OrganizationID, User.GetUserID(), null, null, null)).ToList();

            var vm = new InternalReqsViewModel
            {
                JobID = JobID,
                OrganizationID = OrganizationID,
                Reqs = Requisitions.Select(x => (ReqNo: x.service_no, ReqName: x.description)).Distinct().ToList(),
                Requisitions = Requisitions

            };
            return View(vm);
        }

        [HasPermission(Permissions.BillingPooledHours)]
        public async Task<IActionResult> PooledReqDetail(int OrganizationID, int JobID, int ServiceID, int ItemID, int RateID)
        {
            Requisition Requisition = (await _data.Billing_PooledHours_Select(JobID, OrganizationID, User.GetUserID(), ServiceID, ItemID, RateID)).FirstOrDefault();

            List<Allocation> Allocations = (await _data.Billing_PooledHoursExternalReqs_Select(JobID, User.GetUserID(), OrganizationID)).ToList();

            var vm = new PooledReqDetailViewModel
            {
                JobID = JobID,
                OrganizationID = OrganizationID,
                Requisition = Requisition,
                Allocations = Allocations

            };
            return View(vm);
        }

        [HasPermission(Permissions.PayrollReadApprove)]
        public async Task<IActionResult> Payroll(int OrganizationID)
        {
            List<string>  payrollCompanies = (await _data.Payroll_GetComanies()).ToList();
            var vm = new PayrollViewModel
            {
                OrganizationID = OrganizationID,
                PayrollCompanies = payrollCompanies
            };
            return View(vm);
        }

        public async Task<IActionResult> GetPayrollData(PayRollAPI dataToSend)
        {
            try
            {
                // Get payroll lines data from DB
                var content = await _data.GetPayrollData(dataToSend.PayrollCompany, dataToSend.StartDate, dataToSend.EndDate, dataToSend.BatchID, User.GetUserID());
                // Create the Header for the CSV output
                string header = "CO CODE, BATCH ID, FILE #, Reg Hours, O/T Hours, Temp Cost Number, Rate Code, Hours 3 Code, Hours 3 Amount, Reg Earnings, O/T Earnings, Earnings 3 Code, Earnings 3 Amount, Adjust DED Code, Adjust DED Amount, Cancel Pay, Pay #";
                // Create a comma separated string for each data row
                var linescsv = new StringBuilder();
                linescsv.AppendJoin("\r\n", content.Select(line => LineCommaSeparatedBuilder(line)));
                // Return a file appending header to comma separated lines
                return File(Encoding.ASCII.GetBytes($"{header}\r\n{linescsv}"), "text/csv", $"Payroll_Export_{DateTime.Now.ToString("yyyyMMdd")}.csv");

                //
                // Local fx for creating a comma separated line
                //
                string LineCommaSeparatedBuilder(PayRollData line)
                {
                    return string.Join(',', new object[]{
                                   line.CoCode,
                                   line.Batch,
                                   line.ExtEmployeeID,
                                   line.RegHours,
                                   line.OTHours,
                                   line.TempCost,
                                   line.RateCode,
                                   line.Hours3Code,
                                   line.Hours3Amount,
                                   line.RegEarnings,
                                   line.OTEarnings,
                                   line.Earnings3Code,
                                   line.Earnings3Amount,
                                   line.AdjustDEDCode,
                                   line.AdjustDEDAmount,
                                   line.CancelPay,
                                   line.PayNo
                           });
                }


            }
            catch (Exception e)
            {
                var ss = e.Message;
                throw;
            }

        }

        public async Task<IActionResult> ByJobInvoice(int OrganizationID, /*long JobID, */long InvoiceID, string ViewType, string SelectedTab)
        {

                string AssignedXMLName = "BillingJobInvoiceAssignedByItem";
                string UnassignedXMLName = "BillingByItem";
                switch (ViewType)
                {
                    case "REQITEM": AssignedXMLName = "BillingJobInvoiceAssignedByReqItem"; UnassignedXMLName = "BillingByReqItem"; break;
                    case "REQ": AssignedXMLName = "BillingJobInvoiceAssignedByReq"; UnassignedXMLName = "BillingByReq"; break;
                    case "DETAIL": AssignedXMLName = "BillingJobInvoiceAssignedDetail"; UnassignedXMLName = "BillingDetail"; break;
                }

                var invoiceData = await _data.Billing_JobInvoice_Select(InvoiceID, User.GetUserID());

                // Check if the user can change the status of the Invoice
                var invoiceStatuses = await _data.Invoice_Statuses_Select();
                var canChangeStatus = invoiceStatuses.Where(s => s.Code == invoiceData.Invoice_statuscode).FirstOrDefault()?.CanBeSelected ?? false;
                // If the user can change the status pass all "canbeselected" statuses, if cannot change status then just pass the "!canbeselected" (just to have the status name on the dropdown)
                var availableStatuses = canChangeStatus ? invoiceStatuses.Where(s => s.CanBeSelected) : invoiceStatuses.Where(s => !s.CanBeSelected);

                var vm = new BillingByJobInvoiceViewModel
                {
                    OrganizationID = OrganizationID,
                    ViewType = ViewType ?? "ITEM",
                    AssignedXMLName = AssignedXMLName,
                    UnassignedXMLName = UnassignedXMLName,
                    //JobID = JobID,
                    InvoiceID = InvoiceID,
                    InvoiceData = invoiceData,
                    UserID = User.GetUserID(),
                    InvoicedTotal = await _data.Billing_InvoicedByJob_Select(invoiceData.Job_id, User.GetUserID()),
                    ReadOnly = !invoiceData.Invoice_status.Equals("new", StringComparison.OrdinalIgnoreCase),
                    InvoiceStatuses = availableStatuses,
                    CanChangeInvoiceStatus = canChangeStatus,
                    SelectedTab = SelectedTab,
                    BillingTypes = await _data.Billing_Type_Select(),
                    BillingPeriods = await _data.Billing_Periods_Select(invoiceData.End_Date),
                    FuelSurchargeTotal = invoiceData.FuelSurchargeTotal,
                    AddFuelSurcharge = invoiceData.AddFuelSurcharge,
                    AddAdminFee = invoiceData.AddAdminFee
                };

                return View(vm);


        }


        [HasPermission(Permissions.PayrollReadApprove)]
        public async Task<IActionResult> ADPExpenseReport(int OrganizationID)
        {
            var vm = new ADPExpenseReportViewModel
            {
                OrganizationID = OrganizationID,
                Companies = (await _data.Locations_Select()).OrderBy(o => o.sequence_no)
            };
            return View(vm);
        }

        [HasPermission(Permissions.BillingACIInvoices)]
        public IActionResult ACIInvoices(int OrganizationID)
        {
            return View(new BillingACIInvoicesViewModel { OrganizationID = OrganizationID });
        }
    }
}

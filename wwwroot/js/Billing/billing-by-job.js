const initBillingByJob = (billByJobmodel) => {

    let model = billByJobmodel;
    console.log( model);
    //
    //
    model.notificationDialog = notificationDialog;

    //
    // Setup Model
    model.billingViewType = ko.observable(model.viewType);
    model.billingViewType.subscribe(function () {
        window.location = `/Billing/ByJob?OrganizationID=${model.organizationID}&JobID=${model.jobID}&ViewType=${model.billingViewType()}`;
    });

    model.selectedInvoice = ko.observable(null);
    model.selectedInvoice.subscribe(function () {
        model.calculateSummaryQuotedTotal();
    });


    model.selectedTotalAmount = ko.observable(0);
    model.quotedTotal = ko.observable(0);
    model.invoices = ko.observable([]);


    model.getBillableGridParameters = function () {
        return model.buildGridParametersObj(true);
    }
    model.getNonBillableGridParameters = function () {
        return model.buildGridParametersObj(false);
    }


    model.buildGridParametersObj = function (isBillable) {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'JOBID': model.jobID,
            'ISBILLABLE': isBillable ? 'Y' : 'N',
            'INVOICEID': model.selectedInvoice(),
            'BILL_SERVICE_NO': null,
            'ITEM_ID': null,
            'RUNNING_AS_USERID': model.userID
        };
    }


    function gridTypeFact(GridType, IDs) {
        return { 'gridType': GridType, 'idList': IDs }
    }

    model.gridProcessor = function (gridLines, isForDetailsSubGrid = false) {
        gridLines = Array.isArray(gridLines) ? gridLines : [gridLines];

        // Check if the Details SubGrid is open
        if (!isForDetailsSubGrid /*!model.isDetailSubGridOpen()*/) {
            switch (model.billingViewType()) {
                case 'ITEM': return gridTypeFact(model.billingViewType(), gridLines.map(r => r.ITEM_ID.toString()));
                case 'REQITEM': return gridTypeFact(model.billingViewType(), gridLines.map(r => r.KEYID));
                case 'REQ': return gridTypeFact(model.billingViewType(), gridLines.map(r => r.BILL_SERVICE_ID.toString()));
                case 'DETAIL': return gridTypeFact(model.billingViewType(), gridLines.map(r => r.SERVICE_LINE_ID.toString()));
            }
        }
        else {
            // We are working on the DETAILS SUB TEG (modal)
            return gridTypeFact('DETAIL', gridLines.map(r => r.SERVICE_LINE_ID.toString()));
        }
    }

    const calculateTotalSelected = (rows) => {
        if (rows && rows.length > 0) {
            //return rows.reduce((acc, curr) => acc + curr.BILL_HOURLY_TOTAL + curr.BILL_EXP_TOTAL, 0);
            return rows.reduce((acc, curr) => acc + curr.BILL_TOTAL, 0);
        }
        return 0;
    };

    model.gridEvents = {
        afterExecuteAction: function (btn) {
            if (btn.id === 'cmdMarkNew') {
                acctPendingInvoicesGrid.refresh();
                openInvoicesGrid.refresh();
                model.requiresRefresh = true;
            }
            if (btn.id === 'cmdMarkPending') {
                acctPendingInvoicesGrid.refresh();
                model.requiresRefresh = true;
            }
        },
        buttonClick: function (btn, row) {

            if (btn.id === 'cmdMarkComp') {
                postWrapper('/api/v1/flaginvoicesascomplete', ko.toJSON({ 'InvoiceIDs': [row.INVOICE_ID] }))
                    .then(r => {
                        acctPendingInvoicesGrid.refresh();
                        acctCompletedInvoicesGrid.refresh();
                    })
            }

            if (btn.id === 'cmdMarkNew' || btn.id === 'cmdMarkComp' || btn.id === 'cmdMarkPending' || btn.id === 'cmdBillingInvServiceLineDetail') {
                model.requiresRefresh = true;
                return true;
            }

            return false;
        }
    }

    model.detailSubGrid = null;

    // Opens the SubTEG for billing details
    model.openBillingDetailsTEG = function (row, isBillable) {
        // Get the data parameters that will be used on the Details subgrid - add the BILL_SERVICE_NO & ITEM_ID from the TEG clicked row
        let subGridParameters = isBillable ? model.getBillableGridParameters() : model.getNonBillableGridParameters();
        subGridParameters.BILL_SERVICE_NO = row.BILL_SERVICE_NO ? row.BILL_SERVICE_NO : null;
        subGridParameters.ITEM_ID = row.ITEM_ID ? row.ITEM_ID : null;
        // Clear content (just in case another grid was previously loaded - to prevent displaying it for a moment until the new one loads)
        $('#detailSubGrid').empty();
        // Create/Load the Details sub grid
        model.detailSubGrid = new clsMyGrid('BillingDetail', $('#detailSubGrid'), null, model.subTEGDetailsGridEvents(isBillable), true, subGridParameters);
        // Make visible the Details grid div container 
        document.getElementById('detailSubGridModal').style.display = 'unset';
        // Tell the model that the Details subgrid is open
        model.isDetailSubGridOpen(true);
    }

    // Assigns lines from Billiable/NonBilliable screens to the Selected Invoice
    model.assignLinesToinvoice = function (gridTypeAndIDs) {
        let values = {
            'JobID': model.jobID,
            'ItemIDList': gridTypeAndIDs.idList,
            'GRIDTYPE': gridTypeAndIDs.gridType,
            'INVOICEID': model.selectedInvoice()
        };

        if (model.selectedInvoice()) {
            postWrapper('/api/v1/invoiceservicelines', ko.toJSON(values))
                .then(() => {
                    model.refreshAllGrids();
                    //acctPendingInvoicesGrid.refresh();
                    model.requiresRefresh = true;
                });
        }
        else {
            model.notificationDialog.displayDialog('INVOICING ERROR', 'Please select an Invoice from the dropdown above.');
        }
    }

    // Sets lines Billable/NonBillable property
    model.setLineBillable = function (setBillable, gridTypeAndIDs, isForDetailsSubTeg) {

        let values = {
            'JobID': model.jobID,
            'ItemIDList': gridTypeAndIDs.idList,
            'GRIDTYPE': gridTypeAndIDs.gridType,
            'ISBILLABLE': setBillable ? 'Y' : 'N'
        }

        postWrapper('/api/v1/servicelinesbillable', ko.toJSON(values))
            .then(() => {
                model.refreshAllGrids();
                // If the Details sub grid is open then refresh it
                if (model.detailSubGrid) {
                    model.detailSubGrid.refresh();
                }
            });
    }



    //
    // Billiable / NonBilliable / Details - TEG buttons actions
    // 
    model.processButtonAction = function (btn, row, isBillable, isForDetailsSubTeg) {
        // Process the Rows
        let gridTypeAndIDs = model.gridProcessor(row, isForDetailsSubTeg);

        if (btn.id === 'cmdBillable') {
            model.setLineBillable(isBillable, gridTypeAndIDs, isForDetailsSubTeg);
        }
        if (btn.id === 'cmdInvoice') { // "Send To Accouting" Button
            model.assignLinesToinvoice(gridTypeAndIDs);
        }
        if (btn.id === 'cmdMoveLines') {
            // Show Modal
            model.moveLinesDialog.displayDialog(gridTypeAndIDs); // row.map(r => r.ITEM_ID));
        }
        if (btn.id === 'cmdBillingDetail') {
            model.openBillingDetailsTEG(row, isBillable);
        }
    }

    // 
    // Events for Non Billable Grid
    //
    model.nonBillableGridEvents = {
        created: function () {
            // Change the title of the non-billable TEG
            let nonBillableTitle = $('.gridNonBillableByJob').find('.gridTitle label').text();
            $('.gridNonBillableByJob').find('.gridTitle label').text(nonBillableTitle + ' -NON BILLABLE-');
        },
        buttonClick: function (btn, row) {
            model.processButtonAction(btn, row, false, false);
            return false;
        }
    }

    // 
    // Events for Billable Grid
    //
    model.billableGridEvents = {
        created: function () {
            // Change the title of the non-billable TEG
            let nonBillableTitle = $('.gridBillableByJob').find('.gridTitle label').text();
            $('.gridBillableByJob').find('.gridTitle label').text(nonBillableTitle + ' -BILLABLE-');
        },
        buttonClick: function (btn, row) {
            model.processButtonAction(btn, row, true, false);
            return false;
        },
        multiSelectionChange: function (rows) {
            model.selectedTotalAmount(calculateTotalSelected(rows));

            //    let gridTypeAndIDs = model.gridProcessor(rows, false);
            //    postWrapper('/api/v1/quotedbyjob', ko.toJSON({ 'JobID': model.jobID, 'ItemIDList': gridTypeAndIDs.idList, 'GRIDTYPE': gridTypeAndIDs.gridType, 'InvoiceID': model.selectedInvoice() }))
            //        .then(r => model.quotedTotal(r.value));
        }
    }

    model.calculateSummaryQuotedTotal = function () {
        let gridTypeAndIDs = model.gridProcessor([], false);
        postWrapper('/api/v1/quotedbyjob', ko.toJSON({ 'JobID': model.jobID, 'GRIDTYPE': gridTypeAndIDs.gridType, 'InvoiceID': model.selectedInvoice() }))
            .then(r => model.quotedTotal(r.value));
    }


    // 
    // Events for the SUBTEG Details Grid
    //
    model.subTEGDetailsGridEvents = function (isBillable) {
        return ({
            'buttonClick': function (btn, row) {
                model.processButtonAction(btn, row, isBillable, true);
                return false;
            }
        });
    }


    model.currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });


    model.refreshAllGrids = function () {
        byJobBillableGrid.refresh();
        byJobNonBillableGrid.refresh();
        openInvoicesGrid.refresh();
        //sentInvoicesGrid.refresh();
    }

    //
    // 1st OPS Grids (Billable/NonBillable By Job)
    //
    let byJobBillableGrid = new clsMyGrid(model.viewXMLFileName, document.getElementById('byJobBillableTEG'), null, model.billableGridEvents, true, model.getBillableGridParameters());
    let byJobNonBillableGrid = new clsMyGrid(model.viewXMLFileName, document.getElementById('byJobNonBillableTEG'), null, model.nonBillableGridEvents, true, model.getNonBillableGridParameters());



    model.resetGrid = function () {
        byJobBillableGrid.reset(model.viewXMLFileName, model.gridEvents, model.getBillableGridParameters());
        byJobNonBillableGrid.reset(model.viewXMLFileName, model.gridEvents, model.getNonBillableGridParameters());
    };
    //
    //

    //
    // 2nd OPS Grid (Invoices Open)
    //
    model.sendingToAccountingDialog = notificationDialog;

    model.processInvoices = function (invoices) {
        console.log(invoices);
        postWrapper('/api/v1/invoiceprocess', invoices)
            .then((r) => {
                if (!r.value.succeeded) {
                    model.notificationDialog.displayDialog('INVOICING ERROR', r.value.resultMessage.replace('|', '\n'));
                };
                model.refreshAllGrids();
                model.requiresRefresh = true;
            });

    }
    model.openInvcGridEvents = {
        buttonClick: function (btn, row) {
            // Open grid in Modal
            if (btn.id === 'cmdBillingInvServiceLineDetail' || btn.id === 'cmdBillingInvCustomLineDetail') {
                return true;
            }

            if (btn.id === 'cmdInvoice') {
                console.log('billing-by-job');

                var invoices = ko.toJSON({ 'KEYIDTABLE': row.map(r => r.INVOICE_ID) });
                postWrapper('/api/v1/getpoopenwithoutinvoices', invoices)
                    .then((r) => {
                        console.log(r);
                        if (r.value.resultMessage > 0)
                            model.sendingToAccountingDialog.displayConfirmationDialog('POs OPEN', 'There are open ' + r.value.resultMessage + ' purchase order(s), are you sure you want to invoice?', () => model.processInvoices(invoices))
                        else
                            if (r.value.resultMessage == 0)
                                model.processInvoices(invoices);
                    });
               /* postWrapper('/api/v1/invoiceprocess', ko.toJSON({ 'KEYIDTABLE': row.map(r => r.INVOICE_ID) }))
                    .then((r) => {
                        if (!r.value.succeeded) {
                            model.notificationDialog.displayDialog('INVOICING ERROR', r.value.resultMessage.replace('|', '\n'));
                        }
                        model.refreshAllGrids();
                        model.requiresRefresh = true;
                    });*/
            }

            // This command is actually from BillingInvServiceLineDetail.xml Grid (is opened from BillingInvoicesOpen in a popup)
            if (btn.id === 'cmdUnassign') {
                postWrapper('/api/v1/invoiceservicelinesunassign', ko.toJSON({ 'JOBID': row[0].JOB_ID, 'INVOICEID': row[0].INVOICE_ID, 'KEYIDTABLE': row.map(r => r.SERVICE_LINE_ID.toString()), 'GRIDTYPE': 'DETAIL' }))
                    .then(() => { model.refreshAllGrids(); });
                return true;
            }
            return false;
        }
    };


    model.getOpenInvcGridParameters = function () {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'FROMDATE': null, //moment().subtract(12, 'months').toISOString(),
            'TODATE': moment().toISOString(),
            'RUNNING_AS_USERID': model.userID,
            'JOBID': model.jobID
        }
    };

    var openInvoicesGrid = new clsMyGrid('BillingInvoicesOpen', document.getElementById('InvoicesOpenTEG'), null, model.openInvcGridEvents, true, model.getOpenInvcGridParameters());
    //
    //

    //
    // 3rd OPS Grid (Invoices Sent)
    //
    //model.getSentInvcGridParameters = function () {
    //    return {
    //        'ORGANIZATION_ID': model.organizationID,
    //        'FROMDATE': moment().subtract(12, 'months').toISOString(),
    //        'TODATE': moment().toISOString(),
    //        'RUNNING_AS_USERID': model.userID,
    //        'JOBID': model.jobID
    //    }
    //};

    //let sentInvoicesGrid = new clsMyGrid('BillingInvoicesSent', document.getElementById('InvoicesSentTEG'), null, model.gridEvents, true, model.getSentInvcGridParameters());
    //
    //

    //
    // Detail SubGrid
    //
    model.isDetailSubGridOpen = ko.observable(false);
    model.closeSubGrid = function () {
        document.getElementById('detailSubGridModal').style.display = 'none';
        model.detailSubGrid = null;
        model.isDetailSubGridOpen(false);
    }
    //
    //

    //
    // Account Pending Grid 
    //
    model.getPendingGridParameters = function () {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'RUNNING_AS_USERID': model.userID,
            'JOBID': model.jobID
        }
    };

    var acctPendingInvoicesGrid = new clsMyGrid('BillingAcctPending', document.getElementById('pendingTEG'), null, model.gridEvents, true, model.getPendingGridParameters());
    //
    //


    //
    // Account Completed Grid 
    //
    model.getCompletedGridParameters = function () {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'RUNNING_AS_USERID': model.userID,
            'JOBID': model.jobID,
            'FROMDATE': null,
            'TODATE': null
        }
    };
    var acctCompletedInvoicesGrid = new clsMyGrid('BillingAcctCompleted', document.getElementById('completedTEG'), null, model.gridEvents, true, model.getCompletedGridParameters());
    //
    //


    //
    // Account Invoiced Grid 
    //
    model.getInvoicedGridParameters = function () {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'RUNNING_AS_USERID': model.userID,
            'JOBID': model.jobID,
            'FROMDATE': null,
            'TODATE': null
        }
    };

    var acctInvoicedInvoicesGrid = new clsMyGrid('BillingAcctInvoiced', document.getElementById('invoicedTEG'), null, model.gridEvents, true, model.getInvoicedGridParameters());
    //
    //






    //
    // New Invoice Dialog
    //
    model.newInvoiceDialog = {
        isDialogDisplaying: ko.observable(false),
        jobno: model.jobDetails.job_no,
        dealer: model.jobDetails.dealer_name,
        customername: model.jobDetails.customer_name,
        invoiceTypes: model.invoiceTypes,
        selectedInvoiceType: ko.observable(false),
        billingTypes: model.billingTypes,
        selectedBillingType: ko.observable(false),
        //billingAssignCandidates: model.billingAssignCandidates,
        //assignedTo: ko.observable(false),
        invoiceDescription: ko.observable(''),
        billAmt: ko.observable(0),
        billingPeriods: model.billingPeriods,
        isEndPeriodRequired: ko.observable(model.jobDetails.is_end_period_required),
        selectedBillingPeriod: ko.observable(null),

        displayDialog: function () {
            this.selectedBillingType(null);
            this.selectedInvoiceType(null);
            //this.assignedTo(null);
            this.invoiceDescription('');
            this.isDialogDisplaying(true);
            this.selectedBillingPeriod(null);
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        saveInvoiceButtonEnabled: ko.pureComputed(
            function () {
                return model.newInvoiceDialog.selectedInvoiceType() !== null
                    && model.newInvoiceDialog.selectedBillingType() !== null
                    && ((model.newInvoiceDialog.isEndPeriodRequired() && model.newInvoiceDialog.selectedBillingPeriod() !== null) || !model.newInvoiceDialog.isEndPeriodRequired());
            }
            , this),
        billingAmtVisible: ko.pureComputed(function () {

            let show = model.newInvoiceDialog.selectedBillingType() == model.billingTypes.find(bt => bt.code === "flat_fee_bid").id;
            if (show) {
                getWrapper('/api/v1/invoicebillamt', { 'JobID': model.jobDetails.job_id })
                    .then(r => {
                        model.newInvoiceDialog.billAmt(r.value);
                    });
            }
            else {
                model.newInvoiceDialog.billAmt(0);
            }

            return show;
        }),
        addInvoice: function () {

            let data = {
                'OrganizationId': model.organizationID,
                'InvoiceTypeId': this.selectedInvoiceType(),
                'BillingTypeId': this.selectedBillingType(),
                //'AssignedToUserId': this.assignedTo(),
                'JobId': model.jobID,
                'Description': this.invoiceDescription(),
                'BillCustomerId': model.jobDetails.customer_id,
                'AMTTOBILL': parseFloat(model.newInvoiceDialog.billAmt()),
                'BillingPeriod': model.newInvoiceDialog.selectedBillingPeriod()
            };

            postWrapper('/api/v1/invoice', ko.toJSON(data))
                .then(({ value }) => {
                    if (value.succeeded) {
                        // Re-load the Invoices list
                        model.loadInvoices();
                        // Select the newly added invoice
                        model.selectedInvoice(value.invoice_id);
                        // Refresh Invoices Open TEG
                        openInvoicesGrid.refresh();
                        // Refresh Totals
                        model.calculateSummaryQuotedTotal();
                    }
                })
                .finally(() => this.closeDialog());
        }
    }
    //
    //


    //
    // MOVE LINES DIALOG
    //
    model.moveLinesDialog = {
        initialized: false,
        jobs: model.jobs,
        isDialogDisplaying: ko.observable(false),
        serviceRequests: ko.observableArray([]),
        selectedServiceRequests: ko.observable(null),
        selectedJob: ko.observable(null),
        itemIDs: [],

        displayDialog: function (itemIDsAndGridType) {

            if (!this.initialized) {
                this.selectedJob.subscribe(function (newValue) {
                    if (newValue) {
                        this.loadRequests();
                    }
                }.bind(this));
                this.initialized = true;
            }
            this.itemIDsAndGridType = itemIDsAndGridType;
            this.selectedServiceRequests(null);
            this.selectedJob(null);
            this.isDialogDisplaying(true);
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        moveLines: function () {
            let data = {
                'SourceJobID': model.jobID,
                'JobID': this.selectedJob(),
                'ReqID': this.selectedServiceRequests(),
                'ServiceLinesToMove': this.itemIDsAndGridType.idList,
                'GRIDTYPE': this.itemIDsAndGridType.gridType
            };

            postWrapper('/api/v1/moveservicelines', ko.toJSON(data))
                .then(function () { model.refreshAllGrids(); })
                .then(() => this.closeDialog());

            //console.log('moving lines....', this.itemIDs, this.selectedServiceRequests(), this.selectedJob());
        },
        moveLinesEnabled: ko.pureComputed(function () {
            return this.moveLinesDialog.selectedServiceRequests() && this.moveLinesDialog.selectedJob() && this.moveLinesDialog.itemIDsAndGridType.idList && this.moveLinesDialog.itemIDsAndGridType.idList.length > 0;
        }, model),
        loadRequests: function () {
            // find out the ProjectId for the selected JobId
            let job = this.jobs.find(j => j.jobId === this.selectedJob());
            if (job) {
                getWrapper('/api/v1/bulktimeentryrequests', { 'organizationid': model.organizationID, 'projectid': job.projectId })
                    .then(res => { console.log(res); return res; })
                    .then(res => this.serviceRequests(res.value));
            } else {
                console.error('Project not found.');
            }
        }
    };
    //
    //



    //
    //
    //
    model.loadInvoices = function () {
        getWrapper('/api/v1/invoices', { 'jobid': model.jobID })
            .then(res => model.invoices(res.value));
    }
    model.loadInvoices();
    //
    //


    //
    //
    //
    model.postedGridViews = [
        { id: 'byreq', name: 'POSTED BY REQ' },
        { id: 'details', name: 'POSTED DETAILS' },
        { id: 'byitem', name: 'POSTED BY ITEM' },
        { id: 'byreqitem', name: 'POSTED BY REQ/ITEM' }
    ];


    model.postedViewType = ko.observable(model.postedGridViews[0].id);
    model.postedLinesByReqVisible = ko.observable(model.postedViewType() === 'byreq');
    model.postedLinesByDetailVisible = ko.observable(model.postedViewType() === 'details');
    model.postedLinesByItemVisible = ko.observable(model.postedViewType() === 'byitem');
    model.postedLinesByReqItemVisible = ko.observable(model.postedViewType() === 'byreqitem');

    model.postedViewType.subscribe(function (newValue) {
        console.log('POSTED LINES SUBSCRIVE');
        model.postedLinesByReqVisible(newValue === 'byreq');
        model.postedLinesByDetailVisible(newValue === 'details');
        model.postedLinesByItemVisible(newValue === 'byitem');
        model.postedLinesByReqItemVisible(newValue === 'byreqitem');
        model.refreshPostedLinesGrids();
    });

    model.refreshPostedLinesGrids = function () {

        if (model.postedLinesByReqVisible()) {
            if (postedLinesByReqGrid == null)
                postedLinesByReqGrid = new clsMyGrid('BillingJobPostedLinesByReq', document.getElementById('postedLinesByReqTEG'), null, model.gridEvents, true, model.getPostedLinesGridParameters());
            postedLinesByReqGrid.refresh();
        }
        if (model.postedLinesByDetailVisible()) {
            if (postedLinesByDetailGrid == null)
                postedLinesByDetailGrid = new clsMyGrid('BillingJobPostedLinesByDetail', document.getElementById('postedLinesByDetailTEG'), null, model.gridEvents, true, model.getPostedLinesGridParameters());
            postedLinesByDetailGrid.refresh();
        }
        if (model.postedLinesByItemVisible()) {
            if (postedLinesByItemGrid == null)
                postedLinesByItemGrid = new clsMyGrid('BillingJobPostedLinesByItem', document.getElementById('postedLinesByItemTEG'), null, model.gridEvents, true, model.getPostedLinesGridParameters());
            postedLinesByItemGrid.refresh();
        }
        if (model.postedLinesByReqItemVisible()) {
            if (postedLinesByReqItemGrid == null)
                postedLinesByReqItemGrid = new clsMyGrid('BillingJobPostedLinesByReqItem', document.getElementById('postedLinesByReqItemTEG'), null, model.gridEvents, true, model.getPostedLinesGridParameters());
            postedLinesByReqItemGrid.refresh();
        }
    };

    //
    // Purchase Orders
    //

    model.notificationDialog = notificationDialog;
    model.confirmApproveInvoice = notificationDialog;

    model.uploadInvoiceDialog = {
        isDialogDisplaying: ko.observable(false),
        poID: ko.observable(null),
        amtBalance: 0,
        amount: ko.observable().extend({ required: { message: 'Amount is required.' }, validator: { min: 1, max: 100 } }),
        invoiceNumber: ko.observable().extend({ required: { message: 'Invoice Number is required.' } }),
        isUploadingInvoice: ko.observable(null),
        invoiceFileName: ko.observable(null).extend({ required: { message: 'File is required.' } }),
        invoiceFile: ko.observable(null).extend({ required: { message: 'File is required.' } }),
        projectID: model.jobDetails.project_id,
        organizationID: model.organizationID,
        requestID: model.jobDetails.requestId,
        redirectToBilling: true,
        jobID: model.jobID,

        invoiceDate: ko.observable(new Date()).extend({ required: { message: 'Date is required.' } }),

        displayDialog: function (POHeaderId, AmtBalance) {
            this.poID(POHeaderId);
            this.projectID = model.jobDetails.project_id;
            this.organizationID = model.organizationID;
            this.requestID = model.jobDetails.requestId;
            this.amtBalance = AmtBalance;
            this.validationInvoiceDetails().showAllMessages(false);
            console.log(this.projectID);
            console.log(this.organizationID);
            console.log(this.requestID);
            if (this.amtBalance <= 0) {
                this.isDialogDisplaying(false);
                model.notificationDialog.displayDialog('Balance', 'There are no dollar left for this PO');
            }
            else {
                this.isUploadingInvoice(true);
                this.isDialogDisplaying(true);
            }
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
            this.isUploadingInvoice(false);
        },
        refreshData: function () {
            this.isDialogDisplaying(false);
            this.isUploadingInvoice(false);

        },
        est_invoice_date_options: function (isReadOnly) {
            return isReadOnly === false ? { trigger: '#triggerCalendarInvoiceDate' } : {};
        },

        validateForm: function (formElement) {
            this.invoiceFileName(formElement["invoiceFile"].value);

            var result = this.validationInvoiceDetails();
            if (result().length > 0) {
                result.showAllMessages(true);
                return false;
            }
            var invoiceNumber = formElement["invoiceNumber"].value;
            var amount = formElement["amount"].value;
            var fileInvoice = formElement["invoiceFile"].value;
            //var valid = amount.match(/^-?\d*(\.\d+)?$/);
            var valid = !/^\s*$/.test(amount) && !isNaN(amount);
            if (valid == true) {
                if (amount > this.amtBalance) {
                    model.notificationDialog.displayDialog('Balance', 'There are no dollar left for this PO');
                    return false;
                }
            }
            else {
                model.notificationDialog.displayDialog('Invalid Number', 'Put a correct number in the amount field');
                return false;
            }
            return true;

        },
        validationInvoiceDetails: function () {
            //return ko.validation.group(this, { deep: true }
            return ko.validation.group({
                f1: this.invoiceNumber,
                f2: this.invoiceDate,
                f3: this.amount,
                f4: this.invoiceFileName
            }, { deep: true })
        }

    };
    model.approveInvoice = function (row) {
        let data = {
            POInvoiceID: row.POINVOICEID,
            FileName: row.DOCUMENTNAME,
            OrganizationID: model.organizationID,
            Total: row.AMOUNT,
            MDFileName: row.MDFILENAME
        };

        postWrapper('/api/v1/approvepoinvoice', ko.toJSON(data))
        .then(() => {
            var poInvoiceNumber = row.INVOICENUMBER;
            model.notificationDialog.displayDialog('InvoiceApproved', 'The invoice ' + poInvoiceNumber + ' was approved');
            poInvoicesGrid.oGridAux.refreshData();

        });

     };

    model.getPOInvoicesGridParameters = function () {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'USER_ID': model.userID,
            'REQUEST_ID': model.jobDetails.requestId,
            'REQUEST_ID_G': model.jobDetails.requestId,
            'PROJECT_ID': model.jobDetails.project_id
        }
    };
    
    model.gridEvents = {
        afterCreatedNewRecord: function (newDataRow) {
            // Set the Row organizationID value so the filtered dropdowns can work
            newDataRow["ROWORG_ID"] = model.organizationID;
            newDataRow["PROJECT_ID"] = model.jobDetails.PROJECT_ID;
        },
        buttonClick: function (btn, row) {
            if (btn.id === 'cmdUpdateInvoice') {
                model.uploadInvoiceDialog.displayDialog(row.POHEADERID, row.AMTBALANCE);
            };
            if (btn.id === 'cmdApproveInvoice') {
                if (!model.isAllowedToApprove) {
                    model.notificationDialog.displayDialog('Access Denied', 'You are not allowed to Approve an invoice');
                }
                else {
                    model.confirmApproveInvoice.displayConfirmationDialog('DID YOU DOWNLOAD THE INVOICE TO CONFIRM AMOUNTS MATCH?', `Are you sure you want to approve the invoice ${row.INVOICENUMBER} ?`, () => model.approveInvoice(row));
                }
            };
            if (btn.id === 'cmdDownloadInvoice') {
                var win = window.open(`/Request/downloadpoinvoicefile/${row.MDFILENAME}`, '_blank');
                win.focus();
            }
        },
        beforeRenderGrid: function (config) {
            config.allowUpdate = model.isEnableEdit;
            config.allowInsert = model.isEnableEdit;
            if (!model.POIsEnableEdit) {
                $('.cmdNewRecord').hide();
            }
        }
    };


    model.refreshPOInvoicesGrid = function () {
        poInvoicesGrid = new clsMyGrid('PurchaseOrders', document.getElementById('poInvoicesTEG'), null, model.gridEvents, true, model.getPOInvoicesGridParameters());
        poInvoicesGrid.refresh();
    };
        
    //
    //


    //
    // Posted Lines Grids
    //
    model.getPostedLinesGridParameters = function () {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'RUNNING_AS_USERID': model.userID,
            'JOBID': model.jobID
        }
    };

    var postedLinesByReqGrid = null;
    var postedLinesByDetailGrid = null;
    var postedLinesByItemGrid = null;
    var postedLinesByReqItemGrid = null;

    //
    //



    //
    // Tabs Toggle Handling
    //
    model.getSelectedTab = function (value) {
        switch (value.toUpperCase()) {
            case 'UNBILLEDOPS':
                return ko.observable('UNBILLEDOPS'); break;
            case 'UNBILLEDACCT':
                return ko.observable('UNBILLEDACCT'); break;
            case 'POOLEDHOURS':
                return ko.observable('POOLEDHOURS'); break;
            case 'POINVOICES':
                return ko.observable('POINVOICES'); break;
            default:
                return ko.observable('UNBILLEDOPS'); break;
        }
    }

    model.selectedTab = model.getSelectedTab(model.selectedTab);
    model.firstTimeSwitch = true;
    model.requiresRefresh = false;

    model.selectUnbilledOps = () => {
        model.selectedTab('UNBILLEDOPS');

        if (model.firstTimeSwitch || model.requiresRefresh) {
            model.firstTimeSwitch = false;
            model.requiresRefresh = false;
            model.refreshAllGrids();
        }
    }
    model.selectUnbilledAcct = () => {
        model.selectedTab('UNBILLEDACCT');

        if (model.firstTimeSwitch || model.requiresRefresh) {
            model.firstTimeSwitch = false;
            model.requiresRefresh = false;
            acctPendingInvoicesGrid.refresh();
            acctCompletedInvoicesGrid.refresh();
            acctInvoicedInvoicesGrid.refresh();
        }
    }

    model.selectPostedLines = () => {
        model.selectedTab('POSTEDLINES');
        model.refreshPostedLinesGrids();
    }

    model.selectPOInvoices = () => {
        model.selectedTab('POINVOICES');
        //console.log(poInvoicesSelected);
        model.refreshPOInvoicesGrid();
    }

    model.selectPooledHours = () => model.selectedTab('POOLEDHOURS');


    model.unbilledOpsSelected = ko.pureComputed(function () {
        return model.selectedTab() === 'UNBILLEDOPS';
    });

    model.unbilledAcctSelected = ko.pureComputed(function () {
        return model.selectedTab() === 'UNBILLEDACCT';
    });

    model.pooledHoursSelected = ko.pureComputed(function () {
        return model.selectedTab() === 'POOLEDHOURS';
    });

    model.postedLinesSelected = ko.pureComputed(function () {
        return model.selectedTab() === 'POSTEDLINES';
    });

    model.poInvoicesSelected = ko.pureComputed(function () {
        return model.selectedTab() === 'POINVOICES';
    });

    if (model.selectedTab() == 'POINVOICES') { 
        model.selectPOInvoices();
    }


    //
    //
    //
    // Validations
    //
    ko.validation.init({
        //errorElementClass: 'text-danger',
        errorElementClass: 'requestMissingFieldError',
        errorMessageClass: 'help-block',
        decorateElement: true,
        decorateInputElement: false,
        insertMessages: false
    });

    ko.validation.registerExtenders();

    //
    // Custom Bindings
    //

    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    //
    //


    //
    //
    //
    ko.applyBindings(model);
    //
    //
}
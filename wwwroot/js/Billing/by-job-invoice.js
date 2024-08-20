const initBillingByJobInvoice = (billByJobInvoicemodel) => {

    let model = billByJobInvoicemodel;
    console.log(model);

    model.notificationDialog = notificationDialog;
    //
    // Custom Bindings
    //
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    //
    //

    model.currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    model.isBilliable = ko.observable("Y");
    model.isBilliable.subscribe(function () {
        // Refresh the grid when the IsBilliable radio changes
        model.resetGrids();
    });

    model.quotedTotal = ko.observable(0.0);
    model.selectedTotalAmount = ko.observable(0.0);
    model.isDetailSubGridOpen = ko.observable(false);

    model.billingViewType = ko.observable(model.viewType);
    model.billingViewType.subscribe(function () {
        redirectToPage('/Billing/ByJobInvoice', { 'OrganizationID': model.organizationID, 'JobID': model.invoiceData.job_id, 'InvoiceID': model.invoiceID, 'ViewType': model.billingViewType() })
    });

    const calculateTotalSelected = (rows) => {
        if (rows && rows.length > 0) {
            return rows.reduce((acc, curr) => acc + curr.BILL_HOURLY_TOTAL + curr.BILL_EXP_TOTAL, 0);
        }
        return 0;
    };


    //
    // Header values (Description & PO) change support
    //
    model.invoiceData.description = ko.observable(model.invoiceData.description);
    model.invoiceData.po_no = ko.observable(model.invoiceData.po_no);

    model.invoice_statusid_UI_ignore = false;
    model.invoice_statusid_UI = ko.observable(model.invoiceData.invoice_statusid);
    model.invoice_statusid_UI.subscribe(function (newValue) {
        console.log('here');
        console.log(newValue);
        if (!model.invoice_statusid_UI_ignore) {
            var message = "Please confirm Invoice Status Change."; 
            console.log(model.invoiceData.numberOfOpenPOs);
            if (model.invoiceData.numberOfOpenPOs > 0)
                message = "There are open " + model.invoiceData.numberOfOpenPOs + " purchase order(s). " + message;

            model.notificationDialog.displayOptionsDialog('CHANGE INVOICE STATUS', message,
                () => {
                    model.updateInvoiceHeaderValues({ 'StatusID': newValue }, true);
                    model.invoiceData.invoice_statusid = newValue;
                },
                () => {
                    model.invoice_statusid_UI_ignore = true;
                    model.invoice_statusid_UI(model.invoiceData.invoice_statusid);
                },
                { 'ok': 'Yes, Change Status', 'cancel': 'Cancel' });
        }
        else {
            model.invoice_statusid_UI_ignore = false;
        }

    });


    model.invoiceData.billing_type_id = ko.observable(model.invoiceData.billing_type_id);
    model.invoiceData.billing_type_id.subscribe(function (newValue) {
        model.updateInvoiceHeaderValues({ 'BillingTypeId': newValue }, true);
    });

    model.invoiceData.description.subscribe(function (newValue) {
        model.updateInvoiceHeaderValues({ 'Description': newValue }, false);
    });

    model.invoiceData.po_no.subscribe(function (newValue) {
        model.updateInvoiceHeaderValues({ 'PO_NO': newValue }, false);
    });

    model.invoiceData.billingPeriod = ko.observable(model.invoiceData.billingPeriod);
    model.invoiceData.billingPeriod.subscribe(function (newValue) {
        model.updateInvoiceHeaderValues({ 'BillingPeriod': newValue }, false);
    });

    model.addFuelSurcharge = ko.observable(model.invoiceData.addFuelSurcharge);
    model.addAdminFee = ko.observable(model.invoiceData.addAdminFee);
    model.fuelSurchargeRate = ko.observable(model.invoiceData.fuelSurchargeRate);
    model.fuelSurchargeTotal = ko.observable(model.invoiceData.fuelSurchargeTotal);
    console.log('model.invoiceData.fuelSurchargeRate: ' + model.invoiceData.fuelSurchargeRate);
    console.log('model.invoiceData.addFuelSurcharge: ' + model.invoiceData.addFuelSurcharge);
    console.log('model.invoiceData.addAdminFee: ' + model.invoiceData.addAdminFee);

    model.addFuelSurchargeClick = function () {

        getWrapper('/api/v1/invoiceaddfuelsurcharge', { 'invoiceid': model.invoiceID }).then((r) => {
            if (!r.value.succeeded) {
                model.notificationDialog.displayDialog('ADD FUEL SURCHARGE ERROR', r.resultMessage, false, model.refreshPage);
            } else {
                    redirectToPage('/Billing/ByJobInvoice', { 'OrganizationID': model.organizationID, 'JobID': model.invoiceData.job_id, 'InvoiceID': model.invoiceID, 'ViewType': model.billingViewType() });
                
            }
        });
    }

    model.addAdminFeeClick = function () {

        getWrapper('/api/v1/invoiceaddadminfee', { 'invoiceid': model.invoiceID }).then((r) => {
            if (!r.value.succeeded) {
                model.notificationDialog.displayDialog('ADD ADMIN FEE ERROR', r.resultMessage, false, model.refreshPage);
            } else {
                    redirectToPage('/Billing/ByJobInvoice', { 'OrganizationID': model.organizationID, 'JobID': model.invoiceData.job_id, 'InvoiceID': model.invoiceID, 'ViewType': model.billingViewType() });
                
            }
        });
    }

    model.updateInvoiceHeaderValues = function (values, shouldReload) {
        let updateValues = { ...{ 'InvoiceId': model.invoiceID }, ...values };
        postWrapper('/api/v1/invoiceupdate', ko.toJSON(updateValues)).then((r) => {
            if (!r.succeeded) {
                model.notificationDialog.displayDialog('INVOICE UPDATE ERROR', r.resultMessage, false, model.refreshPage);
            } else {
                if (shouldReload) {
                    redirectToPage('/Billing/ByJobInvoice', { 'OrganizationID': model.organizationID, 'JobID': model.invoiceData.job_id, 'InvoiceID': model.invoiceID, 'ViewType': model.billingViewType() });
                }
            }
        });
    }

    model.refreshPage = () => {
        redirectToPage('/Billing/ByJobInvoice', { 'OrganizationID': model.organizationID, 'JobID': model.invoiceData.job_id, 'InvoiceID': model.invoiceID, 'ViewType': model.billingViewType() });
    };

    //
    // Assigned Lines Grid
    //
    model.getAssignedGridParameters = function () {
        return {
            'ORGANIZATIONID': model.organizationID,
            'JOBID': model.invoiceData.job_id,
            'INVOICEID': model.invoiceID,
            'RUNNING_AS_USERID': model.userID,
            'ISBILLABLE': model.isBilliable()
        };
    };

    model.assignedGridEvents = {
        created: function () {
            $('.rowSelector').css("display", "none");
        },
        buttonClick: function (btn, row) {
            let gridTypeAndIDs = model.gridProcessor(row);

            if (btn.id === 'cmdUnassign') {
                postWrapper('/api/v1/invoiceservicelinesunassign', ko.toJSON({
                    'JOBID': model.invoiceData.job_id, 'INVOICEID': model.invoiceID, 'KEYIDTABLE': gridTypeAndIDs.idList, 'GRIDTYPE': gridTypeAndIDs.gridType
                }))
                    .then(() => { model.refreshAllGrids(); });
            }
            return false;
        },

        multiSelectionChange: function (rows) {
            if (!model.readOnly) {
                model.selectedTotalAmount(calculateTotalSelected(rows));

                let gridTypeAndIDs = model.gridProcessor(rows);
                postWrapper('/api/v1/quotedbyjob', ko.toJSON({ 'JobID': model.invoiceData.job_id, 'ItemIDList': gridTypeAndIDs.idList, 'GRIDTYPE': gridTypeAndIDs.gridType }))
                    .then(r => model.quotedTotal(r.value));
            } else {
                return false;
            }
        }
    };

    var assignedLineGrid = new clsMyGrid(model.assignedXMLName, document.getElementById('assignedLinesTEG'), null, model.assignedGridEvents, true, model.getAssignedGridParameters());

    model.resetAssignedGrid = function () {
        assignedLineGrid.reset(model.assignedXMLName, model.assignedGridEvents, model.getAssignedGridParameters());
    };
    //
    //

    //
    // Unassigned Lines Grid
    //
    model.getUnassignedGridParameters = function () {
        return {
            'ORGANIZATION_ID': model.organizationID,
            'JOBID': model.invoiceData.job_id,
            'ISBILLABLE': model.isBilliable(),
            'INVOICEID': model.invoiceID,
            'BILL_SERVICE_NO': null,
            'ITEM_ID': null,
            'RUNNING_AS_USERID': model.userID
        };
    };

    function gridTypeFact(GridType, IDs) {
        return { 'gridType': GridType, 'idList': IDs }
    }

    model.gridProcessor = function (gridLines) {
        gridLines = Array.isArray(gridLines) ? gridLines : [gridLines];

        // Check if the Details SubGrid is open
        if (!model.isDetailSubGridOpen()) {
            switch (model.billingViewType()) {
                case 'ITEM': return gridTypeFact(model.billingViewType(), gridLines.map(r => r.ITEM_ID.toString()));
                case 'REQITEM': return gridTypeFact(model.billingViewType(), gridLines.map(r => r.KEYID));
                case 'REQ': return gridTypeFact(model.billingViewType(), gridLines.map(r => r.BILL_SERVICE_ID.toString()));
                case 'DETAIL': return gridTypeFact(model.billingViewType(), gridLines.filter(r => r.SERVICE_LINE_ID).map(r => r.SERVICE_LINE_ID.toString()));
            }
        }
        else {
            // We are working on the DETAILS SUB TEG (modal)
            return gridTypeFact('DETAIL', gridLines.map(r => r.SERVICE_LINE_ID.toString()));
        }
    }

    model.unassignedgridEvents = {
        buttonClick: function (btn, row) {
            let gridTypeAndIDs = model.gridProcessor(row);

            if (btn.id === 'cmdInvoice') {

                postWrapper('/api/v1/invoiceservicelines', ko.toJSON({ 'JobID': model.invoiceData.job_id, 'ItemIDList': gridTypeAndIDs.idList, 'GRIDTYPE': gridTypeAndIDs.gridType, 'INVOICEID': model.invoiceID }))
                    .then(model.refreshAllGrids());
            }
            if (btn.id === 'cmdBillable') {
                postWrapper('/api/v1/servicelinesbillable', ko.toJSON({ 'JobID': model.invoiceData.job_id, 'ItemIDList': gridTypeAndIDs.idList, 'GRIDTYPE': gridTypeAndIDs.gridType, 'ISBILLABLE': model.isBilliable() }))
                    .then(model.refreshAllGrids());
            }
            if (btn.id === 'cmdMoveLines') {
                // Show Modal
                model.moveLinesDialog.displayDialog(gridTypeAndIDs); // row.map(r => r.ITEM_ID));
            }
            return false;
        }
    };

    if (!model.readOnly) {
        var unassignedLineGrid = new clsMyGrid(model.unassignedXMLName, document.getElementById('unassignedLinesTEG'), null, model.unassignedgridEvents, true, model.getUnassignedGridParameters());
    }

    model.resetUnassignedGrid = function () {
        if (!model.readOnly) {
            unassignedLineGrid.reset(model.unassignedXMLName, model.unassignedgridEvents, model.getUnassignedGridParameters());
        }
    };
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
                'SourceJobID': model.invoiceData.job_id,
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
            getWrapper('/api/v1/bulktimeentryrequests', { 'organizationid': model.organizationID, 'projectid': this.selectedJob() })
                .then(res => { console.log(res); return res; })
                .then(res => this.serviceRequests(res.value));
        }
    };
    //
    //

    model.canAddCustomLine = model.invoiceData.invoice_statuscode.toUpperCase() == 'NEW' || model.invoiceData.invoice_statuscode.toUpperCase() == 'PENDING';

    defineGreaterThanValidation();
    ko.validation.registerExtenders();


    //
    // Add Custom Line Dialog
    //
    model.newCustomLineDialog = {
        isDialogDisplaying: ko.observable(false),
        serviceRequests: ko.observableArray([]),
        selectedServiceRequest: ko.observable(null).extend({ required: { message: 'Please select a Service Request.' } }),
        serviceItems: ko.observableArray([]),
        selectedServiceItem: ko.observable(null).extend({ required: { message: 'Please select an Item.' } }),
        lineDescription: ko.observable('').extend({ required: { message: 'Please enter a Description.' } }),
        lineQuantity: ko.observable(0).extend({ greaterThan: 0}), // { required: { message: 'Please enter a Quantity.' } }),
        lineRate: ko.observable(0).extend({ greaterThan: 0 }), //.extend({ required: { message: 'Please enter a Line Rate value.' } }),
        linePONO: ko.observable(null).extend({ required: { message: 'Please enter a PO #.' } }),
        lineIsTaxable: ko.observable(false),
        selectedServiceRequestSubscription: null,

        displayDialog: function () {
            getWrapper('/api/v1/customlineinitprops', { 'JobID': model.invoiceData.job_id })
                .then((value) => {
                    // Set Items
                    this.serviceItems(value.items);
                    // Set Requests
                    value.requests.forEach(r => r.displayText = `${r.service_No} - ${$(`<p>${r.description}</p>`).text().substring(0, 35)}`);
                    this.serviceRequests(value.requests);
                });

            this.selectedServiceRequest(null);
            if (this.selectedServiceRequestSubscription == null) {
                this.selectedServiceRequestSubscription = this.selectedServiceRequest.subscribe(function () {
                    let req = model.newCustomLineDialog.serviceRequests().find(s => s.service_ID === model.newCustomLineDialog.selectedServiceRequest());
                    model.newCustomLineDialog.linePONO(req && req.po_no ? req.po_no : '');
                });
            }

            this.selectedServiceItem(null);
            this.lineQuantity(0);
            this.lineRate(0);
            this.linePONO('');
            this.lineDescription('');
            this.lineIsTaxable(false);
            this.isDialogDisplaying(true);
            this.validationGroup().showAllMessages(false);
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        lineTotal: ko.pureComputed(function () {
            let total = 0;
            if (model.newCustomLineDialog.lineQuantity() && model.newCustomLineDialog.lineRate()) {
                total = model.newCustomLineDialog.lineQuantity() * model.newCustomLineDialog.lineRate();
            }
            return `$ ${total.toFixed(2)}`;
        }),
        saveCustomLine: function () {
            let lineData = {
                'invoice_id': model.invoiceID,
                'item_id': this.selectedServiceItem(),
                'description': this.lineDescription(),
                'unit_price': parseFloat(this.lineRate()),
                'qty': parseFloat(this.lineQuantity()),
                'po_no': this.linePONO(),
                'taxable': this.lineIsTaxable(),
                'bill_service_id': this.selectedServiceRequest()
            };

            var result = this.validationGroup();
            if (result().length > 0) {
                result.showAllMessages(true);
                return false;
            }

            postWrapper('/api/v1/invoicecustomline', ko.toJSON(lineData))
                .then(({ value }) => {
                    if (value.succeeded === true) {
                        model.refreshAllGrids();
                        model.invoiceData.po_no(value.po)
                        this.closeDialog();
                    }
                    else {
                        alert('Custom Line Insert failed!');
                    }
                });
        },
        validationGroup: function () {
            return ko.validation.group(this, { deep: true })
        },
    }
    //
    //



    model.refreshAllGrids = function () {
        assignedLineGrid.refresh();
        if (!model.readOnly) {
            unassignedLineGrid.refresh();
        }
    }

    model.resetGrids = function () {
        model.resetUnassignedGrid();
        model.resetAssignedGrid();
    };


    //
    // Tracking Notes Handling
    //
    model.openTrackingNotesGrid = function () {

        // Get the data parameters that will be used on the Details subgrid 
        let subGridParameters = { INVOICEID: model.invoiceID };
        // Clear content (just in case another grid was previously loaded - to prevent displaying it for a moment until the new one loads)
        $('#detailSubGrid').empty();
        // Create/Load the Details sub grid
        model.detailSubGrid = new clsMyGrid('InvoiceTrackingNotes', $('#detailSubGrid'), null, null, true, subGridParameters);
        // Make visible the Details grid div container 
        document.getElementById('detailSubGridModal').style.display = 'unset';
        // Tell the model that the Details subgrid is open
        model.isDetailSubGridOpen(true);

    };

    model.closeSubGrid = function () {
        document.getElementById('detailSubGridModal').style.display = 'none';
        model.detailSubGrid = null;
        model.isDetailSubGridOpen(false);
    }
    //
    //

    //
    // Custom Bindings
    //
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    //
    //
   

    ko.validation.init({
        errorElementClass: 'text-danger',
        errorMessageClass: 'help-block',
        decorateElement: true,
        insertMessages: false
    });


    //
    //
    //
    ko.applyBindings(model);
    //
    //


}

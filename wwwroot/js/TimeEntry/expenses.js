const initExpenses = (expensesModel) => {
    let model = expensesModel;
    console.log(model);

    let gridParameters = () => ({ 'ORGANIZATION_ID': model.organizationID, 'RUNNING_AS_USER_ID': model.userID });
    let gridEvents = {
        buttonClick: function (btn, row) {
            if (btn.id === 'cmdSubmitExpenseLines') {
                model.submitLines(row.map(r => r.SERVICE_LINE_ID));
            }
        }
    };
    let expensesGrid = new clsMyGrid('Expenses', document.getElementById('ExpensesTEG'), null, gridEvents, true, gridParameters());


    //
    // Setup binding handlers
    //
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    //
    //

    //
    // Model Setup
    //
    model.selectedJob = ko.observable(null);
    model.selectedJob.subscribe(function () {
        // On JobId change reload the work codes and service requests
        loadServices();
        loadWorkCodes();
    });


    model.serviceRequests = ko.observableArray([]);
    model.selectedServiceRequests = ko.observableArray(null);

    model.selectedMembers = ko.observableArray(null);
    model.date = ko.observable(new Date());

    model.workCodes = ko.observableArray([]);
    model.selectedWorkCode = ko.observable(null);

    model.hours = ko.observable(0);

    model.isOT = ko.observable(false);

    //model.payCodes = ko.observableArray(model.payCodes);
    //model.selectedPayCode = ko.observable(model.payCodeID);

    model.enableInsertButton = ko.pureComputed(function () {
        return model.selectedJob()
            && model.selectedService()
            && model.selectedWorkCode()
            //&& model.selectedPayCode()
            && model.hoursQty() > 0;
    });

    model.emptyTimeEntries = ko.observable(false);
    model.loadingExpenses = ko.observable(false);


    model.selectedResource = ko.observable(null);
    model.selectedService = ko.observable(null);
    model.selectedWorkCode = ko.observable(null);
    model.selectedWorkCode.subscribe(function () {
        // Update ItemCost and ItemRate when the user changes the selected Work Code
        if (model.selectedWorkCode()) {
            let selwc = model.workCodes().find(wc => wc.itemId === model.selectedWorkCode());
            if (selwc) {
                model.itemCost(selwc.itemCost);
                model.billRate(selwc.itemRate);
            }
        }
    });

    model.hoursQty = ko.observable(null);
    model.itemCost = ko.observable();
    model.billRate = ko.observable();

    //
    //

    model.loadingServices = ko.observable(false);
    loadServices = function () {
        model.loadingServices(true);
        let projectValue = model.jobs.filter(j => j.jobID === model.selectedJob())[0];
        getWrapper('/api/v1/expensesservices', { 'organizationid': model.organizationID, 'jobid': projectValue ? projectValue.jobID : null })
            .then(res => {
                let cleanText = res.value.map(v => ({ 'serviceId': v.serviceId, 'serviceNoDesc': $(`<p>${v.serviceNoDesc}</p>`).text().substring(0, 35) }));
                model.serviceRequests(cleanText);
                model.loadingServices(false);
            });
    }


    model.loadingWorkcodes = ko.observable(false);
    loadWorkCodes = function () {
        model.loadingWorkcodes(true);
        getWrapper('/api/v1/expensesworkcodes', { 'organizationid': model.organizationID, 'jobid': model.selectedJob() })
            .then((res) => {
                model.workCodes(res.value);
                model.loadingWorkcodes(false);
            })
    }


    model.insertExpenses = function () {

        let data = {
            'Date': model.date(),
            'JobId': model.selectedJob(),
            'ResourcesId': model.selectedResource(),
            'ServiceId': model.selectedService(),
            'WorkCodeId': model.selectedWorkCode(),
            'QtyHours': parseFloat(model.hoursQty()),
            'ItemCost': parseFloat(model.itemCost()),
            'BillRate': parseFloat(model.billRate())
        }

        postWrapper('/api/v1/expenses', ko.toJSON(data))
            .then((value) => {
                if (value.succeeded) {
                    expensesGrid.refreshData();
                }
            });

    };


    model.submitLines = function (rowIds) {
        postWrapper('/api/v1/expensessubmitlines', ko.toJSON({ 'lstLineIds': rowIds }))
            .then((value) => {
                if (value.succeeded) {
                    expensesGrid.refreshData();
                }
            });
    }

    //
    // Expenses list
    //
    model.expenses = ko.observableArray([]);
    //
    //

    //
    // KO ApplyBindings
    ko.applyBindings(model);
    //
    //
};

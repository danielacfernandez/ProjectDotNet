const initJobHeader = (jobHeadersModel, userID) => {

    const model = jobHeadersModel;
    model.userID = userID;

    const gridParameters = () => ({ ORGANIZATION_ID: model.organizationID, USER_ID: model.userID });
    const gridEvents = {
        buttonClick: function (btn, row) {
            if (btn.id === 'cmdOpenServiceRequest') {
                redirectToPage('/Request', { 'RequestID': row.REQUEST_ID, 'OrganizationID': model.organizationID });
            }
        }
    };
    const oGrid = new clsMyGrid('JobHeaders', document.getElementById('tegGrid'), null, gridEvents, true, gridParameters());

    model.newJobDialog = {
        isDialogDisplaying: ko.observable(false),
        isValidProjectNumber: ko.observable(false),
        isValidatingProjectNumber: ko.observable(false),

        request_Data: {
            project_name: ko.observable(''),
            job_number: ko.observable(null).extend({ rateLimit: 350 }),
            project_type_id: ko.observable(null),
            customer_id: ko.observable(null),
            end_user_id: ko.observable(null),
            isPooledHours: ko.observable(false)
        },

        displayDialog: function () {
            this.isValidProjectNumber(false);
            this.isValidatingProjectNumber(false);
            this.request_Data.project_name('');
            this.request_Data.job_number(null);
            this.request_Data.project_type_id(null);
            this.request_Data.customer_id(null);
            this.request_Data.end_user_id(null);
            this.request_Data.isPooledHours(false);
            //
            this.isDialogDisplaying(true);
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        pooledHoursCheckboxVisible: ko.pureComputed(function () {
            const projTypeCode = model.serviceTypes && model.serviceTypes.find(f => f.serviceTypeID === model.newJobDialog.request_Data.project_type_id());
            return projTypeCode && projTypeCode.serviceCode === 'service_account';
        }),
        disabledCreateJobButton: ko.pureComputed(function () {
            const valid = model.newJobDialog.isValidProjectNumber()
                && model.newJobDialog.request_Data.project_name().length > 0
                && model.newJobDialog.request_Data.project_type_id()
                && model.newJobDialog.request_Data.customer_id()
                && model.newJobDialog.request_Data.end_user_id()
                && !model.newJobDialog.isValidatingProjectNumber();

            return !valid;
        }),
        saveJob: function () {
            const jobHeaderData = {
                'ProjectNo': parseInt(this.request_Data.job_number()),
                'JobTypeID': this.request_Data.project_type_id(),
                'CustomerID': this.request_Data.customer_id(),
                'EndUserID': this.request_Data.end_user_id(),
                'JobName': this.request_Data.project_name(),
                'IsPooledHours': this.request_Data.isPooledHours()
            };

            postWrapper('/api/v1/createjobheader', ko.toJSON(jobHeaderData))
                .then(r => {
                    if (r && r.succeeded) {
                        // Reload TEG
                        oGrid.refresh();
                        model.newJobDialog.closeDialog();
                    }
                });
        }
    }


    model.newJobDialog.request_Data.job_number.subscribe(function () {

        if (model.newJobDialog.request_Data.job_number()) {
            model.newJobDialog.isValidatingProjectNumber(true);
            getWrapper('/api/v1/validprojectno', { 'ProjectNo': model.newJobDialog.request_Data.job_number() })
                .then((response) => {
                    model.newJobDialog.isValidProjectNumber(response.value.isValid)
                })
                .finally(() => model.newJobDialog.isValidatingProjectNumber(false));
        }
        else {
            model.newJobDialog.isValidProjectNumber(false);
        }
    });

    model.endUsers = ko.observableArray([]);
    model.newJobDialog.request_Data.customer_id.subscribe(function () {
        //
        model.newJobDialog.request_Data.end_user_id(null);
        model.endUsers([]);

        // Load End User for selected customer ID
        getWrapper('/api/v1/endusers', { 'OrganizationID': model.organizationID, 'CustomerID': model.newJobDialog.request_Data.customer_id() })
            .then((response) => {
                // Set EndUsers array
                model.endUsers(response.value);
            });
    });


    //
    // Custom Bindings
    //
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    //
    //


    //
    //
    //
    ko.applyBindings(model);
    //
    //
};
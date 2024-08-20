const addActivityDialog = {
    isDialogDisplaying: ko.observable(false),
    allJobs: ko.observableArray([]),
    selectedJobId: ko.observable(null),
    organizationID: null,
    requestSelectEnable: ko.observable(false),
    serviceRequests: ko.observableArray([]),
    selectedServiceRequest: ko.observable(null),
    customFields: ko.observableArray([]),
    timeEntryLine: null,
    jobHours: ko.observable(0),
    validationModel: null,
    afterSaveCallback: null,
    loadingJobs: ko.observable(false),
    editingHours: ko.observable(false),
    selectedWorkCode: ko.observable(null),
    workCodes: ko.observableArray([]),
    defaultItemID: null,

    initDialog: function (organizationID, afterSaveCallback) {
        // Set the organization and load the jobs for that organization
        this.organizationID = organizationID;
        this.afterSaveCallback = afterSaveCallback;

        // Create a subscription to load the service requests and enable/disable the select accordingly
        this.selectedJobId.subscribe(function () {
            this.requestSelectEnable(false);
            this.selectedServiceRequest(null);
            this.customFields([]);

            getWrapper('/api/v1/projectrequests', { 'ProjectID': this.selectedJobId() })
                .then(({ value }) => {
                    value.forEach(r => r.displayText = `${r.requestNumber} - ${$(`<p>${r.description}</p>`).text().substring(0, 35)}`);
                    this.serviceRequests(value);
                    // Load WorkCodes for the selected ProjectID
                    let selectedJob = this.allJobs().find(j => j.projectID === this.selectedJobId());
                    if (selectedJob) {
                        this.loadWorkCodes(selectedJob.jobNo);
                    }

                }).finally(() => this.requestSelectEnable(true));
        }.bind(this));

        // Subscription to load Custom Request Fields on change
        this.selectedServiceRequest.subscribe(function (selectedServiceRequestValue) {
            if (selectedServiceRequestValue) {

                getWrapper('/api/v1/requestcustomcolums', { 'RequestID': selectedServiceRequestValue })
                    .then((response) => {
                        let customFields = response.value;
                        let validationFieldsObject = {};
                        // Process custom fields - 
                        if (customFields) {
                            //make observables and add validations if required
                            customFields.forEach(function (cf) {
                                cf.customFieldValue = ko.observable(cf.customFieldValue);
                                if (cf.isMandatory === 'Y') {
                                    cf.customFieldValue.extend({ required: { message: `Please enter a value for ${cf.customFieldName} field.` } });
                                    validationFieldsObject['f' + cf.customFieldID] = cf.customFieldValue;
                                }
                            });

                            // Set the validation model field
                            this.validationModel = ko.validatedObservable(validationFieldsObject);
                        }
                        this.customFields(customFields);
                    });
            }
        }.bind(this));


        this.editingHours.subscribe(
            function () {
                if (this.editingHours()) {
                    let hrsInput = document.getElementById('aad-job-hours');
                    hrsInput.select();
                } else {
                    if (this.jobHours() < 0) {
                        this.jobHours(0);
                    }
                    if (this.jobHours() > 24) {
                        this.jobHours(24);
                    }
                }
            }, this);
    },

    displayDialog: function (teLine) {
        // Clear previous dialog values
        this.selectedJobId(null);
        this.selectedServiceRequest(null);
        this.customFields([]);
        this.jobHours(0);
        this.workCodes([]);
        // Save the received time entry line for later use
        this.timeEntryLine = teLine;
        // Keep the default itemId to be used later on WorkCode selection
        this.defaultItemID = teLine.itemId;

        this.loadJobs();
        // Show dialog
        this.isDialogDisplaying(true);
    },
    closeDialog: function () {
        this.isDialogDisplaying(false);
    },
    getJobHours: function () {
        let value = parseFloat(this.jobHours());
        return isNaN(value) ? 0.0 : value;
    },
    save: function () {
        // Check custom fields validations
        var result = ko.validation.group(this.validationModel, { deep: true });
        if (result().length > 0) {
            // Contact validation failed -> display messages
            result.showAllMessages(true);
            return false;
        }

        let newJob = {
            servicelinetimeentryid: this.timeEntryLine.serviceLineTimeEntryID,
            requestid: this.selectedServiceRequest(),
            fordate: null,
            hours: this.getJobHours(),
            customcols: ko.toJSON(this.customFields()),
            itemid: this.selectedWorkCode()
        };

        postWrapper('/api/v1/svcaccttimeentryaddjob', ko.toJSON(newJob))
            .then((r) => {
                // Hide dialog
                this.isDialogDisplaying(false);
                // Run Callback
                this.afterSaveCallback();
            });
    },
    loadJobs: function () {
        this.loadingJobs(true);
        getWrapper('/api/v1/serviceaccountjobs', { 'OrganizationID': this.organizationID, 'ResourceID': this.timeEntryLine.resourceID })
            .then(({ value }) => {
                value.forEach(j => j.displayText = `${j.jobNo} - ${j.jobName}`);
                this.allJobs(value);
            })
            .finally(() => this.loadingJobs(false));
    },
    loadWorkCodes: function (jobno) {
        getWrapper('/api/v1/workcodes', { 'jobno': jobno, 'members': this.timeEntryLine.resourceID, 'isForSA': true })
            .then(res => {
                let selected = this.selectedWorkCode();
                this.workCodes([]);
                this.workCodes(res.value);
                this.selectedWorkCode(null);
                if (this.workCodes().findIndex(wc => wc.item_id === selected) === -1) {
                    var defaults = this.workCodes().filter(wc => wc.isDefault == "Y");
                    if (defaults.length != 0) {
                        this.selectedWorkCode(defaults[0].item_id);
                    }
                    else {
                        // Set the selected work code based on the ItemId of the TE line 
                        this.selectedWorkCode(this.workCodes().some(wc => wc.item_id === this.defaultItemID) != -1 ? this.defaultItemID : null);
                    }
                }
                else {
                    this.selectedWorkCode(selected);
                }
                $('#activityWorkCodeSelect').selectpicker('refresh');
            });
    }
};
const initWeekApproval = (approvalModel) => {
    let model = approvalModel;
    console.log(model);

    //
    // Setup binding handlers
    //
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.datepicker2 = ServiceTRAXBindingHandlers.datepicker2;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    //
    //
    model.notificationDialog = notificationDialog;

    model.resourceName = ko.observable(null);
    model.extEmployeeID = ko.observable(null);
    model.loadingData = ko.observable(false);

    //
    // Panels Expand/Collapse control
    //
    model.pannelsCollapsed = ko.observable(true);
    model.panelsCollapseToggle = function () {
        $('.dayjobsapproval-collapse').collapse(model.pannelsCollapsed() ? 'hide' : 'show');
        model.pannelsCollapsed(!model.pannelsCollapsed());
    };



    //
    // Model Setup
    //
    model.date = model.date ? ko.observable(moment(model.date).startOf('day')._d) : ko.observable(moment(new Date()).startOf('day')._d);
    model.date.subscribe(() => model.loadApprovalWeek());

    model.asResourceID = ko.observable(model.asResourceID);
    model.asResourceID.subscribe(() => model.loadApprovalWeek());

    model.moveToNextWeek = function () {
        model.date(moment(model.date()).add(1, 'weeks').startOf('week')._d);
    };

    model.moveToPrevWeek = function () {
        model.date(moment(model.date()).subtract(1, 'weeks').startOf('week')._d);
    };

    model.selectedWeekRange = ko.pureComputed(function () {
        let start = moment(model.date()).startOf('week').format('MMM Do');
        let end = moment(model.date()).endOf('week').format('MMM Do');
        return `Week of ${start} to ${end}`;
    });

    model.approvalDays = ko.observableArray([]);
    model.dayResources = ko.observableArray([]);
    model.totalHoursSum = ko.observable(0.0);
    //
    //

    //
    //
    //
    model.loadApprovalWeek = function () {
        model.loadingData(true);
        console.log("getting data ", new Date());
        getWrapper('/api/v1/myweekapproval', { 'OrganizationId': model.organizationID, "ForDate": model.date().toJSON(), "AsResourceID": model.asResourceID() })
            .then(response => {
                console.log("got response ", new Date());
                model.approvalDays(response.myapprovallistbyDay);
                model.dayResources(response.dayResources);
                model.totalHoursSum(response.totalHoursSum);
                // Set the Resource Name to show on the page
                let selectedRes = response.dayResources.find(r => r.resourceID === model.asResourceID());
                model.resourceName(selectedRes ? selectedRes.resourceName : null);
                model.extEmployeeID(selectedRes ? (selectedRes.extEmployeeID ? selectedRes.extEmployeeID : 'ADP File# missing') : null);
            }).finally(() => model.loadingData(false));
    }

    model.pendingDaysToApproveReject = ko.pureComputed(function () {
        return model.approvalDays().some(j => j.isApproved === 0);
    });
    //
    //


    //
    // Day Approval
    //
    model.dayApproval = {
        dayApproveDialogShown: ko.observable(false),
        forDate: ko.observable(null),
        timeSheetId: null,
        openDialog: function (timeSheetId, forDate) {
            this.timeSheetId = timeSheetId;
            this.dayApproveDialogShown(true);
            this.forDate(forDate);
        },
        closeDialog: function () {
            this.dayApproveDialogShown(false);
        },
        dialogText: ko.pureComputed(function () {
            let momentdate = moment(model.dayApproval.forDate());
            return `You are approving the daily time sheet for ${momentdate.format('dddd')} ${momentdate.format('L')}. Do you wish to proceed ?`
        }),
        approveDay: function () {
            postWrapper('/api/v1/daytimesheet', ko.toJSON({ timeSheetId: this.timeSheetId, approved: true, rejectReason: ''}))
                .then(({ value }) => {
                    this.dayApproveDialogShown(false);
                    if (value.succeeded) {
                        model.loadApprovalWeek();
                    } else {
                        model.notificationDialog.displayDialog('CANNOT APPROVE', value.errorMessage);
                    }
                });
        }
    }
    //
    //

    //
    // Day Remove PTO
    //
    model.dayPTO = {
        dayRemovePTODialogShown: ko.observable(false),
        forDate: ko.observable(null),
        timeSheetId: null,
        orgId: model.organizationID,
        openDialog: function (timeSheetId, forDate) {
            this.timeSheetId = timeSheetId;
            this.dayRemovePTODialogShown(true);
            this.forDate(forDate);
        },
        closeDialog: function () {
            this.dayRemovePTODialogShown(false);
        },
        dialogText: ko.pureComputed(function () {
            let momentdate = moment(model.dayPTO.forDate());
            return `You are removing the PTO for ${momentdate.format('dddd')} ${momentdate.format('L')}. Do you wish to proceed ?`
        }),
        removePTO: function () {
            postWrapper('/api/v1/dayremovepto', ko.toJSON({ forDate: this.forDate, resourceId: model.asResourceID(), organizationId: this.orgId }))
                .then(({ value }) => {
                    this.dayRemovePTODialogShown(false);
                    if (value.succeeded) {
                        model.loadApprovalWeek();
                    } else {
                        model.notificationDialog.displayDialog('CANNOT REMOVE PTO', value.errorMessage);
                    }
                });
        }
    }
    //
    //
    //
    // Day Reject
    //
    model.dayReject = {
        dayRejectDialogShown: ko.observable(false),
        forDate: ko.observable(null),
        reason: ko.observable(''),
        timeSheetId: null,
        openDialog: function (timeSheetId, forDate) {
            this.timeSheetId = timeSheetId;
            this.dayRejectDialogShown(true);
            this.reason('');
            this.forDate(forDate);
        },
        closeDialog: function () {
            this.dayRejectDialogShown(false);
        },
        dialogText: ko.pureComputed(function () {
            return `You are about to REJECT your daily timesheet for ${moment(this.forDate).format('dddd')} ${moment(this.forDate).format('L')}. Do you wish to proceed ?`
        }),
        rejectDay: function () {
            postWrapper('/api/v1/daytimesheet', ko.toJSON({ 'timeSheetId': this.timeSheetId, 'approved': false, 'rejectReason': this.reason()}))
                .then(({ value }) => {
                    this.dayRejectDialogShown(false);
                    if (value.succeeded) {
                        model.loadApprovalWeek();
                    } else {
                        model.notificationDialog.displayDialog('CANNOT REJECT', value.errorMessage);
                    }
                });
        }
    }

    //
    //

    //
    // Week Approval
    //
    model.weekApproval = {
        weekApproveDialogShown: ko.observable(false),
        forDate: null,
        openDialog: function (forDate) {
            this.forDate = forDate;
            this.weekApproveDialogShown(true);
        },
        closeDialog: function () {
            this.weekApproveDialogShown(false);
        },
        approveWeek: function () {
            postWrapper('/api/v1/weektimesheet', ko.toJSON({ 'date': this.forDate, 'approved': true, rejectReason: '', 'asresourceid': model.asResourceID() }))
                .then(({ value }) => {
                    this.weekApproveDialogShown(false);
                    if (value.succeeded) {
                        model.loadApprovalWeek();
                    } else {
                        model.notificationDialog.displayDialog('CANNOT APPROVE', value.errorMessage);
                    }
                });
        }
    }
    //
    //

    //
    // Week Reject
    //
    model.weekReject = {
        weekRejectDialogShown: ko.observable(false),
        forDate: null,
        reason: ko.observable(''),
        openDialog: function (forDate) {
            this.forDate = forDate;
            this.reason('');
            this.weekRejectDialogShown(true);
        },
        closeDialog: function () {
            this.weekRejectDialogShown(false);
        },
        rejectWeek: function () {
            postWrapper('/api/v1/weektimesheet', ko.toJSON({ 'date': this.forDate, 'approved': false, 'rejectReason': this.reason(), 'asresourceid': model.asResourceID() }))
                .then(({ value }) => {
                    this.weekRejectDialogShown(false);
                    if (value.succeeded) {
                        model.loadApprovalWeek();
                    } else {
                        model.notificationDialog.displayDialog('CANNOT REJECT', value.errorMessage);
                    }
                });
        }
    }

    //
    //

    //
    // Undo Approval
    //
    model.undoApproval = function (timeSheetID, forDate) {
        model.notificationDialog.displayConfirmationDialog('UNDO DAY TIME APPROVAL', `Are you sure you want to undo your time sheet approval for ${moment(forDate).format('dddd, MMMM D, YYYY')}?`, () => model.performUndoApproval(timeSheetID), { 'ok': 'Yes, undo it', 'cancel': 'No' });
    }

    model.performUndoApproval = function (timeSheetID) {
        postWrapper('/api/v1/undoapproval', ko.toJSON({ 'TimeSheetID': timeSheetID }))
            .then(({ value }) => {
                if (value.succeeded) {
                    model.loadApprovalWeek();
                } else {
                    model.notificationDialog.displayDialog('Time Undo Issues', value.errorMessage);
                }
            });
    }
    //
    //

    //
    // Init load
    //
    model.loadApprovalWeek();
    //
    //

    //
    // KO ApplyBindings
    ko.applyBindings(model);
    //
    //
};

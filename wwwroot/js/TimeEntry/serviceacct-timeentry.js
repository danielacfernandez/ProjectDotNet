const initServiceAccountTimeEntry = (svcAcctTimeEntryModel) => {

    let model = svcAcctTimeEntryModel;
    //console.log(model);

    //
    model.addActivityDialog = addActivityDialog;
    model.timeentryPikerModal = timeentryPikerModal;
    model.multiResourceAction = multiResourceAction;
    model.addExceptionDialog = addExceptionDialog;
    model.notificationDialog = notificationDialog;
    //

    //
    // Validations setup (actually needed for Add Activity Modal custom fields validations) 
    //
    ko.validation.init({
        errorElementClass: 'text-danger',
        errorMessageClass: 'help-block',
        decorateElement: true,
        insertMessages: false
    });
    ko.validation.registerExtenders();

    //
    //

    //
    // Setup binding handlers
    //
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    //
    //

    //
    model.reloadPage = function () {
        redirectToPage('/TimeEntry/ServiceAccount', { 'OrganizationID': model.organizationID, 'forDate': moment.utc(model.date()).toJSON(), 'UserID': model.forUserId });
    }
    //


    //
    // Model Setup
    //
    model.date = model.date ? ko.observable(model.date) : ko.observable(moment(new Date()).startOf('day').toJSON());
    model.date.subscribe(model.reloadPage);
    model.todayDate = ko.observable(moment(new Date()).startOf('day').toJSON());

    model.addTeamMemberDialog = addTeamMemberDialog;

    //
    // Screen Width Check
    //
    model.screenLGorWider = window.getComputedStyle(document.getElementById('screen-width-check')).display === 'none';
    //
    //

    //
    // Day data
    // 
    model.dayDataLoadCompleted = ko.observable(false);
    model.dayResources = ko.observableArray([]);
    model.isReadOnlyScreen = ko.observable(false);
    model.loadDayResources = function () {
        model.dayDataLoadCompleted(false);

        getWrapper('/api/v1/serviceaccountdayresources', { 'OrganizationID': model.organizationID, 'ForDate': model.date() })
            .then(({ resources, isReadOnly }) => {
                // Prepare resources model/observables
                //let resources = response.value;
                resources.forEach(function (r) {
                    r.hoursQty = ko.observable(r.hoursQty);
                    r.activities.forEach(function (a) {
                        a.hoursQty = ko.observable(a.hoursQty);
                        a.hoursQty.subscribe(function (hrsValue) {
                            hrsValue = parseFloat(hrsValue);
                            a.hoursQty(isNaN(hrsValue) ? 0.0 : hrsValue);
                            model.UpdateServiceLine(a.serviceLineId, hrsValue);
                        });
                        a.projectNameDisplayValue = $(`<p>${a.projectName}</p>`).text().substring(0, 35);
                    });
                });
                model.dayResources(resources);
                model.isReadOnlyScreen(isReadOnly);
            }).finally(() => model.dayDataLoadCompleted(true));
    };
    //
    //


    //
    // Service Line time update
    //
    model.increaseTime = function (time) {
        time.hoursQty(time.hoursQty() + 0.25);
        //model.UpdateServiceLine(time.serviceLineId, time.hoursQty());
    }

    model.decreaseTime = function (time) {
        time.hoursQty(time.hoursQty() - 0.25);
        //model.UpdateServiceLine(time.serviceLineId, time.hoursQty());
    }

    model.UpdateServiceLine = function (servicelineid, hours) {
        postWrapper('/api/v1/svcaccttimeentryupdate', ko.toJSON({ 'servicelineid': servicelineid, 'hours': hours }))
            .then(function (response) {
                console.log('Time updated');
            });
    }
    //
    //

    //
    // Add Activity Dialog
    // 
    model.addActivityDialog.initDialog(model.organizationID, model.loadDayResources);
    model.addJob = function (teLine) {
        model.addActivityDialog.displayDialog(teLine);
    }
    //
    //

    //
    // Missing Lunch
    //
    model.missingLunchModal = {
        isDialogDisplaying: ko.observable(false),
        message: ko.observable(''),
        goAheadCallback: null,

        showDialog: function (message, goAheadCallback) {
            this.message(message);
            this.isDialogDisplaying(true);
            this.goAheadCallback = goAheadCallback;
        },
        close: function () {
            this.isDialogDisplaying(false);
        },
        goAhead: function () {
            this.goAheadCallback();
        },

        goBack: function () {
            this.isDialogDisplaying(false);
        }
    }
    //
    //

    //
    // Header Line Handling (Start/End)
    //
    model.updateJobTimeEntry = function (serviceLineTimeEntry, type, time, notes) {
        timeentryPikerModal.show(serviceLineTimeEntry, type, model.addJobTimeEntryPost, time, notes);
    }

    model.callTimeEntryUpdate = function (updateDetails) {
        return postWrapper('/api/v1/timeentryupdate', ko.toJSON(updateDetails));
    }


    model.addJobTimeEntryPost = function (serviceLineTimeEntry, type, time, notes) {
        let updateDetails = {
            'serviceLineTimeEntry': serviceLineTimeEntry,
            'type': type,
            'time': time,
            'forceendwolunch': false,
            'notes': notes
        };

        model.callTimeEntryUpdate(updateDetails).then(function (response) {
            model.processUpdateResponse(updateDetails, response.value);
        });
    }


    function showTEUpdateSimpleErrorMessage(response, errorCode) {
        timeentryPikerModal.close();

        let idx = response.codeResult.split('_').indexOf(errorCode);
        if (idx > -1) {
            let errorMsg = response.errorMessage.split('|')[idx];
            model.notificationDialog.displayDialog('CLOCK OUT ERROR', errorMsg);
        } else {
            return true;
        }

        return false;
    }


    model.processUpdateResponse = function (updateDetails, response) {
        if (!response.succeeded) {

            if (!showTEUpdateSimpleErrorMessage(response, 'ENDTIMESAMLLERTHANSTARTTIME')) {
                return;
            }

            if (!showTEUpdateSimpleErrorMessage(response, 'ENDTIMESAMLLERTHANLUNCHTIME')) {
                return;
            }

            switch (response.codeResult.toUpperCase()) {
                case 'MISSINGLUNCH':
                    timeentryPikerModal.close();
                    model.missingLunchModal.showDialog(response.errorMessage, function () { model.endWithoutLunch(updateDetails); });
                    break;
                case 'NOTESELF':
                    timeentryPikerModal.close();
                    model.newLeadModal.showDialog(response.errorMessage, updateDetails.serviceLineTimeEntry, function () { model.callTimeEntryUpdate(updateDetails); model.newLeadModal.close(); });
                    break;
                default:
                    model.notificationDialog.displayDialog('UPDATE TIME ENTRY ERROR', response.errorMessage);
                    break;
            }

        } else if (response.succeeded) {
            if (response.codeResult === 'AUTOSIGNEDOUT') {
                model.notificationDialog.displayDialog('START', response.errorMessage);
            }

            timeentryPikerModal.close();
            model.loadDayResources();
        }
    }

    model.endWithoutLunch = function (updateDetails) {
        updateDetails.forceendwolunch = true;
        model.callTimeEntryUpdate(updateDetails).then(function () {
            model.missingLunchModal.close();
            model.loadDayResources();
        });
    }
    //
    //



    // 
    // Auto Start dialog
    //
    model.showAutoStartDialog = function (serviceId) {

        getWrapper('/api/v1/svcacctautostart', { 'OrganizationID': model.organizationID, 'ForDate': model.date() })
            .then((response) => model.multiResourceAction.displayDialog('START', null, response.value, model.saveAutoStart));
    }


    model.saveAutoStart = function (serviceId, autoStartResources) {
        let autoStartData = {
            ServiceId: null,
            ForDate: model.date(),
            ResourceIds: autoStartResources.filter(r => r.autoFlagValue === true).map(r => r.resourceId)
        };

        postWrapper('/api/v1/svcacctautostart', ko.toJSON(autoStartData))
            .then((response) => {
                if (response.codeResult === 'AUTOSIGNEDOUT') {
                    model.notificationDialog.displayDialog('START', response.errorMessage);
                }
                // Close dialog and refresh the page
                model.multiResourceAction.closeDialog();
                model.loadDayResources();
            });
    }
    //
    //


    //
    // Auto End Dialog
    //
    model.showAutoEndDialog = function (serviceId) {

        getWrapper('/api/v1/svcacctautoend', { 'OrganizationID': model.organizationID, 'ForDate': model.date() })
            .then(({ value }) => {
                // Displays the modal passing the resources
                model.multiResourceAction.displayDialog('END', null, value, model.saveAutoEnd);
            });
    }

    model.saveAutoEnd = function (serviceid, resources, forceendwolunch = false) {

        let autoEndData = {
            ServiceId: serviceid,
            ForDate: model.date(),
            ForceEndWOLunch: forceendwolunch,
            ResourceIds: resources.filter(r => r.autoFlagValue === true).map(r => r.resourceId)
        };

        fetch(`/api/v1/svcacctautoend`,
            {
                method: 'POST',
                body: ko.toJSON(autoEndData),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (serverReply) {

                let response = serverReply.value;

                if (!response.succeeded) {
                    if (response.codeResult === 'MISSINGLUNCH') {
                        model.multiResourceAction.closeDialog();
                        model.missingLunchModal.showDialog(response.errorMessage, function () {
                            model.saveAutoEnd(serviceid, resources, true);
                        });
                    }
                    if (response.codeResult === 'NOTESELF') {
                        model.multiResourceAction.closeDialog();
                        model.newLeadModal.showDialog(response.errorMessage, updateDetails.serviceLineTimeEntry, function () { model.callTimeEntryUpdate(updateDetails); model.newLeadModal.close(); });
                    }
                } else if (response.succeeded) {
                    model.missingLunchModal.close();
                    model.multiResourceAction.closeDialog();
                    model.loadDayResources();
                }
            });
    }
    //
    //




    //
    // Add Lunch Handling
    //
    model.showAddLunchDialog = function () {
        getWrapper('/api/v1/svcacctaddlunch', { 'OrganizationID': model.organizationID, 'ForDate': model.date() })
            .then(({ value }) => {
                // Displays the modal passing the resources
                model.multiResourceAction.displayDialog('LUNCH', null, value, model.saveLunch);
            });
    }

    model.apiSaveLunch = function (serviceid, resourceIds) {

        let lunchersData = {
            ServiceId: serviceid,
            ForDate: model.date(),
            ResourceIds: resourceIds
        };

        return postWrapper('/api/v1/svcacctaddlunch', ko.toJSON(lunchersData));

        //return fetch(`/api/v1/svcacctaddlunch`,
        //    {
        //        method: 'POST',
        //        body: ko.toJSON(lunchersData),
        //        headers: { 'Content-Type': 'application/json' }
        //    }).then(res => res.json())
        //    .catch(error => console.error('Error:', error));
    }

    model.saveLunch = function (serviceid, resources) {
        model.apiSaveLunch(serviceid, resources.filter(r => r.autoFlagValue === true).map(r => r.resourceId))
            .then(function (response) {
                model.multiResourceAction.closeDialog();
                model.processUpdateResponse(null, response.value);
            })
    }

    model.addSingleLunch = function (resourceid) {
        model.apiSaveLunch(null, [resourceid])
            .then(({ value }) => {
                model.processUpdateResponse(null, value);
                //model.loadDayResources();
            })
    }
    //
    //


    //
    // Remove Lunch Handling
    //
    model.removeLunch = function (serviceLineTimeEntryID) {
        model.notificationDialog.displayConfirmationDialog('REMOVE LUNCH', 'Are you sure that you want to delete this Lunch time?', () => model.removeLunchAction(serviceLineTimeEntryID), { 'ok': 'Yes, delete.', 'cancel': 'Cancel' });
    }

    model.removeLunchAction = function (serviceLineTimeEntryID) {
        postWrapper('/api/v1/removelunch', ko.toJSON({ 'serviceLineTimeEntry': serviceLineTimeEntryID }))
            .then((resp) => {
                if (resp.succeeded) {
                    model.reloadPage();
                }
            });
    }
    //
    //


    //
    // Add Team Member
    //
    model.showAddTeamMemberModal = function () {
        model.addTeamMemberDialog.displayDialog(null, null, model.organizationID, model.date(), model.addMemberCloseCallback);
    }

    model.addMemberCloseCallback = function () {
        model.loadDayResources();
    }
    //
    //

    //
    // No Show/Exception dialog handling
    //
    model.showExceptionDialog = function (servicelinetimeentryid, resourceid, noShowObj) {
        addExceptionDialog.displayDialog(servicelinetimeentryid, null, null, resourceid, model.saveException, noShowObj);
    }

    model.saveException = function (servicelinetimeentryid, serviceid, timeentrydate, resourceid, noshowid, noshownotes) {

        let exceptionData = {
            servicelinetimeentryid: servicelinetimeentryid,
            serviceid: serviceid,
            timeentrydate: timeentrydate,
            resourceid: resourceid,
            noshowid: noshowid,
            noshownotes: noshownotes
        };

        postWrapper('/api/v1/timeentryresourcenoshow', ko.toJSON(exceptionData))
            .then((r) => {
                if (r.succeeded) {
                    addExceptionDialog.closeDialog();
                    model.loadDayResources();
                }
            });
    }

    //
    // Init
    //
    model.loadDayResources();
    //
    //

    //
    // KO ApplyBindings
    ko.applyBindings(model);
    //
    //
};
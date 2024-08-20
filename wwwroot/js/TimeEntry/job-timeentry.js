initJobTimeEntry = (timeentryModel) => {
    let model = timeentryModel;
    //console.log(model);
    //
    // Setup model for Modals that are in other js files
    //
    model.timeentryPikerModal = timeentryPikerModal;
    model.multiResourceAction = multiResourceAction;
    model.addTeamMemberDialog = addTeamMemberDialog;
    model.addExceptionDialog = addExceptionDialog;
    model.notificationDialog = notificationDialog;
    //
    //

    //
    // Model setup
    //
    model.timeEntries = ko.observableArray([]);
    model.dayUsers = ko.observableArray([]);
    model.userControls = ko.observable({});

    model.date = model.date ? ko.observable(model.date) : ko.observable(moment(new Date()).startOf('day').toJSON());
    model.todayDate = ko.observable(moment(new Date()).startOf('day').toJSON());

    // Date change subscription
    model.date.subscribe(function () {
        model.reloadPage();
    });

    model.forUserID = ko.observable(model.forUserID);
    model.forUserID.subscribe(function () {
        model.reloadPage();
    });

    model.dayDataLoadCompleted = ko.observable(false);
    //
    //

    //
    // Screen Width Check
    //
    model.screenLGorWider = window.getComputedStyle(document.getElementById('screen-width-check')).display === 'none';
    //
    //

    //
    model.reloadPage = function () {
        //let userIDParam = model.forUserID() ? `&ForUserID=${model.forUserID()}` : '';
        //let dateParam = `&forDate=${moment.utc(model.date()).toJSON()}`; //.format('YYYY-MM-DD')}`;
        //window.location = `/TimeEntry/Job?OrganizationID=${model.organizationID}${dateParam}${userIDParam}`;
        redirectToPage('/TimeEntry/Job', { 'OrganizationID': model.organizationID, 'forDate': moment.utc(model.date()).toJSON(), 'ForUserID': model.forUserID() });
    }
    //

    //
    // Approve My Week (with impersonation)
    //
    model.goToApproveMyWeek = function () {
        redirectToPage('/TimeEntry/Approval', { 'organizationid': model.organizationID, 'AsUserID': model.forUserID() }, false);
    }
    //
    //


    model.openDailyStatusReport = function (serviceID) {
        redirectToPage('/TimeEntry/DailyStatusReport', { 'organizationid': model.organizationID, 'serviceid': serviceID, 'fordate': model.date() }, true);
    }


    model.openSR = function (requestID) {
        redirectToPage('/Request', { 'organizationid': model.organizationID, 'RequestID': requestID }, true);
    }

    model.openSRDocs = function (projectNo) {
        redirectToPage('/Search/ProjectDocuments', { 'OrganizationID': model.organizationID, 'ProjectNo': projectNo }, true);
    }

    model.dailyStatusReportDialog = {
        isDialogDisplaying: ko.observable(false),
        serviceid: null,
        projectno: null,
        requestno: null,
        versionno: null,
        jobname: '',
        workstations: ko.observable(0),
        privateoffices: ko.observable(0),
        confrooms: ko.observable(0),
        ancillaryareas: ko.observable(0),
        seating: ko.observable(0),
        projectcompletionpctg: ko.observable(0),
        installationcompletedtoday: ko.observable(''),
        installationscheduledfortotay: ko.observable(''),
        productissuesjobconcerns: ko.observable(''),
        images: ko.observableArray([]),
        newImages: ko.observableArray([]),
        punchOrChange: ko.observable(''),
        cleanedAndCollected: ko.observable(''),
        checkWithClient: ko.observable(''),
        gearsAndToolsCollected: ko.observable(''),
        isPaperWorkSignedOff: ko.observable(''),
        vendorBadgesOrKeysReturned: ko.observable(''),
        productReturnFormsCompleted: ko.observable(''),

        modelChangeTracker: ko.observable(null),
        //modelChangeTracker: {
        //    isDirty: function () { console.log('123123123'); } }, 

        actionMessageBox: {
            visible: ko.observable(false),
            spinner: ko.observable(false),
            text: ko.observable(''),
            outcomevisible: ko.observable(false),
            outcometext: ko.observable(''),
            isSendingEmail: ko.observable(false),
            hide: function () {
                this.visible(false);
                this.spinner(false);
                this.outcomevisible(false);
            },
            show: function () {
                this.visible(true);
                //var d = document.getElementById('divActionMessageBox');
                //d.scrollIntoView();
            },
            previewGeneration: function () {
                this.hide();
                this.text('Saving Report version...');
                this.spinner(true);
                this.show();
            },
            previewGenerated: function () {
                this.hide();
                this.outcometext('Saved!');
                this.outcomevisible(true);
                this.show();
            },
            emailSending: function () {
                this.isSendingEmail(true);
                this.hide();
                this.text('Sending report email...');
                this.spinner(true);
                this.show();
            },
            emailSent: function (text) {
                this.isSendingEmail(false);
                this.hide();
                this.outcometext(text);
                this.outcomevisible(true);
                this.show();
            }
        },

        showDialog: function (serviceID, ProjectNo, RequestNo, VersionNo, JobName) {
            this.serviceid = serviceID;
            this.projectno = ProjectNo;
            this.requestno = RequestNo;
            this.versionno = VersionNo;
            this.jobname = JobName;
            
            this.loadReportFromAPI();
        },
        loadReportFromAPI: function () {
            getWrapper('/api/v1/emaildailystatusreport', { 'organizationid': model.organizationID, 'serviceid': this.serviceid, 'fordate': model.date() })
                .then((r) => {
                    console.log('loadReportFromAPI');
                    console.log(r);
                    this.workstations(r.workstationCount);
                    this.privateoffices(r.privateOfficeCount);
                    this.confrooms(r.confRoomCount);
                    this.ancillaryareas(r.ancillaryAreaCount);
                    this.seating(r.seatingCount);
                    this.projectcompletionpctg(r.pctComplete);
                    this.installationcompletedtoday(r.notesToday);
                    this.installationscheduledfortotay(r.notesTomorrow);
                    this.productissuesjobconcerns(r.notesIssue);
                    this.images(r.imageIDs);
                    this.newImages([]);

                    this.punchOrChange(null);
                    this.cleanedAndCollected(null);
                    this.checkWithClient(null);
                    this.gearsAndToolsCollected(null);
                    this.isPaperWorkSignedOff(null);
                    this.vendorBadgesOrKeysReturned(null);
                    this.productReturnFormsCompleted(null);

                    if (r.punchOrChange == true) this.punchOrChange("true"); 
                    if (r.punchOrChange == false) this.punchOrChange("false");

                    if (r.cleanedAndCollected == true) this.cleanedAndCollected("true");
                    if (r.cleanedAndCollected == false) this.cleanedAndCollected("false");

                    if (r.checkWithClient == true) this.checkWithClient("true");
                    if (r.checkWithClient == false) this.checkWithClient("false");

                    if (r.gearsAndToolsCollected == true) this.gearsAndToolsCollected("true");
                    if (r.gearsAndToolsCollected == false) this.gearsAndToolsCollected("false");
                    console.log('isPaperwork: ' + r.isPaperworkSignedOff);
                    if (r.isPaperworkSignedOff == true) this.isPaperWorkSignedOff("true");
                    if (r.isPaperworkSignedOff == false) this.isPaperWorkSignedOff("false");

                    if (r.vendorBadgesOrKeysReturned == true) this.vendorBadgesOrKeysReturned("true");
                    if (r.vendorBadgesOrKeysReturned == false) this.vendorBadgesOrKeysReturned("false");

                    if (r.productReturnFormsCompleted == true) this.productReturnFormsCompleted("true");
                    if (r.productReturnFormsCompleted == false) this.productReturnFormsCompleted("false");



                    this.trackableModel = {
                        'p01': this.workstations,
                        'p02': this.privateoffices,
                        'p03': this.confrooms,
                        'p04': this.ancillaryareas,
                        'p05': this.seating,
                        'p06': this.projectcompletionpctg,
                        'p07': this.installationcompletedtoday,
                        'p08': this.installationscheduledfortotay,
                        'p09': this.productissuesjobconcerns,
                        'p10': this.images,
                        'p11': this.newImages,
                        'p12': this.punchOrChange,
                        'p13': this.cleanedAndCollected,
                        'p14': this.checkWithClient,
                        'p15': this.isPaperWorkSignedOff,
                        'p16': this.gearsAndToolsCollected,
                        'p17': this.vendorBadgesOrKeysReturned,
                        'p18': this.productReturnFormsCompleted

                    }
                    this.modelChangeTracker(ko.dirtyFlag(this.trackableModel));
                    //model.modelChangeTracker.reset();

                    this.isDialogDisplaying(true);
                });
        },
        dataModified: ko.pureComputed(function () {
            let ct = model.dailyStatusReportDialog.modelChangeTracker();
            return ct && !ct.isDirty();
        }),
        closeDialog: function () {
            this.punchOrChange(null);
            this.isDialogDisplaying(false);
        },
        toInt: function (v) {
            let r = parseInt(v);
            if (isNaN(r)) {
                return 0;
            }
            return r;
        },
        insertFilesFromInput: function (files) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                this.newImages.push(file);
            }
        },
        dragover: function (e) {
            e.preventDefault();
        },
        dropFileHandler: function (e, b) {
            if (e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.types) {
                if (e.originalEvent.dataTransfer.types.every(t => t === 'Files')) {
                    let files = e.originalEvent.dataTransfer.files;
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        this.newImages.push(file);
                    }
                }
            }
        },
        saveReportVersion: async function () {
            this.punchOrChange.extend({ required: { message: 'Select an option' } });
            this.cleanedAndCollected.extend({ required: { message: 'Select an option' } });
            this.checkWithClient.extend({ required: { message: 'Select an option' } });
            this.gearsAndToolsCollected.extend({ required: { message: 'Select an option' } });
            this.isPaperWorkSignedOff.extend({ required: { message: 'Select an option' } });
            this.vendorBadgesOrKeysReturned.extend({ required: { message: 'Select an option' } });
            this.productReturnFormsCompleted.extend({ required: { message: 'Select an option' } });

            var valid = model.saveValidator.isValid();
            if (!valid) {
                let data = {
                    Succeeded: false
                };
                return ko.toJSON(data);
            };

            let reportData = {
                'serviceid': this.serviceid,
                'statusdate': model.date(),
                'workstationcount': this.toInt(this.workstations()),
                'privateofficecount': this.toInt(this.privateoffices()),
                'confroomcount': this.toInt(this.confrooms()),
                'ancillaryareacount': this.toInt(this.ancillaryareas()),
                'seatingcount': this.toInt(this.seating()),
                'pctcomplete': this.toInt(this.projectcompletionpctg()),
                'notestoday': this.installationcompletedtoday(),
                'notestomorrow': this.installationscheduledfortotay(),
                'notesissue': this.productissuesjobconcerns(),
                'images': this.images().join(','),
                'punchOrChange': this.punchOrChange(),
                'cleanedAndCollected': this.cleanedAndCollected(),
                'checkWithClient': this.checkWithClient(),
                'gearsAndToolsCollected': this.gearsAndToolsCollected(),
                'isPaperWorkSignedOff': this.isPaperWorkSignedOff(),
                'vendorBadgesOrKeysReturned': this.vendorBadgesOrKeysReturned(),
                'productReturnFormsCompleted': this.productReturnFormsCompleted()
            };

            console.log(reportData);
            console.log(ko.toJSON(reportData));

            let request = {
                'projectno': this.projectno,
                'requestno': this.requestno,
                'versionno': this.versionno
            };

            var reportDataForm = new FormData();
            reportDataForm.append('report', ko.toJSON(reportData));
            reportDataForm.append('request', ko.toJSON(request));
            // Compress and append files (attachments)
            for (var f = 0; f < this.newImages().length; f++) {
                await this.compressImage(f, reportDataForm);
            };

            return fetch('/api/v1/emaildailystatusreport',
                {
                    method: 'POST',
                    body: reportDataForm,
                })
                .then(res => res.json())
                .then((reply) => {
                    if (reply.succeeded) {
                        this.loadReportFromAPI();
                    }
                    return reply;
                })
                .catch(error => console.error('Error:', error));
        },

        compressImage: function (f, form) {
            console.log('compressImage');

            return new Promise(resolve => {
                new Compressor(this.newImages()[f], {
                    quality: 0.3,
                    strict: true,
                    minWidth: 0,
                    minHeight: 0,
                    //resize: 'none',
                    //mimeType: '',
                    //convertTypes: 'image/jpg, image/jpeg,image/png,image/webp',
                    convertSize: 700000,
                    success: (result) => {
                        form.append('files', result, result.name);
                        resolve(result);
                    },
                    error: (er) => {
                        model.notificationDialog.displayDialog('IMAGE ERROR', 'Please, check the images you attached. Error: ' + er.message);
                    }
                });
            });

        },

        sendReportEmail: function () {
            this.actionMessageBox.emailSending();
            getWrapper('/api/v1/sendemaildailystatusreport', { 'organizationid': model.organizationID, 'serviceid': this.serviceid, 'fordate': model.date(), 'jobname': this.jobname })
                .then((r) => {
                    if (r.succeeded) {
                        this.actionMessageBox.emailSent('Email Sent!');
                    } else {
                        this.actionMessageBox.emailSent(`Failure sending email ** ${r.errormsg}`);
                    }
                });
        },
        previewReport: function () {
            this.actionMessageBox.previewGeneration();

            this.saveReportVersion()
                .then((r) => {
                    console.log(r);
                    if (r.succeeded) {
                        console.log('here');
                        //model.openDailyStatusReport(this.serviceid);
                        this.actionMessageBox.previewGenerated();
                    }
                    else this.actionMessageBox.hide();
                });
        },
        viewReport: function () {
            model.openDailyStatusReport(this.serviceid);
        },
        imagePanel: {
            open: ko.observable(false),
            source: ko.observable(''),
            localResource: false,
            imageIdentifier: ''
        },
        viewImage: function (data, isLocalResource) {
            this.localResource = isLocalResource;
            if (isLocalResource) {
                this.imagePanel.source(URL.createObjectURL(data));
                this.imageIdentifier = data.name;
            } else {
                this.imagePanel.source('/TimeEntry/DSRImage/' + data);
                this.imageIdentifier = data;
            }

            this.imagePanel.open(true);
        },
        removeImage: function () {
            if (this.localResource) {
                this.newImages.remove((image) => image.name === this.imageIdentifier);
            } else {
                this.images.remove(this.imageIdentifier);
            }
        },
        closeImage: function () {
            this.open(false);
        }

       
    }
    ko.validation.init({
        errorElementClass: 'text-danger',
        errorMessageClass: 'help-block',
        decorateElement: true,
        insertMessages: false
    });

    model.saveValidator = {

        saveValidations: {
            a: model.dailyStatusReportDialog.punchOrChange,
            b: model.dailyStatusReportDialog.cleanedAndCollected,
            c: model.dailyStatusReportDialog.checkWithClient,
            d: model.dailyStatusReportDialog.isPaperWorkSignedOff,
            e: model.dailyStatusReportDialog.gearsAndToolsCollected,
            f: model.dailyStatusReportDialog.vendorBadgesOrKeysReturned,
            g: model.dailyStatusReportDialog.productReturnFormsCompleted
        },
        saveValidationModel: ko.validatedObservable({
            a: model.dailyStatusReportDialog.punchOrChange,
            b: model.dailyStatusReportDialog.cleanedAndCollected,
            c: model.dailyStatusReportDialog.checkWithClient,
            d: model.dailyStatusReportDialog.isPaperWorkSignedOff,
            e: model.dailyStatusReportDialog.gearsAndToolsCollected,
            f: model.dailyStatusReportDialog.vendorBadgesOrKeysReturned,
            g: model.dailyStatusReportDialog.productReturnFormsCompleted
        }),
        hideAllMessages: function () {
            this.saveValidationModel.errors.showAllMessages(false);
        }, 
        isValid: function () {
            console.log('isValid function');
            console.log(this.saveValidationModel());
            console.log('here');
            console.log(this.saveValidationModel.isValid());
            if (!this.saveValidationModel.isValid()) {
                this.saveValidationModel.errors.showAllMessages(true);
                return false;
            }
           return true;
        }
    }
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




    model.newLeadModal = {
        isDialogDisplaying: ko.observable(false),
        message: ko.observable(''),
        goAheadCallback: null,
        newLeadAvailableResources: ko.observableArray([]),
        newLead: ko.observable(null),
        serviceLineTimeEntry: null,
        serviceID: null,

        showDialog: function (message, serviceLineTimeEntry, serviceID, goAheadCallback, forbiddenResources) {
            this.message(message);
            this.newLead(null);
            this.goAheadCallback = goAheadCallback;
            this.serviceLineTimeEntry = serviceLineTimeEntry;
            this.serviceID = serviceID;
            this.forbiddenResources = forbiddenResources ? forbiddenResources : []; // Resources that will not be displayed as possible Leads (i.e. resources that might have been selected for Auto Out)
            console.log(this.forbiddenResources);

            // Load the modal data
            getWrapper('/api/v1/teleadresource', { 'ServiceLineTimeEntryID': serviceLineTimeEntry, 'ServiceID': serviceID, 'ForDate': model.date() })
                .then(({ value }) => {
                    // Remove resources that are being singed out
                    let autoEndSelectedResources = this.forbiddenResources.filter(r => r.autoFlagValue === true).map(r => r.resourceId);
                    let availableResourcesForLead = value.filter(r => !autoEndSelectedResources.includes(r.resourceID));
                    //value.filter(t => !this.forbiddenResources.filter(r => r.autoFlagValue===true).map(r => r.resourceId).includes(t.resourceID))

                    this.newLeadAvailableResources(availableResourcesForLead);
                    // Displays the dialog
                    this.isDialogDisplaying(true);
                });
        },
        close: function () {
            this.isDialogDisplaying(false);
        },
        goAhead: function () {

            let newLeadData = {
                ServiceLineTimeEntryID: this.serviceLineTimeEntry,
                ServiceId: this.serviceID,
                ResourceId: this.newLead(),
                ForDate: model.date()
            };

            // Assign the new Lead
            postWrapper('/api/v1/teleadresource', ko.toJSON(newLeadData))
                .then((response) => this.goAheadCallback());
        },

        goBack: function () {
            this.isDialogDisplaying(false);
        }
    }



    // 
    // Auto Start dialog
    //
    model.showAutoStartDialog = function (serviceId, requestscheduleid) {

        getWrapper('/api/v1/autostart', { 'ServiceId': serviceId, 'requestscheduleid': requestscheduleid, 'ForDate': model.date(), 'AsUserID': model.forUserID() })
            .then(function ({ value } = response) {
                if (value.succeded) {
                    // Displays the modal passing the resources
                    model.multiResourceAction.displayDialog('START', serviceId, requestscheduleid, value.autoDayResources, model.saveAutoStart);
                }
                else {
                    model.notificationDialog.displayDialog('AUTO-START ERROR', value.errorMessage);
                }
            });

    }


    model.saveAutoStart = function (serviceid, resources) {

        let autoStartData = {
            ServiceId: serviceid,
            ForDate: model.date(),
            ResourceIds: resources.filter(r => r.autoFlagValue === true).map(r => r.resourceId)
        };

        postWrapper('/api/v1/autostart', ko.toJSON(autoStartData))
            .then(({ value }) => {
                if (value.succeeded) {
                    // Check if the AutoStart closed some open job for some resource
                    if (value.codeResult === 'AUTOSIGNEDOUT') {
                        model.notificationDialog.displayDialog('AUTO-START', value.errorMessage);
                    }

                    // Close dialgo and refresh the page
                    model.multiResourceAction.closeDialog();
                    model.loadDay();
                } else {
                    model.notificationDialog.displayDialog('AUTO-START ERROR', value.errorMessage);
                }
            });
    }
    //
    //


    //
    // Auto End Dialog
    //
    model.showAutoEndDialog = function (serviceId, requestscheduleid) {
        console.log('autoEnd: ', model.date());
        getWrapper('/api/v1/autoend', { 'ServiceId': serviceId, 'requestscheduleid': requestscheduleid, 'ForDate': model.date(), 'AsUserID': model.forUserID() })
            .then(function ({ value } = response) {
                if (value.succeded) {
                    model.multiResourceAction.displayDialog('END', serviceId, requestscheduleid, value.autoDayResources, model.saveAutoEnd);
                }
                else {
                    model.notificationDialog.displayDialog('AUTO-END ERROR', value.errorMessage);
                }
            });
    }


    model.saveAutoEnd = function (serviceid, requestscheduleid, resources, forceendwolunch = false) {

        let autoEndData = {
            ServiceId: serviceid,
            requestscheduleid: requestscheduleid,
            ForDate: model.date(),
            ForceEndWOLunch: forceendwolunch,
            ResourceIds: resources.filter(r => r.autoFlagValue === true).map(r => r.resourceId)
        };


        postWrapper('/api/v1/autoend', ko.toJSON(autoEndData))
            .then(function (serverReply) {

                let response = serverReply.value;

                if (!response.succeeded) {
                    console.log('Response: ', response);
                    if (response.codeResult === 'MISSINGLUNCH') {
                        model.multiResourceAction.closeDialog();
                        model.missingLunchModal.showDialog(response.errorMessage, function () {
                            model.saveAutoEnd(serviceid, requestscheduleid, resources, true);
                            model.missingLunchModal.close();
                        });
                    }
                    if (response.codeResult === 'NOTESELF') {
                        model.multiResourceAction.closeDialog();
                        model.newLeadModal.showDialog(response.errorMessage, requestscheduleid, serviceid,
                            function () {
                                model.saveAutoEnd(serviceid, requestscheduleid, resources, true);
                                model.newLeadModal.close();
                                model.loadDay();
                            }, resources);
                    }
                } else if (response.succeeded) {
                    model.multiResourceAction.closeDialog();
                    model.loadDay();
                }
            });
    }
    //
    //




    //
    // Add Lunch Handling
    //
    model.showAddLunchDialog = function (serviceid) {

        getWrapper('/api/v1/lunchers', { 'ServiceId': serviceid, 'requestscheduleid': requestscheduleid, 'ForDate': model.date(), 'AsUserID': model.forUserID() })
            // Displays the modal passing the resources
            .then(({ value }) => model.multiResourceAction.displayDialog('LUNCH', serviceid, requestscheduleid, value, model.saveLunch));
    }


    model.saveLunchSingle = function (serviceid, requestscheduleid, resource) {
        postWrapper('/api/v1/lunchers', ko.toJSON({ 'ServiceId': serviceid, 'requestscheduleid': requestscheduleid, 'ForDate': model.date(), 'ResourceIds': [resource] }))
            .then(({ value }) => {
                if (value.succeeded) {
                    model.reloadPage();
                } else {
                    model.notificationDialog.displayDialog('ADD LUNCH ERROR', value.errorMessage);
                }
            });
    };

    model.saveLunch = function (serviceid, requestscheduleid, resources) {

        let lunchersData = {
            ServiceId: serviceid,
            requestscheduleid: requestscheduleid,
            ForDate: model.date(),
            ResourceIds: resources.filter(r => r.autoFlagValue === true).map(r => r.resourceId)
        };

        postWrapper('/api/v1/lunchers', ko.toJSON(lunchersData))
            .then(({ value }) => {
                if (value.succeeded) {
                    model.multiResourceAction.closeDialog();
                    model.reloadPage();
                } else {
                    model.notificationDialog.displayDialog('ADD LUNCH ERROR', value.errorMessage);
                }
            });

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
    model.showAddTeamMemberModal = function (serviceid, requestscheduleid) {
        model.addTeamMemberDialog.displayDialog(serviceid, requestscheduleid, model.organizationID, model.date(), model.addMemberCloseCallback);
    }

    model.addMemberCloseCallback = function () {
        model.loadDay();
    }
    //
    //


    //
    //
    //
    model.callTimeEntryUpdate = function (updateDetails) {
        return postWrapper('/api/v1/timeentryupdate', ko.toJSON(updateDetails));
    }

    model.updateJobTimeEntry = function (serviceLineTimeEntry, type, time, notes) {
        if (type === 'END') {
            getWrapper('/api/v1/shouldfilldsr', { 'OrganizationID': model.organizationID, 'ServiceLineTimeEntry': serviceLineTimeEntry })
                .then(({ value }) => {
                    if (value.shouldCompleteDSR) {
                        model.notificationDialog.displayDialog('Missing Daily Status Report', 'Please submit your Daily Status Report before Clocking Out. Thank You.');

                    //    notificationDialog.displayOptionsDialog("Missing Daily Status Report",
                    //        "Please submit your Daily Status Report now if you haven’t done so. Thank You.",
                    //        () => { return; },
                    //        () => { timeentryPikerModal.show(serviceLineTimeEntry, type, model.addJobTimeEntryPost, time, notes); },
                    //        { 'ok': 'Go Back, add DSR', 'cancel': 'Ignore, Sign me Out' });
                    }
                    else {
                        timeentryPikerModal.show(serviceLineTimeEntry, type, model.addJobTimeEntryPost, time, notes);
                    }
                });
        } else {
            timeentryPikerModal.show(serviceLineTimeEntry, type, model.addJobTimeEntryPost, time, notes);
        }
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
            console.log('Response: ', response);

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
                    model.newLeadModal.showDialog(response.errorMessage, updateDetails.serviceLineTimeEntry, null,
                        function () {
                            model.callTimeEntryUpdate(updateDetails).then(function (response) {
                                model.newLeadModal.close();
                                model.loadDay();
                            })
                        }, null);
                    break;
                case 'NOTESELF_MISSINGLUNCH':
                    timeentryPikerModal.close();
                    model.missingLunchModal.showDialog(response.errorMessage.split('|')[0], function () { model.endWithoutLunchAndChangeLead(response.errorMessage.split('|')[1], updateDetails); });
                    break;
                default:
                    model.notificationDialog.displayDialog('UPDATE TIME ENTRY ERROR', response.errorMessage)
                    break;
            }
        } else if (response.succeeded) {
            if (response.codeResult === 'AUTOSIGNEDOUT') {
                model.notificationDialog.displayDialog('START', response.errorMessage);
            }

            timeentryPikerModal.close();
            model.loadDay();
        }
    }

    model.endWithoutLunchAndChangeLead = function (errorMessage, updateDetails) {
        model.missingLunchModal.close();
        updateDetails.forceendwolunch = true;
        model.newLeadModal.showDialog(errorMessage, updateDetails.serviceLineTimeEntry, null,
            function () {
                model.callTimeEntryUpdate(updateDetails).then(function (response) {
                    model.processUpdateResponse(updateDetails, response.value);
                    model.newLeadModal.close();
                });
                //    model.loadDay();
            }, null);
    }

    model.endWithoutLunch = function (updateDetails) {
        updateDetails.forceendwolunch = true;
        model.callTimeEntryUpdate(updateDetails).then(function (response) {
            model.processUpdateResponse(updateDetails, response.value)
            model.missingLunchModal.close();
            //model.loadDay();
        });
    }



    //
    //


    //
    // No Show/Exception dialog handling
    //
    model.showExceptionDialog = function (serviceLineTimeEntryID, serviceid, resourceid, noShowObj) {
        addExceptionDialog.displayDialog(serviceLineTimeEntryID, serviceid, model.date(), resourceid, model.saveException, noShowObj);
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

        console.log(exceptionData);

        postWrapper('/api/v1/timeentryresourcenoshow', ko.toJSON(exceptionData))
            .then(function () {
                addExceptionDialog.closeDialog();
                model.loadDay();
            });
    }
    //
    //

    //
    // Display Job Notes
    //
    model.displayJobNotes = function (requestid) {
        getWrapper('/api/v1/jobnotes', { 'OrganizationID': model.organizationID, 'RequestID': requestid, 'ForDate': model.date() })
            .then(r => model.notificationDialog.displayDialog('JOB NOTES', r.jobNotes, true));
    }


    //
    //

    //
    // Show Add Daily Status Report button 
    //
    model.isEnabledAddRDS = function (isLead) {
        return ko.pureComputed(function () {
            return isLead;
        })
    };

    //
    // ReadOnly screen control
    //
    model.isReadOnlyScreen = function (isApproved, enableButton = false) {
        return ko.pureComputed(function () {
            let uc = model.userControls();
            return (!uc.checkInOutButtonsEnabled || isApproved || uc.isReadOnly) || !enableButton;
        })
    };
    //
    //

    //
    // Setup binding handlers
    //
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.popover = ServiceTRAXBindingHandlers.popover;
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    ko.bindingHandlers.fileInputSelection = ServiceTRAXBindingHandlers.fileInputSelection;
    //
    //


    //
    // Init
    //
    model.loadDay = function () {

        model.dayDataLoadCompleted(false);

        getWrapper('/api/v1/daytimeentries', { 'OrganizationID': model.organizationID, 'ForDate': model.date(), 'AsUserID': model.forUserID() })
            .then(data => {
                // Sort the Time entries by Field time
                model.timeEntries(data.timeEntries.sort((a, b) => (a.fieldstarttime > b.fieldstarttime) ? 1 : ((b.fieldstarttime > a.fieldstarttime) ? -1 : 0)));
                model.dayUsers(data.dayUsers);
                model.userControls(data.userControls);
                // Display warning message about data load
                if (!data.succeeded) {
                    model.notificationDialog.displayDialog('TIME ENTRY LOAD WARNING', data.errorMessage);
                }
            })
            .finally(() => model.dayDataLoadCompleted(true));
    }

    model.loadDay();
    //
    //

    //
    // KO ApplyBindings
    ko.applyBindings(model);
    //
    //
}
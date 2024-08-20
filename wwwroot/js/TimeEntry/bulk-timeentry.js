const initBulkTimeEntry = (bulkTimeEntryModel) => {
    let model = bulkTimeEntryModel;



    openApproveScreen = function (forDate, resourceID) {
        redirectToPage('/TimeEntry/Approval', { 'OrganizationID': model.organizationID, 'ForDate': forDate, 'AsResourceId': resourceID }, true);
    }

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
    model.timeentryPikerModal = timeentryPikerModal;
    model.notificationDialog = notificationDialog;
    //
    model.startDate = ko.observable(model.startDate);
    model.startDate.subscribe(() => model.resetBulkTimeGrid());

    // Clean the HTML from the request description (for proper truncation)
    model.requests.forEach(function (v) {
        v.cleanDescription = `${v.requestNumber} - ${$(`<p>${v.description}</p>`).text().substring(0, 35)}`;
    });

    model.endDate = ko.observable(model.endDate);
    model.endDate.subscribe(() => model.resetBulkTimeGrid());


    model.loadingRelatedJobInfo = ko.observable(false);

    model.selectedJob = ko.observable(null);
    model.selectedJob.subscribe(function () {

        // Lock Jobs select until all related data is loaded 
        model.loadingRelatedJobInfo(true);

        // Clear Service Request (because it can keep previous Job SR value)
        model.selectedServiceRequest(null);

        model.resetBulkTimeGrid();
        // On JobId change reload the work codes and service requests
        let p2 = Promise.resolve(loadWorkCodes());
        let p3 = Promise.resolve(model.loadTimeEntries());

        // Filter requests
        filterRequests();

        Promise.all([p2, p3]).then(values => {
            model.loadingRelatedJobInfo(false);
        }, reason => {
            console.log(reason)
        });

    });

    model.serviceRequests = ko.observableArray([]);
    model.selectedServiceRequest = ko.observable(null);

    model.selectedMembers = ko.observableArray(null);
    model.selectedMembers.subscribe(function () { loadWorkCodes(); });
    model.date = ko.observable(new Date());
    model.date = ko.observable(new Date());

    model.workCodes = ko.observableArray([]);
    model.selectedWorkCode = ko.observable(null);

    model.hours = ko.observable(0);

    model.isOT = ko.observable(false);
    console.log(model.payCodes);
    model.payCodeID = model.payCodes.filter(r => r.code === 'regular_time')[0].id;
    //console.log(model.payCodeID);

    model.payCodes = ko.observableArray(model.payCodes);
    model.selectedPayCode = ko.observable(model.payCodeID);

    model.enableInsertButton = ko.pureComputed(function () {
        let enabled = model.selectedJob() != null
            && model.selectedServiceRequest() != null
            && model.selectedMembers().length > 0
            && model.selectedPayCode() != null
            && model.selectedWorkCode() != null
            && model.entryStartTime() != null
            && model.entryEndTime() != null;

        return enabled;
    });

    model.enableInsertButtonTitle = ko.pureComputed(function () {
        let missingFields = ['Please complete the following field before inserting time'];

        if (!model.selectedJob()) {
            missingFields.push('- Job');
        }
        if (!model.selectedServiceRequest) {
            missingFields.push('- Service Request');
        }
        if (!model.selectedMembers().length) {
            missingFields.push('- Members');
        }
        if (!model.selectedPayCode()) {
            missingFields.push('- Pay Code');
        }
        if (!model.selectedWorkCode()) {
            missingFields.push('- Work Code');
        }
        if (!model.entryStartTime()) {
            missingFields.push('- Start Time');
        }
        if (!model.entryEndTime()) {
            missingFields.push('- End Time');
        }
        if (missingFields.length > 1) {
            return missingFields.join('\n\t');
        }
        return 'Insert time...';
    });


    model.emptyTimeEntries = ko.observable(false);
    model.loadingTimeEntries = ko.observable(false);

    //
    //
    filterRequests = function () {
        // Clean the Service Request collection until it's refreshed
        model.serviceRequests([]);
        let projectValue = model.jobs.filter(j => j.jobId === model.selectedJob())[0];
        model.serviceRequests(model.requests.filter(r => r.projectId === projectValue.projectId));
    }

    loadWorkCodes = function () {
        //alert(model.selectedMembers());
        return getWrapper('/api/v1/workcodes', { 'jobid': model.selectedJob(), 'members': model.selectedMembers(), 'isForSA': false })
            .then(res => {
                model.workCodes([]);
                // Update observable array with newly loaded values
                model.workCodes(res.value);
                // Check if the new values contains the previously selected value -> if not clear current selected value
                console.log(model.selectedWorkCode());
                console.log(model.workCodes().findIndex(wc => wc.item_id === model.selectedWorkCode()));
                if (model.workCodes().findIndex(wc => wc.item_id === model.selectedWorkCode()) === -1) {
                    console.log(model.workCodes());
                    console.log(model.workCodes().filter(wc => wc.isDefault === "Y"));
                    var defaults = model.workCodes().filter(wc => wc.isDefault === "Y");
                    if (defaults.length != 0)
                        model.selectedWorkCode(defaults[0].item_id);
                    else
                        model.selectedWorkCode(null);
                    //model.selectedWorkCode(model.workCodes().some(wc => wc.isDefault === "Y").item_id) ? wc.item_id : null);
                }
                //this.selectedWorkCode(this.workCodes().some(wc => wc.item_id === this.defaultItemID) != -1 ? this.defaultItemID : ((wc.IsDefault === "Y") != -1 ? this.item_id : null));
            });
    }

    model.newTimeEntryIDs = ko.observableArray([4102365, 4104803]);
    model.selectedPayCode(model.payCodeID);
    model.insertingBulkTimes = ko.observable(false);
    model.insertBulkTimes = function () {

        model.insertingBulkTimes(true);
        let data = {
            'Date': moment(model.date()).startOf('day').toJSON(),
            'JobId': model.selectedJob(),
            'LstServiceRequests': [model.selectedServiceRequest()],
            'LstResourcesId': model.selectedMembers(),
            'WorkCodeId': model.selectedWorkCode(),
            'PayCodeId': model.selectedPayCode(),
            'StartTime': model.entryStartTime(),
            'EndTime': model.entryEndTime()
        };

        postWrapper('/api/v1/bulktimeentry', ko.toJSON(data))
            .then(({ value }) => {
                if (value.succeeded) {
                    bulkTimeGrid.refresh();
                } else {
                    model.notificationDialog.displayDialog('BULK TIME INSERT ERROR', value.errorMessage);
                }
            }).finally(() => model.insertingBulkTimes(false));
    };


    //
    // Time entries list
    //
    model.timeEntries = ko.observableArray([]);
    model.loadTimeEntries = function () {
        let params = {
            organizationid: model.organizationID,
            jobid: model.selectedJob()
        };

        model.loadingTimeEntries(true);
        model.emptyTimeEntries(false);
        return getWrapper('/api/v1/bulktimeentry', params)
            .then(r => {
                model.emptyTimeEntries(r.value.length === 0);
                model.timeEntries(r.value);
                model.loadingTimeEntries(false);
            });
    }
    //
    //

    //
    //
    //
    model.getGridParameters = function () {
        return {
            'JOBID': model.selectedJob(),
            'STARTDATE': moment(model.startDate()).format('YYYY-MM-DD'),
            'ENDDATE': moment(model.endDate()).format('YYYY-MM-DD'),
            'ORGANIZATIONID': model.organizationID
        };
    }

    model.gridEvents = {
        beforeRenderEditableCell: function (rowName, row) {
            if (row.ISLUNCH && (rowName === 'ITEM_ID' || rowName === 'EXT_PAY_CODE')) {
                return false; // If the row is a Lunch and the user is trying to edit Item or PayCode columns then block the edition (those values are Readonly for Lunchs)
            }
            // If this method returns false makes the TEG row read-only
            return row.ISEDITABLE === 1;
        },
        // Custom Rendered to transform HTML cells data
        onCustomHTMLCellRendering: function (cellData, Col, RowData) {
            if (Col.id === 'ROW_APPROVE') {
                switch (cellData.toUpperCase()) {
                    case 'DAY APPROVE':
                        return `<a href="#" onclick="openApproveScreen('${RowData.SERVICE_LINE_DATE}', '${RowData.RESOURCE_ID}')">Day Approve</a>`;
                        break;
                    case 'REJECTED':
                        return '<p style="color:#721C24">Rejected</p>'
                        break;
                    case 'APPROVED':
                        return '<p style="color:#2DAF4B">Approved</p>'
                        break;
                }
            }
            return null;
        }
    };

    var bulkTimeGrid = new clsMyGrid("BulkTimeEntry", document.getElementById('BulkTimeEntriesTEG'), null, model.gridEvents, true, model.getGridParameters());

    model.resetBulkTimeGrid = function () {
        bulkTimeGrid.reset("BulkTimeEntry", model.gridEvents, model.getGridParameters());
    };
    //
    //


    //
    // Start/End Time handling
    //
    model.entryStartTime = ko.observable(null);
    model.entryEndTime = ko.observable(null);
    model.entryStartTimeCaption = ko.pureComputed(function () {
        return model.formatEntryTimes(model.entryStartTime());
    });
    model.entryEndTimeCaption = ko.pureComputed(function () {
        return model.formatEntryTimes(model.entryEndTime());
    });
    model.formatEntryTimes = function (time) {
        return time ? `${moment(time).format('LT')}` : '(NOT SET)';
    }
    model.timeDifferenceCaption = ko.pureComputed(function () {
        if (model.entryStartTime() && model.entryEndTime()) {
            let start = moment(model.entryStartTime()).second(0).millisecond(0);
            let end = moment(model.entryEndTime()).second(0).millisecond(0);
            let duration = moment.duration(end.diff(start));
            if (duration.get('hours') < 0) end.add(1, "days"); // This means end time is on next day
            duration = moment.duration(end.diff(start));
            return `Total Time: ${duration.get('hours')} hs ${duration.get('minutes')} min`;
        }
        return '-Set Start/End for Time Diff-';
    });

    model.displayStartTimeSetDialog = function () {
        timeentryPikerModal.show(0, 'ALTSTART', model.setEntryTime, model.entryStartTime());
    }
    model.displayEndTimeSetDialog = function () {
        timeentryPikerModal.show(0, 'ALTEND', model.setEntryTime, model.entryEndTime());
    }

    model.setEntryTime = function (_, type, time, _) {
        if (type === 'ALTSTART') {
            // Commented out by FernandoP 2023.05.04. Now we allow end time < start time indicating end time is on next day.
            // Check if user entered a End time Before Start 
           /* if (moment(time).isAfter(model.entryEndTime())) {
                model.entryStartTime(model.entryEndTime());
            }
            else {*/
                model.entryStartTime(time);
           // }
        } else if (type === 'ALTEND') {
            // Commented out by FernandoP 2023.05.04. Now we allow end time < start time indicating end time is on next day.
            // Check if user entered a End time Before Start 
            /*if (moment(time).isBefore(model.entryStartTime())) {
                model.entryEndTime(model.entryStartTime());
            }
            else {*/
                model.entryEndTime(time);
            //}

        }
        timeentryPikerModal.close();
    }

    //
    // Init
    //

    //
    //

    //
    // KO ApplyBindings
    ko.applyBindings(model);
    //
    //
};

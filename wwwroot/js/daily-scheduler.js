const initScheduler = (schedulerModel) => {

    let model = schedulerModel;

    // Setup Model
    model.date = model.date ? ko.observable(model.date) : ko.observable(moment(new Date()).startOf('day').toJSON());

    model.jobDaySchedule = ko.observableArray([]);
    model.jobDaySchedulePTOAndSvcAcct = ko.observableArray([]);
    model.humanResources = ko.observableArray([]);
    model.vehicleResources = ko.observableArray([]);
    model.resourceDataLoadCompleted = ko.observable(false);
    model.dayScheduleDataLoadCompleted = ko.observable(false);

    model.resourceGroupFilterPV = ko.observableArray([]);
    model.resourceGroupFilterSelected = ko.observableArray([]);

    model.dayDataLoadCompleted = ko.pureComputed(function () {
        return model.resourceDataLoadCompleted() === true && model.dayScheduleDataLoadCompleted() === true;
    });
    // Setup Model -end-

    $(".custom-editor").trumbowyg({
        svgPath: '/lib/trumbowyg/icons.svg'
    });

    //
    // SignalR support
    //
    var signalRConnection = new signalR.HubConnectionBuilder().withUrl("/schedulerhub").build();

    //

    //
    // Sticky Table Header
    //
    var header = document.getElementById("schedheader");
    var subMenuNav = document.getElementById("scroll_wrapper");
    window.onscroll = () => applyStickySubMenu();
    subMenuNav.onscroll = () => panelLateralScroll();

    calcPos = () => subMenuNav.getBoundingClientRect().top;

    function panelLateralScroll() {
        if (header.classList.contains('sticky')) {
            let headerLateralPos = subMenuNav.scrollLeft - subMenuNav.getBoundingClientRect().left;
            header.style.left = -headerLateralPos + 'px';
        }
    }

    // Add the sticky class to the requestSubMenuNav when you reach its scroll position. Remove "sticky" when you leave the scroll position
    function applyStickySubMenu() {
        //console.log(calcPos());
        let pos = calcPos();
        if (pos <= 0) {
            header.classList.add("sticky");
            panelLateralScroll();
        } else {
            if (pos > 74) { // This prevent flickery (74 is the height of the table header)
                header.classList.remove("sticky");
            }
        }
    }

    //
    //

    $("#scroll_wrapper").floatingScroll();

    //
    // Setup binding handlers
    //
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.popover = ServiceTRAXBindingHandlers.popover;
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    ko.bindingHandlers.trumbowyg = ServiceTRAXBindingHandlers.trumbowyg;
    //
    //
    //


    //
    // Resources Menu Handling
    //
    resourcesMenu = {
        isOpen: function () {
            // If right value > 0 then panel is open 
            var right = parseInt($("#resources-panel").css('right'));
            return right >= 0;
        },

        close: function () {
            if (this.isOpen()) {
                // Get the width of the panel to know how much to the right it should be shifted (to hide it)
                var width = parseInt($("#resources-panel").css('width'));
                // Set right to negative panel width to hide it
                $("#resources-panel").css('right', -width);
                // Disable panel resizing when panel is closed
                $("#resources-panel").resizable("option", "disabled", true);
            }
        },

        open: function () {
            if (!this.isOpen()) {
                // Make right 0 so the full panel is visible
                $("#resources-panel").css('right', 0);
                // Allow resizing of the panel 
                $("#resources-panel").resizable("option", "disabled", false);
            }
        },

        toggle: function () {
            if (this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        }
    };

    $(".btn-toggle-resources").on("click", function (a) {
        a.preventDefault();
        // On handle click -> toggle the side menu visibility
        resourcesMenu.toggle();
    });


    $("#resources-panel").resizable({
        helper: "ui-resizable-helper",
        handles: 'w',
        minWidth: 300,
        maxWidth: 800,
        disabled: true, // the panel is initially closed >> disable resizing
    });

    model.driverDropdownsLocked = ko.observable(false);
    model.setupVehicleObservables = (vehicle) => {
        vehicle.driverID = ko.observable(vehicle.driverID);
        //Watch for changes on driverID field to update the Crew record when a driver is added/removed
        vehicle.driverID.subscribe(function (newDriverID) {
            model.driverDropdownsLocked(true);
            model.assignCrewResourceAPICall(vehicle.crewResourceID, vehicle.requestScheduleCrewId, 'VEHICLE', newDriverID);
        });
    }


    //
    // Summary Day Resources Modal
    //
    model.daySummaryByRoles = ko.observableArray([]);
    model.showSummaryByResourceDialog = ko.observable(false);

    model.daySummaryTotalRequired = ko.pureComputed(function () { return model.daySummaryByRolesCrew().reduce((prev, actual) => prev + actual.humanResourcesRequired, 0) });
    model.daySummaryTotalAllocated = ko.pureComputed(function () { return model.daySummaryByRolesCrew().reduce((prev, actual) => prev + actual.humanResourcesAllocated, 0) });

    model.daySummaryByRolesCrew = ko.pureComputed(function () { return model.daySummaryByRoles().filter(c => c.roleIsVehicle === false) });
    model.daySummaryByRolesVehicles = ko.pureComputed(function () { return model.daySummaryByRoles().filter(c => c.roleIsVehicle === true) });


    model.loadDaySummary = () => {
        getWrapper('/api/v1/daysummarybyrole', { 'ForDate': model.date(), 'OrganizationID': model.organizationID, 'LocationId': model?.jobFilters?.selectedLocation() })
            .then(function (response) {
                model.daySummaryByRoles(response);
                model.showSummaryByResourceDialog(true);
            });
    };

    //
    //

    //
    // Empty Jobs Modal
    //
    model.showEmptyJobsModal = ko.observable(false);
    model.dayEmptyJobs = ko.observableArray([]);

    model.loadEmptyJobs = () => {

        getWrapper('/api/v1/dayjobsunnasigned', { 'ForDate': model.date(), 'OrganizationID': model.organizationID })
            .then(function (response) {
                model.dayEmptyJobs(response);
                model.showEmptyJobsModal(true);
            });
    };
    //
    //


    //
    //
    //
    model.emailJobDialog = {
        isDialogDisplaying: ko.observable(false),
        emailRecipients: ko.observableArray([]),
        emailRecipientsSelected: ko.observableArray([]),
        emailBody: ko.observable('123'),
        requestScheduleId: null,

        validateEmail: function (email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        },

        showDialog: function (requestScheduleId) {

            this.emailRecipientsSelected([]);
            this.requestScheduleId = requestScheduleId;

            getWrapper('/api/v1/emailjob', { 'RequestScheduleID': requestScheduleId })
                .then(r => {
                    let filteredEmailRecipients = r.recipients.filter(r => this.validateEmail(r.email) && r.email !== '' && r.dailySchedulerJobEmailRecipient === true);
                    this.emailRecipients(filteredEmailRecipients);
                    this.emailRecipientsSelected(filteredEmailRecipients.filter(r => r.dailySchedulerJobEmailDefaultRecipient === true).map(e => e.email));
                    this.emailBody(r.emailbody);
                    $('.custom-editor').trumbowyg('html', r.emailbody);
                    this.isDialogDisplaying(true);
                });


        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        saveEmailForDelivery: function () {
            postWrapper('/api/v1/emailjob', ko.toJSON({ 'RequestScheduleID': this.requestScheduleId, 'EmailRecipientList': this.emailRecipientsSelected(), 'EmailText': this.emailBody() }))
                .then(() => this.closeDialog());
        }
    }
    //
    //


    model.organizationLocationName = function (srLocationID) {
        return model?.organizationLocations?.find(o => o.locationID === srLocationID)?.locationName ?? '-';
    };



    model.resourceLocations = ko.observableArray([]);



    model.loadResources = (signal = true) => {
        if (signal) {
            // Flag as Resource loading in progress
            model.resourceDataLoadCompleted(false);
        }

        getWrapper('/api/v1/resources', { ForDate: model.date(), OrganizationID: model.organizationID })
            .then(function (response) {
                let { humanResources, vehicleResources, locations } = response;
                model.humanResources(humanResources);
                model.vehicleResources(vehicleResources);
                model.resourceLocations(locations);

                console.log('Locations ', model.resourceLocations(), model.resourceLocationsSelected());
                model.resourceLocationsSelected(model.resourceLocationsSelected());
                $('#locationFilteringSelectpicker').selectpicker('refresh');

                // Set the filtering groups
                let groups = [...new Set(humanResources.map(r => r.resourceGroupName.toLowerCase())), ...new Set(vehicleResources.map(r => r.resourceGroupName.toLowerCase()))];
                model.resourceGroupFilterPV(groups.map(g => ({ id: g, name: g[0].toUpperCase() + g.substr(1) })));

                if (signal) {
                    // Signal Resource loading completed
                    model.resourceDataLoadCompleted(true);
                }

                // Initially when no chip is selected > diplay all resources in the side menu
                model.setResourceGroupsOrder(null, 'SHOWALL');
            });
    };

    model.parseHour = function (dt) {
        let date = moment(dt);
        return `${(date.hour() < 10 ? '0' : '') + date.hour()}:${(date.minute() < 10 ? '0' : '') + date.minute()}`;
    }

    model.dayCustomers = ko.observableArray([]);
    model.dayPMs = ko.observableArray([]);

    // Object that will hold references to Scheduler Request rows for quick access
    model.schedulerRowsDictionary = {};

    model.loadDailySchedule = (signal = true) => {
        // Flag as Day Schedule load in progress
        if (signal) {
            model.dayScheduleDataLoadCompleted(false);
        }

        getWrapper('/api/v1/dayschedule', { ForDate: model.date(), OrganizationID: model.organizationID })
            .then(function (response) {
                console.log('scheduler response:', response);

                if (response) {
                    // Clear the quick access dictionary
                    model.schedulerRowsDictionary = {};

                    response.dayRows.forEach(day => {
                        // Set observable fields
                        day.projectManagerId = ko.observable(day.projectManagerId);
                        day.notes = ko.observable(day.notes);
                        day.wseStartTime = ko.observable(day.wseStartTime);
                        day.fieldStartTime = ko.observable(day.fieldStartTime);

                        let preUpdateValue = {
                            'RequestScheduleId': day.requestScheduleId,
                            'ProjectManagerId': day.projectManagerId(),
                            'Notes': day.notes(),
                            'WseStartTime': day.wseStartTime(),
                            'FieldStartTime': day.fieldStartTime()
                        }

                        day.projectManagerId.subscribe(function (newValue) { preUpdateValue.ProjectManagerId = newValue; model.updateDaySchedule(preUpdateValue); });
                        day.notes.subscribe(function (newValue) { preUpdateValue.Notes = newValue; model.updateDaySchedule(preUpdateValue); });
                        day.wseStartTime.subscribe(function (newValue) { preUpdateValue.WseStartTime = newValue; model.updateDaySchedule(preUpdateValue); });
                        day.fieldStartTime.subscribe(function (newValue) { preUpdateValue.FieldStartTime = newValue; model.updateDaySchedule(preUpdateValue); });

                        day.wseStartTimeDisplay = ko.observable(model.parseHour(day.wseStartTime()));
                        day.wseStartTimeDisplay.subscribe(function () {
                            day.wseStartTime(moment(day.wseStartTime()).startOf('day').set({ "hour": day.wseStartTimeDisplay().split(':')[0], "minute": day.wseStartTimeDisplay().split(':')[1] }));
                        });
                        day.fieldStartTimeDisplay = ko.observable(model.parseHour(day.fieldStartTime()));
                        day.fieldStartTimeDisplay.subscribe(function () {
                            day.fieldStartTime(moment(day.fieldStartTime()).startOf('day').set({ "hour": day.fieldStartTimeDisplay().split(':')[0], "minute": day.fieldStartTimeDisplay().split(':')[1] }));
                        });

                        // Load Crew and Lead arrays and make them observable
                        day.lead = ko.observableArray(day.lead);
                        day.crew = ko.observableArray(day.crew);

                        day.crew.subscribe(function () {
                            day.vehicles().forEach(function (vehicle) {
                                // After a Crew change check if all vehicles drivers are still on the Crew (this to consider 
                                // the case of removing a Crew member that was assigned to drive a vehicle, in that case the vehicle driver should be removed)
                                if (vehicle.driverID() && !day.crew().some(crew => crew.crewResourceID === vehicle.driverID())) {
                                    // We haven't found a Crew member with the Id of the Driver assigned to a vehicle -> crew member was removed -> remove driver from vehicle
                                    vehicle.driverID(null); // <--- Note: setting the DriverID will trigger the subcription on driverID and call the API to remove the driver from the vehicle
                                }
                            });
                        });

                        // Load vehicles and make the DriveID as observable too (to watch for assignations to it)
                        day.vehicles.forEach(function (v) {
                            // Setup the observables for driver change
                            model.setupVehicleObservables(v);
                        });
                        day.vehicles = ko.observableArray(day.vehicles);

                        // Set an entry in the quick access row dictionary
                        model.schedulerRowsDictionary[day.request_id] = day;

                    });

                    model.jobDaySchedule(response.dayRows);

                    // Read ony PTO and Service Account lines
                    response.dayPTOSvcAcctRows.forEach(day => {
                        day.wseStartTimeDisplay = model.parseHour(day.wseStartTime);
                        day.fieldStartTimeDisplay = model.parseHour(day.fieldStartTime);
                        day.lead = ko.observableArray(day.lead);
                        day.crew = ko.observableArray(day.crew);
                        // There is no vehicles for the PTO/ServiceAccount lines -> so make it an empty array
                        day.vehicles = [];
                    })
                    model.jobDaySchedulePTOAndSvcAcct(response.dayPTOSvcAcctRows);

                    // Set day Customers
                    model.dayCustomers(response.dayCustomers);
                    model.dayPMs(response.dayPMs);

                    if (signal) {
                        // Flag as Day data load completed
                        model.dayScheduleDataLoadCompleted(true);
                    }

                }
                else {
                    console.log('DailySchedule - ERROR - Retrying update');
                    model.schedulerUpdateThrottling.updateUI(() => {
                        model.loadDailySchedule(false);
                        model.loadResources(false);
                        console.log('DailySchedule - Update Retried');
                    });
                }

            }.bind(model));
    };



    model.updateDaySchedule = function (updateDetails) {
        postWrapper('/api/v1/scheduledayupdate', ko.toJSON(updateDetails))
            .then(r => console.log('ScheduleDayUpdate', r));
    };

    //
    // Crew template selector
    model.crewResourceChip = (crew) => {
        if (!crew.crewResourceID || crew.crewResourceID === 0) {
            return 'resource-template-empty'
        } else if (crew.isOnPTO) {
            return 'resource-template-pto'
        } else if (crew.isDoubleBooked) {
            return 'resource-template-doublebooked'
        } else if (crew.isCallIn) {
            return 'resource-template-callin'
        } else if (crew.crewResourceID !== 0) {
            return 'resource-template-normal'
        } else {
            return 'resource-template-error'
        }
    };


    //
    // Crew template selector
    model.vehicleResourceChip = (vehicle) => {
        if (!vehicle.crewResourceID || vehicle.crewResourceID === 0) {
            if (model.readOnlyView) {
                return 'resource-readonly-empty-vehicle-template';
            }
            return 'resource-empty-vehicle-template';
        } else {
            if (model.readOnlyView) {
                return 'resource-readonly-vehicle-template'
            }
            return 'resource-vehicle-template'
        }
    };



    //
    //
    //
    model.showOnlyEmptyResources = ko.observable(false);
    model.showOnlyEmptyResourcesBtnTxt = ko.pureComputed(function () {
        return 'Only Show Jobs With Missing Resources' + (model.showOnlyEmptyResources() ? ' (ON)' : ' (OFF)');
    });
    model.showEmptyResources = function () {
        // Toggle show empty resources
        model.showOnlyEmptyResources(!model.showOnlyEmptyResources());
    }
    //
    //




    //
    // Filtering
    //

    model.filtersDialog = {
        isDialogDisplaying: ko.observable(false),

        openDialog: function () {
            this.isDialogDisplaying(true);
            // Sync page element with values 
            $('#customer-filter-multiselect').selectpicker('val', model.jobFilters.customer());
            $('#pm-filter-multiselect').selectpicker('val', model.jobFilters.pm());
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        }
    }

    model.jobsStatusFilterValues = [
        { 'status_name': 'Both', 'status_code': 'both', 'isdefault': true },
        { 'status_name': 'Ready To Schedule', 'status_code': 'rts', 'isdefault': false },
        { 'status_name': 'Hard Scheduled', 'status_code': 'hs', 'isdefault': false },
    ];

    model.lineTypeFilterValues = [
        { 'lineType': 'Field', 'name': 'Standard Jobs' },
        { 'lineType': 'ServiceAccount', 'name': 'Service Account Jobs' },
        { 'lineType': 'PTO', 'name': 'PTO' }
    ];

    function jobsStatusFilterValuesDefaultValue() {
        return model.jobsStatusFilterValues.filter(s => s.isdefault === true)[0].status_code;
    }

    function rowKindFilterValuesDefaultValue() {
        return [model.lineTypeFilterValues[0].lineType, model.lineTypeFilterValues[2].lineType];
    }

    function GetLineTypes() {
        // Get the current LineTypes received from the NET controller
        let lineTypes = model.jobFiltersValues.lineTypes ? model.jobFiltersValues.lineTypes.split('|') : [];
        if (lineTypes.length === 0) {
            return rowKindFilterValuesDefaultValue();
        }
        return lineTypes;
    }

    model.jobFilters = {
        showOnlyEmptyResources: ko.observable(model.jobFiltersValues.showOnlyEmptyResources),
        showJobsOnStatus: model.jobFiltersValues.showJobsOnStatus ? ko.observable(model.jobFiltersValues.showJobsOnStatus) : ko.observable(jobsStatusFilterValuesDefaultValue()),
        customer: ko.observableArray(model.jobFiltersValues.customer),
        pm: ko.observableArray(model.jobFiltersValues.pm),
        selectedRowKinds: ko.observableArray(GetLineTypes()),
        selectedLocation: ko.observable(null),

        applyFilters: function (jobs, isServiceAccount) {

            let filteredjobs = jobs;
            if (this.showOnlyEmptyResources()) {
                // Check if the vehicles property exists (SA jobs doe not have this property defined)
                if (!isServiceAccount) {
                    filteredjobs = filteredjobs.filter(job => job.crew().some(c => c.crewResourceID === null) || job.vehicles().some(v => v.crewResourceID === 0 || v.driverID() === null));
                } else {
                    filteredjobs = filteredjobs.filter(job => job.crew().some(c => c.crewResourceID === null));
                }
            }
            if (this.customer().length > 0) {
                filteredjobs = filteredjobs.filter(job => this.customer().includes(job.customer_id));
            }
            if (this.pm().length > 0) {
                filteredjobs = filteredjobs.filter(job => this.pm().includes(job.projectManagerId)); //* FJP: use projectManagerName in case they want to see distinct project manager names ignoring proj manager id.
            }
            if (this.showJobsOnStatus() !== 'both') {
                filteredjobs = filteredjobs.filter(job => job.isHardScheduled === (this.showJobsOnStatus() === 'hs'));
            }
            if (this.selectedLocation()) {
                filteredjobs = filteredjobs.filter(job => job.srLocationId == this.selectedLocation());
            }

            // Filter by Line Type (this filtering is always performed)
            filteredjobs = filteredjobs.filter(job => this.selectedRowKinds().includes(job.lineType));

            return filteredjobs;
        },
        clearFilters: function () {
            this.showOnlyEmptyResources(false);
            this.customer([]);
            this.selectedLocation(null);
            $('#customer-filter-multiselect').selectpicker('render');
            this.pm([]);
            $('#pm-filter-multiselect').selectpicker('render');
            this.showJobsOnStatus(jobsStatusFilterValuesDefaultValue());
            this.selectedRowKinds(rowKindFilterValuesDefaultValue());
            $('#row-kind-filter-multiselect').selectpicker('render');
            model.saveSchedulerSettings();
        },
        queryStringParams: function () {
            let params = {
                //'CustID': this.customer().join('|'),
                'OnlyMissRes': this.showOnlyEmptyResources(),
                'JobStatus': this.showJobsOnStatus(),
                'LineTypes': this.selectedRowKinds().join('|'),
                'SelectedLocation': this.selectedLocation()
            }
            return params;
        },
        anyFilterActive: ko.pureComputed(function () {
            return model.jobFilters.showOnlyEmptyResources()
                || model.jobFilters.customer().length > 0
                || model.jobFilters.showJobsOnStatus() != jobsStatusFilterValuesDefaultValue()
                || model.jobFilters.selectedLocation();
        })
    }

    function saveJobFiltering() {
        if (!model.schedulerCustomSettingsLoading()) {
            model.schedulerCustomSettings.jobFiltering[model.organizationID] = {
                customer: model.jobFilters.customer(),
                selectedLocation: model.jobFilters.selectedLocation(),
                pm: model.jobFilters.pm()
            };
            model.saveSchedulerSettings();
        }
    }

    model.jobFilters.customer.subscribe(function () {
        saveJobFiltering();
    });

    model.jobFilters.selectedLocation.subscribe(function () {
        saveJobFiltering();
    });



    //
    // Main schedule lines source
    //
    model.jobDayScheduleFiltered = ko.pureComputed(function () {
        return model.jobFilters.applyFilters(model.jobDaySchedule(), false);
    });

    model.jobDaySchedulePTOAndSvcAcctFiltered = ko.pureComputed(function () {
        return model.jobFilters.applyFilters(model.jobDaySchedulePTOAndSvcAcct(), true);
    });

    //
    //

    // 
    // Date change handler
    //
    model.date.subscribe(function () {
        redirectToPage('/Scheduler/Daily', {
            'OrganizationID': model.organizationID,
            'Date': moment(model.date()).toISOString(),
            'IsMobileView': model.isMobileView,
            ...model.jobFilters.queryStringParams()
        });
    });

    model.showPrevDay = () => {
        let day = new Date(model.date())
        day.setDate(day.getDate() - 1);
        model.date(day);
    }

    model.showNextDay = () => {
        let day = new Date(model.date())
        day.setDate(day.getDate() + 1);
        model.date(day);
    }

    model.resourceCardColor = (color) => {
        switch (color.toUpperCase()) {
            case 'GREEN': return '#08a02c';
            case 'YELLOW': return '#d1c90b';
            case 'ORANGE': return '#ff6600';
            case 'RED': return '#f63535';
            case 'PTO': return '#555';
            default: return '#FFF';
        }
    }

    model.resourceLevelColor = (level) => {
        switch (level) {
            case 5: return '#08a02c';
            case 4: return '#08a02c';
            case 3: return '#d1c90b';
            case 2: return '#ff6600';
            case 1: return '#f63535';
            default: return '#f63535';
        }
    }

    // This controls which data is shown on the Resources Side Menu (Skills/Hours)
    model.resourceDisplayKind = ko.observable('skills');

    model.resourceGroups = ko.observableArray([]);

    model.setResourceGroupsOrder = (selectedGroup, apiResourceType) => {
        //console.log('setResourceGroupsOrder ', selectedGroup, apiResourceType);

        if (apiResourceType === 'HUMAN') {

            let first = { name: selectedGroup, resources: model.humanResources().filter(r => r.resourceGroupName === selectedGroup) };
            let remaining = [...new Set(model.humanResources().filter(r => r.resourceGroupName !== selectedGroup).map(r => r.resourceGroupName))].map(role => { return { name: role, resources: model.humanResources().filter(r => r.resourceGroupName === role) } });
            model.resourceGroups([first, ...remaining]);

        } else if (apiResourceType === 'VEHICLE') {

            let first = { name: selectedGroup, resources: model.vehicleResources().filter(r => r.resourceGroupName === selectedGroup) };
            let remaining = [...new Set(model.vehicleResources().filter(r => r.resourceGroupName !== selectedGroup).map(r => r.resourceGroupName))].map(role => { return { name: role, resources: model.vehicleResources().filter(r => r.resourceGroupName === role) } });
            model.resourceGroups([first, ...remaining]);

        } else if (apiResourceType === 'SHOWALL') {
            let humanRes = [...new Set(model.humanResources().map(r => r.resourceGroupName))].map(role => { return { name: role, resources: model.humanResources().filter(r => r.resourceGroupName === role) } });
            let vehicleRes = [...new Set(model.vehicleResources().map(r => r.resourceGroupName))].map(role => { return { name: role, resources: model.vehicleResources().filter(r => r.resourceGroupName === role) } });
            model.resourceGroups([...humanRes, ...vehicleRes]);
        }
        else {
            console.log('Unknown apiResourceType');
            model.resourceGroups([]);
        }

        // When the sort order is changed the Resource list should scroll to top
        $('#myTabContent').animate({ scrollTop: 0 }, 'fast');
    }



    model.resourceByGroup = (group) => {
        return [...model.humanResources().filter(r => r.resourceGroupName.toUpperCase() === group), ...model.vehicleResources().filter(r => r.resourceGroupName.toUpperCase() === group)];
    };


    model.vehicleDriverOptions = function (crew, lead) {
        let availableDrivers = [...crew.filter(c => c.crewResourceID), ...lead.filter(c => c.crewResourceID)];
        return ko.pureComputed(function () {
            return availableDrivers;
        });
    };


    //
    // Chip Selection
    // 
    model.selectedResource = ko.observable(null);
    model.selectedResourceChip = ko.observable(null);
    model.selectedResourceChipColumnType = ko.observable(null);
    model.selectResourceChip = (resourceChip, columnType) => {
        // If the user is selecting the currently selected chip >> then UnSelect it
        if (model.selectedResourceChip() === resourceChip.requestScheduleCrewId) {
            model.unselectResourceChip();

            //model.selectedResource(null);
            //model.selectedResourceChip(null);
            //model.selectedResourceChipColumnType(null);
            //resourcesMenu.close();
            //// When the chip is de-selected return back to the full resrouce list on the side menu
            //model.setResourceGroupsOrder(null, 'SHOWALL');
        } else {
            // Set the selected resource crew ID
            model.selectedResource(resourceChip);
            model.selectedResourceChip(resourceChip.requestScheduleCrewId);
            // Set the columntype so we can know if they are assigning Crew or Lead
            model.selectedResourceChipColumnType(columnType);
            // Set the array that will be used to order the Side menu cards
            model.setResourceGroupsOrder(resourceChip.roleGroupName, resourceChip.apiResourceType);

            // If the chip is unnasiged -> show Resrouces
            if (!resourceChip.crewResourceID) {
                // Expand the Side Menu into view
                resourcesMenu.open();
            } else {
                // If the Chip is assigned then display the Callout dialog
                model.showCallOutDialog(true);
            }
        }
    }

    model.unselectResourceChip = function () {
        model.selectedResource(null);
        model.selectedResourceChip(null);
        model.selectedResourceChipColumnType(null);
        resourcesMenu.close();
        model.setResourceGroupsOrder(null, 'SHOWALL');
    }



    //
    // Crew Resource Assignation/Removal
    //
    model.assignCrewResource = (resource_ID) => {
        // Check if a chip is selected 
        if (model.selectedResourceChip()) {
            model.assignCrewResourceAPICall(resource_ID, model.selectedResourceChip(), model.selectedResourceChipColumnType(), null);
        } else {
            console.log('No chip selected.');
        }

    }

    model.removeCrewResource = (RequestScheduleCrewId, crewType) => {
        model.assignCrewResourceAPICall(null, RequestScheduleCrewId, crewType, null);
    }


    model.updateChipsAfterUpdate = (response, columnType) => {

        model.jobDaySchedule().forEach((dayRow) => {
            switch (columnType) {
                case 'CREW':
                    var resourcesArray = dayRow.crew;
                    break;
                case 'VEHICLE':
                    var resourcesArray = dayRow.vehicles;
                    break;
                case 'LEAD':
                    var resourcesArray = dayRow.lead;
                    break;
            }

            var idx = resourcesArray().findIndex(c => c.requestScheduleCrewId === response.requestScheduleCrewId);
            if (idx > -1) {
                var old = resourcesArray()[idx];

                if (columnType === 'VEHICLE') {
                    // Setup the observables on the vehicle data received
                    model.setupVehicleObservables(response);
                }

                // Replace value in array using KO replace -> this kind of replace will update the UI
                resourcesArray.replace(old, response);
            }
        });
    };

    model.assignCrewResourceAPICall = (resource_ID, RequestScheduleCrewId, columnType, driverID) => {

        let assignResourceObj = {
            'OrganizationID': model.organizationID,
            'Resource_ID': resource_ID,
            'RequestScheduleCrewId': RequestScheduleCrewId,
            'ResourceType': columnType,
            'DriverID': driverID
        };

        postWrapper('/api/v1/assignresource', ko.toJSON(assignResourceObj))
            .then(response => {
                model.updateChipsAfterUpdate(response, columnType);
                // Unselect chip
                model.unselectResourceChip();
                // Unlock Driver dropdowns to prevent component bug
                setTimeout(() => model.driverDropdownsLocked(false), 1500);

            });
    }
    //
    //


    //
    // Vehicle
    //
    model.vehicleCapabilitiesDescription = (vehicleResource) => {

        let groupName = vehicleResource && vehicleResource.resourceGroupName ? vehicleResource.resourceGroupName.toUpperCase() : '';
        switch (groupName) {
            case 'BOX VANS':
                return `${vehicleResource.length}/${vehicleResource.width}/${vehicleResource.height}/${vehicleResource.seats} (L/W/H/S)`
                break;
            case 'SHORT VANS':
                return `${vehicleResource.seats} SEATS`
                break;
            case 'BOBTAILS':
                return `${vehicleResource.length}/${vehicleResource.width}/${vehicleResource.height}/${vehicleResource.seats} (L/W/H/S)`
                break;
            default:
                return `${vehicleResource.length}/${vehicleResource.width}/${vehicleResource.height}/${vehicleResource.seats} (L/W/H/S)`
        }
    }
    //
    //

    //
    // CallOut Dialog handling
    //
    model.callOutDialogShown = ko.observable(null);
    model.showCallOutDialog = function (show) {
        if (model.canSeeExceptions) {
            if (show) {

                this.callOutDialogValues.reset(model.selectedResource().noShowLookupID, model.selectedResource().noShowReason, '');
                this.callOutDialogShown(show);
            } else {
                this.callOutDialogShown(null);
            }
        }
    }.bind(model);

    model.callOutDialogValues = {
        callOutTypeId: ko.observable(null),
        originalCallOutTypeId: null,
        reason: ko.observable(''),
        originalReason: '',
        notes: ko.observable(''),
        originalNotes: '',
        reset: function (callOutTypeId, reason, notes) {
            this.originalCallOutTypeId = callOutTypeId;
            this.callOutTypeId(callOutTypeId);
            this.originalReason = reason;
            this.reason(reason);
            this.originalNotes = notes;
            this.notes(notes);
        },
        saveButtonEnabled: ko.observable(false),
        calloutChanged: function () {
            return this.reason() !== this.originalReason || this.callOutTypeId() !== this.originalCallOutTypeId;
        },
        notesChanged: function () {
            return this.notes() !== this.originalNotes;
        },
        updateCrew: function (requestScheduleCrewId) {


            var resProps = {
                RequestScheduleCrewId: requestScheduleCrewId
            }

            if (this.calloutChanged()) {
                resProps.CallOut = {
                    NoShowLookupID: this.callOutTypeId(),
                    NoShowReason: this.reason()
                }
            }

            if (this.notesChanged()) {
                resProps.notes = this.notes()
            }

            fetch('/api/v1/updateresourceproperties',
                {
                    method: 'POST',
                    body: ko.toJSON(resProps),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.updateChipsAfterUpdate(response, model.selectedResourceChipColumnType());
                });

            // Hide Dialog
            model.showCallOutDialog(false);
        }
    }

    model.callOutOptionName = function (noShowLookupID) {
        let coOpt = model.callOutOptions.find(o => o.id === noShowLookupID);
        return coOpt && coOpt.name ? `Call out: ${coOpt.name}` : 'Unknown Callout Type';
    }

    model.callOutDialogValues.saveButtonText = ko.pureComputed(function () {

        let calloutChanged = this.calloutChanged();  //this.reason() !== this.originalReason || this.callOutTypeId() !== this.originalCallOutTypeId;
        let notesChanged = this.notesChanged(); //this.notes() !== this.originalNotes;

        // Set the enabled status of the Update Button based on changes status
        this.saveButtonEnabled(calloutChanged || notesChanged);

        // Set the text that will be used on the Update button
        if (calloutChanged && notesChanged) {
            return 'Update CallOut and Notes';
        } else if (calloutChanged) {
            return 'Update CallOut';
        } else if (notesChanged) {
            return 'Update Notes';
        }

        return 'No changes made';
    }.bind(model.callOutDialogValues));

    //
    // 
    //
    model.totalClock = ko.pureComputed(() => model.jobDayScheduleFiltered().reduce((acc, curr) => acc + (curr.totalHours * curr.humanResourcesRequired), 0));
    model.totalMen = ko.pureComputed(() => model.jobDayScheduleFiltered().reduce((acc, curr) => acc + curr.humanResourcesRequired, 0));
    model.totalTruck = ko.pureComputed(() => model.jobDayScheduleFiltered().reduce((acc, curr) => acc + curr.vehicleResourcesRequired, 0));



    // 
    // Day Roles Quantities handling
    //

    const editJobModal = {
        dayRoleAndQuantities: ko.observable([]),

        dayRoleAndQuantitiesCrew: ko.pureComputed(function () {
            return model.editJobModal.dayRoleAndQuantities().filter(r => r.isVehicle === false);
        }.bind(model.editJobModal)),

        dayRoleAndQuantitiesVehicles: ko.pureComputed(function () {
            return model.editJobModal.dayRoleAndQuantities().filter(r => r.isVehicle === true);
        }.bind(model.editJobModal)),

        dayRoleAndQuantitiesRequestScheduleId: ko.observable(null),
        roleAndQuantitiesDialogShown: ko.observable(null),

        jobStartDate: ko.observable(null),
        jobEndDate: ko.observable(null),
        jobOriginalStartDate: null,
        jobOriginalEndDate: null,
        jobHrsPerShift: ko.observable(null),
        jobHrsPerShiftOriginal: null,
        applyHrsShiftValue: ko.observable(false),

        displayDateChangeConfirmation: ko.observable(false),
        savingChanges: ko.observable(false),

        showRoleAndQuantitiesDialog: function (RequestScheduleId, jobStartDate, jobEndDate, hrsPerShift) {

            this.displayDateChangeConfirmation(false);
            this.dayRoleAndQuantitiesRequestScheduleId(RequestScheduleId);
            this.jobStartDate(moment(jobStartDate).toJSON());
            this.jobStartDate(moment(jobStartDate).toJSON());
            this.jobEndDate(moment(jobEndDate).toJSON());
            this.jobHrsPerShift(hrsPerShift);
            this.jobHrsPerShiftOriginal = this.jobHrsPerShift();
            $('#inputJobStartDate').datepicker('setDate', this.jobStartDate());
            $('#inputJobEndDate').datepicker('setDate', this.jobEndDate());
            this.jobOriginalStartDate = this.jobStartDate();
            this.jobOriginalEndDate = this.jobEndDate();
            this.applyHrsShiftValue(false);
            this.savingChanges(false);

            // Load day Role data
            getWrapper('/api/v1/requestschedulerolesandquantities', { 'RequestScheduleId': RequestScheduleId })
                .then(function (response) {
                    // Make Quantity observable so it responds to the up/down controls 
                    response.forEach(r => r.quantity = ko.observable(r.quantity));
                    this.dayRoleAndQuantities(response);
                    // Display the modal
                    this.roleAndQuantitiesDialogShown(true);
                }.bind(model.editJobModal));
        },

        closeDialog: function () {
            this.roleAndQuantitiesDialogShown(false);
        },

        saveChanges: function () {
            this.savingChanges(true);

            let rolesAndQuantityData = {
                'OrganizationID': model.organizationID,
                'RequestScheduleId': this.dayRoleAndQuantitiesRequestScheduleId(),
                'RolesAndQts': ko.toJS(this.dayRoleAndQuantities())
            };
            let dateChangeData = {
                'RequestScheduleId': this.dayRoleAndQuantitiesRequestScheduleId(),
                'StartDate': this.jobStartDate(),
                'EndDate': this.jobEndDate(),
                'HoursPerShift': this.applyHrsShiftValue() ? parseFloat(this.jobHrsPerShift()) : null
            };

            let startDateChanged = (new Date(this.jobOriginalStartDate)).getTime() !== (new Date(this.jobStartDate()).getTime());
            let endDateChanged = (new Date(this.jobOriginalEndDate)).getTime() !== (new Date(this.jobEndDate()).getTime());

            if (startDateChanged || endDateChanged || this.applyHrsShiftValue()) {
                // Check if the user has modified the Start/End date, is so display a notification on the modal and return
                if (!this.displayDateChangeConfirmation()) {
                    this.savingChanges(false);
                    this.displayDateChangeConfirmation(true);
                    return;
                }
                else {
                    // Call update of the job Start/End date
                    postWrapper('/api/v1/updatejobdaterange', ko.toJSON(dateChangeData))
                        .then(() => postWrapper('/api/v1/requestschedulerolesandquantities', ko.toJSON(rolesAndQuantityData))
                            .then(() => this.closeDialog())
                            .then(() => model.loadDailySchedule()));

                    return;
                }
            }

            // If no date change then just Update Roles and Quantities only
            postWrapper('/api/v1/requestschedulerolesandquantities', ko.toJSON(rolesAndQuantityData))
                .then(response => this.roleAndQuantitiesDialogShown(false)) // Hide the Modal

        }
    }

    model.editJobModal = editJobModal;
    //
    //


    //
    // Columns Customization
    // 
    model.schedulerCustomSettingsLoading = ko.observable(false);
    makeSchedulerColumObservable = function () {

        let col = ko.observable(true);
        col.subscribe(function () {
            // Save settings only if "schedulerCustomSettingsLoading" is true (to avoid saving the model when it's loaded from the API)
            if (!model.schedulerCustomSettingsLoading()) {
                model.saveSchedulerSettings();
            }
        });
        return col;
    }


    model.schedulerCustomSettings = {

        columns: {
            jobresourcecount: { visible: makeSchedulerColumObservable() },
            jobno: { visible: makeSchedulerColumObservable() },
            pono: { visible: makeSchedulerColumObservable() },
            request_Name: { visible: makeSchedulerColumObservable() },
            customer_name: { visible: makeSchedulerColumObservable() },
           /* pm_name: {visible: makeSchedulerColumnObservable()},*/
            end_user_name: { visible: makeSchedulerColumObservable() },
            organization_location: { visible: makeSchedulerColumObservable() },
            jobname: { visible: makeSchedulerColumObservable() },
            startdate: { visible: makeSchedulerColumObservable() },
            enddate: { visible: makeSchedulerColumObservable() },
            numberofdays: { visible: makeSchedulerColumObservable() },
            whse: { visible: makeSchedulerColumObservable() },
            field: { visible: makeSchedulerColumObservable() },
            pm: { visible: makeSchedulerColumObservable() },
            lead: { visible: makeSchedulerColumObservable() },
            crew: { visible: makeSchedulerColumObservable() },
            vehicle: { visible: makeSchedulerColumObservable() },
            hrsshift: { visible: makeSchedulerColumObservable() },
            address: { visible: makeSchedulerColumObservable() },
            notes: { visible: makeSchedulerColumObservable() }
        },
        filters: {},
        jobFiltering: []
    };


    function processSavedSettings(jsonStr) {
        const settings = JSON.parse(jsonStr);

        return {
            'cols': processSavedColumns(settings.columns),
            'filters': settings.filters ? settings.filters : [],
            'jobFiltering': settings.jobFiltering ? settings.jobFiltering : []
        }
    }

    function processSavedColumns(cols) {
        // Check new columns (added after original design)
        if (!cols.hasOwnProperty('pono')) {
            cols.pono = { 'visible': true };
        }
        if (!cols.hasOwnProperty('end_user_name')) {
            cols.end_user_name = { 'visible': true };
        }
        if (!cols.hasOwnProperty('organization_location')) {
            cols.organization_location = { 'visible': true };
        }

        return cols;
    }



    model.loadSchedulerSettings = function () {
        getWrapper('/api/v1/userschedulesettings')
            .then((response) => {
                if (response.hasSettings === true) {

                    let settingsObj = processSavedSettings(response.settings.configValue);
                    let cols = settingsObj.cols;

                    let modelCols = model.schedulerCustomSettings.columns;

                    // Disable the observable save on subcription trigger
                    model.schedulerCustomSettingsLoading = ko.observable(true);

                    modelCols.jobresourcecount.visible(cols.jobresourcecount.visible);
                    modelCols.jobno.visible(cols.jobno.visible);
                    modelCols.pono.visible(cols.pono.visible);
                    modelCols.request_Name.visible('request_Name' in cols ? cols.request_Name.visible : 'true');
                    modelCols.customer_name.visible(cols.customer_name.visible);
                  /*  modelCols.pm_name.visible(cols.pm_name.visible);*/
                    modelCols.end_user_name.visible(cols.end_user_name.visible);
                    modelCols.organization_location.visible(cols.organization_location.visible);
                    modelCols.jobname.visible(cols.jobname.visible);
                    modelCols.startdate.visible(cols.startdate.visible);
                    modelCols.enddate.visible(cols.enddate.visible);
                    modelCols.numberofdays.visible(cols.numberofdays.visible);
                    modelCols.whse.visible(cols.whse.visible);
                    modelCols.field.visible(cols.field.visible);
                    modelCols.pm.visible(cols.pm.visible);
                    modelCols.lead.visible(cols.lead.visible);
                    modelCols.crew.visible(cols.crew.visible);
                    modelCols.vehicle.visible(cols.vehicle.visible);
                    modelCols.hrsshift.visible(cols.hrsshift.visible);
                    modelCols.address.visible(cols.address.visible);
                    modelCols.notes.visible(cols.notes.visible);

                    // Process filters 
                    model.schedulerCustomSettings.filters = settingsObj.filters;
                    model.resourceLocationsSelected(model.schedulerCustomSettings.filters[model.organizationID] ? model.schedulerCustomSettings.filters[model.organizationID] : []);

                    // Process Job Filtering values
                    let customerJobFiltersSetting = settingsObj.jobFiltering ? settingsObj.jobFiltering[model.organizationID] : null;
                    let savedSelectedCustomers = customerJobFiltersSetting && customerJobFiltersSetting.customer && customerJobFiltersSetting.customer.length > 0 ? customerJobFiltersSetting.customer : [];
                    model.jobFilters.customer(savedSelectedCustomers);
                    model.jobFilters.selectedLocation(customerJobFiltersSetting?.selectedLocation);
                    model.schedulerCustomSettings.jobFiltering = settingsObj.jobFiltering ?? [];


                    // Re-enable the observable save on subcription trigger
                    model.schedulerCustomSettingsLoading = ko.observable(false);
                }
            }).then(r => model.loadResources());
    };

    model.saveSchedulerSettings = function () {
        console.log('Saving: ', ko.toJSON({ configValue: ko.toJSON(model.schedulerCustomSettings) }));
        postWrapper('/api/v1/userschedulesettings', ko.toJSON({ configValue: ko.toJSON(model.schedulerCustomSettings) }))
            .then((r) => console.log('User Settings Saved', model.schedulerCustomSettings));
    }
    //
    //


    //
    // Resource filtering
    // 
    model.nameFilter = ko.observable('');
    model.resourceLocationsSelected = ko.observableArray([]);
    model.resourceLocationsSelected.subscribe(function () {

        if (!model.schedulerCustomSettingsLoading()) {
            // Save Resource Locations selected for User
            //console.log('%c Locations array changed', 'background: #222; color: #bada55', model.resourceLocationsSelected());
            model.schedulerCustomSettings.filters[model.organizationID] = model.resourceLocationsSelected;
            model.saveSchedulerSettings();
        }
    });


    model.showServiceAccountResources = ko.observable(false);

    model.resourceCardVisible = function (name, resourceGroupName, locationLookupID, resourceID, isAssignedToSvcAcctJob) {
        return ko.pureComputed(function () {

            // Determine if the resource is already added to a job -> hide the card if true
            if (model.selectedResource() != null) {
                // Get the RequestID from the selected Chip
                let selectedChipRequestId = model.selectedResource().requestID;
                // Get the "day row" entry
                let row = model.schedulerRowsDictionary[selectedChipRequestId];
                // Check if the Crew/Vehicle resources for this Request has already this Card "ResourceID" -> return false (to hide the card) if found 
                if (row.crew().some(c => c.crewResourceID === resourceID)) {
                    return false;
                }
                if (row.vehicles().some(c => c.crewResourceID === resourceID)) {
                    return false;
                }
            }


            // Determine if the card is going to be visible given the current selected filters (if any)
            if (name !== '' || model.resourceGroupFilterSelected().length > 0 || model.resourceLocationsSelected().length > 0) {
                return name.toLowerCase().indexOf(model.nameFilter().toLowerCase()) !== -1
                    && (model.resourceGroupFilterSelected().includes(resourceGroupName.toLowerCase()) || model.resourceGroupFilterSelected().length === 0)
                    && (model.resourceLocationsSelected().includes(locationLookupID) || model.resourceLocationsSelected().length === 0)
                    && (!isAssignedToSvcAcctJob || model.showServiceAccountResources());
            }
            return true;
        });
    };

    model.resourceFilteringEnabled = ko.pureComputed(function () {
        return model.nameFilter() !== '' || model.resourceGroupFilterSelected().length > 0 || model.resourceLocationsSelected().length > 0;
    });

    model.clearResourceFilters = function () {
        model.resourceLocationsSelected([]);
        model.resourceGroupFilterSelected([]);
        model.nameFilter('')
        $('#roleFilteringSelectpicker').selectpicker('deselectAll');
        $('#locationFilteringSelectpicker').selectpicker('deselectAll');

    };

    model.filteringPanelOpen = ko.observable(false);
    model.filteringPanelToggleOpen = function () {
        model.filteringPanelOpen(!model.filteringPanelOpen());
    }
    //
    //

    //
    // Remove RequestSchedule entry
    //
    model.removeRequestScheduleConfirmation = notificationDialog;
    model.displayRemoveRequestScheduleConfirmation = function (RequestScheduleId, Job_No, Job_Name) {
        model.removeRequestScheduleConfirmation.displayConfirmationDialog('Confirm Remove Schedule', `Click ACCEPT to confirm removing Job# ${Job_No} "${Job_Name}" for date ${moment(model.date()).format("MM-DD-YYYY")} `, () => model.removeRequestSchedule(RequestScheduleId));
    }

    model.removeRequestSchedule = function (RequestScheduleId) {

        getWrapper('/api/v1/removescheduler', { 'RequestScheduleID': RequestScheduleId })
            .then(function (response) {
                if (response.value.code === "OK") {
                    model.loadDailySchedule();
                } else {
                    alert(response.value.msg);
                }
            }.bind(model));
    }
    //
    // Set Hard Schedule Flag
    //
    model.hardScheduleConfirmation = notificationDialog;
    model.displayHardScheduleConfirmation = function (RequestId, Job_No, Job_Name) {
        model.hardScheduleConfirmation.displayConfirmationDialog('Confirm Hard Schedule', `Click ACCEPT to confirm setting Job# ${Job_No} "${Job_Name}" as Hard Scheduled`, () => model.setHardSchedule(RequestId));
    }
    model.setHardSchedule = function (RequestId) {

        getWrapper('/api/v1/fillhardscheduler', { 'RequestID': RequestId })
            .then(function (response) {
                if (response.value.code === "OK") {
                    model.loadDailySchedule();
                } else {
                    alert(response.value.msg);
                }
            }.bind(model));
    }
    model.hardScheduleButtonTitle = (isHardScheduled) => isHardScheduled ? 'Job is Hard Scheduled' : 'Set Hard Scheduled flag on this job...';


    //
    //

    //
    // Customer Email
    //
    model.customerEmailConfirmation = notificationDialog;
    model.displayCustomerEmailConfirmation = function (RequestScheduleID, Job_No, Job_Name) {
        model.customerEmailConfirmation.displayConfirmationDialog('Confirm Customer Email'
            , `Please confirm sending customer email for Job# ${Job_No} "${Job_Name}".`
            , () => model.sendCustomerEmail(RequestScheduleID)
            , { 'ok': 'SEND', 'cancel': 'CANCEL' });
    }
    model.sendCustomerEmail = function (RequestScheduleID) {
        postWrapper('/api/v1/sendschedulercustomeremail', ko.toJSON({ 'RequestScheduleID': RequestScheduleID }))
            .then(r => console.log('Email sent'));
    }
    //
    //

    //
    // Open SR in new tab
    //
    model.openSR = function (request_id) {
        redirectToPage('/request', { 'organizationid': model.organizationID, 'requestid': request_id }, true);
    }
    //
    //


    //
    // Exceptions Handling
    //
    model.schedulerExceptionsRangeFilterOptions = [
        {
            'id': 1, 'value': 'Prev Week', 'filter': (v) => {
                let ws = moment().startOf('week').subtract(1, 'weeks');
                let we = moment().startOf('week');
                return moment(v.date).isBetween(ws, we);
            }
        },
        {
            'id': 2, 'value': 'This Week', 'filter': (v) => {
                let ws = moment().startOf('week');
                let we = moment().endOf('week');
                return moment(v.date).isBetween(ws, we);
            }
        },
        {
            'id': 3, 'value': 'Next Week', 'filter': (v) => {
                let ws = moment().endOf('week');
                let we = moment().endOf('week').add(1, 'weeks');
                return moment(v.date).isBetween(ws, we);
            }
        },
        {
            'id': 4, 'value': 'All Exceptions', 'filter': (v) => {
                return true;
            }
        }
    ];
    model.schedulerExceptionsRangeFilterValue = ko.observable(2);

    // Observable for the Exception Types found
    model.exceptionTypes = ko.observableArray([]);
    model.exceptionTypesFilters = ko.observableArray([]);

    model.schedulerExceptions = ko.observableArray([]);
    //model.schedulerExceptionsCount = ko.pureComputed(function () {
    //    return model.schedulerExceptions.length;
    //});
    //model.loadExceptions = function () {
    //    getWrapper('/api/v1/schedulerexceptions', { 'OrganizationID': model.organizationID })
    //        .then(r => {
    //            // Update the options for the exception type filter
    //            let exTypesFound = [...new Set(r.map(e => e.exceptionName))];
    //            exTypesFound = exTypesFound.map((e) => ({ 'id': e, 'value': e }))
    //            model.exceptionTypes(exTypesFound);
    //            // Update the Exception general array
    //            model.schedulerExceptions(r);
    //        });
    //}

    model.schedulerExceptionsFiltered = ko.pureComputed(function () {
        // Retrieve the funtion to filter the array
        let dateRangeFilterFx = model.schedulerExceptionsRangeFilterOptions.find(f => f.id === model.schedulerExceptionsRangeFilterValue());
        let exceptionsFiltered = model.schedulerExceptions().filter(dateRangeFilterFx.filter);

        if (model.exceptionTypesFilters().length > 0) {
            exceptionsFiltered = exceptionsFiltered.filter(e => model.exceptionTypesFilters().includes(e.exceptionName));
        }

        return exceptionsFiltered;
    });

    //
    // Screen init
    //

    // Load the User personal table configuration

    model.loadSchedulerSettings();
    // Load the Daily Schedule data
    //model.loadResources();
    model.loadDailySchedule();
    //model.loadExceptions();
    //
    //



    model.receivedJobPositionUpdate = ko.observable(false);
    model.receivedJobPositionUpdateAction = function () {
        model.receivedJobPositionUpdate(false);
        model.loadDailySchedule();
    };


    //
    // Job Sorting Modal
    //
    function JobSortingModalInit(vm, successCallback) {
        vm.jobSortingModal = {};
        self = vm.jobSortingModal;

        self.loadingJobs = ko.observable(false);
        self.savingJobs = ko.observable(false);

        self.successCallback = successCallback;
        self.dialogDisplaying = ko.observable(false);
        self.dayJobs = ko.observableArray([]);
        self.positionsChanged = ko.observable(false);

        self.jobBeingDragItem = null;
        self.jobDragOverItem = null;

        self.showDialog = function () {

            self.dayJobs([]);
            self.positionsChanged(false);
            self.savingJobs(false);
            self.loadingJobs(true);
            self.jobBeingDragItem = null;
            self.jobDragOverItem = null;

            getWrapper('/api/v1/dayschedule', { ForDate: model.date(), OrganizationID: model.organizationID })
                .then(function ({ /*dayPTOSvcAcctRows, */ dayRows }) {
                    // Use only "Regular Jobs" information (SVC ACCT and PTO does not requires sorting)
                    self.dayJobs([...dayRows]);
                    self.loadingJobs(false);
                });

            self.dialogDisplaying(true);
        };

        self.hideDialog = function () {
            self.dialogDisplaying(false);
        };

        self.initJobDrag = function (event) {
            self.jobBeingDragItem = event;
            return true;
        }

        self.jobDragOver = function (event) {
            if (self.jobDragOverItem == null) {
                self.jobDragOverItem = event;
            }

            if (event != self.jobDragOverItem) {
                self.jobDragOverItem = event;

                let sourceIndex = self.dayJobs.indexOf(self.jobBeingDragItem);
                let destIndex = self.dayJobs.indexOf(event);

                var temp = self.dayJobs()[sourceIndex];
                self.dayJobs()[sourceIndex] = self.dayJobs()[destIndex];
                self.dayJobs()[destIndex] = temp;

                self.dayJobs(self.dayJobs());
                self.positionsChanged(true);
            }
        }

        self.endJobDrag = function (event) {
            self.jobBeingDrag = null;
        }

        self.savePostions = function () {
            self.savingJobs(true);
            if (self.positionsChanged() === true) {

                let positionsUpdate = {
                    'SchedulerClientID': model.schedulerClientID,
                    'JobPositions': self.dayJobs().map((job, index) => ({ requestScheduleId: job.requestScheduleId, position: index }))
                };

                postWrapper('/api/v1/sendschedulersavepositions', ko.toJSON(positionsUpdate))
                    .then(r => {
                        if (r.succeeded) {
                            self.hideDialog();
                            self.successCallback();
                        } else {
                            alert('Error Saving Scheduler Job Positions...');
                        }
                    });
            }
        }

    };

    JobSortingModalInit(model, model.loadDailySchedule);
    //
    //


    //
    // Driver Checks
    //
    model.driverChecks = {
        hasWarning: function (crewdata) {
            return crewdata.isOverWeeklyLimit || crewdata.isNotOff10Hrs || crewdata.isOver14Hrs;
        },
        warnDriver: function (crewdata) {
            return ko.computed(function () {
                return model.driverChecks.hasWarning(crewdata);
            })
        },
        warnDriverMessage: function (crewdata) {
            return ko.computed(function () {
                const messages = [];
                if (model.driverChecks.hasWarning(crewdata)) {
                    if (crewdata.isOverWeeklyLimit) {
                        messages.push('<strong>- Over weekly limit!</strong>');
                    }
                    if (crewdata.isNotOff10Hrs) {
                        messages.push('<strong>- Not off 10 hrs!</strong>');
                    }
                    if (crewdata.isOver14Hrs) {
                        messages.push('<strong>- Over 14 hours!</strong>');
                    }
                    return messages.join('<br>');
                }
                return '';
            })
        }

    };
    //
    //

    //
    // Change messages handling
    //
    model.schedulerUpdateThrottling = {
        throttlingDelay: 3250,
        runScheduled: false,
        lastRun: Date.now(),
        updateUI: function (updateFunc) {
            console.log('Update UI', this.runScheduled);
            if (!this.runScheduled) {
                var currentTime = Date.now();
                var pp = currentTime - this.lastRun;
                if (currentTime - this.lastRun > this.throttlingDelay) {
                    this.lastRun = currentTime;
                    console.log('UIUpdateThrottler - UI update OK...', pp);
                    updateFunc();
                } else {
                    this.runScheduled = true;
                    console.log('UIUpdateThrottler - UI update scheduled... (too early)');
                    setTimeout(function () {
                        try {
                            updateFunc();
                        }
                        finally {
                            model.schedulerUpdateThrottling.runScheduled = false;
                            model.schedulerUpdateThrottling.lastRun = Date.now();
                            console.log('UIUpdateThrottler - UI update throttled completed...');
                        }
                    }, this.throttlingDelay - (currentTime - this.lastRun));
                }
            } else {
                console.log('UIUpdateThrottler - UI update throttled... (update already scheduled)');
            }
        }
    };

    signalRConnection.on("SchedulerUpdate", function (msg) {
        if (msg.organizationID === model.organizationID) {

            model.schedulerUpdateThrottling.updateUI(() => {
                model.loadDailySchedule(false);
                model.loadResources(false);
            });
        }
    });
    signalRConnection.on('ExceptionsChanged', function (msg) {
        if (msg.organizationID === model.organizationID) {
            //model.loadExceptions();
        }
    });

    function processUpdateMessage(msg) {
        console.log('JobsPositionChanged', msg);
        if (msg.schedulerclientid !== model.schedulerClientID) {
            let updateForMe = model.jobDaySchedule().map(s => s.requestScheduleId).some(rsid => msg.rsids.includes(rsid));
            console.log('Update ', updateForMe);
            model.receivedJobPositionUpdate(updateForMe);
        } else {
            console.log('Ignoring Self Update...');
        }
    };

    signalRConnection.on('JobsPositionChanged', function (msg) {
        processUpdateMessage(msg);
    });

    signalRConnection.start();


    //
    // KO ApplyBindings
    ko.applyBindings(model);
    //
    //

};



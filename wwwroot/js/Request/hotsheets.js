const initHotSheets = (hsModel) => {
    var model = hsModel;
    console.log(model);
    // Clean any KO binding in the description text
    if (model.description) {
        model.description = model.description.replaceAll('data-bind', 'data-bind1');
    }
    console.log(model.hotSheetRequestSchedules);
    console.log(model.dateData.requestScheduleId);

    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.trumbowyg = ServiceTRAXBindingHandlers.trumbowyg;
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.beforeUnloadText = ServiceTRAXBindingHandlers.beforeUnloadText;

    model.hotsheet_Identifier = ko.observable(model.hotsheet_Identifier);
    model.createdBy = ko.observable(model.createdBy);
    model.dateCreated = ko.observable(model.dateCreated);
    model.specialInstructions = ko.observable(model.specialInstructions);

    model.newContactDialog = newContactDialog(model.organizationID, model.customerID);

    //-----//
    // Map //
    //-----//


    model.showMapModal = ko.observable(null);
    model.showMapModalDialog = function (show) {
        if (show) {
            initMap();
            this.showMapModal(true);
        } else {
            this.showMapModal(null);
        }
    }.bind(model);

    //-----//



    //-----------//
    // Locations //
    //-----------//

    model.jobLocationID = ko.observable(model.jobLocationID);

    model.jobLocationDetails = ko.computed(function () {
        var sq = model.jobLocations.find(j => j.job_location_id === model.jobLocationID());
        if (sq) {
            return sq;
        }
        return {};
    }, model);

    let street = model.jobLocationDetails().street1 ? model.jobLocationDetails().street1 : (model.jobLocationDetails().street2 ? model.jobLocationDetails().street2 : (model.jobLocationDetails().street3 ? model.jobLocationDetails().street3 : ''));
    let city = model.jobLocationDetails().city ? model.jobLocationDetails().city + ', ' : '';
    let zip = model.jobLocationDetails().zip ? model.jobLocationDetails().zip + ', ' : '';
    let state = model.jobLocationDetails().state ? model.jobLocationDetails().state : '';

    model.destAdd = ko.observable(street);
    model.destCity = ko.observable(city + zip + state);

    model.jobLocationDetails.subscribe(function () {
        street = this.jobLocationDetails().street1 ? this.jobLocationDetails().street1 : (this.jobLocationDetails().street2 ? this.jobLocationDetails().street2 : (this.jobLocationDetails().street3 ? this.jobLocationDetails().street3 : ''));
        city = this.jobLocationDetails().city ? this.jobLocationDetails().city + ', ' : '';
        zip = this.jobLocationDetails().zip ? this.jobLocationDetails().zip + ', ' : '';
        state = this.jobLocationDetails().state ? this.jobLocationDetails().state : '';
        model.destAdd(street);
        model.destCity(city + zip + state);
    }.bind(model))

    model.origLocationID = ko.observable(model.origLocationID);

    model.origLocationDetails = ko.computed(function () {
        var so = model.origLocations.find(j => j.job_location_id === model.origLocationID());
        if (so) {
            return so;
        }
        return {};
    }, model);

    street = model.origLocationDetails().street1 ? model.origLocationDetails().street1 : (model.origLocationDetails().street2 ? model.origLocationDetails().street2 : (model.origLocationDetails().street3 ? model.origLocationDetails().street3 : ''));
    city = model.origLocationDetails().city ? model.origLocationDetails().city + ', ' : '';
    zip = model.origLocationDetails().zip ? model.origLocationDetails().zip + ', ' : '';
    state = model.origLocationDetails().state ? model.origLocationDetails().state : '';

    model.origAdd = ko.observable(street);
    model.origCity = ko.observable(city + zip + state);

    model.origLocationDetails.subscribe(function () {
        street = this.origLocationDetails().street1 ? this.origLocationDetails().street1 : (this.origLocationDetails().street2 ? this.origLocationDetails().street2 : (this.origLocationDetails().street3 ? this.origLocationDetails().street3 : ''));
        city = this.origLocationDetails().city ? this.origLocationDetails().city + ', ' : '';
        zip = this.origLocationDetails().zip ? this.origLocationDetails().zip + ', ' : '';
        state = this.origLocationDetails().state ? this.origLocationDetails().state : '';
        model.origAdd(street);
        model.origCity(city + zip + state);
    }.bind(model))


    model.formatForOptionComma = function (string) {
        return string ? string : 'N/S';
    }

    model.locationOptionFormatter = function (job_location) {
        let values =
            [model.formatForOptionComma(job_location.job_location_name)
                , model.formatForOptionComma(job_location.street1)
                , model.formatForOptionComma(job_location.city)
                , model.formatForOptionComma(job_location.sq_footage)];

        return values.join(', ');
    }

    //-----------//


    //----------//
    // Contacts //
    //----------//
    // Origin Contacts
    model.allOriginContacts = ko.observableArray(model.allOriginContacts);
    model.hotSheetOriginContacts = ko.observableArray(model.hotSheetOriginContacts.map(c => ({ contact_ID: ko.observable(c.contactId) })));

    model.originContactsNotYetSelected = function (currentSelectedValue) {
        let pendingContacts = model.allOriginContacts().filter(c => !model.hotSheetOriginContacts().map(c => c.contact_ID()).includes(c.contact_ID) || c.contact_ID === ko.unwrap(currentSelectedValue));
        return pendingContacts;
    };

    model.remainingOriginContacts = function (currentSelectedValue) {
        return ko.pureComputed(function () {
            return model.originContactsNotYetSelected(currentSelectedValue);
        });
    }

    model.addOriginContact = function () {
        let notSelected = model.originContactsNotYetSelected(-1);
        if (notSelected && notSelected.length > 0) {
            let firstRemaining = notSelected[0];
            model.hotSheetOriginContacts.push({ contact_ID: ko.observable(firstRemaining.contact_ID) });
        }
    };

    model.removeOriginContact = function (contactID) {
        model.hotSheetOriginContacts.remove(i => i.contact_ID() === ko.unwrap(contactID));
    }

    // Destination Contacts
    model.allDestinationContacts = ko.observableArray(model.allDestinationContacts);
    model.hotSheetDestinationContacts = ko.observableArray(model.hotSheetDestinationContacts.map(c => ({ contact_ID: ko.observable(c.contactId) })));

    model.destinationContactsNotYetSelected = function (currentSelectedValue) {
        let pendingContacts = model.allDestinationContacts().filter(c => !model.hotSheetDestinationContacts().map(c => c.contact_ID()).includes(c.contact_ID) || c.contact_ID === ko.unwrap(currentSelectedValue));
        return pendingContacts;
    };

    model.remainingDestinationContacts = function (currentSelectedValue) {
        return ko.pureComputed(function () {
            return model.destinationContactsNotYetSelected(currentSelectedValue);
        });
    };

    model.addDestinationContact = function () {
        let notSelected = model.destinationContactsNotYetSelected(-1);
        if (notSelected && notSelected.length > 0) {
            let firstRemaining = notSelected[0];
            model.hotSheetDestinationContacts.push({ contact_ID: ko.observable(firstRemaining.contact_ID) });
        }
    };

    model.removeDestinationContact = function (contactID) {
        model.hotSheetDestinationContacts.remove(i => i.contact_ID() === ko.unwrap(contactID));
    }

    model.newContactCallback = function (newcontact) {
        model.allOriginContacts.push(newcontact);
    }

    model.newDestinationContactCallback = function (newcontact) {
        model.allDestinationContacts.push(newcontact);
    }

    //model.selectedContacts = ko.observable([...(model.origContacts().find(c => c.contact_ID === model.origContactID) ?? [])]);

    //model.addOriginContact = function () {
    //    let pendingContacts = model.origContacts().filter(c => !model.selectedContacts().some(s => s.contact_ID === c.contact_ID));
    //    console.log(pendingContacts ?? [], model.origContacts(), model.selectedContacts());
    //};


    //model.contactID = ko.observable(model.contactID);

    //model.ctPhone = ko.computed(function () {
    //    return model.contacts.find(j => j.contact_ID === model.contactID());
    //}, model);

    //let phone = '';

    //if (model.ctPhone() != null) {
    //    phone = model.ctPhone().contact_Phone;
    //}

    //model.ctcPhone = ko.observable(phone);

    //model.contactID.subscribe(function () {
    //    phone = this.ctPhone().contact_Phone;
    //    this.ctcPhone(phone);
    //}.bind(model));

    //model.origContactID = ko.observable(model.origContactID);

    //model.octPhone = ko.computed(function () {
    //    var ph = model.origContacts().find(j => j.contact_ID === model.origContactID());
    //    return ph;
    //}, model);

    //let ophone = '';

    //if (model.octPhone() != null) {
    //    ophone = model.octPhone().contact_Phone;
    //}

    //model.octcPhone = ko.observable(ophone);

    //model.origContactID.subscribe(function () {
    //    ophone = this.octPhone().contact_Phone;
    //    this.octcPhone(ophone);
    //}.bind(model));

    model.newContact = {
        name: ko.observable(''),
        phone: ko.observable('')
    }

    //var ind = -2;
    model.addContact = function () {
        if (model.newContact.name() != '' && model.newContact.phone() != '') {
            model.origContacts.push({
                contact_ID: ind,
                contact_Name: model.newContact.name(),
                contact_Phone: model.newContact.phone(),
                email: ''
            });
            model.origContactID(ind);
            ind--;
            model.showContactModalDialog(false);
        } else {
            alert('Complete all fields');
        }
    }.bind(model);

    model.showContactModal = ko.observable(null);
    model.showContactModalDialog = function (show) {
        if (show) {
            model.newContact.name('');
            model.newContact.phone('');
            this.showContactModal(true);
        } else {
            this.showContactModal(null);
        }
    }.bind(model);

    //----------//


    //-----------//
    // Equipment //
    //-----------//

    model.savedEquipment = ko.observableArray(model.savedEquipment);

    for (var i = 0; i < model.savedEquipment().length; i++) {
        model.savedEquipment()[i].equipmentID = ko.observable(model.savedEquipment()[i].equipmentID);
        model.savedEquipment()[i].equipmentIN = ko.observable(model.savedEquipment()[i].equipmentIN);
        model.savedEquipment()[i].equipmentOUT = ko.observable(model.savedEquipment()[i].equipmentOUT);
        model.savedEquipment()[i].equipmentName = ko.observable(model.savedEquipment()[i].equipmentName);
    }

    model.addEquipment = function () {
        model.savedEquipment.push({
            equipmentID: ko.observable(0),
            equipmentIN: ko.observable(0),
            equipmentOUT: ko.observable(0),
            equipmentName: ko.observable('')
        })
    };

    model.addCustEquipment = function () {
        let e = {
            equipmentID: ko.observable(-1),
            equipmentIN: ko.observable(0),
            equipmentOUT: ko.observable(0),
            equipmentName: ko.observable('')
        };
        model.savedEquipment.push(e);
    };

    model.removeEquipment = function (item) {
        model.savedEquipment.remove(item);
    }.bind(model);

    //-----------//


    //----------//
    // Vehicles //
    //----------//

    model.savedVehicle = ko.observableArray(model.savedVehicle);

    for (var i = 0; i < model.savedVehicle().length; i++) {
        model.savedVehicle()[i].vehicleID = ko.observable(model.savedVehicle()[i].vehicleID);
        model.savedVehicle()[i].vehicleQTY = ko.observable(model.savedVehicle()[i].vehicleQTY);
    }

    model.addVehicle = function () {
        model.savedVehicle.push({
            vehicleID: ko.observable(null),
            vehicleQTY: ko.observable(0)
        })
    };

    model.removeVehicle = function (item) {
        model.savedVehicle.remove(item);
    }.bind(model);

    //----------//


    //------//
    // Date //
    //------//

    model.workDate = ko.observable(model.workDate);
    console.log('datedata', model.dateData);

    model.dateData.jobLength = ko.observable(model.dateData.jobLength === null ? '' : model.dateData.jobLength);
    model.dateData.onSiteStartTime = ko.observable(model.dateData.onSiteStartTime === null ? '' : moment(model.dateData.onSiteStartTime).format('HH:mm'));
    model.dateData.warehouseStartTime = ko.observable(model.dateData.warehouseStartTime === null ? '' : moment(model.dateData.warehouseStartTime).format('HH:mm'));

    model.dateData.driverQty = ko.observable(model.dateData.driverQty);
    model.dateData.installerQty = ko.observable(model.dateData.installerQty);
    model.dateData.leadQty = ko.observable(model.dateData.leadQty);
    model.dateData.moverQty = ko.observable(model.dateData.moverQty);

    model.dateData.requestScheduleId = ko.observable(model.dateData.requestScheduleId);
    model.dateData.requestScheduleId.subscribe(function () {
        model.reloadHotSheetData();
    })


    model.workDate.subscribe(function () {
        model.reloadHotSheetData();
    })

    model.hotSheetRequestSchedules = ko.observableArray(model.hotSheetRequestSchedules);

    model.reloadHotSheetData = function () {
        getWrapper('/api/v1/gethotsheetdata', { 'RequestID': model.requestID, 'WorkDate': moment(model.workDate()).format('MM/DD/YYYY') })
            .then(function (response) {

                model.hotSheetRequestSchedules(response ? response : []);
                const value = response ? (response.find(r => r.requestScheduleId === model.dateData.requestScheduleId())) : null;

                if (value != null) {
                    model.dateData.jobLength(value.jobLength === null ? 0 : value.jobLength);
                    model.dateData.onSiteStartTime(value.onSiteStartTime === null ? '' : moment(value.onSiteStartTime).utc().format('HH:mm')); //moment(value.onSiteStartTime).format('HH:mm'));
                    model.dateData.warehouseStartTime(value.warehouseStartTime === null ? '' : moment(value.warehouseStartTime).utc().format('HH:mm')); //moment(value.warehouseStartTime).format('HH:mm'));

                    model.dateData.driverQty(value.driverQty);
                    model.dateData.installerQty(value.installerQty);
                    model.dateData.leadQty(value.leadQty);
                    model.dateData.moverQty(value.moverQty);

                } else {
                    model.dateData.jobLength('');
                    model.dateData.onSiteStartTime('');
                    model.dateData.warehouseStartTime('');

                    model.dateData.driverQty(0);
                    model.dateData.installerQty(0);
                    model.dateData.leadQty(0);
                    model.dateData.moverQty(0);
                }

            }.bind(model));
    }
    //------//


    //------//
    // Save //
    //------//

    model.saveHotSheet = function () {

        var se = [];
        ko.utils.arrayForEach(model.savedEquipment(), function (eq) {
            se.push({
                equipmentID: eq.equipmentID(),
                equipmentIN: parseInt(eq.equipmentIN()),
                equipmentOUT: parseInt(eq.equipmentOUT()),
                equipmentName: eq.equipmentName()
            })
        })

        var sv = [];
        ko.utils.arrayForEach(model.savedVehicle(), function (ve) {
            sv.push({
                vehicleID: ve.vehicleID(),
                vehicleQTY: parseInt(ve.vehicleQTY())
            })
        })

        //var contactName = model.octPhone().contact_Name
        //var contactPhone = model.octPhone().contact_Phone

        let data = {
            requestID: model.requestID,
            origLocationID: model.origLocationID(),
            //origContactID: model.origContactID(),
            jobLocationID: model.jobLocationID(),
            //contactID: model.contactID(),
            workDate: model.workDate(),
            savedEquipment: se,
            savedVehicle: sv,
            specialInstructions: model.specialInstructions,
            //OriginContactName: contactName,
            //OriginContactPhone: contactPhone,
            originContacts: model.hotSheetOriginContacts()?.map(c => c.contact_ID()),
            destinationContacts: model.hotSheetDestinationContacts()?.map(c => c.contact_ID()),
            requestScheduleId: model.dateData.requestScheduleId(),

            jobLength: model.dateData.jobLength() ? parseInt(model.dateData.jobLength()) : model.dateData.jobLength(),
            onSiteStartTime: '1900-01-01T' + model.dateData.onSiteStartTime() + 'Z',
            warehouseStartTime: '1900-01-01T' + model.dateData.warehouseStartTime() + 'Z'
        };

        let reqData = ko.toJSON(data);
        //console.log('orig ', ko.toJS(model.hotSheetOriginContacts()));
        //console.log('dest ', ko.toJS(model.hotSheetDestinationContacts()));
        //console.log('save ', ko.toJS(data));

        postWrapper('/api/v1/savehotsheet', reqData)
            .then(function (response) {
                if (response.value) {
                    alert('Hot Sheet Created!');
                    model.hotsheet_Identifier(response.value.hotsheet_Identifier);
                    model.hotSheetID = response.value.hotSheetID;
                    model.createdBy(response.value.createdBy);
                    model.dateCreated(response.value.dateCreated);
                    model.modelChangeTracker.reset();
                }
                else {
                    alert('ERROR Creating Hotsheet!');
                }
            });

    }.bind(model);

    //------//


    //
    // Doc Signature Handling
    //
    model.documentSignatureDialog = initDocumentSigning({}, model.currentUserFullName, () => { });

    // User is signing an already attached document
    model.signHotsheet = function (request_document) {
        model.documentSignatureDialog.signHotsheet(request_document.hotSheetID, model.requestID,  model.organizationID);
    }
    //
    //


    //---------//
    // Tracker //
    //---------//

    var trackableModel = {
        destloc: model.jobLocationID,
        destcon: model.contactID,
        origloc: model.origLocationID,
        origcon: model.origContactID,
        workdate: model.workDate,
        eq: model.savedEquipment,
        ve: model.savedVehicle,
        p01: model.dateData.onSiteStartTime,
        p02: model.dateData.warehouseStartTime,
        p03: model.dateData.jobLength,
        p04: model.hotSheetOriginContacts,
        p05: model.hotSheetDestinationContacts
    };
    model.modelChangeTracker = ko.dirtyFlag(trackableModel);

    model.beforeUnloadPrompt = { message: "You are leaving without creating the new version!", shouldWarn: model.modelChangeTracker.isDirty };

    ko.validation.init({
        errorElementClass: 'text-danger',
        errorMessageClass: 'help-block',
        decorateElement: true,
        insertMessages: false
    });

    // Start KO
    ko.applyBindings(model);


    // Reset change tracked because some Binding Handlers are changing the model
    model.modelChangeTracker.reset();

}
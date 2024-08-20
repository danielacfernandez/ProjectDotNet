const initRequest = (requestModel) => {
    let model = requestModel;

    model.organizationLocations = ko.observable(model.organizationLocations);
    console.log(model);
    console.log(model.request_Data.isSendToSchedule);
    console.log(model.isReadOnly);
    console.log(model.isNew);
    console.log(model.isSR);
    console.log(model.readOnlyLSP);

    // Clean any KO binding in the description text
    if (model.request_Data.description) {
        model.request_Data.description = model.request_Data.description.replaceAll('data-bind', 'data-bind1');
    }
    if (model.request_Data.other_conditions) {
        model.request_Data.other_conditions = model.request_Data.other_conditions.replaceAll('data-bind', 'data-bind1');
    }


    var documentTitleOrig = document.title;

    //
    // Doc Signature Handling
    //
    model.afterSigningCallback = function () {
        model.reloadAttachments();
    }

    model.documentSignatureDialog = initDocumentSigning({}, /*'service_request', model.request_Data.request_id,*/ model.currentUserFullName, model.afterSigningCallback);

    // User is signing an already attached document
    model.signAttachedDocument = function (request_document) {
        console.log('qqq', request_document);
        model.documentSignatureDialog.signAttachedDocument(request_document.request_document_id, request_document.request_id, model.organizationID);
        //redirectToPage('/request/RequestToPdf', { 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID }, true);
    }
    model.request_Data.lspId = ko.observable(model.request_Data.lspId);
    // User is starting a new document signature
    model.signServiceRequest = function () {
        model.documentSignatureDialog.signServiceRequest(model.request_Data.request_id, model.organizationID);
        //model.documentSignatureDialog.displayDialog(request_document_id);
        //redirectToPage('/request/RequestToPdf', { 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID }, true);
    }


    model.signRequest = function () {
        getWrapper('/api/v1/signrequestdocument', { 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID })
    }

    model.testPdf = function () {
        //getWrapper('/api/v1/generatetestingpdf', { 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID })
        redirectToPage('/request/TestPrint', {}, true);
    }
    //

    //
    model.notificationDialog = notificationDialog;
    //

    //
    // Change the Page Header when the user is going to pring the document
    // the page title is used as the name of the file when printing to PDF
    //
    window.onafterprint = function (event) {
        document.title = documentTitleOrig;
    };

    window.onbeforeprint = function (event) {
        document.title = (model.request_Data.quote_Number ? model.request_Data.quote_Number : 'New') + (model.isSR ? '-SR' : '-QR');
    };


    function scrollToDiv(divID) {
        var aTag = $(`div#${divID}`);
        $('html,body').animate({ scrollTop: calcTop(aTag) }, 'slow');
    }
    function scrollToDivInDSR(divID) {
        var aTag = $(`div#${divID}`);
        $('DailyStatusReportModal').animate({ scrollTop: calcTop(aTag) }, 'slow');
    }

    function scrollToDivElem(div) {
        //console.log(div);
        $('html,body').animate({ scrollTop: calcTop(div) }, 'slow');
    }

    $('.submenujumpbutton').click(function (e) {
        scrollToDiv(e.currentTarget.dataset.jumpto);
    });


    //
    // Sticky SubMenu
    //
    var subMenuNav = document.getElementById("requestSubMenuNav");
    //var subMenuTop = subMenuNav.offsetTop;

    //// Calc the top taking into account if the header is sticky (position fixed) or not
    calcTop = function (elem) {
        let elemTop = elem.offset().top - 220;
        //elemTop = subMenuNav.classList.contains('sticky') ? elemTop - 90 : elemTop - 160;
        return elemTop > 0 ? elemTop : 0;
    }

    //// Add the sticky class to the requestSubMenuNav when you reach its scroll position. Remove "sticky" when you leave the scroll position
    //window.onscroll = () => window.pageYOffset >= subMenuTop ? subMenuNav.classList.add("sticky") : subMenuNav.classList.remove("sticky");

    model.scrollToError = function () {
        // Find the visible error DIV and scroll to it
        var div = $('.requestMissingFieldError')[0];
        scrollToDivElem($(div));
    };
    //
    //

    model.addContact = function () {
        this.requestContacts.push({ contact_ID: ko.observable(null) });
    }.bind(model);

    model.buildObservableRequestProduct = function (requestID, prodID, prodOther, shipID) {
        return {
            requestID: requestID,
            product_lookup_id: ko.observable(prodID),
            product_Other: ko.observable(prodOther),
            shipping_Method_Lookup_ID: ko.observable(shipID)
        };
    }.bind(model);

    model.addRequestProductFromObject = function (requestProd) {
        model.requestProduct.push(model.buildObservableRequestProduct(requestProd.requestID, requestProd.product_lookup_id, requestProd.product_Other, requestProd.shipping_Method_Lookup_ID));
    }.bind(model);

    model.addRequestProduct = function () {
        model.requestProduct.push(model.buildObservableRequestProduct(model.request_Data.request_id, model.systemsFurniture[0].systemFurnitureID, null, model.shippingMethod[0].shippingMethodID));
    }.bind(model);

    model.addRequestProductOther = function (requestID, prodID, prodOther, shipID) {
        model.requestProductOther.push(model.buildObservableRequestProduct(model.request_Data.request_id, null, '', model.shippingMethod[0].shippingMethodID));
    }.bind(model);

    model.applyBootstrapStyles = function (elems) {
        $(elems).find('select').selectpicker();
    }.bind(model);

    model.request_Data.conditionalLW = ko.observable(model.request_Data.conditionalLW);
    model.request_Data.unconditionalLW = ko.observable(model.request_Data.unconditionalLW);

    //
    // Fuel Surcharge & Admin Fee
    //

    model.request_Data.addAdminFee = ko.observable(model.request_Data.addAdminFee);
    model.request_Data.adminFeeRate = ko.observable(model.request_Data.adminFeeRate);
    model.request_Data.addFuelSurcharge = ko.observable(model.request_Data.addFuelSurcharge);
    model.request_Data.fuelSurchargeRate = ko.observable(model.request_Data.fuelSurchargeRate);

    model.addAdminFeeChecked = ko.observable(!model.request_Data.addAdminFee());
    //console.log('Model ', model);
    model.addAdminFeeRateClick = function () {
        // alert('adminFeeChecked:' + model.request_Data.addAdminFee());
        if (model.addAdminFeeChecked() === true) {
            model.addAdminFeeChecked(false);
            model.request_Data.addAdminFee(false);
        }
        else {
            model.addAdminFeeChecked(true);
            model.request_Data.addAdminFee(true);

        }


    }.bind(model);

    model.addFuelSurchargeChecked = ko.observable(!model.request_Data.addFuelSurcharge());
    //console.log('Model ', model);
    model.addFuelSurchargeRateClick = function () {
        // alert('fuelsurchargechecked:' + model.addFuelSurchargeChecked());
        if (model.addFuelSurchargeChecked() === true) {
            model.addFuelSurchargeChecked(false);
            model.request_Data.addFuelSurcharge(false);
        }
        else {
            model.addFuelSurchargeChecked(true);
            model.request_Data.addFuelSurcharge(true);

        }
        // model.modelChangeTracker.isDirty(true);

    }.bind(model);
    // 
    // Modify user/time observables
    //
    model.request_Data.modifiedByName = ko.observable(model.request_Data.modifiedByName);
    model.request_Data.modifyTime = ko.observable(model.request_Data.modifyTime);
    model.allCustomerContacts = ko.observableArray(model.allCustomerContacts);

    model.findContact = function (contact_ID) {
        return this.allCustomerContacts().find(c => c.contact_ID === contact_ID);
    }.bind(model);


    model.requestContacts.forEach(function (v, i, a) {
        a[i] = { contact_ID: ko.observable(a[i]) };
    });

    model.requestContacts = ko.observableArray(model.requestContacts);

    model.removeRequestContact = function (contact_ID) {
        this.requestContacts.remove(function (contact) {
            return contact.contact_ID === contact_ID;
        });
    }.bind(model);

    model.requestContactsNotAssignedYet = function (currentValue) {
        var cv = ko.unwrap(currentValue);
        return ko.pureComputed(function () {
            var selectedIds = this.requestContacts().map(c => c.contact_ID());
            return this.allCustomerContacts().filter(f => !selectedIds.includes(f.contact_ID) || f.contact_ID === cv);
        }, model);
    }
    //
    //
    //

    // Create the observables for the array objects inner properties
    model.requestProduct.forEach(function (v, i, arr) {
        arr[i] = model.buildObservableRequestProduct(arr[i].requestID, arr[i].product_lookup_id, arr[i].product_Other, arr[i].shipping_Method_Lookup_ID);
    });
    model.requestProduct = ko.observableArray(model.requestProduct);

    // Create the observables for the array objects inner properties
    model.requestProductOther.forEach(function (v, i, arr) {
        arr[i] = model.buildObservableRequestProduct(arr[i].requestID, arr[i].product_lookup_id, arr[i].product_Other, arr[i].shipping_Method_Lookup_ID);
        //arr[i] = model.addRequestProductFromObject(arr[i]);
    });
    model.requestProductOther = ko.observableArray(model.requestProductOther);

    if (model.requestProductOther().length === 0) {
        model.requestProductOtherCount = null;
    } else {
        model.requestProductOtherCount = 1;
    }



    model.requestProductRemove = function (product_lookup_id) {
        this.requestProduct.remove(function (prod) {
            return prod.product_lookup_id === product_lookup_id;
        });
    }.bind(model);


    model.requestProductOtherRemove = function (product_Other) {
        this.requestProductOther.remove(function (prod) {
            return prod.product_Other === product_Other;
        });
    }.bind(model);

    model.showNewCustomerModal = ko.observable(null);
    model.showNewCustomerModalDialog = function (show, customerType) {
        if (show) {
            this.newCustomer.reset(customerType);
            this.showNewCustomerModal(show);
        } else {
            this.showNewCustomerModal(null);
        }
    }.bind(model);

    //
    // Location Contacts
    //
    model.findLocationContact = function (contact_ID) {
        //return this.allContacts.find(c => c.contact_ID === contact_ID);
        return this.locationContacts().find(c => c.contact_ID === contact_ID);
    }.bind(model);

    model.requestLocationContacts.forEach(function (v, i, a) {
        a[i] = { contact_ID: ko.observable(a[i]) };
    });

    model.requestLocationContacts = ko.observableArray(model.requestLocationContacts);

    model.addRequestLocationContacts = function (locationContactID) {
        model.requestLocationContacts.push({ contact_ID: ko.observable(null) });
    }

    if (model.requestLocationContacts().length > 0) {
        model.requestLocationContactsCount = 1;
    } else {
        model.requestLocationContactsCount = null;
    }

    model.removeRequestLocationContact = function (contact_ID) {
        this.requestLocationContacts.remove(function (contact) {
            return contact.contact_ID === contact_ID;
        });
    }.bind(model);

    model.locationContactsNotAssignedYet = function (currentValue) {
        var cv = ko.unwrap(currentValue);
        return ko.pureComputed(function () {
            var selectedIds = this.requestLocationContacts().map(c => c.contact_ID());
            return this.locationContacts().filter(f => !selectedIds.includes(f.contact_ID) || f.contact_ID === cv);
        }, model);
    };

    // Setup a Boostrap Modal binding handler
    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    ko.bindingHandlers.selectPicker = ServiceTRAXBindingHandlers.selectPicker;
    ko.bindingHandlers.trumbowyg = ServiceTRAXBindingHandlers.trumbowyg;
    ko.bindingHandlers.yesnoCheckboxValue = ServiceTRAXBindingHandlers.yesnoCheckboxValue;
    ko.bindingHandlers.yesnoCheckboxReadOnlyValue = ServiceTRAXBindingHandlers.yesnoCheckboxReadOnlyValue;
    ko.bindingHandlers.datepicker = ServiceTRAXBindingHandlers.datepicker;
    ko.bindingHandlers.beforeUnloadText = ServiceTRAXBindingHandlers.beforeUnloadText;
    ko.bindingHandlers.fileInputSelection = ServiceTRAXBindingHandlers.fileInputSelection;

    model.savingNewCustomer = ko.observable(false);
    model.saveNewCustomer = function () {

        var result = this.newCustomer.validationGroup();
        if (result().length > 0) {
            result.showAllMessages(true);
            return false;
        }

        var newcustomerdata = {
            organizationID: this.organizationID,
            customerName: this.newCustomer.name,
            customerTypeCode: this.newCustomer.customerTypeCode,
            belongsToCustomerID: this.request_Data.customer_id,
            endUserName: this.newCustomer.name
        }

        if (newcustomerdata.customerTypeCode() === 'prospect') {
            model.savingNewCustomer(true);
            postWrapper('api/v1/addcustomer', ko.toJSON(newcustomerdata))
                .then(function (response) {
                    // Add the new customer to the allcustomers array
                    model.allCustomers.push(response.value);
                    // Select the new customer in the dropdown
                    model.request_Data.customer_id(response.value.customer_Id);
                    // Close the New Customer dialog
                    model.showNewCustomerModalDialog(false);
                }).finally(() => model.savingNewCustomer(false));

        } else if (newcustomerdata.customerTypeCode() === 'end_user') {
            model.savingNewCustomer(true);
            postWrapper('api/v1/addenduser', ko.toJSON(newcustomerdata))
                .then((response) => {
                    // Add the new End User to the list
                    model.endUsers.push(response.value);
                    // Set the new End User as selected
                    model.request_Data.end_user_id(response.value.end_user_id);
                    // Close the New Customer dialog
                    model.showNewCustomerModalDialog(false);
                }).finally(() => model.savingNewCustomer(false));
        }

    }.bind(model);

    //
    // Attachments handler
    //
    model.attachments = ko.observableArray(model.attachments);
    model.reloadAttachments = async function () {
        let reply = await getWrapper('/api/v1/requestattachments', { 'RequestID': model.request_Data.request_id });
        model.attachments(reply);
    }

    model.removeAttachment = function (request_document_id) {
        model.attachments.remove((attachment) => attachment.request_document_id === request_document_id);
    }

    model.removeNewFileAttachment = function (name) {
        model.newFiles.remove((attachment) => attachment.name === name);
    }

    //
    // Validations
    //
    ko.validation.init({
        //errorElementClass: 'text-danger',
        errorElementClass: 'requestMissingFieldError',
        errorMessageClass: 'help-block',
        decorateElement: true,
        decorateInputElement: false,
        insertMessages: false
    });

    model.request_Data.project_type_id = ko.observable(model.request_Data.project_type_id).extend({ required: { message: 'Please enter a Project Type.' } });;
    model.request_Data.project_type_id.subscribe(function (newValue) {
        if (model.isSR && model.isNew) {
            // Check if the user selected Furniture or Wareshousing type
            let filtered = model.serviceTypes.filter(t => t.serviceTypeID === newValue);
            let typeOfServiceSelected = filtered.length > 0 ? filtered[0].serviceCode : null;
            //When creating an SR from scratch, if Furniture or Warehousing for Types of Service drop down is selected, Send To Schedule should be automatically checked
            model.request_Data.isSendToSchedule(typeOfServiceSelected === 'service_account' ? false : true);
        }
    });

    model.request_Data.dealer_po_no = ko.observable(model.request_Data.dealer_po_no).extend({ required: { message: 'Please enter a PO Number.' } });


    useValidateDateRule();
    ko.validation.registerExtenders();
    var quote_type_id;

    if (!model.isNew) {
        quote_type_id = model.request_Data.quote_type_id;
     }
     else {
        // 2023.04.10: Changed by FernandoP. If it is a new QR, the default billing type is Flat Fee. Requested by Shawn in email subject "Re: ServiceTrax - Billing Type" from 2023.04.05.
        if (model.isSR)
            quote_type_id = model.billingTypes.filter(r => r.code == "time_exp")[0].id;
        else
            quote_type_id = model.billingTypes.filter(r => r.code == "flat_fee_bid")[0].id;
        }


    model.request_Data.project_Manager_Id = ko.observable(model.request_Data.project_Manager_Id).extend({ required: { message: 'Please select a Project Manager.' } });
    model.request_Data.schedulerPMContactID = ko.observable(model.request_Data.schedulerPMContactID)
    model.request_Data.request_Name = ko.observable(model.request_Data.request_Name)
    model.request_Data.project_name = ko.observable(model.request_Data.project_name).extend({ required: { message: 'Please enter a Job Name.' } });
    model.request_Data.a_m_sales_contact_id = ko.observable(model.request_Data.a_m_sales_contact_id).extend({ required: { message: 'Please select a Salesperson.' } });
    model.request_Data.customer_id = ko.observable(model.request_Data.customer_id).extend({ required: { message: 'Please select a Customer.' } });
    model.request_Data.days_to_complete = ko.observable(model.request_Data.days_to_complete).extend({ required: { message: 'Please enter # of days to complete.' } });
    model.request_Data.work_type_lookup_id = ko.observable(model.request_Data.work_type_lookup_id).extend({ required: { message: 'Please enter a Work Type.' } });
    model.request_Data.end_user_id = ko.observable(model.request_Data.end_user_id).extend({ required: { message: 'Please enter a End User.' } });
    model.request_Data.job_location_id = ko.observable(model.request_Data.job_location_id).extend({ required: { message: 'Please enter a Job Location.' } });
    model.request_Data.job_location_contact_id = ko.observable(model.request_Data.job_location_contact_id).extend({ required: { message: 'Please enter a Contact.' } });
    model.request_Data.quote_type_id = ko.observable(quote_type_id).extend({ required: { message: 'Please select a Billing Type.' } });
    model.request_Data.description = ko.observable(model.request_Data.description).extend({ required: { message: 'Please enter Work Request Description.' } });
    model.request_Data.other_conditions = ko.observable(model.request_Data.other_conditions); //.extend({required: {message: 'Please enter Work Request Description (internal).' } });
    model.request_Data.externalHeaderNumber = ko.observable(model.request_Data.externalHeaderNumber).extend({ required: { message: 'Please enter Hedberg #.' } });

    model.enableExternalQuoteField = ko.pureComputed(function () {
        let cust = model.allCustomers().find(c => c.customer_Id === model.request_Data.customer_id());
        return !model.isReadOnly && model.request_Data.customer_id() !== null && (cust !== null ? (cust.customer_Name.toLowerCase().includes('atmosphere') || cust.customer_Name.toLowerCase().includes('connect')) : false);
    });
    model.enableExternalQuoteFieldRq = ko.pureComputed(function () {
        let cust = model.allCustomers().find(c => c.customer_Id === model.request_Data.customer_id());
        return !model.isReadOnly && model.request_Data.customer_id() !== null && (cust !== null ? (cust.customer_Name.toLowerCase().includes('atmosphere')) : false);
    })

    model.request_Data.quote_or_order_type_id = ko.observable(model.request_Data.quote_or_order_type_id).extend({ required: { message: 'Please select Quote or Order.' } });
    model.request_Data.customer_costing_type_id = ko.observable(model.request_Data.customer_costing_type_id).extend({
        required: { message: 'Please select a Customer Costing.' },
        onlyIf: function () {
            return model.enableExternalQuoteField() === true;
        }
    });


    model.requestProductOtherCount = ko.observable(model.requestProductOtherCount); //.extend({ required: { message: 'Please enter at least one product.' } });


    model.requestProductCount = ko.pureComputed(function () {
        return model.requestProduct().length > 0 ? model.requestProduct().length : null;
    }).extend({ required: { message: 'Please enter at least one product.' } });


    model.requestContactsCount = ko.pureComputed(function () {
        return model.requestContacts().length > 0 ? model.requestContacts().length : null;
    }).extend({ required: { message: 'Please enter at least one Contact.' } });


    model.requestLocationContactsCount = ko.observable(model.requestLocationContactsCount).extend({ required: { message: 'Please enter at least one contact' } });

    // (FernandoP) When shown in client side we need to show the original date/time as it is in organization time zone.
     if (model.request_Data.timeZoneOffset != 0) {
         let clientTZOffset = new Date(model.request_Data.est_start_date).getTimezoneOffset(); // Note: getTimezoneOffset() returns a positive value for negative GMT, for example, for GMT -5 it returns 300 (= minutes).
                                                              // This is because you have UTCtime = localtime + getTimezoneOffset().
                                                              // But, model.request_Data.timeZoneOffset value is calculated in SQL side, in this case it will be negative for negative GMT.
         model.request_Data.est_start_date = moment(model.request_Data.est_start_date).add(model.request_Data.timeZoneOffset + clientTZOffset, 'm').toDate();
    }
    
    model.request_Data.est_start_date = ko.observable(model.request_Data.est_start_date).extend({ required: { message: 'Start date is required.', onlyIf: function () { return !(model.request_Data.project_type_id() === 5 && model.isSR); } }, validateDate: function () { return !(model.request_Data.project_type_id() === 5 && model.isSR) } });
    model.request_Data.est_end_date = ko.observable(model.request_Data.est_end_date).extend({ date: true });

    model.request_Data.schedule_type_id = ko.observable(model.request_Data.schedule_type_id);


    // Functions to control the Options passed to the Datetime Pickers depending on the Request being writable or read-only
    model.est_end_date_options = function (isReadOnly) {
        return isReadOnly === false ? { ifNullSetDateTo: model.request_Data.est_start_date(), setStartDateTo: model.request_Data.est_start_date, trigger: '#triggerCalendarEndDate' } : {};
    }

    model.est_start_date_options = function (isReadOnly) {
        return isReadOnly === false ? { trigger: '#triggerCalendarStartDate' } : {};
    }


    model.settingStartFromScratch = false;
    model.request_Data.est_start_date.subscribe(function () {
        // If "est_end_date" is null -> set the calendar to the day/month selected by the
        // user on the "start datepicker" (that way the "end datepicker" opens in the same month as the start date)
        if (model.request_Data.est_end_date() == null) {
            model.settingStartFromScratch = true;
            var newStartDate = new Date(model.request_Data.est_start_date());
            $('#estimatedEndDate').datepicker('setDate', newStartDate);
            $('#estimatedEndDate').datepicker('update');
            $('#estimatedEndDate').datepicker('setStartDate', newStartDate);
            $('#estimatedEndDate').val('');
            model.request_Data.est_end_date(null);
            model.settingStartFromScratch = false;
        } else {
            if (moment(model.request_Data.est_end_date()).diff(moment(model.request_Data.est_start_date()), 'days') < 0) {
                //model.request_Data.est_end_date(model.request_Data.est_start_date());
                $('#estimatedEndDate').datepicker('setDate', new Date(moment(model.request_Data.est_start_date())));
                model.chagingFromDate = true;
                model.request_Data.days_to_complete(0);
                model.chagingFromDate = false;
            }
        }
        model.calc_days();

        // Check Service Start within the Service Start Date Lock period and notify user
        model.VerifyWithinServiceDateLockPeriod();

    });

    model.VerifyWithinServiceDateLockPeriod = function () {
        let displayNotification = false;
        let daysTypes = '';
        if (model.request_Data.include_weekends_flag().toUpperCase() === 'Y') {
            if (moment(model.request_Data.est_start_date()).diff(moment(), 'days', true) <= model.serviceStartDateLockPeriod) {
                displayNotification = true;
                daysTypes = 'days -including weekend-';
            }
        } else {
            if (moment(model.request_Data.est_start_date()).businessDiff(moment()) <= model.serviceStartDateLockPeriod) {
                displayNotification = true;
                daysTypes = 'business days';
            }
        }

        if (displayNotification && model.showStartDateWarning) {
            model.notificationDialog.displayDialog('START DATE WARNING', `You have selected a Service Start date within the lock period (${model.serviceStartDateLockPeriod} ${daysTypes}). Please be aware that users who do not have permission to edit Requests with the lock period will have Read Only Access.`);
        }
    }

    model.requestProductOther.subscribe(function () {
        if (model.requestProductOther().length == 0) {
            model.requestProductOtherCount(null);
        } else {
            model.requestProductOtherCount(1);
        }
    })

    model.requestLocationContacts.subscribe(function () {
        if (model.requestLocationContacts().length > 0) {
            model.requestLocationContactsCount(1);
        } else {
            model.requestLocationContactsCount(null);
        }
    })

    model.request_Data.est_end_date.subscribe(() => {
        if (!model.settingStartFromScratch) {
            model.calc_days();
        }
    });


    model.chagingFromDate = false;

    model.request_Data.days_to_complete.subscribe(function (newValue) {
        if (!model.chagingFromDate) {
            let firstDate = moment(model.request_Data.est_start_date()).startOf('day');
            if (model.request_Data.include_weekends_flag().toUpperCase() === 'Y') {
                model.request_Data.est_end_date(moment(firstDate).add(newValue - 1, 'days'));
            } else {
                model.request_Data.est_end_date(moment(firstDate).businessAdd(newValue - 1));
            }
            $('#estimatedEndDate').datepicker('setDate', model.request_Data.est_end_date()._d);
            $('#estimatedEndDate').datepicker('update');
        }
    });
    var obj;
    if (model.enableExternalQuoteField) {
        obj = {
            f1: model.request_Data.project_Manager_Id,
            f2: model.request_Data.project_name,
            f4: model.request_Data.a_m_sales_contact_id,
            f5: model.request_Data.customer_id,
            f6: model.request_Data.days_to_complete,
            f7: model.request_Data.work_type_lookup_id,
            f8: model.request_Data.end_user_id,
            f9: model.request_Data.job_location_id,
            fb: model.request_Data.job_location_contact_id,
            fc: model.request_Data.quote_type_id,
            fe: model.request_Data.description,
            fh: model.request_Data.est_start_date,
            fi: model.request_Data.est_end_date,
            fj: model.requestProductCount,
            fk: model.requestContactsCount
        };
    } else {
        obj = {
            f1: model.request_Data.project_Manager_Id,
            f2: model.request_Data.project_name,
            f4: model.request_Data.a_m_sales_contact_id,
            f5: model.request_Data.customer_id,
            f6: model.request_Data.days_to_complete,
            f7: model.request_Data.work_type_lookup_id,
            f8: model.request_Data.end_user_id,
            f9: model.request_Data.job_location_id,
            fb: model.request_Data.job_location_contact_id,
            fc: model.request_Data.quote_type_id,
            fe: model.request_Data.description,
            fh: model.request_Data.est_start_date,
            fi: model.request_Data.est_end_date,
            fj: model.requestProductCount,
            fk: model.requestContactsCount,
            fi: model.request_Data.quote_or_order_type_id,
            fj: model.request_Data.customer_costing_type_id,
            fk: model.request_Data.externalHeaderNumber
        };
    }


    var changeValidationOnCustomer = ko.observable(model.enableExternalQuoteField);
    changeValidationOnCustomer.subscribe(function () {
        if (model.enableExternalQuoteField) {
            obj.fi = null;
            obj.fi = null;
            obj.fi = null;
        } else {
            fi = model.request_Data.quote_or_order_type_id;
            fj = model.request_Data.customer_costing_type_id;
            fk = model.request_Data.externalHeaderNumber;
        }
    });

    //
    // Validations for Save (fields that are saved into Project table)
    //
    model.firstSaveValidator = {
        firstSaveValidations: {
            a: model.request_Data.project_type_id,
            b: model.request_Data.end_user_id,
            c: model.request_Data.project_name,
            d: model.request_Data.customer_id
        },
        firtSaveValidationModel: ko.validatedObservable({
            a: model.request_Data.project_type_id,
            b: model.request_Data.end_user_id,
            c: model.request_Data.project_name,
            d: model.request_Data.customer_id
        }),
        isValid: function () {
            if (!this.firtSaveValidationModel.isValid()) {
                this.firtSaveValidationModel.errors.showAllMessages(true);
                model.scrollToError();
                return false;
            }
            return true;
        }
    }
    //
    //

    //
    // Validations for SR only
    //
    model.SRValidator = {
        srValidationModel: ko.validatedObservable({
            a: model.request_Data.dealer_po_no,
            b: model.requestLocationContactsCount,
            c: model.request_Data.customer_costing_type_id
        }),
        isValid: function () {
            if (!this.srValidationModel.isValid()) {
                this.srValidationModel.errors.showAllMessages(true);
                return false;
            }
            return true;
        }
    };
    //
    //


    //------------//
    // Punch List //
    //------------//

    model.request_Data.ispunchlist = ko.observable(model.request_Data.ispunchlist);


    //------------//

    //---------------//
    // Custom Fields //
    //---------------//

    var objNumber = 10;

    model.customFields = ko.observableArray(model.customFields);

    ko.utils.arrayForEach(model.customFields(), function (res) {
        if (res.isMandatory === 'Y' && model.isSR) {
            res.customFieldValue = ko.observable(res.customFieldValue).extend({ required: { mesage: 'Please complete this field' } });
            obj['f' + objNumber] = res.customFieldValue;
            objNumber++;
        } else {
            res.customFieldValue = ko.observable(res.customFieldValue);
        }
    });

    //---------------//


    //-----------//
    // Hot Sheet //
    //-----------//

    model.hotSheets = ko.observableArray(model.hotSheets);
    model.updateHotSheets = function () {
        getWrapper('api/v1/gethotsheets', { 'RequestID': model.request_Data.request_id })
            .then(function (response) {


                // Get Hotsheets groups (Time shifts are groups)
                const groups = response.value.reduce((result, currentValue) => {
                    (result[currentValue['requestScheduleId']] = result[currentValue['requestScheduleId']] || []).push(currentValue);
                    return result;
                }, {});

                const hotSheetGroups = Object.keys(groups).map(g => ({ groupname: g, hotsheets: groups[g] }));
                model.hotSheets(hotSheetGroups);
            })
    };


    var hotSheetCustomer = model.allCustomers.filter(cust => cust.customer_Id === model.request_Data.customer_id())[0];
    var hotSheetEndUser = model.endUsers.filter(user => user.end_user_id === model.request_Data.end_user_id())[0];
    var hotSheetSalesPerson = model.salespersons.filter(sp => sp.salespersonID === model.request_Data.a_m_sales_contact_id())[0];
    var hotSheetRequestLocationContact = model.requestLocationContacts()[0];

    model.hotSheet = encodeURIComponent(ko.toJSON({
        HotSheetID: 0,
        OrganizationID: model.organizationID,
        RequestID: model.request_Data.request_id,
        JobName: model.request_Data.project_name,
        CustomerName: hotSheetCustomer ? hotSheetCustomer.customer_Name : null,
        EndUserName: hotSheetEndUser ? hotSheetEndUser.end_user_name : null,
        EndUserID: model.request_Data.end_user_id(),
        SalesContact: hotSheetSalesPerson ? hotSheetSalesPerson.salespersonName : null,
        JobLocationID: model.request_Data.job_location_id(),
        ContactID: hotSheetRequestLocationContact ? hotSheetRequestLocationContact.contact_ID() : null,
        //Description: model.request_Data.description(), // avoid sending the Description is too big and breaks the URL
        OrigContactID: model.request_Data.project_Manager_Id(),
        WorkDate: model.request_Data.est_start_date(),
        PONo: model.request_Data.dealer_po_no()
    }));


    //-----------//

    model.validationModel = ko.validatedObservable(obj);


    //
    // Check if the user selects the Date&Time schedule type
    //
    model.needsSchedulerHour = ko.pureComputed(function () {
        let schedType = model.scheduleTypes.filter(st => st.id === model.request_Data.schedule_type_id())[0];
        //return model.scheduleTypes.filter(st => st.id === model.request_Data.schedule_type_id())[0]?.code === 'date_time';
        return schedType ? schedType.code === 'date_time' : false;
    });

    // Reset hour when ScheduleType changes
    model.needsSchedulerHour.subscribe(function (needsHour) {
        if (needsHour) {
            if (model.request_Data.est_start_date()) {
                // If the Request requires date & time then compose both into "est_start_date"
                model.request_Data.est_start_date(moment(model.request_Data.est_start_date()).startOf('day').set({ 'hour': model.estimatedServiceHour().split(':')[0], 'minute': model.estimatedServiceHour().split(':')[1] }));
            }
        } else {
            // If the Request does not requires date & time then put 00:00 into "est_start_date" (this was done because they want to keep the 
            // estimatedServiceHour if they set an hour, then change the schedule type, and go back to date & time...)
            model.request_Data.est_start_date(moment(model.request_Data.est_start_date()).startOf('day'));
        }
    });


    //
    // Estimated Service Hour handling (used only when loading the Request)
    //
    model.parseEstimatedServiceHour = function () {
        if (model.request_Data.est_start_date()) {
            let eststartdate = moment(model.request_Data.est_start_date());
            return `${(eststartdate.hour() < 10 ? '0' : '') + eststartdate.hour()}:${(eststartdate.minute() < 10 ? '0' : '') + eststartdate.minute()}`;
        }
        else {
            return '07:00';
        }
    }

    model.estimatedServiceHour = ko.observable(model.parseEstimatedServiceHour());

    model.estimatedServiceHourDisable = ko.pureComputed(function () {
        return model.isReadOnly || !model.request_Data.est_start_date();
    });

    model.estimatedServiceHourTitle = ko.pureComputed(function () {
        if (model.estimatedServiceHourDisable()) {
            return 'Pick a Date to enable hour selection.'
        }
        return 'Select Service hour';
    });

    model.setEstimatedServiceHour = function () {
        if (model.request_Data.est_start_date()) {
            // If the Request requires date & time then compose both into "est_start_date"
            model.request_Data.est_start_date(moment(model.request_Data.est_start_date()).startOf('day').set({ "hour": model.estimatedServiceHour().split(':')[0], "minute": model.estimatedServiceHour().split(':')[1] }));
        }
    }

    model.estimatedServiceHour.subscribe(model.setEstimatedServiceHour);


    model.newCustomer = {
        name: ko.observable('').extend({ required: { message: 'Please enter a Customer Name.' } }),
        type: '',
        customerTypeCode: ko.observable(''),
        validationGroup: function () {
            return ko.validation.group(this, { deep: true })
        },
        reset: function (customerType) {
            this.name('');
            this.customerTypeCode(customerType);
            this.validationGroup().showAllMessages(false);
        }
    };

    model.addCustomer = function () {
        this.allCustomers.push({ customer_id: 39582, customer_Name: "Test-Cust-05" });
    }.bind(model);

    model.request_Data.schedule_with_client_flag = ko.observable(model.request_Data.schedule_with_client_flag);
    model.request_Data.include_weekends_flag = ko.observable(model.request_Data.include_weekends_flag);
    model.request_Data.include_weekends_flag.subscribe(function () {
        model.calc_days();
        // Check Service Start within the Service Start Date Lock period and notify user
        model.VerifyWithinServiceDateLockPeriod();
    })
    model.request_Data.include_holidays_flag = ko.observable(model.request_Data.include_holidays_flag);

    model.calc_days = function () {
        if (model.request_Data.est_start_date() && model.request_Data.est_end_date()) {

            let firstDay = moment(model.request_Data.est_start_date()).startOf('day');
            let lastDay = moment(model.request_Data.est_end_date()).endOf('day');

            var d = 0;
            if (model.request_Data.include_weekends_flag() === 'Y') {
                d = Math.ceil(lastDay.diff(firstDay, 'days', true));
            } else {
                d = lastDay.businessDiff(firstDay);
                // If d==0 then check if both days are the same and return 1, businessDiff seems to compute that as 0
                if (d === 0) {
                    d = Math.ceil(lastDay.diff(firstDay, 'days', true));
                }
            }

            if (d > 0) {
                model.chagingFromDate = true;
                model.request_Data.days_to_complete(d);
                model.chagingFromDate = false;
            }
        }
    }

    model.request_Data.badge_access_required = ko.observable(model.request_Data.badge_access_required);
    model.request_Data.stair_carry_req = ko.observable(model.request_Data.stair_carry_req);
    model.request_Data.bring_ppe = ko.observable(model.request_Data.bring_ppe);
    model.request_Data.stair_carry_addl_info = ko.observable(model.request_Data.stair_carry_addl_info);
    model.request_Data.taxable_flag = ko.observable(model.request_Data.taxable_flag);
    model.request_Data.isSendToSchedule = ko.observable(model.request_Data.isSendToSchedule);
    model.endUsers = ko.observableArray(model.endUsers);

    //
    //
    //


    //model.request_Data.customer_id = ko.observable(model.request_Data.customer_id);
    model.request_Data.customer_id.subscribe(function (new_customer_id) {

        // Load End User for selected customer ID
        getWrapper('api/v1/endusers', { 'OrganizationID': model.organizationID, 'CustomerID': new_customer_id })
            .then(function (response) {
                // Set EndUsers array
                this.request_Data.end_user_id(null);
                this.endUsers(response.value);
                // Clear all Customer related End User values
                this.request_Data.job_location_id(null);
                this.jobLocations([]);
            }.bind(model));



        // Load Customer contacts for newly selected customer_id
        getWrapper('api/v1/customercontacts', { 'OrganizationID': model.organizationID, 'CustomerID': new_customer_id })
            .then(function (response) {
                // Set EndUsers array
                //this.setAllCustomerContacts(response.value);
                this.allCustomerContacts(response.value);

                // Clear all request actual contacs
                this.requestContacts([]);
            }.bind(model));

        // Clear Hedberg Quote #
        model.request_Data.externalHeaderNumber(null);

    }.bind(model));
    model.allCustomers = ko.observableArray(model.allCustomers); //.slice(0,3));

    model.addedBuildingManager = ko.observable(false); // Tells when the used added a Location Manager
    model.addedBuildingManagerID = ko.observable('');
    model.addedBuildingManagerName = ko.observable('');
    model.addedBuildingManagerPhone = ko.observable('');
    model.addedBuildingManagerEmail = ko.observable('');
    model.jobLocationsHedbergShipId = ko.observable('');


    model.elocedit = ko.observable(true);
    model.request_Data.job_location_id.subscribe(() => model.enableLocationEdit(model.request_Data.job_location_id()));
    model.jobLocations = ko.observableArray(model.jobLocations);
    model.enableLocationEdit = function (value) {
        var jobLocationsHedbergShipId = -1;

        if (model.jobLocations().filter(p => p.job_location_name.toUpperCase().trim() == 'HEDBERG SHIP TO LOCATION').length > 0) {
            jobLocationsHedbergShipId = model.jobLocations().filter(p => p.job_location_name.toUpperCase().trim() == 'HEDBERG SHIP TO LOCATION')[0].job_location_id;
        }

        if (value && (value !== jobLocationsHedbergShipId)) {
            model.elocedit(true);
            return true;
        }
        model.elocedit(false);
        return false;

    };

    model.enableLocationEdit(model.request_Data.job_location_id());

    model.request_Data.end_user_id.subscribe(function (new_customer_id) {


        getWrapper('api/v1/joblocations', { 'OrganizationID': model.organizationID, 'CustomerID': new_customer_id })
            // Load Job Locations array
            .then(({ value }) => {

                // Clear current selected Job_Location
                this.request_Data.job_location_id(null);

                model.jobLocations(value);

                // If External Header Number is not empty then we are setting a Hedbeg Customer -> so lookup for the custom Hedberg Location and select it
                if (model.request_Data.externalHeaderNumber() && model.request_Data.externalHeaderNumber().length > 0) {
                    let hedbergShipTo = value.find(l => l.job_location_name.toLowerCase() === 'hedberg ship to location');
                    model.request_Data.job_location_id(hedbergShipTo ? hedbergShipTo.job_location_id : null);
                }
            });

        model.addedBuildingManager(false);
    }.bind(model));


    model.locationContacts = ko.observableArray(model.locationContacts);
    model.request_Data.job_location_id.subscribe(function (new_job_location_id) {

        getWrapper('api/v1/joblocationcontacts', { 'JobLocationID': new_job_location_id })
            .then((r) => model.locationContacts(r.value));

    }.bind(model));


    model.job_location_details = ko.computed(function () {
        var sq = model.jobLocations().find(j => j.job_location_id === model.request_Data.job_location_id());
        if (sq) {
            return sq;
        }
        // return a empty object if nothing was found (to avoid error of trying to access a property of unde)
        return {};
    }, model);

    CalculateLocationAddressString = () => {
        let jld = model.job_location_details();
        return [ko.unwrap(jld.street1), ko.unwrap(jld.street2), ko.unwrap(jld.street3), ko.unwrap(jld.city), ko.unwrap(jld.zip), ko.unwrap(jld.state)].filter(l => l).join(', ');
    };

    // Addres to show next to job location
    model.showedAddress = ko.observable(CalculateLocationAddressString());

    model.job_location_details.subscribe(function () {
        model.showedAddress(CalculateLocationAddressString());
    });


    model.googleMapsVisible = ko.pureComputed(function () {
        return model.job_location_details().city && model.job_location_details().street1;
    });

    model.googleMapsURL = ko.pureComputed(function () {
        let address = [
            model.job_location_details().street1,
            model.job_location_details().street2,
            model.job_location_details().street3,
            model.job_location_details().city,
            model.job_location_details().zip,
            model.job_location_details().state
        ];
        return 'https://www.google.com/maps/place/?q=' + encodeURIComponent(address.filter(a => a !== null).join(', '));
    });

    //
    // Is Internal Request handling
    //
    model.request_Data.isInternalRequest = ko.observable(model.request_Data.isInternalRequest);
    const serviceTypeServiceAccountLookupID = model.serviceTypes.find(st => st.serviceCode === 'service_account') ? model.serviceTypes.find(st => st.serviceCode === 'service_account').serviceTypeID : null;
    model.hideIsInternalRequestCheck = ko.computed(function () {
        // Hide the Is Service Request checkbox if the SR is NOT a "Service Account" type
        let willHide = model.request_Data.project_type_id() != serviceTypeServiceAccountLookupID;
        // Unselect IsInternalRequest if the user select any typ of job that will not use this value
        if (willHide && model.request_Data.isInternalRequest()) {
            model.request_Data.isInternalRequest(false);
        }
        return willHide;
    });

    //
    // NEW CONTACT HANDLING
    //
    model.newContactDialog = {
        isDialogDisplaying: ko.observable(false),

        name: ko.observable('').extend({ required: { message: 'Please give a name to the Contact.' } }),
        workphone: ko.observable().extend({ required: false, pattern: { message: 'Invalid phone number.', params: /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/ } }),
        cellphone: ko.observable().extend({ required: false, pattern: { message: 'Invalid phone number.', params: /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/ } }),
        homephone: ko.observable().extend({ required: false, pattern: { message: 'Invalid phone number.', params: /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/ } }),
        email: ko.observable().extend({ required: false, email: true }),
        organizationid: model.organizationID,
        customer_id: model.request_Data.customer_id(),
        contact_type: ko.observable(''),
        joblocationid: null,
        active: true,
        isCreatingContactVar: ko.observable(null),
        contact_id: null,
        validationGroup: function () {
            return ko.validation.group(this, { deep: true })
        },

        displayDialog: function (contact_type) {
            this.name('');
            this.workphone('');
            this.cellphone('');
            this.homephone('');
            this.email('');
            this.customer_id = model.request_Data.customer_id();
            this.contact_type(contact_type);
            this.joblocationid = contact_type === 'job_location' || contact_type === 'bldg_mgmt_co' ? model.request_Data.job_location_id : null;
            this.validationGroup().showAllMessages(false);

            this.isCreatingContactVar(true);

            this.isDialogDisplaying(true);
        },

        displayEditionDialog: function (contact /*id*/) {

            let contactid = contact.contact_ID;
            this.isCreatingContactVar(false);
            this.contact_id = contactid;

            getWrapper('/api/v1/updaterequestcontact', { 'OrganizationID': model.organizationID, 'ContactID': contactid })
                .then((r) => {
                    let contactData = r.value;
                    this.name(contactData.contact_name);
                    this.workphone(contactData.phone_work);
                    this.cellphone(contactData.phone_cell);
                    this.homephone(contactData.phone_home);
                    this.email(contactData.email);
                    this.contact_type(contactData.contact_type);
                    this.validationGroup().showAllMessages(false);

                    this.isDialogDisplaying(true);
                });
        },


        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        validateFields: function () {
            // Check if the customer data is valid
            var result = this.validationGroup();
            if (result().length > 0) {
                // Contact validation failed -> display messages
                result.showAllMessages(true);
                return false;
            }
            return true;
        },
        saveNewContact: function () {
            if (!this.validateFields()) {
                return;
            }

            let contactData = {
                name: this.name(),
                workphone: this.workphone(),
                cellphone: this.cellphone(),
                homephone: this.homephone(),
                email: this.email(),
                customer_id: model.request_Data.customer_id(),
                contact_type: this.contact_type(),
                joblocationid: this.contact_type() === 'job_location' || this.contact_type() === 'bldg_mgmt_co' ? model.request_Data.job_location_id() : null,
                organizationid: this.organizationid,
                active: this.active
            }

            // Contact validation succeeded -> proceed to save thru API
            postWrapper('api/v1/addcontact', ko.toJSON(contactData))
                .then(function (response) {
                    if (model.newContactDialog.contact_type() === 'job_location') {
                        // Add the new customer to the allcustomers array
                        model.locationContacts.push(response.value);
                        // Select the new customer in the dropdown
                        model.requestLocationContacts.push({ contact_ID: ko.observable(response.value.contact_ID) });
                    } else if (model.newContactDialog.contact_type() === 'bldg_mgmt_co') {

                        // Reload Job Locations so the Building Manager data is updated in the UI
                        getWrapper('api/v1/joblocations', { 'OrganizationID': model.organizationID, 'CustomerID': model.request_Data.end_user_id() })
                            .then((r) => model.jobLocations(r.value));
                    } else {
                        // Add the new customer to the allcustomers array
                        //model.allCustomerContacts.push(model.makeObservableCustomerContact(response.value));
                        model.allCustomerContacts.push(response.value);
                        // Select the new customer in the dropdown
                        model.requestContacts.push({ contact_ID: ko.observable(response.value.contact_ID) });
                    }
                    // Close the New Customer dialog
                    model.newContactDialog.closeDialog();
                });
        },
        updateContact: function () {
            if (!this.validateFields()) {
                return;
            }

            let contactData = {
                contact_id: this.contact_id,
                organization_id: this.organizationid,
                contact_name: this.name(),
                phone_work: this.workphone(),
                phone_cell: this.cellphone(),
                phone_home: this.homephone(),
                email: this.email(),
            }

            postWrapper('/api/v1/updaterequestcontact', ko.toJSON(contactData))
                .then(r => {
                    let contactData = r.value;

                    let idx = model.allCustomerContacts().findIndex(c => c.contact_ID === contactData.contact_ID);
                    if (idx > -1) {
                        //model.allCustomerContacts()[idx] = model.makeObservableCustomerContact(r.value);
                        model.allCustomerContacts()[idx] = contactData;
                        model.allCustomerContacts.valueHasMutated();
                    }

                    idx = model.locationContacts().findIndex(c => c.contact_ID === contactData.contact_ID);
                    if (idx > -1) {
                        model.locationContacts()[idx] = contactData;
                        model.locationContacts.valueHasMutated();
                    }

                    // If the contact was the Building Management Contact then reaload location > that's the easiet way 
                    // to update the contact details(without making all it's fields observable, etc)
                    if (model.job_location_details().buildingmgmtcontactid === contactData.contact_ID) {

                        getWrapper('api/v1/joblocations', { 'OrganizationID': model.organizationID, 'CustomerID': model.request_Data.end_user_id() })
                            .then((r) => model.jobLocations(r.value));

                    }


                    return 1;
                }).then(r => model.newContactDialog.closeDialog());
        },
        isUpdatingContact: ko.pureComputed(() => !model.newContactDialog.isCreatingContactVar()),
        isCreatingContact: ko.pureComputed(() => model.newContactDialog.isCreatingContactVar())

    }

    $(".phone-input").mask("(999) 999-9999", { autoclear: false });




    //
    // Contact Edition
    //
    model.editContact = function (contactid) {
        model.newContactDialog.displayEditionDialog(contactid);
    }
    //
    //


    //
    // New Location Add
    //
    model.showNewLocationModal = ko.observable(null);

    model.showNewLocationModalDialog = function (show) {
        if (show) {
            this.newLocationDetails.reset();
            this.newLocationDetails.isUpdating(false);
            this.showNewLocationModal(show);
        } else {
            this.showNewLocationModal(null);
        }
    }.bind(model);

    model.showEditLocationModalDialog = function (show) {
        if (show) {
            this.newLocationDetails.isUpdating(true);
            getWrapper('/api/v1/joblocationbyid', { 'OrganizationID': model.organizationID, 'JobLocationId': model.request_Data.job_location_id() })
                .then(r => {
                    if (r.value && r.value.found) {
                        const loc = r.value.locationInfo;
                        this.newLocationDetails.customer_id = model.request_Data.end_user_id();
                        this.newLocationDetails.job_location_name(loc.job_location_name);
                        this.newLocationDetails.loading_dock_type(loc.loading_dock_type);
                        this.newLocationDetails.dock_height(loc.dock_height);
                        this.newLocationDetails.dock_reserv_req_type(loc.dock_reserv_req_type);
                        this.newLocationDetails.elevator_avail_type_id(loc.elevator_avail_type_id);
                        this.newLocationDetails.elevator_reserv_req_type(loc.elevator_reserv_req_type);
                        this.newLocationDetails.floor_prot_type(loc.floor_prot_type);
                        this.newLocationDetails.wall_protection_type(loc.wall_protection_type);
                        this.newLocationDetails.doorway_prot_type(loc.doorway_prot_type);
                        this.newLocationDetails.street1(loc.street1);
                        this.newLocationDetails.street2(loc.street2);
                        this.newLocationDetails.street3(loc.street3);
                        this.newLocationDetails.city(loc.city);
                        this.newLocationDetails.state(loc.state);
                        this.newLocationDetails.zip(loc.zip);
                        this.newLocationDetails.validationGroup().showAllMessages(false);

                        this.showNewLocationModal(show);
                    }
                })
        } else {
            this.showNewLocationModal(null);
        }
    }.bind(model);


    model.newLocationDetails = {
        organization_id: model.organizationID,
        customer_id: model.request_Data.end_user_id(),
        job_location_name: ko.observable('').extend({ required: { message: 'Please give a name to the Job Location.' } }),
        loading_dock_type: ko.observable(''),
        dock_height: ko.observable(''),
        dock_reserv_req_type: ko.observable(''),
        elevator_avail_type_id: ko.observable(null),
        elevator_reserv_req_type: ko.observable(''),
        floor_prot_type: ko.observable(''),
        wall_protection_type: ko.observable(''),
        doorway_prot_type: ko.observable(''),
        street1: ko.observable(''),
        street2: ko.observable(''),
        street3: ko.observable(''),
        city: ko.observable(''),
        state: ko.observable(''),
        zip: ko.observable(''),
        validationGroup: function () {
            return ko.validation.group(this, { deep: true })
        },
        isUpdating: ko.observable(false),


        reset: function () {
            this.customer_id = model.request_Data.end_user_id();
            this.job_location_name('');
            this.loading_dock_type('N');
            this.dock_height('');
            this.dock_reserv_req_type('N');
            this.elevator_avail_type_id(null);
            this.elevator_reserv_req_type('N');
            this.floor_prot_type('N');
            this.wall_protection_type('N');
            this.doorway_prot_type('N');
            this.street1('');
            this.street2('');
            this.street3('');
            this.city('');
            this.state('');
            this.zip('');
            this.validationGroup().showAllMessages(false);
        }
    };

    model.upsertLocation = function () {
        // Validate Location info
        var result = this.newLocationDetails.validationGroup();
        if (result().length > 0) {
            result.showAllMessages(true);
            return false;
        }


        if (this.newLocationDetails.isUpdating()) {
            var updateObj = {
                ...this.newLocationDetails, 'job_location_id': model.request_Data.job_location_id()
            }

            postWrapper('api/v1/updatejoblocation', ko.toJSON(updateObj))
                .then(function (response) {
                    let item = this.jobLocations().find(l => l.job_location_id === model.request_Data.job_location_id());
                    this.jobLocations.replace(item, updateObj);
                    // Hide the dialog
                    this.showNewLocationModal(false);
                }.bind(model));

        } else {
            postWrapper('api/v1/addjoblocation', ko.toJSON(this.newLocationDetails))
                .then(function (response) {
                    this.jobLocations.push(response.value);
                    this.request_Data.job_location_id(response.value.job_location_id)
                    // Hide the dialog
                    this.showNewLocationModal(false);
                }.bind(model));
        }

    }
    //
    //


    //
    // FILE DROP
    //

    model.newFiles = ko.observableArray([]);

    model.dragover = function (e) {
        e.preventDefault();
    };

    model.insertFile = function (files) {
        let repeatedFiles = [];
        var longFilenames = [];

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            // Replace all '+' ocurrences in the filename because IIS forbids files with that char in the name (use a separate filename var because file.name cannot be rewritten)
            filename = file.name.replaceAll('+', '_');

            // Remove any file whose name length > 250 (Request_documents table has this limit on name length)
            if (filename > 250) {
                longFilenames.push(filename);
            }
            // Check that the attachment collection doens't have a file with the same name already
            else if (this.newFiles().some(f => f.name.toUpperCase() === filename.toUpperCase()) ||
                this.attachments().some(f => f.name.toUpperCase() === filename.toUpperCase())) {
                repeatedFiles.push(filename);
            } else {
                this.newFiles.push({ name: filename, created_by: 'You', date_created: new Date(), file: file });
            }
        }

        if (repeatedFiles.length > 0) {
            model.notificationDialog.displayDialog('FILE ATTACH ERROR', 'The file(s) listed below already exists as attachments and were ignored, please remove them from the attachment section if you intended to reupload them.\n\t' + repeatedFiles.join('\n\t'));
        }

        if (longFilenames.length > 0) {
            let longNameError = '';
            if (longFilenames.length == 1) {
                longNameError = 'A file was discarded because its name is longer than 250 characters.\n\t';
            }
            if (longFilenames.length > 1) {
                longNameError = 'Some files were discarded because its names are longer than 250 characters.\n\t';
            }
            model.notificationDialog.displayDialog('MAX FILENAME LENGTH EXCEEDED', longNameError + longFilenames.join('\n\t'));
        }

    }.bind(model);

    model.dropFileHandler = function (e, b) {
        if (e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.types) {
            if (e.originalEvent.dataTransfer.types.every(t => t === 'Files')) {
                this.insertFile(e.originalEvent.dataTransfer.files);
            }
        }
    }.bind(model);

    model.insertFilesFromInput = function (files) {
        this.insertFile(files);
    }.bind(model);

    //-----------//
    // Resources //
    //-----------//

    model.resources = ko.observable(model.resources);

    model.headerSelResources = ko.observableArray(model.headerSelResources);
    model.scopeSelResources = ko.observableArray(model.scopeSelResources);
    ko.utils.arrayForEach(model.resources(), function (res) {
        res.headerOption = ko.observable(res.headerOption);
    })

    model.resources().map(function (res) {
        if (res.headerOption()) {
            if (res.scopeOption) {
                model.scopeSelResources().push(res.resourceID);
            }
            model.headerSelResources().push(res.resourceID);
        }
    });

    model.scopeResources = ko.observableArray(model.resources().filter(function (res) {
        return res.headerOption();
    }));

    model.headerSelResources.subscribe(function () {
        ko.utils.arrayForEach(model.resources(), function (res) {
            if (model.headerSelResources().includes(res.resourceID)) {
                res.headerOption(true);
            } else {
                res.headerOption(false);
            }
        });
        model.scopeResources(model.resources().filter(function (res) {
            return res.headerOption();
        }));
    }.bind(model));

    model.scopeSelResources.subscribe(function () {
        ko.utils.arrayForEach(model.resources(), function (res) {
            if (model.scopeSelResources().includes(res.resourceID)) {
                res.scopeOption = true;
            } else {
                res.scopeOption = false;
            }
        });
    }.bind(model));

    //-----------//





    //
    // Check required fields 
    //
    model.allSRRequiredFieldsSet = function () {
        if (model.isSR) {
            console.log('here');
            let validQRFields = this.validationModel.isValid();
            let validSRFields = model.SRValidator.isValid();
            console.log('here2' + validQRFields + validSRFields);
            if (!validQRFields || !validSRFields) {
                this.validationModel.errors.showAllMessages(true);
                model.scrollToError();
                return false;
            }
        }
        return true;
    }

    model.request_Data.locationLookupId = ko.observable(model.request_Data.locationLookupId).extend({ required: { message: 'Please enter Organization Location.' } });
    model.organizationLocationValidator = {
        orgLocValidationModel: ko.validatedObservable({
            a: model.request_Data.locationLookupId
        }),
        isValid: function () {
            if (!this.orgLocValidationModel.isValid()) {
                this.orgLocValidationModel.errors.showAllMessages(true);
                model.scrollToError();
                return false;
            }
            return true;
        }
    };

    model.checkOrganizationLocation = function () {
        if (model.isSR && model.isReadyToSchedule) {

            let isValid = model.organizationLocationValidator.isValid();
            if (!isValid) {
                //this.organizationLocationValidator.errors.showAllMessages(true);
                //model.scrollToError();
                return false;
            }
        }
        return true;
    }

    //
    // Save Request
    //
    model.isSavingRequest = ko.observable(false);

    model.saveRequest = function () {
        console.log('here');
        console.log(model.request_Data);
        console.log(model.request_Data.lspId());
        let filtered = model.serviceTypes.filter(t => t.serviceTypeID === model.request_Data.project_type_id());
        let typeOfServiceSelected = filtered.length > 0 ? filtered[0].serviceCode : null;
        if (((model.isSR && !model.request_Data.isSendToSchedule()) || (!model.isSR && typeOfServiceSelected === 'service_account')) && model.request_Data.lspId() > 0 )
            model.notificationDialog.displayDialog("Local Service Provider and Service Account", "You have selected both Service Account and Local Service Provider. Please, remove the Local Service Provider or change the Type of Service to go on.");
        else {
            // Clean Request contacts that are empty
            model.requestLocationContacts(model.requestLocationContacts().filter(function (cont) {
                return cont.contact_ID() != null;
            }))

            model.requestContacts(model.requestContacts().filter(function (cont) {
                return cont.contact_ID() != null;
            }))

            model.requestProduct(model.requestProduct().filter(function (prod, ind, arr) {
                if (ind > 0 || model.requestProduct().some(element => element.product_lookup_id() != 748)) {
                    return prod.product_lookup_id() != 748;
                } else {
                    return true;
                }
            }))

            model.requestProductOther(model.requestProductOther().filter(function (prod) {
                return prod.product_Other() != '';
            }))

            // Check that all SR required fields are complete
            if (!model.allSRRequiredFieldsSet()) {
                return false;
            }

            // If is a new Req then validate the fields that are saved into Project
            if (model.isNew) {
                if (!model.firstSaveValidator.isValid()) {
                    return false;
                }
            }

            var headerArray = [];
            ko.utils.arrayForEach(model.headerSelResources(), function (res) {
                headerArray.push({ ResourceID: res });
            });
            var scopeArray = [];
            ko.utils.arrayForEach(model.scopeSelResources(), function (res) {
                scopeArray.push({ ResourceID: res });
            });

            // Signal that the reqeusts is saving
            model.isSavingRequest(true);


            // this will add the Service Hour is missing (i.e. the user never picked it) 
            if (model.needsSchedulerHour()) {
                model.setEstimatedServiceHour();
            }

            console.log(model.request_Data);
            var data = new FormData();
            // Append the model (Quote Request data)
            data.append('clientTimeZone', ko.toJSON(new Date(model.request_Data.est_start_date()).getTimezoneOffset()));
            data.append('clientTimeZoneEndDate', ko.toJSON(new Date(model.request_Data.est_end_date()).getTimezoneOffset()));
            data.append('isNew', ko.toJSON(model.isNew));
            data.append('request', ko.toJSON(model.request_Data));
            data.append('requestProducts', ko.toJSON(model.requestProduct().concat(model.requestProductOther())));
            data.append('requestProduct', ko.toJSON(model.requestProduct));
            data.append('requestProductOther', ko.toJSON(model.requestProductOther));
            data.append('requestAttachments', ko.toJSON(model.attachments));
            data.append('requestContacts', ko.toJSON(model.requestContacts));
            data.append('requestLocationContacts', ko.toJSON(model.requestLocationContacts));
            data.append('requestHeaderResources', ko.toJSON(headerArray));
            data.append('requestScopeResources', ko.toJSON(scopeArray));
            data.append('customFields', ko.toJSON(model.customFields));
            // Append files (attachments)
            for (var f = 0; f < this.newFiles().length; f++) {
                data.append('newFiles', this.newFiles()[f].file, this.newFiles()[f].name);
            };

            var shouldReload = model.isAdditionalRequest === true || model.isNew === true;
            console.log(data);
            fetch('api/v1/saverequest',
                {
                    method: 'POST',
                    body: data
                }).then(res => {
                    if (!res.ok) {
                        return res.json().then(err => Promise.reject(err.responseText));
                    }
                    return res.json();
                }).catch(error => alert(error))
                .then(async function (response) {
                    // Local update the Last Modify user/time
                    model.request_Data.modifiedByName('You');
                    model.request_Data.modifyTime(new Date());

                    // Reload Attachments and clear newFiles (if any)
                    await model.reloadAttachments();
                    model.newFiles([]);

                    // Reset the model tracker
                    model.modelChangeTracker.reset();
                    //if (model.isSR && model.isNew)
                    //    model.notificationDialog.displayDialog("PURCHASE ORDER", "THE PURCHASE ORDER WAS CREATED");

                    // If it was an Additional Quote Request then reload it
                    if (shouldReload) {
                        redirectToPage('/Request', { 'RequestId': response.value.request_id, 'OrganizationID': model.organizationID });
                    }

                }).finally(() => {
                    // Signal that the request saving is over
                    if (!shouldReload) {
                        model.isSavingRequest(false);
                    }
                });
        }
    }.bind(model);




    //
    // Change status
    //
    model.cancellingRequest = ko.observable(false);
    model.setRequestCancelledStatus = function () {
        model.cancellingRequest(true);
        model.changeRequestStatus('qr_cancelled');
    }

    model.creatingQuote = ko.observable(false);
    model.setRequestQuotedStatus = function () {
        model.creatingQuote(true);
        model.createQuote();
    }

    model.settingReadyToSchedule = ko.observable(false);
    model.fillScheduler = function () {
        let organizationLocationSet = model.checkOrganizationLocation();
        if (!organizationLocationSet) {
            return false;
        }

        model.settingReadyToSchedule(true);

        getWrapper('api/v1/fillscheduler', { 'RequestID': this.request_Data.request_id })
            .then(({ value }) => {
                if (value.code === "OK") {
                    redirectToPage('/request', { 'RequestID': this.request_Data.request_id, 'OrganizationID': model.organizationID });
                } else if (value.code === 'NOENTRIESINOPERATIONALPLAN') {
                    model.settingReadyToSchedule(false);
                    this.showSSRespModalDialog(true);
                } else {
                    model.settingReadyToSchedule(false);
                    alert(value.msg);
                }
            });
    }


    model.hardSchedulingInProcess = ko.observable(false);
    model.fillHardScheduler = function () {
        model.hardSchedulingInProcess(true);
        getWrapper('api/v1/fillhardscheduler', { 'RequestID': this.request_Data.request_id })
            .then(function (response) {
                if (response.value.code === "OK") {
                    window.location = `/request?requestid=${this.request_Data.request_id}&OrganizationID=${model.organizationID}`;
                } else {
                    model.hardSchedulingInProcess(false);
                    alert(response.value.msg);
                }
            }.bind(model));
    }

    model.showSSRespModal = ko.observable(null);
    model.showSSRespModalDialog = function (show) {
        if (show) {
            this.showSSRespModal(true);
        } else {
            this.showSSRespModal(null);
        }
    }.bind(model);

    model.showResourcesModal = ko.observable(null);
    model.showResourcesModalDialog = function (show) {
        if (show) {
            this.showResourcesModal(true);
        } else {
            this.showResourcesModal(null);
        }
    }.bind(model);



    //
    // Import Quote Handling
    //
    model.importExistingQuoteDialog = importExistingQuoteDialog(model.organizationID);
    model.importFromExistingQuote = function () {
        model.importExistingQuoteDialog.displayDialog(model.request_Data);
    }
    //
    //

    //
    // Open Quote Request
    //
    model.openingRequest = ko.observable(false);
    model.setOpenQuoteRequest = function () {
        model.openingRequest(true);
        // Before setting the SENT status validate the model
        if (!this.validationModel.isValid()) {
            this.validationModel.errors.showAllMessages(true);
            model.scrollToError();
            model.sendingQuoteRequest(false);
            return false;
        }

        model.changeRequestStatus('qr_created');
    }


    //
    // Set SENT Status
    //
    model.sendingQuoteRequest = ko.observable(false);
    model.setRequestSentStatus = function () {
        model.sendingQuoteRequest(true);
        // Before setting the SENT status validate the model
        if (!this.validationModel.isValid()) {
            this.validationModel.errors.showAllMessages(true);
            model.scrollToError();
            model.sendingQuoteRequest(false);
            return false;
        }

        model.changeRequestStatus('qr_sent');
    }

    //
    // Create Service Request (Approve)
    //
    model.approvingRequest = ko.observable(false);
    model.createServiceRequest = function () {
        model.approvingRequest(true);
        postWrapper('api/v1/createservicerequest', ko.toJSON({ 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID }))
            .then(({ value }) => {
                console.log(model.request_Data.lspId());
                if (model.request_Data.lspId() != 0)
                    model.notificationDialog.displayConfirmationDialog("PURCHASE ORDER", "THE PURCHASE ORDER WAS CREATED",
                        function () {
                            redirectToPage('/request', { 'RequestID': value.request_id, 'OrganizationID': model.organizationID });
                        }, { 'ok': 'ACCEPT', 'cancel': 'NOTVISIBLE' });
                else
                    redirectToPage('/request', { 'RequestID': value.request_id, 'OrganizationID': model.organizationID });

                    //redirectToPage('/request', { 'RequestID': value.request_id, 'OrganizationID': model.organizationID });
            });
    };

    //
    // Create Quote
    //
    model.createQuote = function () {
        postWrapper('api/v1/createquote', ko.toJSON({ 'RequestID': model.request_Data.request_id }))
            .then(({ value }) => redirectToPage('/Quote', { 'QuoteID': value.newquoteid, 'OrganizationID': model.organizationID }));
    };

    //
    // Create QR version/new QR
    //
    model.isRunnningCreateAction = ko.observable(false);

    model.createNewQuoteRequestVersion = function () {
        model.isRunnningCreateAction(true);
        getWrapper('api/v1/newquoterequestversion', { 'OrganizationID': model.organizationID, 'RequestID': this.request_Data.request_id })
            .then(({ value }) => redirectToPage('/Request', { 'RequestID': value.request_id, 'OrganizationID': model.organizationID }));
    }

    model.createNewServiceRequest = function (type) {
        model.isRunnningCreateAction(true);
        getWrapper('api/v1/newservicerequestversion', { 'OrganizationID': model.organizationID, 'RequestID': this.request_Data.request_id, 'Type': type })
            .then(function (response) {
                redirectToPage('/request', { 'RequestId': response.value, 'OrganizationID': model.organizationID });
            }.bind(model));
    }

    model.createAdditionalRequest = function () {
        model.isRunnningCreateAction(true);
        window.location = `/request?OrganizationID=${model.organizationID}&RequestID=${this.request_Data.request_id}&IsNew=true&IsAdditionalRequest=true&IsSR=${model.isSR}`;
    }

    model.changeRequestStatus = function (statusCode) {
        postWrapper('api/v1/changerequeststatus', ko.toJSON({ 'RequestID': model.request_Data.request_id, 'StatusLookupCode': statusCode }))
            .then(({ value }) => redirectToPage('/Request', { 'RequestID': value.request_id, 'OrganizationID': model.organizationID }));
    }


    //
    // Comments support
    //
    model.newComment = {
        visibleToClient: ko.observable(false),
        commentText: ko.observable('')
    };
    model.newComment.toggleClientVisible = function () {
        this.newComment.visibleToClient(!this.newComment.visibleToClient());
    }.bind(model);

    model.requestComments = ko.observableArray([]);

    model.newComment.submitComment = function () {
        if (this.newComment.commentText().length > 0) {
            fetch('api/v1/appendcomment',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        projectid: this.request_Data.project_id,
                        requestid: this.request_Data.request_id,
                        comment: this.newComment.commentText(),
                        clientvisible: this.newComment.visibleToClient()
                    }),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    // Reload the comments
                    this.loadRequestComments();
                    // Clear comments box
                    this.newComment.commentText('');
                }.bind(model));
        } else {
            console.log('Trying to submit an empty comment.');
        }
    }.bind(model);

    model.loadRequestComments = function () {
        getWrapper('api/v1/commentsbydate', { 'ProjectID': model.request_Data.project_id, 'RequestID': this.request_Data.request_id })
            .then(({ value }) => model.requestComments(value));
    };

    model.removeComment = function (projectCommentID) {
        fetch(`api/v1/deletecomment?projectCommentID=${projectCommentID}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                // Reload the comments
                this.loadRequestComments();
            }.bind(model));
    };


/// Daily Status Report

    model.openDailyStatusReport = function (serviceID) {
        var today = new Date();
        var date = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
        console.log(date);
        redirectToPage('/TimeEntry/DailyStatusReport', { 'organizationid': model.organizationID, 'serviceid': serviceID, 'fordate': date }, true);
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
            var today = new Date();
            var date = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
            console.log(date);
            console.log(this.serviceid);
            console.log(model.organizationID);
            getWrapper('/api/v1/emaildailystatusreport', { 'organizationid': model.organizationID, 'serviceid': this.serviceid, 'fordate': date })
                .then((r) => {
                    console.log('loadReportFromAPI: ');
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
            console.log('test34');
            
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

            var today = new Date();
            var date = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
            console.log(date);
            let reportData = {
                'serviceid': this.serviceid,
                'statusdate': date, //model.date(),
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

            let request = {
                'projectno': this.projectno,
                'requestno': this.requestno,
                'versionno': this.versionno
            };
            console.log(ko.toJSON(reportData));
            console.log(ko.toJSON(request));
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
                    console.log(reply);
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
            //scrollToDivInDSR('divActionMessageBox');
            var today = new Date();
            var date = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
            console.log(date);

            getWrapper('/api/v1/sendemaildailystatusreport', { 'organizationid': model.organizationID, 'serviceid': this.serviceid, 'fordate': date, 'jobname': this.jobname })
                .then((r) => {
                    if (r.succeeded) {
                        this.actionMessageBox.emailSent('Email Sent!');
                    } else {
                        this.actionMessageBox.emailSent(`Failure sending email ** ${r.errormsg}`);
                    }
                    //scrollToDivInDSR('divActionMessageBox');
                });
        },
        previewReport: function () {
            this.actionMessageBox.previewGeneration();
            console.log('previewReport');
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

    //ko.validation.init({
    //    errorElementClass: 'text-danger',
    //    errorMessageClass: 'help-block',
    //    decorateElement: true,
    //    insertMessages: false
    //});

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
            if (!this.saveValidationModel.isValid()) {
                this.saveValidationModel.errors.showAllMessages(true);
                return false;
            }
            return true;
        }
    }

    //
    // Panels Expand/Collapse control
    //
    model.pannelsCollapsed = ko.observable(false);
    model.panelsCollapseAll = function (allCollapsed) {
        $('.collapse-panel').collapse(allCollapsed ? 'hide' : 'show');
        this.pannelsCollapsed(allCollapsed);
    }.bind(model);


    //
    // Schedule Workflow Handling
    //
    model.isSavingSRMissingFieldsOnSoftSchedule = ko.observable(false);
    model.customer_costing_type_id_originallynull = model.request_Data.customer_costing_type_id() === null;
    model.dealer_po_no_originallynull = model.request_Data.dealer_po_no() === null;

    model.softScheduleClickHandler = function () {
        let allSRFieldsComplete = model.allSRRequiredFieldsSet();
        if (allSRFieldsComplete && !model.softScheduleDisabled()) {
            model.pickSoftScheduleDate();
            return;
        }

        if (!allSRFieldsComplete && model.canSaveSRMissingFieldsOnSoftSchedule) {
            model.isSavingSRMissingFieldsOnSoftSchedule(true);
        }
    }

    model.performingSoftScheduling = ko.observable(false);
    model.softScheduleDisabled = ko.pureComputed(function () {
        var ret = ((!model.request_Data.isSendToSchedule() || model.modelChangeTracker.isDirty() === true) && !model.isSavingSRMissingFieldsOnSoftSchedule() ) ;
        return ret;
    });

    model.coloredCalendar = coloredCalendar;
    model.pickSoftScheduleDate = function () {
        // If it's running Soft Schedule when isSavingSRMissingFieldsOnSoftSchedule is TRUE -> then save the REQ before proceeding 
        if (model.isSavingSRMissingFieldsOnSoftSchedule()) {
            // Save the REQ
            model.saveRequest();
            model.isSavingSRMissingFieldsOnSoftSchedule(false);
        }
        console.log(model.locationLookupId);
        console.log(model.request_Data.locationLookupId());
        console.log(model.request_Data.locationInfo);
        coloredCalendar.showCalendar(model.organizationID, model.request_Data.days_to_complete(),
            model.softScheduleDatePicked,
            model.request_Data.include_weekends_flag() === 'Y',
            model.serviceStartDateLockPeriod,
            model.request_Data.locationLookupId());
    };

    model.softScheduleDatePicked = function (forDate) {

        model.performingSoftScheduling(true);

        let schedule = {
            'requestid': model.request_Data.request_id,
            'servicedate': forDate.date.toJSON()
        };

        postWrapper('/api/v1/setservicedate', ko.toJSON(schedule))
            .then(r => redirectToPage('/request', { 'requestid': model.request_Data.request_id, 'OrganizationID': model.organizationID }));
    }

    model.approveServiceDate = function () {
        // TODO: don't use model date -> set date on DB -> we are approving an already set date
        postWrapper('/api/v1/approveservicedate', ko.toJSON({ 'requestid': model.request_Data.request_id, 'servicedate': model.request_Data.est_start_date(), 'isapproved': true }))
            .then(r => redirectToPage('/request', { 'requestid': model.request_Data.request_id, 'OrganizationID': model.organizationID }));
    }
    model.rejectServiceDate = function () {
        coloredCalendar.showCalendar(model.organizationID, model.request_Data.days_to_complete(), model.newDateAfterReject, model.request_Data.include_weekends_flag() === 'Y');
    }
    model.newDateAfterReject = function (forDate) {
        postWrapper('/api/v1/rescheduleservicedate', ko.toJSON({ 'requestid': model.request_Data.request_id, 'servicedate': forDate.date.toJSON() }))
            .then(r => redirectToPage('/request', { 'requestid': model.request_Data.request_id, 'OrganizationID': model.organizationID }));
    }


    model.approveRescheduleDate = function () {
        // TODO: don't use model date -> set date on DB -> we are approving an already set date
        postWrapper('/api/v1/approveservicedate', ko.toJSON({ 'requestid': model.request_Data.request_id, 'servicedate': model.request_Data.est_start_date(), 'isapproved': true }))
            .then(r => redirectToPage('/request', { 'requestid': model.request_Data.request_id, 'OrganizationID': model.organizationID }));
    }
    model.rejectRescheduleDate = function () {
        coloredCalendar.showCalendar(model.organizationID, model.request_Data.days_to_complete(), model.newDateAfterReschedule, model.request_Data.include_weekends_flag() === 'Y');
    }
    model.newDateAfterReschedule = function (forDate) {
        postWrapper('/api/v1/setservicedate', ko.toJSON({ 'requestid': model.request_Data.request_id, 'servicedate': forDate.date.toJSON() }))
            .then(r => redirectToPage('/request', { 'requestid': model.request_Data.request_id, 'OrganizationID': model.organizationID }));
    }
    //
    //


    //
    // Rescheduling
    //
    model.reschedulingInProcess = ko.observable(false);
    model.internalReschedule = function () {
        model.reschedulingInProcess(true);
        postWrapper('/api/v1/internalReschedule', ko.toJSON({ 'RequestID': model.request_Data.request_id }))
            .then(({ value }) => processRescheduleResponse(value));
    }

    model.clientReschedule = function () {
        model.reschedulingInProcess(true);
        postWrapper('/api/v1/clientReschedule', ko.toJSON({ 'RequestID': model.request_Data.request_id }))
            .then(({ value }) => processRescheduleResponse(value));
    }

    function processRescheduleResponse(value) {
        if (value.succeeded) {
            redirectToPage('/Request', { 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID });
        } else {
            model.reschedulingInProcess(false);
            model.notificationDialog.displayDialog('RESCHEDULE ERROR', value.errorMessage);
        }
    };

    //
    //


    //
    // Service Request Cancelling
    //
    model.cancelServiceRequest = function () {
        model.notificationDialog.displayConfirmationDialog('CANCEL SERVICE REQUEST', 'Confirm?', model.callServiceRequestCancel, { 'ok': 'Yes, Cancel the Request', 'cancel': 'No' });
    }

    model.callServiceRequestCancel = function () {
        postWrapper('/api/v1/cancelservicerequest', ko.toJSON({ 'RequestID': model.request_Data.request_id }))
            .then((r) => redirectToPage('/Request', { 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID }));
    }
    //
    //


    //
    // Service Request Flag Complete
    //
    model.flagServiceRequestComplete = function () {
        model.notificationDialog.displayConfirmationDialog('COMPLETE SERVICE REQUEST', 'Please confirm Service Request Completion', model.callServiceRequestCompletion, { 'ok': 'Yes, Service Request is Complete!', 'cancel': 'No' });
    }

    model.callServiceRequestCompletion = function () {
        model.changeRequestStatus('completed');
    }
    //
    //

    //
    // Custom Fields Edition
    //
    model.customColumnPVEditor = customColumnPVEditor;
    model.editCustomFieldValues = function (customFieldDropValues) {
        model.customColumnPVEditor.displayDialog(customFieldDropValues, model.closeDialogCallback);
    }

    model.closeDialogCallback = function (shouldReload, customCustColId, customFieldID) {
        if (shouldReload) {
            getWrapper('/api/v1/requestcustomcolums', { 'RequestID': model.request_Data.request_id })
                .then(({ value }) => model.customFields(value));
        }
    }
    //
    //

    //
    // Hedberg Quote handler
    // 
    
    model.request_Data.externalHeaderNumber.subscribe(function (newValue) {
        if (newValue) {
            // When the user types something in Hedberg Quote field then auto select the Hedberg End User and Locations for it
            // Note: location will be filled on the EndUser subscription handler
            let hedbergEndUser = model.endUsers().find(u => u.end_user_name.toLowerCase() === 'hedberg end user');
            model.request_Data.end_user_id(hedbergEndUser ? hedbergEndUser.end_user_id : null);
        }
    });

    
    //
    //

    //
    // Prospect customer dialog
    //
    model.prospectCustomerFillInDialog = function (customerid) {
        notificationDialog.displayConfirmationDialog('Complete Customer Registration',
            `Please download and fill in the Prospect Customer Form, then email it to Accounting (${model.prospectCustomerFormEmail}) for the Customer to be created in GP.\nCustomer ID = ${customerid}`,
            () => model.getProspectCustomerFile(customerid),
            { 'ok': 'Download Customer Form', 'cancel': 'Close' });
    };

    model.getProspectCustomerFile = function (customerid) {
        redirectToPage(`/projectfiles/prospectcustomerform/${model.organizationID}/${customerid}`, {});
    };
    //
    //

    model.reOpenServiceRequest = function () {
        postWrapper('/api/v1/reopensr', ko.toJSON(model.request_Data.request_id))
            .then((r) => {
                if (r.value.succeeded) {
                    redirectToPage('/Request', { 'RequestID': model.request_Data.request_id, 'OrganizationID': model.organizationID });
                } else {
                    model.notificationDialog.displayDialog('RE OPEN ERROR', r.value.errorMessage);
                }
            });
    }

    //
    // Model Change Tracking Observable setup
    //
    var trackableModel = {
        model: model.request_Data,
        attachments: model.attachments,
        cts: model.requestContacts,
        nf: model.newFiles,
        rp: model.requestProduct,
        rpo: model.requestProductOther,
        rlc: model.requestLocationContacts,
        rsc: model.resources,
        cf: model.customFields,
        sr: model.scopeSelResources        
    };
    model.modelChangeTracker = ko.dirtyFlag(trackableModel);
    //

    // Setup the message for the page unload binding handler
    model.beforeUnloadPrompt = { message: "There is unsaved changes!", shouldWarn: model.modelChangeTracker.isDirty };

    //
    // Title for the Send button
    //
    model.sendButtonTitle = ko.computed(function () {
        if (this.modelChangeTracker.isDirty()) {
            return 'Save your pending changes before sending this Quote Request...';
        }
        return 'Send the Quote Request for quoting...';
    }.bind(model));


    //
    //
    model.quotePageUrl = ko.computed(function () {
        if (model.isSR && model.quoteEstimatorData) {
            return model.quoteEstimatorData.quoteUrl;
        } else if (model.isSR && model.request_Data.quoteid) {
            return `/Quote?QuoteID=${model.request_Data.quoteid}&OrganizationID=${model.organizationID}`;
        } else {
            return '/Home/ServiceTraxError?title=Error&ErrorDescription=Quote Not Found';
        }
    });


    //
    // Options formatting
    //
    model.buidInlinePhoneEmailInfo = function (option, item) {
        let phone = item.phone ? `Phone: ${item.phone}` : null;
        let email = item.email ? `Email: ${item.email}` : null;
        option.setAttribute("data-subtext", [phone, email].filter(e => e).join(' -- '));
    }

    model.salesPersonOptionsAfterRender = model.buidInlinePhoneEmailInfo;
    projectManagerOptionsAfterRender = model.buidInlinePhoneEmailInfo;


    model.selectedProjectManagerInfo = ko.computed(function () {
        if (model.request_Data.project_Manager_Id()) {
            return model.projectManagers.find(pm => pm.projectManagerID === model.request_Data.project_Manager_Id());
        }
    });


    model.selectedSalespersonInfo = ko.computed(function () {
        if (model.request_Data.a_m_sales_contact_id()) {
            return model.salespersons.find(sls => sls.salespersonID === model.request_Data.a_m_sales_contact_id());
        }
    });
    //
    //


    //
    // Job Rates Handling
    //
    model.isDetailSubGridOpen = ko.observable(false);
    model.openJobItemRatesTEG = function () {
        // Get the data parameters that will be used on the Details subgrid 
        let subGridParameters = { JOB_ID: model.request_Data.jobid };
        // Clear content (just in case another grid was previously loaded - to prevent displaying it for a moment until the new one loads)
        $('#ratesSubGrid').empty();
        // Create/Load the Details sub grid
        model.detailSubGrid = new clsMyGrid('JobItemRates', $('#ratesSubGrid'), null, null, true, subGridParameters);
        // Make visible the Details grid div container 
        document.getElementById('ratesSubGridModal').style.display = 'unset';
        // Tell the model that the Details subgrid is open
        model.isDetailSubGridOpen(true);
    };

    model.closeSubGrid = function () {
        document.getElementById('ratesSubGridModal').style.display = 'none';
        model.detailSubGrid = null;
        model.isDetailSubGridOpen(false);
    }
    //
    //

    model.request_Data.dealer_po_line_no = ko.observable(model.request_Data.dealer_po_line_no);
    model.OrderLineHeaderText = ko.pureComputed(function () {
        return `${model.request_Data.dealer_po_no()}/${model.request_Data.dealer_po_line_no()}`;
    });

    //
    // KO ApplyBindings
    ko.applyBindings(model);
    //
    //

    // Reset change tracked because some Binding Handlers are changing the model
    model.modelChangeTracker.reset();


    // Load the request comments after the all the KO bindings are complete
    if (model.commentsCanReadAdd) {
        model.loadRequestComments();
    }


    model.buildQuoteLink= ko.computed(function () {
        return `/Quote?QuoteID=${model.request_Data.quoteIdForLink}&OrganizationID=${model.organizationID}`;
       
    });

    model.buildOperationalPlanLink = ko.computed(function () {
        return `/Quote?QuoteID=${model.request_Data.quoteIdForLink}&OrganizationID=${model.organizationID}#summary`;
    });


    model.buildQuoteRequestLink = ko.computed(function () {
        return `/Request?RequestID=${model.request_Data.qrRequestId}&OrganizationID=${model.organizationID}`;
    });


    model.buildServiceRequestLink = ko.computed(function () {
        return `/Request?RequestID=${model.request_Data.srRequestId}&OrganizationID=${model.organizationID}`;
    });
 
};
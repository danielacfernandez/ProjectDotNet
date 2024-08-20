const newContactDialog = (organizationID, customer_id) => ({
    isDialogDisplaying: ko.observable(false),

    name: ko.observable('').extend({ required: { message: 'Please give a name to the Contact.' } }),
    workphone: ko.observable().extend({ required: false, pattern: { message: 'Invalid phone number.', params: /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/ } }),
    cellphone: ko.observable().extend({ required: false, pattern: { message: 'Invalid phone number.', params: /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/ } }),
    homephone: ko.observable().extend({ required: false, pattern: { message: 'Invalid phone number.', params: /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/ } }),
    email: ko.observable().extend({ required: false, email: true }),
    organizationid: organizationID,
    customer_id: customer_id,
    contact_type: ko.observable(''),
    joblocationid: null,
    active: true,
    isCreatingContactVar: ko.observable(null),
    isCreatingContact: ko.observable(null),
    isUpdatingContact: ko.observable(null),
   
    contact_id: null,

    saveCallback: null,

    validationGroup: function () {
        return ko.validation.group(this, { deep: true })
    },

    displayDialog: function (contact_type, saveCallback, job_location_id) {
        $(".phone-input").mask("(999) 999-9999", { autoclear: false });

        this.name('');
        this.workphone('');
        this.cellphone('');
        this.homephone('');
        this.email('');
        this.customer_id = customer_id;
        this.contact_type(contact_type);
        this.joblocationid = contact_type === 'job_location' || contact_type === 'bldg_mgmt_co' ? job_location_id : null;
        this.validationGroup().showAllMessages(false);

        this.isCreatingContactVar(true);
        this.isCreatingContact(true);
        this.isUpdatingContact(false);

        this.saveCallback = saveCallback;

        this.isDialogDisplaying(true);
    },

    displayEditionDialog: function (contact /*id*/) {

        let contactid = contact.contact_ID;
        this.isCreatingContactVar(false);
        this.isCreatingContact(false);
        this.isUpdatingContact(true);

        this.contact_id = contactid;

        getWrapper('/api/v1/updaterequestcontact', { 'OrganizationID': this.organizationid, 'ContactID': contactid })
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
        const validData = this.validateFields();

        if (validData) {

            let contactData = {
                name: this.name(),
                workphone: this.workphone(),
                cellphone: this.cellphone(),
                homephone: this.homephone(),
                email: this.email(),
                customer_id: customer_id,
                contact_type: this.contact_type(),
                joblocationid: this.contact_type() === 'job_location' || this.contact_type() === 'bldg_mgmt_co' ? this.joblocationid : null,
                organizationid: this.organizationid,
                active: this.active
            }

            // Contact validation succeeded -> proceed to save thru API
            postWrapper('/api/v1/addcontact', ko.toJSON(contactData))
                .then(function (response) {
                    this.saveCallback(response.value);
                    this.closeDialog();
                }.bind(this));
        }
    },
    //updateContact: function () {
    //    this.validateFields();

    //    let contactData = {
    //        contact_id: this.contact_id,
    //        organization_id: this.organizationid,
    //        contact_name: this.name(),
    //        phone_work: this.workphone(),
    //        phone_cell: this.cellphone(),
    //        phone_home: this.homephone(),
    //        email: this.email(),
    //    }

    //    postWrapper('/api/v1/updaterequestcontact', ko.toJSON(contactData))
    //        .then(r => {
    //            let contactData = r.value;

    //            let idx = model.allCustomerContacts().findIndex(c => c.contact_ID === contactData.contact_ID);
    //            if (idx > -1) {
    //                //model.allCustomerContacts()[idx] = model.makeObservableCustomerContact(r.value);
    //                model.allCustomerContacts()[idx] = contactData;
    //                model.allCustomerContacts.valueHasMutated();
    //            }

    //            idx = model.locationContacts().findIndex(c => c.contact_ID === contactData.contact_ID);
    //            if (idx > -1) {
    //                model.locationContacts()[idx] = contactData;
    //                model.locationContacts.valueHasMutated();
    //            }

    //            // If the contact was the Building Management Contact then reaload location > that's the easiet way 
    //            // to update the contact details(without making all it's fields observable, etc)
    //            if (model.job_location_details().buildingmgmtcontactid === contactData.contact_ID) {

    //                getWrapper('api/v1/joblocations', { 'OrganizationID': model.organizationID, 'CustomerID': model.request_Data.end_user_id() })
    //                    .then((r) => model.jobLocations(r.value));

    //            }


    //            return 1;
    //        }).then(r => model.newContactDialog.closeDialog());
    //},
    //isUpdatingContact: ko.pureComputed(() => !model.newContactDialog.isCreatingContactVar()),
    //isCreatingContact: ko.pureComputed(() => this.isCreatingContactVar())

});

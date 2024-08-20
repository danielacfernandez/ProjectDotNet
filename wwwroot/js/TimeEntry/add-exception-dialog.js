const addExceptionDialog = {
    isDialogDisplaying: ko.observable(false),
    selectedExceptionReason: ko.observable(null),
    saveExceptionCallback: null,

    servicelinetimeentryid: null,
    serviceid: null,
    timeentrydate: null,
    resourceid: null,

    hasExceptionSet: ko.observable(false),
    currentExceptionDescription: ko.observable(''),
    exceptionNotes: ko.observable(''),

    noShowOptions: ko.observableArray([]),

    displayDialog: function (servicelinetimeentryid, serviceid, timeentrydate, resourceid, saveExceptionCallback, noShowObj) {

        let initDialog = new Promise((accept, reject) => {

            // check if the no show options were loaded before
            if (this.noShowOptions().length === 0) {
                getWrapper('/api/v1/noshowoptions')
                    .then(response => accept(response.value));

                //fetch('/api/v1/noshowoptions',
                //    {
                //        method: 'GET',
                //        headers: { 'Content-Type': 'application/json' }
                //    }).then(res => res.json())
                //    .catch(error => console.error('Error:', error))
                //    .then(function (response) {
                //        // Call accept with the noshow options array
                //        accept(response.value);
                //    }.bind(this));
            } else {
                // No show options array was already loaded just pass null
                accept(null);
            }
        });


        initDialog.then(function (noshowoptions) {

            // Ignore the noshowoptions if null
            if (noshowoptions !== null) {
                this.noShowOptions(noshowoptions);
            }

            this.servicelinetimeentryid = servicelinetimeentryid;
            this.serviceid = serviceid;
            this.timeentrydate = timeentrydate;
            this.resourceid = resourceid;
            this.isDialogDisplaying(true);
            this.saveExceptionCallback = saveExceptionCallback;
            this.hasExceptionSet(noShowObj.noShowLookupID !== null);
            this.currentExceptionDescription(noShowObj.noShowLookupDesc);
            this.exceptionNotes(noShowObj.noShowNotes);
        }.bind(this));
    },
    closeDialog: function () {
        this.isDialogDisplaying(false);
    }
};
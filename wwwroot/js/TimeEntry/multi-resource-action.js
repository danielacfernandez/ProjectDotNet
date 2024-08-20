const multiResourceAction = {
    isDialogDisplaying: ko.observable(false),
    type: ko.observable(null),
    jobResources: ko.observableArray([]),
    saveCallback: null,
    serviceid: ko.observable(null),
    requestscheduleid: ko.observable(null),


    displayDialog: function (type, serviceid, requestscheduleid, resources, saveCallback) {
        console.log(resources);
        // Sets the type of the dialog (START/END/LUNCH)
        this.type(type.toUpperCase());
        // Set the resources to display observables to react to the checkbox change on the modal 
        resources.forEach(r => r.autoFlagValue = ko.observable(r.autoFlagValue));
        this.jobResources(resources);

        //
        this.saveCallback = saveCallback;
        this.serviceid(serviceid);
        this.requestscheduleid(requestscheduleid);

        // Update the observable to display the modal
        this.isDialogDisplaying(true);
    },
    closeDialog: function() {
        this.isDialogDisplaying(false);
    },
    isAutoStart: function () {
        return this.type() === 'START';
    },
    isAutoEnd: function () {
        return this.type() === 'END';
    },
    isLunch: function () {
        return this.type() === 'LUNCH';
    },
    dialogTitle: function () {
        if (this.isAutoStart()) {
            return 'Auto-Start';
        } else if (this.isAutoEnd()) {
            return 'Auto-End';
        } else if (this.isLunch()) {
            return 'Add Lunch';
        }
        return 'Unknown';
    },
    dialogSubTitle: function () {
        if (this.isAutoStart()) {
            return 'Select which workers are present at the  job site at the start of the work day.';
        } else if (this.isAutoEnd()) {
            return 'Select which workers are present at the  job site at the end of the work day.';
        } else if (this.isLunch()) {
            return 'Select which workers are taking a lunch.';
        }
        return 'Unknown';
    },
    someSelected: function () {
        console.log(this);
        return this.jobResources().some(r => r.autoFlagValue() === true);
    },
    saveAction: function () {
        console.log('Saving!', ko.toJS(this.jobResources()));
        this.saveCallback(this.serviceid(), this.requestscheduleid(), ko.toJS(this.jobResources()));
    },
    lunchText: function (lunchs) {
        if (lunchs === 0) {
            return ' (no lunchs taken yet)';
        } else {
            return ` (already took ${lunchs} lunch${lunchs > 1 ? 's' : ''})`
        }
    }

};
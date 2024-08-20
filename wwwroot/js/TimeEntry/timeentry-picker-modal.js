const timeentryPikerModal = {

    isDialogDisplaying: ko.observable(false),
    type: ko.observable('IN'),
    hour: ko.observable(1),
    minutes: ko.observable(0),
    ampm: ko.observable('AM'),
    saveCallback: null,
    serviceLineTimeEntry: null,
    timeEntryNotes: ko.observable(''),

    show: function (serviceLineTimeEntry, type, saveCallback, time, notes) {
        if (!time) {
            // If no time is provided then create it as now
            time = new Date();
        }

        this.type(type);

        this.hour(time.getHours() % 12 === 0 ? 12 : time.getHours() % 12);
        this.minutes(this.roundToQuarter(time.getMinutes()));
        this.ampm(time.getHours() >= 12 ? 'PM' : 'AM'); // The condition is there to clean any value different than AM/PM

        this.timeEntryNotes(notes);
        this.isDialogDisplaying(true);
        this.saveCallback = saveCallback;
        this.serviceLineTimeEntry = serviceLineTimeEntry;
    },
    close: function () {
        this.isDialogDisplaying(false);
    },

    save: function () {
        let time = new Date();
        time.setHours((this.hour() % 12) + (this.ampm() === 'PM' ? 12 : 0));
        time.setMinutes(this.minutes());
        this.saveCallback(this.serviceLineTimeEntry, this.type(), time, this.timeEntryNotes());
    },

    timenow: function () {
        this.saveCallback(this.serviceLineTimeEntry, this.type(), null);
    },

    roundToQuarter: function (m) {
        if (m == 0) {
            return 0;
        } else if (m < 15) {
            return 0;
        } else if (m < 30) {
            return 15;
        } else if (m < 45) {
            return 30;
        } else if (m >= 45) {
            return 45;
        }
    }
}
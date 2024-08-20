const coloredCalendar = {
    isDialogDisplaying: ko.observable(false),
    organizationID: null,
    date: ko.observable(null),
    dateChangeSubscription: null,
    startDate: null,
    calendarWeeks: ko.observableArray([]),
    userSelectionCallback: null,
    daysLength: null,
    redDaySelected: ko.observable(null),
    allowWeekends: ko.observable(false),
    displayUsingRedDateConfirmation: ko.observable(false),
    displayWithinServiceStartLockPeriod: ko.observable(false),
    askForConfirmation: ko.observable(false),
    serviceStartLockDaysNumber: 0,
    scheduleManpowerRequestFailed: ko.observable(false),

    showCalendar: function (OrganizationID, daysLength, callback, allowWeekends, serviceStartLockDaysNumber, resourceLocationId) {
        this.organizationID = OrganizationID;
        this.userSelectionCallback = callback;
        this.isDialogDisplaying(true);
        this.daysLength = daysLength;
        this.redDaySelected(null);
        this.allowWeekends(allowWeekends);
        this.serviceStartLockDaysNumber = serviceStartLockDaysNumber;

        this.displayUsingRedDateConfirmation(false);
        this.displayWithinServiceStartLockPeriod(false);
        this.askForConfirmation(false);
        this.resourceLocationId = resourceLocationId;

        // Load days only if the subscription doesn't exists already (if the subscription exists loadDaysData will be called after Date observable is changed)
        this.date(moment(new Date()).startOf('day'));
        if (!this.dateChangeSubscription) {
            this.dateChangeSubscription = this.date.subscribe(() => this.loadDaysData());
            this.loadDaysData();
        }
    },
    loadDaysData: function () {
        this.calendarWeeks([]);
        this.scheduleManpowerRequestFailed(false);
        
        getWrapper('/api/v1/schedulermanpower', { 'OrganizationID': this.organizationID, 'StartDate': this.date().toJSON(), 'LocationID': this.resourceLocationId }) //* TODO: this is just for testing.
            .then((result) => {

                if (!result) { // Probably the DB call timedout
                    this.scheduleManpowerRequestFailed(true);
                }
                else {
                    var dayColors = result;
                    var dayNo = 1;
                    var weekNo = 0; // Keep a week number counter to sort and prevent weird issue with weeks being shown out of order on UI
                    var daysArray = [];
                    var weeksArray = [];
                    console.log(dayColors);
                    for (let dayObj of dayColors) {
                        dayObj.date = moment.utc(dayObj.date);

                        daysArray.push({ date: dayObj.date, color: dayObj.color.toLowerCase(), isBusyDay: this.calcBusyDay(dayObj) });
                        if (dayNo === 7) {
                            dayNo = 0;
                            weeksArray.push({ 'weekNo': weekNo, 'weekDays': daysArray.slice() });
                            daysArray = [];
                            weekNo++;
                        }
                        dayNo++;
                    }
                    this.calendarWeeks(weeksArray);
                }
            });
    },
    sortedCalendarWeeks: ko.pureComputed(() => {
        // Create a sorted array of weeks to try fix odd issue with weeks shown (sometimes) out of order in the UI
        return coloredCalendar.calendarWeeks().sort((x, y) => (x.weekNo > y.weekNo) ? 1 : ((y.weekNo > x.weekNo) ? -1 : 0));
    }),
    hideCalendar: function () {
        this.isDialogDisplaying(false);
    },
    nextMonth: function () {
        this.date(moment(this.date()).add(1, 'month').startOf('month'));
    },
    prevMonth: function () {
        this.date(moment(this.date()).add(-1, 'month').startOf('month'));
    },
    anyBusyDayInRange: function () {
        // Check if the user passes any 'Red day'
        let busyDays = this.calendarWeeks().map(c => c.weekDays).flat().filter(d => d.isBusyDay === true).map(d => d.date);
        for (let day of busyDays) {
            if (moment(day).isBetween(this.dateRangeStart(), this.dateRangeEnd(), undefined, '[)') === true) {
                return true;
            }
        }
        return false;
    },
    //displayUsingRedDateConfirmation: ko.observable(false),
    //displayWithinServiceStartLockPeriod: ko.observable(false),
    //askForConfirmation: ko.observable(false),


    userSelection: function (forDate, ignoreWarnings) {

        // Check if the selected date falls within the lock period
        if (!ignoreWarnings) {
            if (this.allowWeekends()) {
                let lockwe = forDate.date.diff(moment(), 'days', true) <= this.serviceStartLockDaysNumber;
                this.displayWithinServiceStartLockPeriod(lockwe);
            } else {
                let lockbd = forDate.date.businessDiff(moment()) <= this.serviceStartLockDaysNumber;
                this.displayWithinServiceStartLockPeriod(lockbd);
            }


            // if this is a weekend day
            // If there are busy days in the range -> ask for confirmation
            if (this.anyBusyDayInRange() && !ignoreWarnings) {
                this.displayUsingRedDateConfirmation(true);
            } else {
                this.displayUsingRedDateConfirmation(false);
            }

            // Check if there was any warning and the user should confirm the dialog
            this.askForConfirmation(!ignoreWarnings && (this.displayWithinServiceStartLockPeriod() || this.displayUsingRedDateConfirmation()));
            if (this.askForConfirmation()) {
                this.redDaySelected(forDate);
                return;
            }
        }

        // Call the user callback with the selected date (or the red date previously selected if "ignoreRedDay" is set)
        this.userSelectionCallback(ignoreWarnings ? this.redDaySelected() : forDate);
        this.hideCalendar();
    },
    calcBusyDay: function (dayObj) {
        switch (dayObj.color.toLowerCase()) {
            case 'red': return true;
            case 'orange': return false;
            case 'yellow': return false;
            case 'green': return false;
            default: return true;
        }
    },
    dayColorClass: function (date, isBusyDay, color) {
        if (date.isBusinessDay() || this.allowWeekends()) {
            return isBusyDay ? 'red-day' : (color == 'orange' ? 'orange-day' : (color == 'yellow' ? 'yellow-day' : 'green-day'));
        }
    },
    rangeHighlight: function (date) {
        if (this.dateRangeStart() && ((this.dateRangeStart().isBusinessDay() && date.isBusinessDay()) || this.allowWeekends())) {
            return moment(date).isBetween(this.dateRangeStart(), this.dateRangeEnd(), undefined, '[)');
        }
        return false;
    },
    selectionHighlight: function (date) {
        if (this.redDaySelected()) {
            if (this.redDaySelected() && (date.isBusinessDay() || this.allowWeekends())) {
                if (this.allowWeekends()) {
                    return moment(date).isBetween(this.redDaySelected().date, moment(this.redDaySelected().date).add(this.daysLength, 'days').startOf('day'), undefined, '[)');
                }
                else {
                    return moment(date).isBetween(this.redDaySelected().date, moment(this.redDaySelected().date).businessAdd(this.daysLength).startOf('day'), undefined, '[)');
                }
            }
        }
        return false;
    },
    dateRangeStart: ko.observable(null),
    dateRangeEnd: ko.observable(null),
    setDateRangeStart: function (date) {
        this.dateRangeStart(moment(date).startOf('day'));

        if (this.allowWeekends()) {
            this.dateRangeEnd(moment(date).add(this.daysLength, 'days').startOf('day'));
        }
        else {
            // If weekends are NOT allowed then add ONLY business days
            this.dateRangeEnd(moment(date).businessAdd(this.daysLength).startOf('day'));
        }
    },
    isBusinessDate: function (date) {
        return date.isBusinessDay();
    }
}
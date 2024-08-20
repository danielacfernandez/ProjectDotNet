const addTeamMemberDialog = {
    isDialogDisplaying: ko.observable(false),
    members: ko.observableArray([]),
    serviceid: null,
    forDate: null,
    typeOfAddition: ko.observableArray([]),
    selectedMember: ko.observable(null),
    selectedtypeOfAddition: ko.observable(null),
    closeCallback: null,

    displayDialog: function (serviceid, requestScheduleId, organizationID, forDate, closeCallback) {

        this.serviceid = serviceid;
        this.requestScheduleId = requestScheduleId;
        this.forDate = forDate;

        this.selectedMember(null);
        this.selectedtypeOfAddition(null);

        this.closeCallback = closeCallback;

        //let serviceIDParam = serviceid ? `&ServiceId=${serviceid}` : '';
        //let requestScheduleIdParam = requestScheduleId ? `&RequestScheduleID=${requestScheduleId}` : '';
        //let orgIDParam = organizationID ? `&OrganizationID=${organizationID}` : '';
        getWrapper('/api/v1/addteammember', { 'ForDate': forDate, 'ServiceId': serviceid, 'RequestScheduleID': requestScheduleId, 'OrganizationID': organizationID })
            .then(function (response) {
                this.members(response.value.members);
                this.typeOfAddition(response.value.typeOfAddition);
                // Displays the modal passing the resources
                this.isDialogDisplaying(true);
            }.bind(this));

        //fetch(`/api/v1/addteammember?ForDate=${forDate}${serviceIDParam}${requestScheduleIdParam}${orgIDParam}`,
        //    {
        //        method: 'GET',
        //        headers: { 'Content-Type': 'application/json' }
        //    }).then(res => res.json())
        //    .catch(error => console.error('Error:', error))
        //    .then(function (response) {
        //        console.log(response.value);
        //        this.members(response.value.members);
        //        this.typeOfAddition(response.value.typeOfAddition);

        //        // Displays the modal passing the resources
        //        this.isDialogDisplaying(true);
        //    }.bind(this));



    },
    addTeamMember: function () {

        var memberInfo = {
            ServiceID: this.serviceid,
            RequestScheduleId: this.requestScheduleId,
            ForDate: this.forDate,
            ResourceID: this.selectedMember,
            TypeOfAddition: this.selectedtypeOfAddition
        }

        fetch(`/api/v1/addteammember`,
            {
                method: 'POST',
                body: ko.toJSON(memberInfo),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                if (response.value.succeeded === true) {
                    this.isDialogDisplaying(false);
                    //window.location.href = "TimeEntry/Job?OrganizationID=2&forDate=True&UserID=True"; 
                    this.closeCallback();
                }
            }.bind(this));
    },
    closeDialog: function () {
        this.isDialogDisplaying(false);
    }
};
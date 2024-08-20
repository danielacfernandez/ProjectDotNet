const initDocumentSigning = function (signingModel, /*documentType, documentId, */ deliveredBy, afterSingnatureCloseDialogCallback) {

    //const model = signingModel ? signingModel : {};
    //var pp = this;

    let model = {
        isDialogDisplaying: ko.observable(false),
        isForwardForSigningDisplaying: ko.observable(false),
        receivedBy: ko.observable(''),
        deliveredBy: ko.observable(deliveredBy),
        receivedBySignedDate: ko.observable((new Date()).toISOString().substr(0, 10)),
        deliveredBySignedDate: ko.observable((new Date()).toISOString().substr(0, 10)),
        emailOfReceiver: ko.observable(null).extend({ required: true, email: true, message: 'Please enter a valid email address.' }),
        request_document_id: null,
        afterSingnatureCloseDialogCallback: afterSingnatureCloseDialogCallback,

        documentType: null,
        documentId: null,
        requestId: null,
        documentOrganizationId: null,

        actionInProgress: ko.observable(false),
        actionInProgressDescription: ko.observable(''),
        actionCompleted: ko.observable(false),
        actionCompletedDescription: ko.observable(''),

        

        signServiceRequest: function (requestid, organizationid) {
            this.documentType = 'servicerequest';
            this.documentId = requestid;
            this.requestId = requestid;
            this.documentOrganizationId = organizationid;
            this.receivedBy('');
            this.displayDialog();
        },
        signHotsheet: function (hotsheetid, requestid, organizationid) {
            this.documentType = 'hotsheet';
            this.documentId = hotsheetid;
            this.requestId = requestid;
            this.documentOrganizationId = organizationid;
            this.receivedBy('');
            this.displayDialog();
        },
        signAttachedDocument: function (request_document_id, requestid, organizationid) {
            console.log('www', request_document_id, requestid, organizationid);
            this.documentType = 'attachment';
            this.request_document_id = request_document_id;
            this.documentId = request_document_id;
            this.requestId = requestid;
            this.documentOrganizationId = organizationid;
            this.receivedBy('');
            this.displayDialog();
        },

        displayDialog: function (request_document) {
            //this.request_document_id = request_document.request_document_id;

            this.emailOfReceiver(null);
            this.receivedBy('');
            this.isForwardForSigningDisplaying(false);

            this.actionInProgress(false);
            this.actionInProgressDescription('');
            this.actionCompleted(false);
            this.actionCompletedDescription('');
            
            this.isDialogDisplaying(true);
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        closeDialogAfterSignature: function () {
            this.afterSingnatureCloseDialogCallback();
            this.isDialogDisplaying(false);
        },
        signDocument: function () {

            this.actionInProgress(true);
            this.actionInProgressDescription('Signing document...');

            const signature = {
                'Request_Document_Id': this.request_document_id,
                'DocumentType': this.documentType,
                'DocumentId': this.documentId,
                'RequestId': this.requestId,
                'OrganizationId': this.documentOrganizationId,
                'ReceivedBy': this.receivedBy,
                //'ReceivedBySignedDate': this.receivedBySignedDate,
                'DeliveredBy': this.deliveredBy,
                //'DeliveredBySignedDate': this.deliveredBySignedDate
            };

            postWrapper('/api/v1/signdocumentfull', ko.toJSON(signature))
                .then(r => {

                    if (r.value.succeeded) {
                        this.actionCompletedDescription('Document signature succeeded!');
                    } else {
                        this.actionCompletedDescription('Document signature failed!');
                    }
                    //
                    this.actionInProgress(false);
                    this.actionCompleted(true);
                });
        },
        receivedBySigning: function () {
            this.isForwardForSigningDisplaying(!this.isForwardForSigningDisplaying());
        },
        emailDocForSignature: function () {
            //let emailValidation = ko.validatedObservable({
            //    a: this.emailOfReceiver
            //});

            if (!this.emailValidation.isValid()) {
                emailValidation.errors.showAllMessages(true);
                return false;
            }

            this.actionInProgress(true);
            this.actionInProgressDescription('Emailing document for signature...');

            const signature = {
                'Request_Document_Id': this.request_document_id,
                'DocumentType': this.documentType,
                'DocumentId': this.documentId,
                'RequestId': this.requestId,
                'OrganizationId': this.documentOrganizationId,
                'DeliveredBy': this.deliveredBy,
                //'DeliveredBySignedDate': this.deliveredBySignedDate,
                'Signature_ReceivedByEmail': this.emailOfReceiver
            };

            postWrapper('/api/v1/signdocumentpartial', ko.toJSON(signature))
                .then(r => {
                    console.log(r.value.succeeded ? 'SIGNED!' : 'FAILURE TO SIGN!');

                    if (r.value.succeeded) {
                        this.actionCompletedDescription('Document sent!');
                    } else {
                        this.actionCompletedDescription('Email delivery failed!');
                    }
                    //
                    this.actionInProgress(false);
                    this.actionCompleted(true);
                });

        }
    }

    model.emailValidation = ko.validatedObservable({ a: model.emailOfReceiver });

    model.signButtonEnabled = ko.pureComputed(function () {
        return !this.actionCompleted() && !this.actionInProgress() && this.receivedBy && this.receivedBy().length > 0 && this.deliveredBy() && this.deliveredBy().length > 0;
    }.bind(model));

    model.emailSendEnable = ko.pureComputed(function () {
        let validEmail = this.emailValidation.isValid();
        console.log('123', validEmail);
        return this.deliveredBy() && this.deliveredBy().length > 0 && this.emailOfReceiver && this.emailOfReceiver() && this.emailOfReceiver().length > 0 && validEmail;
    }.bind(model));


    return model;
};
const importExistingQuoteDialog = function (organizationId) {

    var self = {};
    self.organizationId = organizationId;
    self.isDialogDisplaying = ko.observable(false);
    self.projectId = ko.observable(null);
    self.projectQuotes = ko.observableArray([]);
    self.selectedQuote = ko.observable(null);
    self.jobNumberSearchValue = ko.observable('');
    self.searching = ko.observable(false);
    self.projectNo = ko.observable('');
    self.requestId = null;
    self.importingQuote = ko.observable(false);
    self.errorReply = ko.observable(null);

    self.displayDialog = function (request_Data) {
        self.jobNumberSearchValue('');
        self.selectedQuote(null);
        self.projectQuotes([]);
        self.projectId(request_Data.project_id);
        self.projectNo(request_Data.project_no);
        self.requestId = request_Data.request_id;
        // Show dialog
        self.isDialogDisplaying(true);
    };
    self.loadJobQuotes = ko.computed(function () {
        if (self.projectId()) {
            self.callSearchQuotes({ 'ProjectId': self.projectId() });
        }
    });

    self.searchJobQuotes = function () {
        self.projectId(null);
        self.callSearchQuotes({ 'JobNo': self.jobNumberSearchValue() });
    }

    self.openSelectedQuote = function () {
        redirectToPage('/Quote', { 'QuoteID': self.selectedQuote(), 'OrganizationID': self.organizationId }, true);
    }

    self.onEnter = function (d, e) {
        if (e.keyCode === 13) {
            self.searchJobQuotes();
        }
        return true;
    };

    self.callSearchQuotes = function (searchObject) {
        self.searching(true);
        getWrapper('/api/v1/quotesbyprojectorjob', searchObject)
            .then(r => {
                self.selectedQuote(null);
                self.projectQuotes(r.value)
            })
            .finally(() => self.searching(false));
    }

    self.importQuote = function () {
        self.errorReply(null);
        self.importingQuote(true);
        getWrapper('/api/v1/createquotefromquote', { 'RequestID': self.requestId, 'CopyFromQuoteId': self.selectedQuote() })
            .then(r => {
                let reply = r.value;
                if (reply.succeeded) {
                    redirectToPage('/Quote', { 'QuoteID': reply.quoteID, 'OrganizationID': self.organizationId });
                    self.closeDialog();
                } else {
                    self.errorReply(`Error! ${reply.errorMessage}`);
                }
            })
            .finally(() => self.importingQuote(false));
    }

    self.closeDialog = function () {
        self.isDialogDisplaying(false);
    };

    return self;
};
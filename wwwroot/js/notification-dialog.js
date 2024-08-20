const notificationDialog = {
    isDialogDisplaying: ko.observable(false),
    dialogTitle: ko.observable(''),
    dialogMessage: ko.observable(''),
    callback: null,
    isConfirmation: ko.observable(false),
    okButtonText: ko.observable(null),
    cancelButtonText: ko.observable(null),
    largeText: ko.observable(false),
    afterCloseCallback: null,
    greyColor: ko.observable(false),

    displayDialog: function (title, message, isLargeText = false, afterCloseCallback = null) {
        this.dialogTitle(title);
        this.dialogMessage(message);
        this.isConfirmation(false);
        this.isDialogDisplaying(true);
        this.largeText(isLargeText);
        this.afterCloseCallback = afterCloseCallback;
    },
    displayConfirmationDialog: function (title, message, callback, buttons) {

        // Set buttons text
        this.okButtonText(buttons && buttons.ok ? buttons.ok : 'ACCEPT');
        console.log(buttons);
        if (buttons && buttons.cancel == 'NOTVISIBLE')
            this.cancelButtonText = "";
        else
            this.cancelButtonText(buttons && buttons.cancel ? buttons.cancel : 'CANCEL')

        this.dialogTitle(title);
        this.dialogMessage(message);
        this.isConfirmation(true);
        this.callback = callback;
        this.isDialogDisplaying(true);
    },
    displayOptionsDialog: function (title, message, callback, afterCloseCallback, buttons) {

        // Set buttons text
        this.okButtonText(buttons && buttons.ok ? buttons.ok : 'ACCEPT');
        this.cancelButtonText(buttons && buttons.cancel ? buttons.cancel : 'CANCEL');

        this.dialogTitle(title);
        this.dialogMessage(message);
        this.isConfirmation(true);
        this.callback = callback;
        this.afterCloseCallback = afterCloseCallback;
        this.isDialogDisplaying(true);
    },
    confirmAction: function () {
        this.callback();
        this.isDialogDisplaying(false);
    },
    closeDialog: function () {
        this.isDialogDisplaying(false);
        // Run after close action (if defined)
        if (this.afterCloseCallback) {
            this.afterCloseCallback();
        }
    }
};
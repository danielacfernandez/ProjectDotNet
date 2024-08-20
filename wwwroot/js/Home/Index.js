$(document).ready(function () {

    $('.save-widget-changes').click(function () {

        var widgetElems = $('.user-widget-selection-table').find('.widget-enable-checkbox').toArray();

        // Create an array of Widget/Enabled Status to send to the API
        var widgetStatus = widgetElems.map(w => {
            return {
                widgetID: w.dataset.widgetid,
                isActive: w.checked
            }
        });

        postWrapper('/api/v1/setwidgetsenabledstatus', JSON.stringify(widgetStatus))
            .then(() => {
                $('#widgetSelectionModal').modal('hide');
                redirectToPage('/');
            });

    });

});



var gridName = 'aspnetusers';
var oGrid = null;

$(document).ready(function () {
    window.alert = function () {
        debugger;
    }
     
    $('.myGrid').each(function () {
        oGrid = new clsMyGrid(gridName, this, null, {
            created: function () {
                $(document)[0].title = oGrid.config.title;
            },
            buttonClick: function (btn, row) {
                alert(btn.id);
                return false;
            }
        });
    });
});

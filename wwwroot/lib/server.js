
var sessionId = '';
var jsServer = function () {

    this.serverCall = function (url, onSuccess, onFail, bSync, customReferences) {
        var b = true;
        if (bSync) b = false;
        var _this = this;
        if (sessionId == '') sessionId = (new Date).getTime();
        if (url.indexOf('?') >= 0) {
            url += '&x_x=' + (new Date).getTime();
        }
        else {
            url += '?x_x=' + (new Date).getTime();
        }
        return $.ajax({
            type: 'POST',
            async: b,
            timeout: 120000,
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            customReferences: customReferences
        }).done(function (oResponse) {
            try {
                if (oResponse.booSuccess) {
                    onSuccess(oResponse.data, oResponse, this.customReferences);
                }
                else {
                    onFail(oResponse);
                }
            } catch (ex) {
                _this.errorDisplay(-1, '[serverCall]' + ex);
            }
        })
            .fail(function (strResponse) {
                window.status = 'Invalid Response: [' + url + ']' + strResponse;
                //_this.errorDisplay(-1, 'Invalid Response: [' + url + ']' + strResponse);
            });
    }
    this.serverCallPost = function (url, parameters, onSuccess, onFail, bSync, customReferences) {
        var b = true;
        if (bSync) b = false;
        var _this = this;
        if (sessionId === '') sessionId = (new Date).getTime();
        if (url.indexOf('?') >= 0) {
            url += '&x_x=' + (new Date).getTime();
        }
        else {
            url += '?x_x=' + (new Date).getTime();
        }
        return $.ajax({
            type: 'POST',
            async: b,
            url: url,
            data: JSON.stringify(parameters),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            customReferences: customReferences
        }).done(function (oResponse) {
            try {
                if (oResponse.booSuccess) {
                    onSuccess(oResponse.data, oResponse, this.customReferences);
                }
                else {
                    if (onFail) {
                        onFail(oResponse);
                    } else {
                        _this.errorDisplay(-1, oResponse.ErrorDescription);
                    }
                }
            } catch (ex) {
                _this.errorDisplay(-1, '[serverCall]' + ex);
            }
        })
            .fail(function (strResponse) {
                window.status = 'Invalid Response: [' + url + ']' + strResponse;
                //_this.errorDisplay(-1, 'Invalid Response  [' + url + ']: ' + strResponse);
            });
    }
    this.errorDisplay = function (ErrNumber, ErrMessage) {
        alert('Error :' + ErrMessage);
    }
    this.errorDisplay = function (ErrNumber, ErrMessage) {
        alert('Error :' + ErrMessage);
    }

    this.navigatePost = function (url, parameters) {
        var strHtml = '<form id="__formNavigate__" action="' + url + '" method="POST">';
        if (parameters) {
            for (var i = 0; i < parameters.length; i++) {
                strHtml += '<input type="hidden" name="' + parameters[i].name + '" value="' + encodeURI(parameters[i].value) + '"/>';
            }
        }
        strHtml += '</form>';
        $('body').append(strHtml);
        $('#__formNavigate__').submit();
    }
};

function htmlEscape(str) {
    try {
        if (str)
            return str
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
    } catch { }
    return '';
}

function stringToDate(strDate) {
    var sDat = strDate.split("-");
    return new Date(parseInt(sDat[0], 10), parseInt(sDat[1] - 1, 10), parseInt(sDat[2], 10));
}
function dateToString(date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
}
function myReplace(strSource, strSearch, strReplacement) {
    while (strSource.indexOf(strSearch) >= 0)
        strSource = strSource.replace(strSearch, strReplacement);
    return strSource;
}
String.prototype.replaceAll = function (strReplace, strWith) {
    var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var reg = new RegExp(esc, 'ig');
    return this.replace(reg, strWith);
};
//SELECT TEXT RANGE
$.fn.selectRange = function (start, end) {
    return this.each(function () {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}


function toCurrencyFormat(value) {
    if (value == 'N/A') return value;
    var n = parseFloat(value);
    return n.toFixed(2).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });
}




var jsConfirm = function (params) {

    var _this = this;
    this._confirmWinId = '';
    //each button has {label, onClick, style}   style can be 'btn-danger','btn-primary'
    _this.params = { message1: '', message2: '', buttons: [] };

    $.extend(_this.params, params);

    var _html = '<div class="modal fade modal--forms" id="##ID##" data-backdrop-limit="1" tabindex="-1" role="dialog" aria-labelledby="##ID##" aria-hidden="true" style="z-index:2050">'
        + '<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content modal-content--dark-blue">'
        + '<div class="modal-header"><h5 class="modal-title dialog-header mr-auto ucase"></h5></div>'
        + '<div class="modal-body">'
        //+ '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
        //+ '<p class="text-center"><i class="fa fa-times-circle fa-4x text-danger"></i></p>'
        + '<div class="text-center message1"> Are you sure?</div>'
        + '<p class="text-center message2">XXXX</p>'
        + '</div><div class="modal-footer"><div class="col-12"><div class="row buttons"></div></div></div></div></div></div>';

    this.init = function () {
        if (!window._confirmWinId) {
            window._confirmWinId = 1;
        } else {
            window._confirmWinId++;
        }
        _this._confirmWinId = 'confirmWindow_' + window._confirmWinId;
        $('body').append(_html.replaceAll('##ID##', _this._confirmWinId));
        $('#' + _this._confirmWinId).find('.dialog-header').html(_this.params.header);
        $('#' + _this._confirmWinId).find('.message1').html(_this.params.message1);
        $('#' + _this._confirmWinId).find('.message2').html(_this.params.message2);
        var strButtons = '';
        for (var i = 0; i < _this.params.buttons.length; i++) {
            var oBtn = _this.params.buttons[i];
            var btnId = 'btn_' + i;
            var style = '';
            if (oBtn.style) style = oBtn.style;
            var label = '';
            if (oBtn.label) label = oBtn.label;
            strButtons += '<div class="col-xs-6 col-sm-6"><button type="button" indexButton="' + i + '" class="btn ' + style + ' btn-block ' + btnId + '">' + label + '</button></div>';
        }
        $('#' + _this._confirmWinId).find('.buttons').html(strButtons);
        $('#' + _this._confirmWinId).on('hidden.bs.modal', function () {
            $('#' + _this._confirmWinId).remove();
        })
        for (var i = 0; i < _this.params.buttons.length; i++) {
            var oBtn = _this.params.buttons[i];
            var btnId = 'btn_' + i;
            $('#' + _this._confirmWinId).find('.' + btnId).click(function (evt) {
                var indexButton = $(this).attr('indexButton');
                if (_this.params.buttons[indexButton])
                    if (_this.params.buttons[indexButton].onClick)
                        _this.params.buttons[indexButton].onClick(evt);
            });
        }
        $('#' + _this._confirmWinId).modal('show');
        if (_this.params.buttons.length > 0) { //Focus the first button.
            setTimeout(function () { $('#' + _this._confirmWinId).find('.btn_0').focus(); }, 500);
        }
    }
    this.close = function () {
        $('#' + _this._confirmWinId).modal('hide');
    }
    this.init();
}
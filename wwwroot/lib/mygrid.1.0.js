/***********************************************************************************************************************/
/*
    myGrid class
    Library to display a editable grid of data
    Developer: Claudio Sciarrillo
*/
/***********************************************************************************************************************/
// - offLineFunction : allows to execute a javascript event instead of call server to request/save data.
//                     all server request are replaced to a call to this function (offLineFunction).
var clsMyGrid = function (gridName, target, lang, events, pAutoDataLoad, dataParameters, offLineFunction) {
    var _this = this;
    this.textChars = ' 1234567890qwertyuiopasdfghjklzxcvbnm!@#$%^&*()_+-=\][\';/.,<>?:"|}{+_QWERTYUIOPASDFGHJKLZXCVBNM';
    this.currentData = null;
    this.recordTotalCount = 0;
    this.currentPage = 0;
    this.currentOrder = '',
        this.pagesCount = 0;
    this.closing = false;
    this.gridName = gridName;
    this.gridUniqueId = Math.floor(Math.random() * Math.floor(Math.random() * Date.now()));
    this.target = target;
    this.oGridAux = null;
    this.lastCheckboxClicked = -1;
    this._savingRow = false;
    this.previousData = null;

    const beforeUnloadListener = (event) => {
        //Send something to back end
        alert('here123');
    };

    window.addEventListener("beforeunload", beforeUnloadListener);

    this.numberFormatter = {
        maskRegex: /[0-9\-+#]/,
        notMaskRegex: /[^\d\-+#]/g,

        getIndex: function (mask) {
            return mask.search(this.maskRegex);
        },

        processMask: function (mask = "#.##") {
            const maskObj = {};
            const len = mask.length;
            const start = this.getIndex(mask);
            maskObj.prefix = start > 0 ? mask.substring(0, start) : "";

            // Reverse string: not an ideal method if there are surrogate pairs
            const end = this.getIndex(mask.split("").reverse().join(""));
            const offset = len - end;
            const substr = mask.substring(offset, offset + 1);
            // Add 1 to offset if mask has a trailing decimal/comma
            const indx = offset + ((substr === "." || (substr === ",")) ? 1 : 0);
            maskObj.suffix = end > 0 ? mask.substring(indx, len) : "";

            maskObj.mask = mask.substring(start, indx);
            maskObj.maskHasNegativeSign = maskObj.mask.charAt(0) === "-";
            maskObj.maskHasPositiveSign = maskObj.mask.charAt(0) === "+";

            // Search for group separator & decimal; anything not digit,
            // not +/- sign, and not #
            let result = maskObj.mask.match(this.notMaskRegex);
            // Treat the right most symbol as decimal
            maskObj.decimal = (result && result[result.length - 1]) || ".";
            // Treat the left most symbol as group separator
            maskObj.separator = (result && result[1] && result[0]) || ",";

            // Split the decimal for the format string if any
            result = maskObj.mask.split(maskObj.decimal);
            maskObj.integer = result[0];
            maskObj.fraction = result[1];
            return maskObj;
        },

        processValue: function (value, maskObj, options) {
            let isNegative = false;
            const valObj = {
                value
            };
            if (value < 0) {
                isNegative = true;
                // Process only abs(), and turn on flag.
                valObj.value = -valObj.value;
            }

            valObj.sign = isNegative ? "-" : "";

            // Fix the decimal first, toFixed will auto fill trailing zero.
            valObj.value = Number(valObj.value).toFixed(maskObj.fraction && maskObj.fraction.length);
            // Convert number to string to trim off *all* trailing decimal zero(es)
            valObj.value = Number(valObj.value).toString();

            // Fill back any trailing zero according to format
            // look for last zero in format
            const posTrailZero = maskObj.fraction && maskObj.fraction.lastIndexOf("0");
            let [valInteger = "0", valFraction = ""] = valObj.value.split(".");
            if (!valFraction || (valFraction && valFraction.length <= posTrailZero)) {
                valFraction = posTrailZero < 0
                    ? ""
                    : (Number("0." + valFraction).toFixed(posTrailZero + 1)).replace("0.", "");
            }

            valObj.integer = valInteger;
            valObj.fraction = valFraction;
            this.addSeparators(valObj, maskObj);

            // Remove negative sign if result is zero
            if (valObj.result === "0" || valObj.result === "") {
                // Remove negative sign if result is zero
                isNegative = false;
                valObj.sign = "";
            }

            if (!isNegative && maskObj.maskHasPositiveSign) {
                valObj.sign = "+";
            } else if (isNegative && maskObj.maskHasPositiveSign) {
                valObj.sign = "-";
            } else if (isNegative) {
                valObj.sign = options && options.enforceMaskSign && !maskObj.maskHasNegativeSign
                    ? ""
                    : "-";
            }

            return valObj;
        },

        addSeparators: function (valObj, maskObj) {
            valObj.result = "";
            // Look for separator
            const szSep = maskObj.integer.split(maskObj.separator);
            // Join back without separator for counting the pos of any leading 0
            const maskInteger = szSep.join("");

            const posLeadZero = maskInteger && maskInteger.indexOf("0");
            if (posLeadZero > -1) {
                while (valObj.integer.length < (maskInteger.length - posLeadZero)) {
                    valObj.integer = "0" + valObj.integer;
                }
            } else if (Number(valObj.integer) === 0) {
                valObj.integer = "";
            }

            // Process the first group separator from decimal (.) only, the rest ignore.
            // get the length of the last slice of split result.
            const posSeparator = (szSep[1] && szSep[szSep.length - 1].length);
            if (posSeparator) {
                const len = valObj.integer.length;
                const offset = len % posSeparator;
                for (let indx = 0; indx < len; indx++) {
                    valObj.result += valObj.integer.charAt(indx);
                    // -posSeparator so that won't trail separator on full length
                    if (!((indx - offset + 1) % posSeparator) && indx < len - posSeparator) {
                        valObj.result += maskObj.separator;
                    }
                }
            } else {
                valObj.result = valObj.integer;
            }

            valObj.result += (maskObj.fraction && valObj.fraction)
                ? maskObj.decimal + valObj.fraction
                : "";
            return valObj;
        },

        format: function (mask, value, options = {}) {
            if (!mask || isNaN(Number(value))) {
                // Invalid inputs
                return value;
            }

            const maskObj = this.processMask(mask);
            const valObj = this.processValue(value, maskObj, options);
            return maskObj.prefix + valObj.sign + valObj.result + maskObj.suffix;
        }


    }
    this.getTarget = function () {

        if (_this.config.viewType.toLocaleLowerCase() == 'grid') {
            if (((_this.target == null) || (_this.target == undefined)) && !_this.closing) {
                if (!window._gridWinId) {
                    window._gridWinId = 1;
                } else {
                    window._gridWinId++;
                }
                var gridWinId = 'gridWindow_' + window._gridWinId;
                var html = ''
                    + '<div class="popupWindow-background ' + gridWinId + '"></div>'
                    + '<div id="' + gridWinId + '"class="popupWindow ' + gridWinId + '">'
                    + '   <i class="fa fa-times closeButton" aria-hidden="true"></i>'
                    + '   <div class="gridPopup myGrid"></div>'
                    + '</div>';

                var parentArea = $('body');
                $(parentArea).append(html);
                $('.popupWindow-background.' + gridWinId).click(function () {
                    var oCell = _this.getContentRef('.cell_' + _this.indexCellSelected);
                    if (oCell) {
                        var indexRow = $(oCell).parent().attr('indexRow');
                        _this.saveRowToServer(indexRow, null, true);

                    }
                    $('.' + gridWinId).remove();
                    _this.target = null;
                    _this.closing = true;
                    if (_this.events.close)
                        _this.events.close();
                });
                $('#' + gridWinId).find('.closeButton').click(function () {
                    var oCell = _this.getContentRef('.cell_' + _this.indexCellSelected);
                    if (oCell) {
                        var indexRow = $(oCell).parent().attr('indexRow');
                        _this.saveRowToServer(indexRow, null, true);

                    }
                    $('.' + gridWinId).remove();
                    _this.target = null;
                    _this.closing = true;
                    if (_this.events.close)
                        _this.events.close();
                });
                _this.target = $('#' + gridWinId).find('.gridPopup');

            }
            //check tabindex attribute (chrome just capture keydown when tabindex is present
            if (!$(_this.target).attr('tabindex'))
                $(_this.target).attr('tabindex', '1');
        }
        return _this.target;
    }
    this.config = {
        fixedColumns: 0,
        viewType: 'grid',
        displayRowCursor: true,
        allowExport: true,
        allowPageSelection: true,
        allowPageSizeSelection: true,
        allowCustomization: true,
        allowFullscreen: true,
        allowMultipleSelection: false,
        defaultMultipleSelection: false,
        saveMultipleRows: false,
        pageSize: 10,
        title: '',
        defaultOrder: '',
        allowInsert: false,
        allowDelete: false,
        columns: []
    };
    this.minWidth = 10;
    this.colFixedWidth = 0;
    this.indexCellSelected = 0;
    this.maxIndexCell = 0;
    this.maxIndexCellEditable = 0;
    this.newDataRow = null;
    this.firstColWidth = 25;
    this.objMyEdit = null;
    this.lang = {
        customize: 'Customize', duplicateRecord: 'Duplicate Record', newRecord: 'New Record', cancelChanges: 'Cancel Changes', saveRecords: 'Save Changes', savingRecords: 'Saving Records', savingRecordsCompleted: 'Complete Records Saving', clearFilters: 'Clear Filters', saveChanges: 'Save Changes',
        hiddenColumns: 'Hidden Columns', visibleStaticColumns: 'Visible Static Columns', clearFilter: 'Remove Filter',
        visibleScrollableColumns: 'Visible Scrollable Columns', columnSettings: 'Columns Settings', setFilterColumn: 'Set Column Filter ',
        recordsFromTo: 'Records %1 to %2, of %3 records', noRecords: 'No records', gotoPrevious: 'Go to previous %1 records.',
        gotoNext: 'Go to next %1 records.', gotoFirst: 'Go to first %1 records.', gotoLast: 'Go to latest %1 records',
        deleteRecord: 'Delete record', applyFilter: 'Apply filter', exportData: 'Export', set: 'Set', editRecord: 'Edit record',
        recordsPerPage: 'Records Per Page', selectUnselectAllRows: 'Select/Unselect all Rows',
        recordsFromToResponsive: '%1 to %2, of %3', close: 'Close'
    };
    this.events = {
        created: null
        , close: null
        , buttonClick: null
        , afterCellChange: null
        , beforeSaveRecord: null
        , afterSaveRecord: null
        , multiSelectionChange: null
        , beforeRenderEditableCell: null
        , afterRenderEditableCell: null
        , beforeRenderGrid: null
        , afterCreatedNewRecord: null
        , onCustomHTMLCellRendering: null
    };
    this.dataParameters = {};
    this.autoDataLoad = true;
    $.extend(_this.lang, lang);
    $.extend(_this.events, events);
    $.extend(_this.dataParameters, dataParameters);
    if (!(pAutoDataLoad === undefined))
        this.autoDataLoad = pAutoDataLoad;
    this.getContentRef = function (ref) {
        if (ref)
            return $(_this.getTarget()).find(ref);
        return $(_this.getTarget());
    }
    this.reset = function (gridName, events, dataParameters) {
        //reasign a different gridName to currnet grid.
        _this.currentData = null;
        _this.recordTotalCount = 0;
        _this.currentPage = 0;
        _this.pagesCount = 0;
        _this.minWidth = 10;
        _this.colFixedWidth = 0;
        _this.currentOrder = "";
        _this.indexCellSelected = 0;
        _this.maxIndexCell = 0;
        _this.maxIndexCellEditable = 0;
        _this.newDataRow = null;
        _this.firstColWidth = 25;
        _this.gridName = gridName;
        _this.objMyEdit = null;
        _this.closing = false;
        _this.events = {
            created: null
            , close: null
            , buttonClick: null
            , afterCellChange: null
            , beforeSaveRecord: null
            , afterSaveRecord: null
            , multiSelectionChange: null
            , afterCreatedNewRecord: null
            , afterExecuteAction: null
            , onCustomHTMLCellRendering: null
        };
        _this.lastCheckboxClicked = -1;
        _this.config = {
            fixedColumns: 0,
            viewType: 'grid',
            displayRowCursor: true,
            allowExport: true,
            allowPageSelection: true,
            allowPageSizeSelection: true,
            allowCustomization: true,
            allowFullscreen: true,
            allowMultipleSelection: false,
            defaultMultipleSelection: false,
            saveMultipleRows: false,
            pageSize: 10,
            title: '',

            defaultOrder: '',
            allowInsert: false,
            allowDelete: false,
            columns: []
        };
        _this.hasNewRecordButton = false;
        _this.hasSaveRecordsButton = false;
        $.extend(_this.events, events);
        _this.dataParameters = {};
        $.extend(_this.dataParameters, dataParameters);
        _this.loadConfig();
    }
    this.init = function () {

        if ((_this.target != null) && (_this.target != undefined)) {
            _this.getContentRef().html('');//clear
        }
        if (_this.config.viewType.toLowerCase() == 'form') {
        } else {
            _this.initGrid();//(data, recordTotalCount, currentPage, currentOrder);
            _this.resizeButtonsTitle();
        }
    }
    this.initGrid = function () {
        _this.getContentRef().attr('gridName', _this.gridName);
        _this.getContentRef().html('<div class="gridTitle">'
            + '<label></label>'
            + '<div id="buttonsTitle">'
            + '   <span class="cmdClearFilters" title="Clear Filters" style="display:none;"><i id="icon-clear" class="fa fa-eraser" aria-hidden="true"></i></span>'
            + '   <span class="cmdNewRecord toolbarButton" style="display:none;">' + this.lang.newRecord + '</span>'
            + '   <span class="cmdSaveRecords toolbarButton" style="display:none;">' + this.lang.saveRecords + '</span>'
            + '   <span class="cmdSaveRecordsCancel toolbarButton" style="display:none;">' + this.lang.cancelChanges + '</span>'
            + '   <div class="gridCustomButtons"></div>'
            //+ '   <span class="cmdExport toolbarButton" style="display:none;">' + this.lang.exportData + '</span>'
            + '   <span title="Refresh data" class="cmdRefresh toolbarButton" style="min-width: auto" ><i class="fa fa-sync" aria-hidden="true"></i></span>'
            + '   <div style="display:none!important; float:right; padding-right:0px;" id="menuCollapse">'
            + '     <button id="button-collapse" style="margin-top: 0px; margin-left: 5px; float:right; margin-right:5px;" type="button" class="btn btn-primary navbar-toggle" data-toggle="collapse" data-target="#grid-title-collapse">'
            + '     <span class="sr-only">Toggle navigation</span>'
            + '     <i id="icon-collapse" class="fa fa-bars" aria-hidden="true"></i>'
            + '    </button></div>'
            + '<div class="clear clearer"></div>'
            + '</div>'
            + '<div id="menuButtonsCollapse" class="container-fluid" style="display:none!important;">'
            + '   <div class="collapse navbar-collapse" style="margin-top: 44px;  padding: 0px; background-color: transparent;" id="grid-title-collapse">'
            + '     <div class="navbar-bottom">'
            + '         <ul id="buttonsCollapsed" class="nav navbar-nav">'
            + '             <li><span class="cmdNewRecord" style="display:none;" data-toggle="collapse" data-target="#grid-title-collapse">' + this.lang.newRecord + '</span>'
            + '             <li><span class="cmdSaveRecords" style="display:none;" data-toggle="collapse" data-target="#grid-title-collapse">' + this.lang.saveRecords + '</span>'
            + '             <li><span class="cmdSaveRecordsCancel" style="display:none;" data-toggle="collapse" data-target="#grid-title-collapse">' + this.lang.cancelChanges + '</span>'
            + '             <div class="gridCustomButtons"></div>'
            //+ '             <span class="cmdExport toolbarButton" style="display:none;" data-toggle="collapse" data-target="#grid-title-collapse">' + this.lang.exportData + '</span></li>'
            + '          </ul>'
            + '    </div>'
            + '  </div>'
            + '</div>'
            + '</div>'
            + '<div class="gridTable">'
            + '    <div class="gridHeaderStatic">'
            + '        <div class="gridHeaderStaticRow">'
            + '        </div>'
            + '    </div>'
            + '    <div class="gridHeader">'
            + '        <div class="gridHeaderRow">'
            + '        </div>'
            + '    </div>'
            + '    <div class="gridBodyStatic">'
            + '    </div>'
            + '    <div class="gridBody">'
            + '    </div>'
            + '    <div class="gridFooter">'
            + '    <div class="gridPageBar pull-left">'
            + '<select class="selectPageSize" title="' + this.lang.recordsPerPage + '"></select>'
            + '<br class="footer-breakline" style="clear:both" />'
            + '<span class="goFirstPage"><i class="fa fa-step-backward" aria-hidden="true"></i></span>'
            + '<span class="goPreviousPage"><i class="fa fa-caret-left" aria-hidden="true"></i></span>'
            + '<span class="currentPage">&nbsp</span>'
            + '<span class="goNextPage"><i class="fa fa-caret-right" aria-hidden="true"></i></span>'
            + '<span class="goLastPage"><i class="fa fa-step-forward" aria-hidden="true"></i></span>'
            + '<span class="currentPageLoading" style=display:none;"><i class="fa fa-spinner fa-pulse fa-fw loading" aria-hidden="true"></i></span>'
            + '<span title="Refresh data" class="cmdRefresh" style="margin-left:15px;"><i class="fa fa-sync" aria-hidden="true"></i></span>'
            + '<span title="Toggle Expand Grid to full screen..." class="cmdFullscreen" ><i class="fa fa-expand-arrows-alt" aria-hidden="true"></i></span></div>'
            + '<div class="pull-right"><div class="cmdCustomize" style="display:none;">' + this.lang.customize + '</div></div>'
            + '<div class="pull-right"><div class="cmdExport mr-1" style="display:none;">' + this.lang.exportData + '</div></div>'
            + '<div class= "clearfix"></div ></div >'
            + '</div>'
            + '</div>');



        if (_this.config.buttons) {
            for (var i = 0; i < _this.config.buttons.length; i++) {
                var oButton = _this.config.buttons[i];
                if (oButton.multiselect) {
                    var strDis = 'disabled="disabled"';
                    if (!_this.config.allowMultipleSelection) strDis = '';
                    _this.getContentRef('.gridCustomButtons').append(
                        '<span class="multiselectButton btn btn-disabled" ' + strDis + ' title="' + oButton.title + '" indexButton="' + i + '" >' + oButton.label + '<i style="margin-left:10px;" class="fa ' + oButton.icon + ' customButtonMultiselect" aria-hidden="true"></i>'
                        + '<i class="fa fa-spinner fa-pulse fa-fw executing" style="display:none;" aria-hidden="true"></i>'
                        + '</span>');
                }
            }
            // hide of navbar custom buttons if were added..
            var customButtonsCollapsed = $('#buttonsCollapsed > li > .gridCustomButtons').children();
            for (var i = 0; i < customButtonsCollapsed.length; i++) {
                customButtonsCollapsed[i].style.display = 'none';
            }
        }


        _this.getContentRef('.gridHeader').off();
        _this.getContentRef('.gridBody').off();
        _this.getContentRef('.gridHeaderStaticRow').off();
        _this.getContentRef('.gridHeaderRow').off();
        _this.getContentRef(".gridHeader").scroll(function () {
            var leftScroll = _this.getContentRef(".gridHeader").scrollLeft();
            var bodyLeftScroll = _this.getContentRef('.gridBody').scrollLeft();
            if (bodyLeftScroll != leftScroll) {
                _this.getContentRef('.gridBody').scrollLeft(leftScroll);
                _this.relocateResizeCols(leftScroll);
            }
        });
        _this.gridBodyScrollTimeout = null;
        _this.getContentRef(".gridBody").scroll(function () {
            //if (_this.gridBodyScrollTimeout != null) clearTimeout(_this.gridBodyScrollTimeout);
            //_this.gridBodyScrollTimeout = setTimeout(function() {
            var bodyTopScroll = _this.getContentRef(".gridBody").scrollTop();
            var oBodyStatic = _this.getContentRef(".gridBodyStatic");
            var bodyStaticTopScroll = oBodyStatic.scrollTop();
            if (bodyTopScroll != bodyStaticTopScroll)
                oBodyStatic.scrollTop(bodyTopScroll);

            var leftScroll = _this.getContentRef(".gridBody").scrollLeft();
            var headerLeftScroll = _this.getContentRef('.gridHeader').scrollLeft();
            if (headerLeftScroll != leftScroll) {
                _this.getContentRef('.gridHeader').scrollLeft(leftScroll);
                _this.relocateResizeCols(leftScroll);
            }
            //  }, 100);
        });
        _this.getContentRef('.gridHeaderStaticRow').mouseenter(function () {
            _this.getContentRef('.filter_icon').show();
        });
        _this.getContentRef('.gridHeaderRow').mouseenter(function () {
            _this.getContentRef('.filter_icon').show();
        });
        _this.getContentRef('.gridHeaderStaticRow').mouseleave(function () {
            _this.getContentRef('.filter_icon').hide();
        });
        _this.getContentRef('.gridHeaderRow').mouseleave(function () {
            _this.getContentRef('.filter_icon').hide();
        });


        //create grid, columns
        _this.minWidth = 10;
        _this.firstColWidth = 25;
        if (_this.config.displayRowCursor) {
            if (_this.config.allowDelete) _this.firstColWidth += 20;
            if (_this.config.templateEdit)
                if (_this.config.templateEdit != '')
                    _this.firstColWidth += 20;
            if (_this.config.buttons)
                for (var i = 0; i < _this.config.buttons.length; i++)
                    if (!_this.config.buttons[i].multiselect)
                        _this.firstColWidth += 22;
            if (_this.config.allowMultipleSelection)
                _this.firstColWidth += 20;
        } else {
            _this.firstColWidth = 0;
        }
        var titleBarVisible = ((_this.config.title != '') || (_this.config.allowExport));
        var footerBarVisible = ((_this.config.allowPageSelection) || (_this.config.allowInsert) || (_this.config.allowCustomization));
        if (titleBarVisible) {
            _this.getContentRef('.gridTitle label').html(_this.config.title);
        } else {
            _this.getContentRef('.gridTitle').hide();
        }
        if (!footerBarVisible) {
            _this.getContentRef('.gridFooter').hide();
        }
        if (_this.config.allowInsert) {
            _this.getContentRef('.cmdNewRecord').show();
            _this.hasNewRecordButton = true;
        } else {
            _this.hasNewRecordButton = false;
            _this.getContentRef('.cmdNewRecord').hide();
            _this.getContentRef('.gridCustomButtons').css('margin-left', '100px');
            $('#buttonsCollapsed > li > .gridCustomButtons')[0].style.marginLeft = '0px';
        }
        if (_this.config.saveMultipleRows) {
            //_this.getContentRef('.cmdSaveRecords').show();
            _this.getContentRef('.cmdSaveRecords').hide();
            _this.getContentRef('.cmdSaveRecordsCancel').hide();
            _this.hasSaveRecordsButton = true;
        } else {
            _this.getContentRef('.cmdSaveRecords').hide();
            _this.getContentRef('.cmdSaveRecordsCancel').hide();
            _this.getContentRef('.gridCustomButtons').css('margin-left', '10px');
            _this.hasSaveRecordsButton = false;
        }
        if (_this.config.allowPageSelection) {
            _this.getContentRef('.gridPageBar').show();
            if (_this.config.allowPageSizeSelection) {
                _this.getContentRef('.selectPageSize').show();
            } else {
                _this.getContentRef('.selectPageSize').hide();
            }
        } else {
            _this.getContentRef('.gridPageBar').hide();
        }
        //console.log(_this.config.title, _this.config.allowExport);
        if (_this.config.allowExport) {
            _this.getContentRef('.gridTable .cmdExport').show();
            _this.hasExportButton = true;
        } else {
            _this.getContentRef('.gridTable .cmdExport').hide();
            _this.hasExportButton = false;
        }
        if (_this.config.allowCustomization) {
            _this.getContentRef('.cmdCustomize').show();
        } else {
            _this.getContentRef('.cmdCustomize').hide();
        }
        if (_this.config.allowFullscreen) {
            _this.getContentRef('.cmdFullscreen').show();
        } else {
            _this.getContentRef('.cmdFullscreen').hide();
        }
        if (!titleBarVisible) {
            _this.getContentRef('.gridTable').css({ top: '0px' });
        } else {
            _this.getContentRef('.gridTable').css({ top: '45px' });
        }
        if (!footerBarVisible) {
            _this.getContentRef('.gridHeaderStatic').css({ bottom: '-16px' });
            _this.getContentRef('.gridHeader').css({ bottom: '0px' });
            _this.getContentRef('.gridBody').css({ bottom: '4px' });
            _this.getContentRef('.gridBodyStatic').css({ bottom: '-16px' });
        }
        _this.getContentRef('.selectPageSize').html('');
        _this.getContentRef('.selectPageSize').append('<option val="10">10</option>');
        _this.getContentRef('.selectPageSize').append('<option val="20">20</option>');
        _this.getContentRef('.selectPageSize').append('<option val="30">30</option>');
        _this.getContentRef('.selectPageSize').append('<option val="40">40</option>');
        _this.getContentRef('.selectPageSize').append('<option val="50">50</option>');
        _this.getContentRef('.selectPageSize').append('<option val="100">100</option>');
        _this.getContentRef('.selectPageSize').append('<option val="200">200</option>');
        _this.getContentRef('.selectPageSize').append('<option val="300">300</option>');
        _this.getContentRef('.selectPageSize').append('<option val="400">400</option>');
        _this.getContentRef('.selectPageSize').append('<option val="500">500</option>');
        _this.getContentRef('.selectPageSize').append('<option val="1000">1000</option>');
        _this.getContentRef('.selectPageSize').val(_this.config.pageSize);
        _this.getContentRef('.selectPageSize').off();
        _this.getContentRef('.selectPageSize').change(function () {
            var oNewPageSize = { pageSize: $(this).val() };
            //save in the user profile
            _this.serverCall('savePageSize', oNewPageSize,
                function (data) {
                    _this.config.pageSize = oNewPageSize.pageSize;
                    _this.loadData(0, '', '');
                },
                function (oResponse) {
                    _this.errorDisplay(-1, oResponse.error.description);
                },
                false);

        });
        _this.getContentRef('.gridTable').find('.gridHeaderStaticRow').html('');
        _this.getContentRef('.gridTable').find('.gridHeaderRow').html('');
        _this.getContentRef('.gridTable').find('.gridBodyStatic').html('');
        _this.getContentRef('.gridTable').find('.gridBody').html('');
        _this.getContentRef('.gridTable').find('.resizeCol').remove();
        //add cursor column
        var strMultipleSelectionDefault = '';
        if (_this.config.defaultMultipleSelection == true) strMultipleSelectionDefault = ' checked ';
        var strStatic = '<div class="cell firstcolumn" style="width:' + _this.firstColWidth + 'px;">';
        if (_this.config.allowMultipleSelection) {
            strStatic += '<div class="areaRowSelector" title="' + _this.lang.selectUnselectAllRows + '"><input type="checkbox" ' + strMultipleSelectionDefault + ' class="selectAllRows"/></div>';
        }
        strStatic += '</div>';
        var strScrollable = '';
        var strResizers = '';
        var bottomPx = _this.getContentRef('.gridFooter').height();
        var strCol = '';
        for (var i = 0; i < _this.config.columns.length; i++) {
            var oCol = _this.config.columns[i];
            if (oCol.visible) {
                var strStyle = 'middlecolumn';
                if (i == _this.config.columns.length - 1) strStyle = 'lastcolumn';
                var filterable = '';
                if (oCol.filterable) filterable = '<i class="header_icons filter_icon fa fa-filter"  title="' + _this.lang.setFilterColumn + '"></i>';
                var sortable = '<i class="header_icons fa fa-sort-alpha-asc sort_icon"></i>';
                var filtered = '<i class="header_icons fa fa-times clearfilter_icon" title="' + _this.lang.clearFilter + '"></i>';

                strCol = '<div colIndex="' + i + '" class="colIndex_' + i + ' cell ' + strStyle + ' headerCol ' + headerAlignClass(oCol.headerAlign) + '" colId="' + oCol.id + '">'
                    + '<label>' + oCol.label + '</label>'
                    + '<div class="headerGroupIcons">' + filtered + filterable + sortable + '</div>'
                    + '</div>';
                if (i < _this.config.fixedColumns) {
                    strStatic += strCol;
                } else {
                    strScrollable += strCol;
                }
                if (oCol.resizable)
                    strResizers += '<div colIndex="' + i + '" class="resizeCol resizeCol_' + i + '"></div>';
            }
        }

        function headerAlignClass(headerAlignValue) {
            if (headerAlignValue) {
                switch (headerAlignValue.toLowerCase()) {
                    case 'center': return 'gridHeaderCenterAlign';
                    case 'right': return 'gridHeaderRightAlign';
                    case 'left': return 'gridHeaderLeftAlign';
                }
            }
            return '';
        };

        _this.getContentRef('.gridTable').append(strResizers);
        _this.getContentRef('.gridHeaderRow').html(strScrollable);
        _this.getContentRef('.gridHeaderStaticRow').html(strStatic);

        _this.redrawWidthColumns();
        //_this.getContentRef('.gridBody').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBody').position().top);
        //_this.getContentRef('.gridBodyStatic').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBody').position().top);
        _this.adjustheight();

        _this.getContentRef('.resizeCol').off();
        _this.getContentRef('.resizeCol').draggable({
            axis: 'x',
            start: function () {
                $(this).css('background-color', '#c0c0c0');
            },
            drag: function (event, ui) {
            },
            stop: function (event, ui) {
                $(this).css('background-color', 'transparent');
                var colIndex = $(this).attr('colIndex');
                var colObj = _this.getContentRef('.colIndex_' + colIndex)[0];
                var left = $(colObj).offset().left;
                var newWidth = ui.offset.left - left;
                var oCol = _this.config.columns[colIndex];
                oCol.width = newWidth;
                _this.redrawWidthColumns();
                var oNewColumnWidth = { id: oCol.id, width: oCol.width };
                //save in the user profile
                _this.serverCall('saveColumnWidth', oNewColumnWidth,
                    function (data) {

                    },
                    function (oResponse) {
                        _this.errorDisplay(-1, oResponse.error.description);
                    },
                    false);
            }
        });
        if (_this.events.created) _this.events.created();
        _this.getContentRef().off();
        _this.getContentRef().keydown(function (event) {
            if (_this.getContentRef().find('.coverGridArea').length > 0) return;
            switch (event.which) {
                case 13:
                    event.preventDefault();
                    event.stopPropagation();
                    var oCell = _this.getContentRef('.cell_' + _this.indexCellSelected);
                    if (!_this.cmdEdit(oCell, event)) _this.goRight();
                    break;
                case 40: //down
                    event.preventDefault();
                    event.stopPropagation();
                    _this.goDown();
                    break;
                case 38: //up
                    event.preventDefault();
                    event.stopPropagation();
                    _this.goUp();
                    break;
                case 37: //left
                    event.preventDefault();
                    event.stopPropagation();
                    _this.goLeft();
                    break;
                case 39: //right
                case 9:
                    event.preventDefault();
                    event.stopPropagation();
                    _this.goRight();
                    break;
                default:
                    var oCell = _this.getContentRef('.cell_' + _this.indexCellSelected);
                    _this.cmdEdit(oCell, event);
                    break;
            }
        });
        _this.getContentRef().click(function (evt) {
            var bNewRecordClicked = false;
            var bSaveRecordsClicked = false;
            if (($(evt.target).hasClass('goFirstPage'))
                || ($(evt.target).parent().hasClass('goFirstPage'))) {
                if (_this.currentPage > 0) _this.loadData(0, '', '');
            }
            if (($(evt.target).hasClass('goPreviousPage'))
                || ($(evt.target).parent().hasClass('goPreviousPage'))) {
                if (_this.currentPage > 0) _this.loadData(_this.currentPage - 1, '', '');
            }
            if (($(evt.target).hasClass('goNextPage'))
                || ($(evt.target).parent().hasClass('goNextPage'))) {
                if (_this.currentPage < _this.pagesCount - 1) _this.loadData(_this.currentPage + 1, '', '');
            }
            if (($(evt.target).hasClass('goLastPage'))
                || ($(evt.target).parent().hasClass('goLastPage'))) {
                if (_this.currentPage < _this.pagesCount - 1) _this.loadData(_this.pagesCount - 1, '', '');
            }
            if ($(evt.target).hasClass('cmdClearFilters')
                || $(evt.target).parent().hasClass('cmdClearFilters')) {
                _this.clearFilters();
            }
            if ($(evt.target).hasClass('cmdNewRecord')) {
                if (_this._savingRow) return;
                bNewRecordClicked = true;
                _this.newRecord();
            }
            if ($(evt.target).hasClass('cmdSaveRecords')) {
                if (_this._savingRow) return;
                bSaveRecordsClicked = true;
                _this.saveMultipleRecords();
            }
            if ($(evt.target).hasClass('cmdSaveRecordsCancel')) {
                if (_this._savingRow) return;
                bSaveRecordsClicked = true;
                _this.cancelSaveMultipleRecords();
            }
            if ($(evt.target).hasClass('cmdExport')) {
                _this.export();
            }

            if ($(evt.target).hasClass('cmdRefresh')
                || ($(evt.target).parent().hasClass('cmdRefresh'))) {
                _this.refresh();
            }

            if ($(evt.target).hasClass('cmdFullscreen')
                || ($(evt.target).parent().hasClass('cmdFullscreen'))) {
                _this.fullScreenToggle();
            }

            if ($(evt.target).hasClass('cmdCustomize')) {
                _this.editConfig();
            }
            if ($(evt.target).hasClass('clearfilter_icon')) {
                _this.clearFilter(evt);
            }
            if ($(evt.target).hasClass('headerCol')) {
                _this.clickSortColumn($(evt.target));
                return false;
            }
            if ($(evt.target).parent().hasClass('headerCol') && ($(evt.target)[0].tagName == 'LABEL')) {
                _this.clickSortColumn($(evt.target).parent());
                return false;
            }
            if ($(evt.target).parent().hasClass('headerCol') && ($(evt.target).hasClass('sort_icon'))) {
                _this.clickSortColumn($(evt.target).parent());
                return false;
            }
            if ($(evt.target).hasClass('filter_icon')) {
                _this.showFilterWindow(evt);
                return;
            }
            if ($(evt.target).hasClass('deleteIcon')) {
                if (_this._savingRow) return;
                _this.deleteRecord(evt);
                return;
            }
            if ($(evt.target).hasClass('duplicateIcon')) {
                if (_this._savingRow) return;
                _this.duplicateRecord(evt);
                return;
            }
            if ($(evt.target).hasClass('editIcon')) {
                if (_this._savingRow) return;
                var indexRow = $(evt.target).parent().parent().attr('indexRow');
                _this.editRecord(indexRow);
                return;
            }
            if ($(evt.target).hasClass('editingIcon')) {
                if (_this._savingRow) return;
                var indexRow = $(evt.target).parent().parent().attr('indexRow');
                if (indexRow != undefined) {

                    _this.selectCell(_this.indexCellSelected, true);
                    _this.saveRowToServer(indexRow);
                }
                return;
            }
            if ($(evt.target).hasClass('customButton')) {
                if (_this._savingRow) return;
                var indexRow = $(evt.target).parent().parent().attr('indexRow');
                if (indexRow != undefined) {
                    _this.processCustomButton(indexRow, evt.target);
                }
                return;
            }
            if ($(evt.target).hasClass('customButtonMultiselect')) {
                if (_this._savingRow) return;
                _this.processCustomMultiselectButton($(evt.target).parent());
                return;
            }
            if ($(evt.target).hasClass('multiselectButton')) {
                if (_this._savingRow) return;
                if (_this.getContentRef('.multiselectButton').attr('disabled') == 'disabled') return;
                _this.processCustomMultiselectButton(evt.target);
                return;
            }
            if ($(evt.target).hasClass('selectAllRows')) {
                var allChecked = $(evt.target)[0].checked;
                _this.getContentRef('.rowSelector').each(function (index) {
                    $(this)[0].checked = allChecked;
                });
                if (allChecked) {
                    _this.getContentRef('.multiselectButton').removeClass('btn-disabled');
                    _this.getContentRef('.multiselectButton').removeAttr('disabled');
                } else {
                    _this.getContentRef('.multiselectButton').addClass('btn-disabled');
                    _this.getContentRef('.multiselectButton').attr('disabled', 'disabled');
                    _this.enableTopButtonAlwaysEnabled();
                }
                if (_this.events.multiSelectionChange) _this.events.multiSelectionChange(_this.getRowsSelected());
            }
            if ($(evt.target).hasClass('rowSelector')) {

                if (_this.getContentRef('.rowSelector:checked').length > 0) {
                    _this.getContentRef('.multiselectButton').removeClass('btn-disabled');
                    _this.getContentRef('.multiselectButton').removeAttr('disabled');
                } else {
                    _this.getContentRef('.multiselectButton').addClass('btn-disabled');
                    _this.getContentRef('.multiselectButton').attr('disabled', 'disabled');
                    _this.enableTopButtonAlwaysEnabled();
                }

                var indexRow = parseInt($(evt.target).parent().parent().parent().attr('indexRow'), 10);
                if (evt.shiftKey) {
                    if (_this.lastCheckboxClicked != -1) {
                        if ($('.rowSelector.indexRow_' + _this.lastCheckboxClicked).length > 0)
                            if ($('.rowSelector.indexRow_' + _this.lastCheckboxClicked)[0].checked)
                                if ($(evt.target)[0].checked)
                                    if (_this.lastCheckboxClicked < indexRow) {
                                        for (var i = _this.lastCheckboxClicked; i <= indexRow; i++) {
                                            $('.rowSelector.indexRow_' + i)[0].checked = true;
                                        }
                                    } else {
                                        for (var i = indexRow; i <= _this.lastCheckboxClicked; i++) {
                                            $('.rowSelector.indexRow_' + i)[0].checked = true;
                                        }
                                    }
                    }
                }
                //evaluate all checked or not
                var allChecked = true;
                _this.getContentRef('.rowSelector').each(function (index) {
                    if (!$(this)[0].checked)
                        if (index < _this.currentData.length) {
                            allChecked = false;
                        }
                });
                _this.getContentRef('.selectAllRows')[0].checked = allChecked;

                _this.lastCheckboxClicked = indexRow;
                if (_this.events.multiSelectionChange) _this.events.multiSelectionChange(_this.getRowsSelected());
                return;
            }
            if (($(evt.target).hasClass('data')) || $(evt.target).parents().hasClass('data') || $($(evt.target).children()[0]).hasClass('data')) {
                var oCell = null;
                if ($(evt.target).hasClass('data')) {
                    oCell = $(evt.target).parent();
                }
                else {
                    if ($($(evt.target).children()[0]).hasClass('data')) {
                        oCell = $(evt.target);
                    } else {
                        $(evt.target).parents().each(function () {
                            if (oCell == null)
                                if ($(this).hasClass('data')) {
                                    oCell = $(this).parent();
                                }
                        });
                    }
                }
                if (oCell != null) {
                    var indexCell = $(oCell).attr('indexCell');
                    _this.selectCell(indexCell);
                    _this.cmdEdit($(oCell), evt);
                    evt.preventDefault();
                    evt.stopPropagation();
                    return;
                }
            }
            else {
                var nop = 0;
            }
            if (!(bNewRecordClicked || bSaveRecordsClicked))
                _this.selectCell(-1);
        });
        //_this.getContentRef().focusout(function (evt) {
        $(document).click(function (evt) {

            var $target = $(evt.target);
            setTimeout(function () {
                if ((!_this.closing) && ($target)) {
                    if ((_this.getContentRef().find($target).length == 0)
                        && !($target[0].className.includes("ui-datepicker"))) {
                        //if ($target.parents(_this.getContentRef()).length == 0) {
                        _this.selectCell(-1, true, true);
                    }
                }
            }, 100);
            return;
        });
        $(window).on("unload", function () {
            alert('123');
            _this.selectCell(-1, true, true);
            /*var oCell = _this.getContentRef('.cell_' + _this.indexCellSelected);
            if (oCell){
                var indexRow = $(oCell).parent().attr('indexRow');
                _this.saveRowToServer(indexRow,null,true);

            }*/
        });
        _this.getContentRef('#button-collapse').click(function (evt) {
            if (($(evt.target).hasClass('fa-close'))
                || ($(evt.target).parent().hasClass('fa-close'))) {
                $('#icon-collapse').removeClass('fa-close');
                $('#icon-collapse').addClass('fa-bars');
            } else {
                if (($(evt.target).hasClass('fa-bars'))
                    || ($(evt.target).parent().hasClass('fa-bars'))) {
                    $('#icon-collapse').removeClass('fa-bars');
                    $('#icon-collapse').addClass('fa-close');
                } else {
                    if ($(evt.target.lastElementChild).hasClass('fa-bars')) {
                        $('#icon-collapse').removeClass('fa-bars');
                        $('#icon-collapse').addClass('fa-close');
                    } else {
                        $('#icon-collapse').removeClass('fa-close');
                        $('#icon-collapse').addClass('fa-bars');
                    }
                }
            }
        });

        _this.refreshOffsets();

    };
    this.checkLostFocus = function () {
        //if ($(evt.target).hasClass('myGrid')) {
        //setTimeout(function () {
        var tgt = _this.getContentRef()[0];
        var mFocus = $(':focus');
        if (mFocus.length > 0) {
            if (mFocus[0] != tgt) {
                //if (!$.contains(tgt, mFocus[0]))
                {
                    var oCell = _this.getContentRef('.cell_' + _this.indexCellSelected);
                    if (oCell) {
                        var indexRow = $(oCell).parent().attr('indexRow');
                        _this.saveRowToServer(indexRow, null, true);
                    }
                }
            }
        }
        //}, 500);
        //}
    }
    $(window).resize(function () {
        _this.refreshScreen();
    });
    this.refreshScreen = function () {
        _this.resizeBody();
        _this.resizePagination();
        _this.resizeButtonsTitle();
    }
    var offsetnewRec;
    var offsetsaveRecords;
    var offsetInit;
    var offsetCustomButtons;
    var offsetClearFilter;
    var offsetExport;
    var offsetMarginTotitle;

    this.adjustheight = function () {
        var heightTotal = 0;
        if (_this.config.hasTotalRow)
            heightTotal = $($('.grandTotal')[0]).height();
        _this.getContentRef('.gridBody').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBody').position().top - heightTotal);
        _this.getContentRef('.gridBodyStatic').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBodyStatic').position().top - heightTotal);

    }

    this.refreshOffsets = function () {

        // init offsets to resize buttons.
        offsetInit = (($('body')[0].clientWidth - $('.gridTitle')[0].clientWidth) / 2);
        if (_this.hasSaveRecordsButton) {
            offsetInit += $('.cmdSaveRecordsCancel')[0].offsetLeft;
        }
        else {
            if (_this.hasNewRecordButton) {
                offsetInit += $('.cmdNewRecord')[0].offsetLeft;
            }
            else {
                offsetInit += $('.gridCustomButtons')[0].offsetLeft;
            }
        }
        offsetnewRec = (_this.hasNewRecordButton) ? $('.cmdNewRecord')[0].clientWidth : 0;
        offsetsaveRecords = (_this.hasSaveRecordsButton) ? $('.cmdSaveRecords')[0].clientWidth + $('.cmdSaveRecordsCancel')[0].clientWidth : 0;
        offsetCustomButtons = $('.gridCustomButtons')[0].clientWidth
        offsetClearFilter = (_this.hasClearFiltersButton) ? $('.cmdClearFilters')[0].clientWidth : 0;
        offsetExport = (_this.hasExportButton) ? $('.cmdExport')[0].clientWidth : 0;
        offsetMarginTotitle = 100;
    }

    this.resizeButtonsTitle = function () {
        var wwidth = $(window).width();
        var customButtons = $('#buttonsTitle > .gridCustomButtons').children();
        var customButtonsCollapsed = $('#buttonsCollapsed > li > .gridCustomButtons').children();

        // export button
        if (wwidth < (offsetInit + offsetnewRec + offsetsaveRecords + offsetCustomButtons + offsetMarginTotitle + offsetClearFilter + offsetExport)) {
            if (_this.hasExportButton) {
                $('.cmdExport').css('display', 'none');
                $('#menuCollapse').show();
                $('#menuButtonsCollapse').show();
                $('#buttonsCollapsed > li > .cmdExport').css('display', 'block');
            }
        } else {
            if ((_this.hasExportButton) && ($('.cmdExport').css('display') == 'none')) {
                $('#menuCollapse').hide();
                $('#menuButtonsCollapse').hide();
                $('.cmdExport').css('display', 'block');
            }
        }

        // custom buttons
        for (var i = 0; i < customButtons.length; i++) {
            if (wwidth < (((customButtons.length - i) * offsetCustomButtons / customButtons.length) + offsetInit + offsetMarginTotitle + offsetClearFilter + offsetnewRec + offsetsaveRecords)) {
                if ((i == customButtons.length - 1) && !_this.hasExportButton) {
                    $('#menuCollapse').show();
                    $('#menuButtonsCollapse').show();
                }
                customButtons[i].style.display = 'none';
                customButtonsCollapsed[i].style.display = 'block';
            }
            else {
                if ((i == customButtons.length - 1) && !_this.hasExportButton) {
                    $('#menuCollapse').hide();
                    $('#menuButtonsCollapse').hide();
                }
                customButtonsCollapsed[i].style.display = 'none';
                customButtons[i].style.display = 'inline-block';
            }
        }

        // new record button
        if ((wwidth < (offsetInit + offsetMarginTotitle + offsetClearFilter + offsetnewRec + offsetsaveRecords))) {
            if (_this.hasNewRecordButton || _this.hasSaveRecordsButton) {
                if (_this.hasExportButton || customButtons.length != 0) {
                    _this.getContentRef('.cmdNewRecord').css('display', 'none');
                    //_this.getContentRef('.cmdSaveRecords').css('display', 'none');
                    $('#buttonsCollapsed > li > .cmdNewRecord').css('display', 'inline-block');
                    $('#buttonsCollapsed > li > .cmdSaveRecords').css('display', 'inline-block');
                    $('#buttonsCollapsed > li > .cmdSaveRecordsCancel').css('display', 'inline-block');
                }
            }
        } else {
            if (_this.hasNewRecordButton || _this.hasSaveRecordsButton) {
                if (_this.hasExportButton || customButtons.length != 0) {
                    _this.getContentRef('.cmdNewRecord').css('display', 'inline');
                    //_this.getContentRef('.cmdSaveRecords').css('display', 'inline-block');
                    $('#buttonsCollapsed > li > .cmdNewRecord').css('display', 'none');
                    $('#buttonsCollapsed > li > .cmdSaveRecords').css('display', 'none');
                    $('#buttonsCollapsed > li > .cmdSaveRecordsCancel').css('display', 'none');

                }
            }
        }
        if ((wwidth < (offsetInit + (offsetMarginTotitle * 2) + offsetClearFilter))) {
            $('.cmdClearFilters').css('margin-left', '15px');
        } else { $('.cmdClearFilters').css('margin-left', '100px'); }


    }

    this.resizePagination = function () {
        _this.pagesCount = Math.ceil(_this.recordTotalCount / _this.config.pageSize);
        var from = (_this.config.pageSize * _this.currentPage) + 1
        var to = (_this.config.pageSize * (_this.currentPage + 1))
        if (to > _this.recordTotalCount) to = _this.recordTotalCount;
        if (_this.recordTotalCount == 0) {
            _this.getContentRef('.currentPage').text(_this.lang.noRecords);
        } else if ($(window).width() < 650) {
            _this.getContentRef('.currentPage').text(_this.lang.recordsFromToResponsive.replace('%1', from).replace('%2', to).replace('%3', _this.recordTotalCount));
        } else {
            _this.getContentRef('.currentPage').text(_this.lang.recordsFromTo.replace('%1', from).replace('%2', to).replace('%3', _this.recordTotalCount));
        }
    }

    var timeoutScroll;
    this.relocateResizeCols = function (leftScroll) {
        if (timeoutScroll) clearTimeout(timeoutScroll);
        timeoutScroll = setTimeout(function () {
            var xWidth = 0;
            _this.getContentRef('.gridHeaderRow').children().each(function () {
                var colIndex = $(this).attr('colIndex');
                if (colIndex) {
                    xWidth += $(this).outerWidth(true);
                    if (xWidth + leftScroll > 5) {
                        _this.getContentRef('.gridTable .resizeCol_' + colIndex).css('display', 'block');
                        _this.getContentRef('.gridTable .resizeCol_' + colIndex).css('left', (_this.colFixedWidth + xWidth - leftScroll) + 'px');
                    }
                    else {
                        _this.getContentRef('.gridTable .resizeCol_' + colIndex).css('display', 'none');
                    }
                } else {
                    xWidth += $(this).outerWidth(true);
                }
            });
        }, 500);
    }
    this.resizeBody = function () {

        if (_this.config.viewType.toLowerCase() == 'form') {
        } else {
            if (_this.getContentRef('.gridHeader').length == 0) {
                //the html is not created yet. don't do anything.
                return;
            } else {
                //_this.getContentRef('.gridBody').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBody').position().top);
                //_this.getContentRef('.gridBodyStatic').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBody').position().top);
                _this.adjustheight();
            }
        }
        var mpopUpWindows = $('.popUpWindow');
        if ((_this.target != null) && (_this.target != undefined)) {
            mpopUpWindows = _this.getContentRef('.popUpWindow');
        }
        mpopUpWindows.each(function () {
            var originalLeft = parseInt($(this).attr('originalLeft'), 10);
            var left = $(this).position().left;
            var width = $(this).outerWidth();
            var windWidth = _this.getContentRef().outerWidth();
            if (originalLeft + width > windWidth) {
                if (originalLeft < left) {
                    $(this).css({ left: originalLeft + 'px' });
                } else {
                    left = _this.getContentRef().outerWidth() - width;
                    $(this).css({ left: left + 'px' });
                }
            } else {
                $(this).css({ left: originalLeft + 'px' });
            }
        });
    }
    this.processCustomButton = function (indexRow, button) {
        var indexButton = $(button).attr('indexButton');
        var oButton = _this.config.buttons[indexButton];

        var oRow = _this.currentData[indexRow];
        var ret = true;
        if (_this.events.buttonClick)
            ret = _this.events.buttonClick(oButton, oRow);
        if (ret == undefined) ret = true;
        if (ret)
            _this.executeButton(indexButton, oButton, oRow);
    }
    this.processCustomMultiselectButton = function (button) {
        var indexButton = $(button).attr('indexButton');
        var oButton = _this.config.buttons[indexButton];

        if ($(window).width() < 981) {
            $('#collapseGridTitle').click();
        }

        //get dataRows selected
        var listRowsSelected = _this.getRowsSelected();
        var ret = true;
        if (_this.events.buttonClick)
            ret = _this.events.buttonClick(oButton, listRowsSelected);
        if (ret == undefined) ret = true;
        if (ret)
            _this.executeButton(indexButton, oButton, listRowsSelected);
    }
    this.getRowsSelected = function () {
        var listRowsSelected = [];
        _this.getContentRef('.rowSelector:checked').each(function (index) {
            var indexRow = $(this).parent().parent().parent().attr('indexRow');
            listRowsSelected.push(_this.currentData[indexRow]);
        });
        return listRowsSelected;
    }
    this.executeButton = function (indexButton, oButton, dataParam) {
        if (oButton.actionType == 'openGrid') {
            if (oButton.gridToOpen)
                if (oButton.gridToOpen != '') {
                    if (oButton.target.toLowerCase() == 'self') {
                        _this.reset(oButton.gridToOpen, null, dataParam);
                    }
                    else {
                        if (oButton.target.toLowerCase() == 'newpage') {
                            _this.navigateTo('edit.aspx?d=' + oButton.gridToOpen + '&x=' + (new Date()), dataParam);
                        }
                        else {
                            //default popup
                            if (_this.oGridAux == null) {
                                _this.oGridAux = new clsMyGrid(oButton.gridToOpen, null, _this.lang, {

                                    buttonClick: _this.events.buttonClick,
                                    refreshGrid: function () {
                                        _this.oGridAux.refresh();
                                    },
                                    close: function () {
                                        _this.loadData(_this.currentPage, '', '');
                                    }
                                }, true, dataParam);
                            } else {
                                // if (_this.oGridAux.gridName != oButton.gridToOpen) { //it's just to prevent load twice
                                _this.oGridAux.reset(oButton.gridToOpen, {

                                    buttonClick: _this.events.buttonClick,
                                    close: function () {
                                        _this.oGridAux.gridName = '';  //it's just to prevent load twice
                                        _this.loadData(_this.currentPage, '', '');
                                    }
                                }, dataParam);
                                //  }
                            }
                        }
                    }
                }
        } else {
            if (oButton.actionType == 'executeSQL') {
                var bExecuted = false;
                if (oButton.confirmationMessage)
                    if (oButton.confirmationMessage != '') {
                        bExecuted = true;

                        const dialogTexts = oButton.confirmationMessage && oButton.confirmationMessage.length > 0 ? oButton.confirmationMessage.split('|') : ['Are you sure?'];
                        var oConfirm = new jsConfirm({
                            header: dialogTexts.length === 1 ? 'Confirm' : dialogTexts[0],
                            message1: dialogTexts.length > 1 ? dialogTexts[1] : dialogTexts[0],
                            message2: '',
                            buttons: [
                                {
                                    label: 'Ok', onClick: function () {
                                        _this.executeAction(indexButton, oButton, dataParam);
                                        oConfirm.close();
                                    }, style: 'btn-green'
                                }
                                , {
                                    label: 'Cancel', onClick: function () {
                                        oConfirm.close();
                                    }, style: 'btn-orange'
                                }
                            ]
                        });

                    }
                if (!bExecuted) _this.executeAction(indexButton, oButton, dataParam);
            } else {
                //Go to URL action, and send parameters as JSON  in a post method
                var target = '';
                if (oButton.target == 'self') target = '_self';
                if (oButton.target == 'blank') target = '_blank';
                //window.open(oButton.url, target);

                var strHtml = '<form id="__formNavigate__" action="' + oButton.url + '" method="POST" target="' + target + '">';
                strHtml += '<input type="hidden" name="Selection" id="__txtSelection" value=""/></form>';
                $('body').append(strHtml);
                $('#__formNavigate__').find('#__txtSelection').val(escape(JSON.stringify(dataParam)));
                $('#__formNavigate__').submit();
                setTimeout(function () { $('#__formNavigate__').remove(); }, 100);
            }
        }
    }
    this.executeAction = function (indexButton, oButton, dataParam) {
        var paramTemp = { indexButton: indexButton };
        $.extend(paramTemp, _this.dataParameters);

        var additionalParameters = {};
        if (dataParam != undefined)
            $.extend(additionalParameters, dataParam);

        _this.getContentRef('.multiselectButton[indexButton=' + indexButton + ']').find('.executing').show();
        _this.serverCall('executeAction', paramTemp,
            function (data, oResponse) {
                _this.getContentRef('.multiselectButton[indexButton=' + indexButton + ']').find('.executing').hide();
                try {
                    if (oButton.refreshDataAfterExecution)
                        _this.loadData(0, '', '');

                    if (_this.events.afterExecuteAction) {
                        _this.events.afterExecuteAction(oButton);
                    }

                } catch (ex) {
                    _this.errorDisplay(-1, ex);
                }
            },
            function (oResponse) {
                _this.getContentRef('.multiselectButton[indexButton=' + indexButton + ']').find('.executing').hide();
                _this.errorDisplay(-1, oResponse.error.description);
            },
            false, additionalParameters);
    }
    this.navigateTo = function (page, dataPar) {
        var strHtml = '<form id="__formNavigate__" action="' + page + '" method="POST" enctype="application/x-www-form-urlencoded">';
        strHtml += '<input type="hidden" name="sessionId" value="' + _this.sessionId + '"/>';
        strHtml += '<input type="hidden" name="dataParameters" value="' + escape(JSON.stringify(dataPar)) + '"/>';
        strHtml += '</form>';
        $('body').append(strHtml);
        $('#__formNavigate__').submit();
        setTimeout(function () { $('#__formNavigate__').remove(); }, 100);
        return false;
    }

    this.clickSortColumn = function (headerNode) {
        var colId = $(headerNode).attr('colId');
        var orderType = $(headerNode).attr('orderType');
        if (orderType) {
            if (orderType == "ASC") {
                orderType = 'DESC';
            } else {
                orderType = 'ASC';
            }
        }
        else {
            orderType = 'ASC';
        }
        _this.getContentRef('.headerCol').attr('orderType', ''); //reset all headers for next time
        _this.getContentRef('.headerCol .sort_icon').hide();
        _this.getContentRef('.headerCol .sort_icon').removeClass('fa-sort-alpha-asc');
        _this.getContentRef('.headerCol .sort_icon').removeClass('fa-sort-alpha-desc');

        $(headerNode).attr('orderType', orderType);
        $(headerNode).find('.sort_icon').show();
        if (orderType == 'ASC') {
            $(headerNode).find('.sort_icon').addClass('fa-sort-alpha-asc');
        } else {
            $(headerNode).find('.sort_icon').addClass('fa-sort-alpha-desc');
        }
        //save in the user profile
        _this.serverCall('saveDefaultOrder', { orderBy: colId, orderType: orderType },
            function (data) {
                _this.currentOrder = colId + ' ' + orderType;
                _this.loadData(0, colId, orderType);  //start from page 0
            },
            function (oResponse) {
                _this.errorDisplay(-1, oResponse.error.description);
            },
            false);
        //_this.loadData(0, colId, orderType);  //start from page 0

    }
    this.redrawWidthColumns = function () {
        var xWidth = 0;
        var bottomPx = this.getContentRef('.gridFooter').height();
        var leftScroll = -_this.getContentRef(".gridHeader").scrollLeft();
        this.getContentRef('.gridHeaderStaticRow').children().each(function () {
            var colIndex = $(this).attr('colIndex');
            if (colIndex) {
                var oCol = _this.config.columns[colIndex];
                if (oCol) {
                    _this.getContentRef('.gridTable .colIndex_' + colIndex).css('width', oCol.width + 'px');
                    oCol.left = _this.getContentRef('.gridTable .colIndex_' + colIndex).position().left;
                    xWidth += $(this).outerWidth(true);
                    _this.getContentRef('.gridTable .resizeCol_' + colIndex).css('left', (xWidth - 5) + 'px');
                }
            } else {
                xWidth += $(this).outerWidth(true);
            }
        });
        this.colFixedWidth = xWidth + 1;
        xWidth = 0;
        this.getContentRef('.gridHeaderRow').children().each(function () {
            var colIndex = $(this).attr('colIndex');
            if (colIndex) {
                var oCol = _this.config.columns[colIndex];
                if (oCol) {
                    _this.getContentRef('.gridTable .colIndex_' + colIndex).css('width', oCol.width + 'px');
                    oCol.left = _this.getContentRef('.gridTable .colIndex_' + colIndex).position().left;
                    xWidth += $(this).outerWidth(true);
                    _this.getContentRef('.gridTable .resizeCol_' + colIndex).css('left', (_this.colFixedWidth + xWidth + leftScroll - 5) + 'px');
                }
            } else {
                xWidth += $(this).outerWidth(true);
            }
        });
        this.minWidth = xWidth + 30;  //20 is for the scrollbar
        this.getContentRef('.gridHeaderStaticRow').css('width', this.colFixedWidth + 'px');
        this.getContentRef('.gridHeaderRow').css('min-width', this.minWidth + 'px');
        this.getContentRef(".gridHeader").css('left', (this.colFixedWidth) + 'px');
        this.getContentRef(".gridHeaderStatic").css('width', (this.colFixedWidth) + 'px');
        this.getContentRef('.gridBodyStatic').css('width', this.colFixedWidth + 'px');
        this.getContentRef(".gridBody").css('left', (this.colFixedWidth) + 'px');
        this.getContentRef('.gridBodyStatic').find('.gridRow').css('min-width', (this.colFixedWidth) + 'px');
        this.getContentRef('.gridBody').find('.gridRow').css('width', (this.minWidth) + 'px');

        // FIX: align scroll of gridBody with static columns when them resized width.
        var bodyTopScroll = _this.getContentRef(".gridBody").scrollTop();
        var oBodyStatic = _this.getContentRef(".gridBodyStatic");
        var bodyStaticTopScroll = oBodyStatic.scrollTop();
        if (bodyTopScroll != bodyStaticTopScroll)
            oBodyStatic.scrollTop(bodyTopScroll);


        if (_this.config.viewType.toLowerCase() == 'form') {
        } else {
            if (_this.getContentRef('.gridHeader').length == 0) {
                //the html is not created yet. don't do anything.
                return;
            } else {
                //_this.getContentRef('.gridBody').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBody').position().top);
                //_this.getContentRef('.gridBodyStatic').height(_this.getContentRef('.gridHeader')[0].clientHeight - _this.getContentRef('.gridBody').position().top);
                _this.adjustheight();
            }
        }

    }
    this.goDown = function () {
        var indexRow = _this.getContentRef('.cell_' + _this.indexCellSelected).parent().attr('indexRow');
        var colIndex = _this.getContentRef('.cell_' + _this.indexCellSelected).attr('colIndex');
        indexRow++;
        var indexCell = _this.getContentRef('.cell_' + indexRow + '_' + colIndex).attr('indexCell');
        if (indexCell < _this.maxIndexCellEditable) {
            if (indexCell) _this.selectCell(indexCell);
            _this.getContentRef('.cell_' + indexRow + '_' + colIndex).focus();
        }
        else {
            if (this.isNewRecordVisible()) {
                if (indexCell <= _this.maxIndexCell) {
                    if (indexCell) _this.selectCell(indexCell);
                    _this.getContentRef('.cell_' + indexRow + '_' + colIndex).focus();
                }
            }
        }
    }
    this.goUp = function () {
        var indexRow = _this.getContentRef('.cell_' + _this.indexCellSelected).parent().attr('indexRow');
        var colIndex = _this.getContentRef('.cell_' + _this.indexCellSelected).attr('colIndex');
        indexRow--;
        var indexCell = _this.getContentRef('.cell_' + indexRow + '_' + colIndex).attr('indexCell');
        if (indexCell) _this.selectCell(indexCell);
        _this.getContentRef('.cell_' + indexRow + '_' + colIndex).focus();
    }
    this.goLeft = function () {
        var indexCell = _this.indexCellSelected;
        if (indexCell > 0) {
            indexCell--;
            _this.selectCell(indexCell);
            _this.getContentRef('.cell_' + indexCell).focus();
        }
    }
    this.goRight = function () {
        var indexCell = _this.indexCellSelected;
        if (_this.indexCellSelected < _this.maxIndexCellEditable - 1) {
            //this is previous to newRow record.
            indexCell++;
            _this.selectCell(indexCell);
            _this.getContentRef('.cell_' + indexCell).focus();
        }
        else {
            if (_this.isNewRecordVisible()) {
                //this is the latest row (new record)
                indexCell++;
                if (indexCell < _this.maxIndexCell) {
                    _this.selectCell(indexCell);
                    var oCell = _this.getContentRef('.cell_' + indexCell);
                    oCell.focus();
                    var widthBody = _this.getContentRef('.gridBody')[0].clientWidth;
                    var cellPos = oCell[0].offsetLeft + oCell[0].clientWidth;
                    if ((widthBody - cellPos) < 20) {
                        _this.getContentRef('.gridBody').scrollLeft(200); //fixed scroll.
                    }
                } else {
                    //save current and create a new record
                    _this.newRecord();
                }
            }
        }
    }
    this.selectCell = function (newCellSelection, forceDataUpdate, bSynch) {
        var oCell = _this.getContentRef('.cell_' + _this.indexCellSelected);
        if (oCell.length > 0) {
            var indexRow = $(oCell).parent().attr('indexRow');
            var colId = $(oCell).attr('colId');
            var colIndex = $(oCell).attr('colIndex');
            if ((_this.indexCellSelected != newCellSelection) || (forceDataUpdate)) {
                var oRow = null;

                if ((_this.currentData) && (indexRow < _this.currentData.length)) {
                    oRow = _this.currentData[indexRow];
                }
                else {
                    oRow = _this.newDataRow;
                }
                var value = '';
                if (oRow)
                    if (oRow[colId] != null) value = oRow[colId];
                //apply lost focus in cell
                var oCtrl = $(oCell).children()[0];
                if (this.config.columns[colIndex]) {
                    switch (this.config.columns[colIndex].editorType) {
                        case 'listbox':
                            if ($(oCtrl).hasClass('edit_listbox')) {
                                var newValue = $(oCtrl).val();
                                var newName = $(oCtrl).find('option:selected').text();
                                $(oCtrl).remove();
                                _this.changeDataValue(oCell, indexRow, colId, newValue);
                                _this.changeDataValue(oCell, indexRow, _this.config.columns[colIndex].labelField, newName);
                                $(oCell).html(_this.getCellHtml(colIndex, oRow));

                            }
                            break;
                        case 'calendar':
                            if ($(oCtrl).hasClass('edit_calendar')) {
                                var newValue = $(oCtrl).val();
                                $(oCtrl).remove();
                                _this.changeDataValue(oCell, indexRow, colId, newValue);
                                $(oCell).html(_this.getCellHtml(colIndex, oRow));
                            }
                            break;
                        case 'textarea':
                        case 'textbox':
                            if ($(oCtrl).hasClass('edit_text')) {
                                var newValue = $(oCtrl).val();
                                $(oCtrl).remove();
                                _this.getContentRef().focus();
                                _this.changeDataValue(oCell, indexRow, colId, newValue);
                                $(oCell).html(_this.getCellHtml(colIndex, oRow));
                            }
                            break;

                    }
                }
            }
        }
        var previousIndexRow = $(oCell).parent().attr('indexRow');
        var newIndexRow = _this.getContentRef('.cell_' + newCellSelection).parent().attr('indexRow');
        //if (newIndexRow) {
        if (previousIndexRow != newIndexRow) {
            if (_this.currentData != null) {
                if (previousIndexRow <= _this.currentData.length) {
                    if (previousIndexRow)
                        _this.saveRowToServer(previousIndexRow, null, bSynch);
                }
                _this.getContentRef('.rowSelected').removeClass('rowSelected');

                _this.getContentRef('.gridBodyStatic').find('.indexRow_' + newIndexRow).find('.firstcolumn').addClass('rowSelected');
            }
        }
        //}
        _this.getContentRef('.cellSelected').removeClass('cellSelected');
        _this.indexCellSelected = newCellSelection;
        _this.getContentRef('.cell_' + newCellSelection).addClass('cellSelected');
        _this.getContentRef('.cell_' + newCellSelection).select();

    };
    this.cmdEdit = function (oCell, event) {
        var colId = $(oCell).attr('colId');
        if (colId) {
            var indexRow = $(oCell).parent().attr('indexRow');
            var colIndex = $(oCell).attr('colIndex');
            if (_this.config.columns[colIndex].editable) {
                var oRow = null;
                var editEnabled = true;
                if (indexRow < _this.currentData.length) {
                    if (_this.config.allowUpdate) {
                        oRow = _this.currentData[indexRow];
                    } else {
                        editEnabled = false;
                    }
                }
                else {
                    oRow = _this.newDataRow;
                }
                if (editEnabled) {
                    var renderEditControl = true;
                    if (_this.events.beforeRenderEditableCell)
                        renderEditControl = _this.events.beforeRenderEditableCell(_this.config.columns[colIndex].id, oRow);
                    if (renderEditControl) {

                        var value = '';
                        if (oRow)
                            if (oRow[colId] != null) value = oRow[colId];
                        switch (this.config.columns[colIndex].editorType) {
                            case 'listbox':
                                $(oCell).html('<select class="edit_listbox" style="width:' + this.config.columns[colIndex].width + 'px;"/>');
                                var olistCtrl = $(oCell).children();
                                var oCol = _this.config.columns[colIndex];
                                var labelField = colId;
                                if (oCol.labelField != '') labelField = oCol.labelField;
                                var requestDataToServer = false;
                                if (oCol.dataList == null) { requestDataToServer = true; }
                                else { if (oCol.dataList.length == 0) { requestDataToServer = true; } }
                                if (!requestDataToServer) {
                                    var data = oCol.dataList;
                                    var strOptions = '';
                                    for (var i = 0; i < data.length; i++) {
                                        var record = data[i];
                                        var selected = '';
                                        if (value == record[colId]) { selected = 'selected'; }
                                        else { if ((value == '') && (i == 0)) selected = 'selected'; }
                                        var valueLabel = record[colId];
                                        if (record[labelField]) valueLabel = record[labelField];
                                        strOptions += '<option ' + selected + ' value="' + record[colId] + '">' + valueLabel + '</option>';
                                        if (selected == 'selected') oRow[colId] = record[colId];
                                    }
                                    $(olistCtrl).append(strOptions);
                                }
                                else {
                                    var pars = {};
                                    if (oRow) pars = oRow;
                                    pars['__colId__'] = colId;
                                    _this.serverCall('getColumnDataSelect', pars,
                                        function (data, oResponse) {
                                            try {
                                                if (data) {
                                                    var strOptions = '';
                                                    for (var i = 0; i < data.length; i++) {
                                                        var record = data[i];
                                                        var selected = '';
                                                        if (value == record[colId]) { selected = 'selected'; }
                                                        else { if ((value == '') && (i == 0)) selected = 'selected'; }

                                                        var valueLabel = record[colId];
                                                        if (record[labelField]) valueLabel = record[labelField];
                                                        strOptions += '<option ' + selected + ' value="' + record[colId] + '">' + valueLabel + '</option>';
                                                        if (selected == 'selected') oRow[colId] = record[colId];
                                                    }
                                                    $(olistCtrl).append(strOptions);
                                                    if (oCol.dataSelectCacheOnClient) oCol.dataList = data;
                                                }
                                            } catch (ex) {
                                                _this.errorDisplay(-1, ex);
                                            }
                                        },
                                        function (oResponse) {
                                            _this.errorDisplay(-1, oResponse.error.description);
                                        },
                                        false);
                                }
                                $(olistCtrl).focus();
                                $(olistCtrl).select();
                                _this._alignBodies();
                                $(olistCtrl).click(function (event) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                });
                                $(olistCtrl).keydown(function (event) {
                                    if (event.altKey == false) {
                                        switch (event.which) {
                                            case 9:
                                            case 13:
                                                if (event.which == 13) _this.goRight();
                                                if (event.which == 9) _this.goRight();
                                                _this.getContentRef().focus();
                                                event.preventDefault();
                                                break;
                                            case 27:
                                                $(event.target).remove();
                                                $(oCell).html(_this.getCellHtml(colIndex, oRow));
                                                _this.getContentRef().focus();
                                                event.preventDefault();
                                                break;
                                        }
                                    }
                                    event.stopPropagation();
                                });
                                break;
                            case 'calendar':
                                $(oCell).html('<input type="text" value="' + value + '" class="edit_calendar"/>');
                                var oTextCtrl = $(oCell).children();
                                var format = 'mm/dd/yy';
                                if (_this.config.columns[colIndex].format)
                                    if (_this.config.columns[colIndex].format != '')
                                        format = _this.config.columns[colIndex].format;
                                format = format.replace('yyyy', 'yy').toLowerCase();
                                $(oTextCtrl).datepicker({
                                    dateFormat: format,
                                    changeYear: true,
                                    autoHide: true,
                                    yearRange: "c-100:c+1",
                                    onSelect: function () {
                                        var newValue = $(this).val();
                                        _this.changeDataValue(oCell, indexRow, colId, newValue);
                                    }
                                });
                                $(oTextCtrl).focus();
                                $(oTextCtrl).select();
                                _this._alignBodies();
                                $(oTextCtrl).click(function (event) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                });

                                $(oTextCtrl).keydown(function (event) {
                                    switch (event.which) {
                                        case 13:
                                        case 40: ///down
                                        case 38: //up
                                        case 9:
                                            var newValue = $(event.target).val();
                                            if (event.which == 40) _this.goDown();
                                            if (event.which == 38) _this.goUp();
                                            if (event.which == 13) _this.goRight();
                                            if (event.which == 9) _this.goRight();
                                            _this.getContentRef().focus();
                                            event.preventDefault();
                                            break;
                                        case 27:
                                            $(event.target).remove();
                                            $(oCell).html(_this.getCellHtml(colIndex, oRow));
                                            _this.getContentRef().focus();
                                            event.preventDefault();
                                            break;
                                    }
                                    event.stopPropagation();
                                });
                                if (event) {
                                    if (_this.textChars.indexOf(event.char) >= 0) {
                                        var e = jQuery.Event("keypress");
                                        e.key = event.key;
                                        e.keyCode = event.keyCode;
                                        e.char = event.char;
                                        e.charCode = event.charCode;
                                        e.wich = event.wich;
                                        $(oCell).children().trigger(e);
                                    }
                                }
                                break;
                            case 'textarea':
                                var indexCell = _this.indexCellSelected;
                                _this.editTextArea(oCell, colIndex, colId, indexRow, value, oRow, indexCell);
                                break;
                            case 'textbox':
                                var sHtml = '';
                                var oTextCtrl = null;
                                var sSize = '';
                                if (_this.config.columns[colIndex].size > 0)
                                    sSize = ' maxlength="' + _this.config.columns[colIndex].size + '" ';
                                sHtml = '<input type="text" ' + sSize + ' value="' + value + '" class="edit_text"/>';
                                $(oCell).html(sHtml);
                                oTextCtrl = $(oCell).children();
                                $(oTextCtrl).focus();
                                $(oTextCtrl).select();
                                _this._alignBodies();
                                $(oTextCtrl).click(function (event) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                });
                                $(oTextCtrl).keydown(function (event) {
                                    switch (event.which) {
                                        case 13:
                                        case 40: ///down
                                        case 38: //up
                                        case 9:
                                            if (event.which == 40) _this.goDown();
                                            if (event.which == 38) _this.goUp();
                                            if (event.which == 13) _this.goRight();
                                            if (event.which == 9) _this.goRight();
                                            _this.getContentRef().focus();
                                            event.preventDefault();
                                            break;
                                        case 27:
                                            $(event.target).remove();
                                            $(oCell).html(_this.getCellHtml(colIndex, oRow));
                                            _this.getContentRef().focus();
                                            event.preventDefault();
                                            break;
                                    }
                                    event.stopPropagation();
                                });
                                $(oTextCtrl).blur(function (event) {
                                    var indexCell = _this.indexCellSelected;
                                    _this.selectCell(indexCell, true);
                                });

                                if (event) {
                                    if (_this.textChars.indexOf(event.char) >= 0) {
                                        var e = jQuery.Event("keypress");
                                        e.key = event.key;
                                        e.keyCode = event.keyCode;
                                        e.char = event.char;
                                        e.charCode = event.charCode;
                                        e.wich = event.wich;
                                        $(oCell).children().trigger(e);
                                    }
                                }
                                break;
                            case 'checkbox':
                                if (event) {
                                    if (((event.type == 'click') && ($(event.target).hasClass('checkClickableZone'))) || (event.which == 13) || (event.which == 32)) {
                                        if (_this.config.columns[colIndex].editable) {
                                            var oCheckbox = _this.getContentRef('.cell_' + _this.indexCellSelected).find('.edit_checkbox');
                                            var value = $(oCheckbox).hasClass('cellChecked');
                                            value = !value;
                                            _this.changeDataValue(oCell, indexRow, colId, value);
                                            if (value) {
                                                $(oCheckbox).removeClass('cellUnChecked')
                                                $(oCheckbox).addClass('cellChecked')
                                            } else {
                                                $(oCheckbox).removeClass('cellChecked')
                                                $(oCheckbox).addClass('cellUnChecked')
                                            }
                                            event.preventDefault();
                                        }
                                    }
                                }
                                break;
                        }
                        if (_this.events.afterRenderEditableCell)
                            _this.events.afterRenderEditableCell();
                        return true;
                    }
                }
            }
        }
        return false;//it's not editable
    }

    this._alignBodies = function () {
        if (_this.config.fixedColumns > 0) {
            // Fix body scroll when a new record will be added with fixed columns.
            var bodyStaticTopScroll = _this.getContentRef(".gridBodyStatic").scrollTop();
            var oBody = _this.getContentRef(".gridBody");
            var bodyTopScroll = oBody.scrollTop();
            if (bodyTopScroll != bodyStaticTopScroll)
                oBody.scrollTop(bodyStaticTopScroll);
        }
    }

    this.editTextArea = function (oCell, colIndex, colId, indexRow, value, oRow, indexCell) {
        var h = 150;
        var t = $(oCell).position().top;
        var w = _this.config.columns[colIndex].width;
        var l = (oCell).offset().left;
        if (t + h > _this.getContentRef().height())
            t = _this.getContentRef().height() - h - 10;

        if (l + w > _this.getContentRef().width())
            l = _this.getContentRef().width() - w - 10;

        var winContent = this.windowCreate({
            parent: null
            , id: 'editTextArea'
            , title: ''
            , left: l
            , right: null
            , top: t
            , bottom: null
            , width: w
            , height: h
            , dontCloseOnClickOutside: null
        });


        //null, 'editTextArea', '', l, null, t, null, w, h);

        $(winContent).append('<textarea class="edit_textarea" style="position:absolute;left:0px;top:0px;width:100%;height:100%;">'
            + value + '</textarea>');
        //$(winContent).append('<div class="setButton" style=" right:0px; bottom:0px;">' + _this.lang.set + '<div>');

        _this.getContentRef('.edit_textarea').focus();

        _this.getContentRef('.edit_textarea').select();
        _this._alignBodies();
        _this.getContentRef('.coverGridArea').click(function () { _this.windowRemove('editTextArea'); });

        _this.getContentRef('.edit_textarea').keydown(function (event) {
            if (event.altKey == false) {
                switch (event.which) {
                    case 13:
                        var newValue = _this.getContentRef('.edit_textarea').val();
                        _this.windowRemove('editTextArea');

                        _this.changeDataValue(oCell, indexRow, colId, newValue);
                        $(oCell).html(_this.getCellHtml(colIndex, oRow));
                        setTimeout(function () {
                            _this.getContentRef().focus();
                            _this.selectCell(indexCell, true);
                            _this.getContentRef('.cell_' + indexRow + '_' + colIndex).focus();
                        }, 100);
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    case 27:
                        _this.windowRemove('editTextArea');
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                }
            }
        });
        _this.getContentRef('.setButton').click(function (evt) {
            var newValue = _this.getContentRef('.edit_textarea').val();
            _this.windowRemove('editTextArea');

            _this.changeDataValue(oCell, indexRow, colId, newValue);
            $(oCell).html(_this.getCellHtml(colIndex, oRow));

            _this.getContentRef().focus();
            _this.selectCell(indexCell, true);
            _this.getContentRef('.cell_' + indexRow + '_' + colIndex).focus();
            evt.preventDefault();
            evt.stopPropagation();


        });
    }

    this.changeDataValue = function (oCell, indexRow, colId, newValue) {
        var oRow = null;
        var isNewRecord = false;
        var newIndexRow = _this.getContentRef('.cell_' + _this.indexCellSelected).parent().attr('indexRow');
        if (indexRow < _this.currentData.length) {
            oRow = _this.currentData[indexRow];
        } else {
            oRow = _this.newDataRow;
            isNewRecord = true;
        }
        var bchanged = false;
        if (oRow) {
            if (oRow[colId] != newValue) {
                if (!((oRow[colId] == null) && (newValue == ''))) {
                    oRow[colId] = newValue;
                    oRow['___IsChanged__'] = true;
                    if (_this.events.afterCellChange) _this.events.afterCellChange(indexRow, colId, oRow);
                    _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.editingIcon').show();
                    if (!isNewRecord) {
                        _this.checkLostFocus();
                    }

                }
            }
        }
    }
    this.deleteRecord = function (evt) {
        var indexRow = $(evt.target).parent().parent().attr('indexRow');
        if (indexRow != undefined) {
            if (_this.config.saveMultipleRows) {
                _this.getContentRef('.indexRow_' + indexRow).hide();
                oRow = _this.currentData[indexRow];
                oRow['___IsRemovedRow__'] = true;
                this.evaluateSaveRecordsButton();
            } else {
                _this._savingRow = true;
                _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.saving').show();
                oRow = _this.currentData[indexRow];
                _this.serverCall('deleteData', oRow,
                    function (data) {
                        try {
                            setTimeout(function () {
                                _this.loadData(_this.currentPage, '', '');
                            }, 1000);
                            _this._savingRow = false;
                        } catch (ex) {
                            _this._savingRow = false;
                            _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.saving').hide();
                            _this.errorDisplay(-1, ex);
                        }
                    },
                    function (oResponse) {
                        _this._savingRow = false;
                        _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.saving').hide();
                        _this.errorDisplay(-1, oResponse.error.description);
                    },
                    false);
            }
        }
    }
    this.duplicateRecord = function (evt) {
        var indexRow = $(evt.target).parent().parent().attr('indexRow');
        if (indexRow != undefined) {
            if (_this.config.saveMultipleRows) {
                _this.getContentRef('.indexRow_' + indexRow).hide();
                oRow = JSON.parse(JSON.stringify(_this.currentData[indexRow]));
                oRow['___IsNewRow__'] = true;
                oRow['___IsChanged__'] = true;
                for (var i = 0; i < _this.config.columns.length; i++) {
                    var oCol = _this.config.columns[i];
                    if (!oCol.duplicable)
                        oRow[oCol.id] = null;
                }
                _this.currentData[_this.currentData.length] = oRow;
                _this.setData(_this.currentData, _this.recordTotalCount + 1, _this.currentPage, _this.currentOrder);
                this.evaluateSaveRecordsButton();
            } else {
                _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.saving').show();
                oRow = JSON.parse(JSON.stringify(_this.currentData[indexRow]));
                oRow['___IsNewRow__'] = true;
                oRow['___IsChanged__'] = true;
                for (var i = 0; i < _this.config.columns.length; i++) {
                    var oCol = _this.config.columns[i];
                    if (!oCol.duplicable)
                        oRow[oCol.id] = null;
                }
                _this.currentData[_this.currentData.length] = oRow;
                _this.setData(_this.currentData, _this.recordTotalCount + 1, _this.currentPage, _this.currentOrder);
                _this.saveRowToServer(_this.currentData.length - 1, function () {
                }, false, true);
            }
        }
    }

    this.editRecord = function (indexRow) {
        if (indexRow != undefined) {
            if (indexRow < _this.currentData.length) {
                oRow = _this.currentData[indexRow];
            } else {
                oRow = _this.newDataRow;
            }
            if (_this.objMyEdit == null) _this.objMyEdit = new clsMyEdit(_this.events, this);
            _this.objMyEdit.open(_this, oRow,
                function (rowUpdated) {
                    if (indexRow < _this.currentData.length) {
                        $.extend(_this.currentData[indexRow], rowUpdated);
                    } else {
                        if (_this.newDataRow == null) _this.newDataRow = {};
                        $.extend(_this.newDataRow, rowUpdated);
                    }
                    _this.saveRowToServer(indexRow, function () {
                        _this.objMyEdit.close();
                    });
                }
            );
        }
    }
    this.saveRowToServer = function (indexRow, fCallBack, synchronized, duplicatedRow) {
        var bSynch = false;
        if (synchronized) bSynch = true;
        if (indexRow != undefined) {
            _this._savingRow = true;
            var oRow = null;
            var isNew = false;
            if (indexRow < _this.currentData.length) {
                oRow = _this.currentData[indexRow];
                if (!_this.config.saveMultipleRows)
                    if (oRow['___IsNewRow__'] == null)
                        oRow['___IsNewRow__'] = false;
            } else {
                if (_this.newDataRow != null) {
                    oRow = _this.newDataRow;
                    oRow['___IsNewRow__'] = true;
                    isNew = true;
                }
            }
            if (_this.config.viewType != 'form') {
                if (!_this.config.saveMultipleRows)
                    _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.editingIcon').hide();
            }
            if (oRow != null) {
                if (oRow['___IsChanged__']) {

                    if (_this.config.saveMultipleRows) {
                        if (_this.config.viewType != 'form') {
                            _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.saving').hide();
                            _this.newDataRow = {};
                            for (var i = 0; i < _this.config.columns.length; i++) {
                                var oCol = _this.config.columns[i];
                                _this.newDataRow[oCol.id] = null;
                            }
                            if (isNew) {
                                _this.currentData[_this.currentData.length] = oRow;
                                _this.setData(_this.currentData, _this.recordTotalCount + 1, _this.currentPage, _this.currentOrder);
                                _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.editingIcon').show();
                            }
                            else {
                                _this.currentData[indexRow] = oRow;
                                for (var i = 0; i < _this.config.columns.length; i++) {
                                    var oCol = _this.config.columns[i];
                                    if (oCol.visible) {
                                        _this.getContentRef('.cell_' + indexRow + '_' + i).html(_this.getCellHtml(i, _this.currentData[indexRow]));
                                    }
                                }
                            }
                        }
                        if (fCallBack) fCallBack();
                        _this.refreshCellTotalHtml();
                        this.evaluateSaveRecordsButton();

                        _this._savingRow = false;
                    } else {
                        if (_this.events.beforeSaveRecord) _this.events.beforeSaveRecord(indexRow, oRow);
                        if (_this.config.viewType != 'form') {
                            _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.saving').show();
                        }
                        _this.serverCall('saveData', oRow,
                            function (data) {
                                try {
                                    if (data) {
                                        oRow['___IsChanged__'] = false;
                                        if (_this.config.viewType != 'form') {
                                            _this.getContentRef('.indexRow_' + indexRow).find('.firstcolumn').find('.saving').hide();
                                            _this.newDataRow = {};
                                            if (duplicatedRow) {
                                                _this.currentData[indexRow] = data[0];
                                                for (var i = 0; i < _this.config.columns.length; i++) {
                                                    var oCol = _this.config.columns[i];
                                                    if (oCol.visible) {
                                                        _this.getContentRef('.cell_' + indexRow + '_' + i).html(_this.getCellHtml(i, _this.currentData[indexRow]));
                                                    }
                                                }
                                            } else {
                                                if (oRow['___IsNewRow__']) {
                                                    _this.getContentRef('.indexRow_' + _this.currentData.length).hide();
                                                    _this.currentData[_this.currentData.length] = data[0];
                                                    _this.setData(_this.currentData, _this.recordTotalCount + 1, _this.currentPage, _this.currentOrder);
                                                }
                                                else {
                                                    _this.currentData[indexRow] = data[0];
                                                    for (var i = 0; i < _this.config.columns.length; i++) {
                                                        var oCol = _this.config.columns[i];
                                                        if (oCol.visible) {
                                                            _this.getContentRef('.cell_' + indexRow + '_' + i).html(_this.getCellHtml(i, _this.currentData[indexRow]));
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if (fCallBack) fCallBack();
                                        if (_this.events.afterSaveRecord) _this.events.afterSaveRecord(indexRow, oRow);
                                        if (_this.config.refreshGridAfterSaveRecord) _this.refreshData();

                                        // Update Totals 
                                        _this.refreshCellTotalHtml();
                                    }
                                    _this._savingRow = false;
                                } catch (ex) {
                                    _this._savingRow = false;
                                    _this.errorDisplay(-1, ex);
                                }
                            },
                            function (oResponse) {
                                _this._savingRow = false;
                                _this.errorDisplay(-1, oResponse.error.description);
                            },
                            bSynch);
                    }
                } else {
                    _this._savingRow = false;
                }
            } else {
                _this._savingRow = false;
            }
        }
    }
    this.getCellHtml = function (colIndex, oRow) {
        var oCol = this.config.columns[colIndex];
        var classes = '';
        if (!oCol.editable) classes = ' disabled';
        switch (this.config.columns[colIndex].editorType) {
            case 'calendar':
                var data = '&nbsp;';
                if (oRow)
                    if (oRow[oCol.id] != undefined)
                        if (oRow[oCol.id] != null)
                            data = oRow[oCol.id];
                if (oCol.format != '') {
                    if ($.isNumeric(data)) {
                        data = this.numberFormatter.format(oCol.format, data);
                    }
                }

                return '<div class="data ' + classes + '" style="text-align:' + oCol.align + '">' + oCol.labelPrefix + data + oCol.labelSuffix + '</div>';
                break;
            case 'textarearemovehtml':
                var data = '&nbsp;';
                if (oRow)
                    if (oRow[oCol.id] != undefined)
                        if (oRow[oCol.id] != null)
                            data = $(`<p>${oRow[oCol.id]}</p>`).text();

                return '<div class="data ' + classes + '" style="text-align:' + oCol.align + '">' + oCol.labelPrefix + data + oCol.labelSuffix + '</div>';
                break;
            case 'textbox':
            case 'textarea':
                var data = '&nbsp;';
                if (oRow)
                    if (oRow[oCol.id] != undefined)
                        if (oRow[oCol.id] != null)
                            data = oRow[oCol.id];
                if (oCol.format != '') {
                    if ($.isNumeric(data)) {
                        data = this.numberFormatter.format(oCol.format, data);
                    }
                }

                return '<div class="data ' + classes + '" style="text-align:' + oCol.align + '">' + oCol.labelPrefix + data + oCol.labelSuffix + '</div>';
                break;
            case 'html':
                var data = '&nbsp;';
                if (oRow)
                    if (oRow[oCol.id] != undefined)
                        if (oRow[oCol.id] != null)
                            data = oRow[oCol.id];
                // Check if the user has defined a custom formatter for the HTML cell
                if (_this.events.onCustomHTMLCellRendering) {
                    let transformedData = _this.events.onCustomHTMLCellRendering(data, oCol, oRow);
                    if (transformedData) {
                        return '<div class="data ' + classes + '" style="text-align:' + oCol.align + '">' + transformedData + '</div>';
                    }
                }
                return '<div class="data ' + classes + '" style="text-align:' + oCol.align + '">' + data + '</div>';
                break;

            case 'checkbox':
                var cellClass = 'cellUnChecked';
                if (oRow)
                    if (oRow[oCol.id] != undefined)
                        if (oRow[oCol.id] != null)
                            if (oRow[oCol.id]) cellClass = 'cellChecked"';
                return '<div class="data ' + classes + '" style="text-align:' + oCol.align + '">' +
                    '<div class="edit_checkbox ' + cellClass + '" style="text-align:center;"><span class="checkClickableZone"></span></div>' +
                    '</div>';
                break;
            case 'listbox':
                var data = '&nbsp;';
                if (oRow)
                    if (oRow[oCol.labelField] != undefined)
                        if (oRow[oCol.labelField] != null)
                            data = oRow[oCol.labelField];
                return '<div class="data ' + classes + '" style="text-align:' + oCol.align + '">' + data + '</div>';
                break;
        }

    }
    this.getCellTotalHtml = function (colIndex, mode) {
        var oCol = this.config.columns[colIndex];
        var v = 0;
        for (var j = 0; j < _this.currentData.length; j++) {
            var oRow = _this.currentData[j];
            if (oRow[oCol.id] != undefined)
                if (oRow[oCol.id] != null)
                    v += parseFloat(oRow[oCol.id]);
        }

        switch (this.config.columns[colIndex].editorType) {
            case 'textbox':
                var data = v;
                if (oCol.format != '') {
                    if ($.isNumeric(v)) {
                        data = this.numberFormatter.format(oCol.format, v);
                    }
                }
                var title = 'Total for [' + oCol.label + ']';
                //return '<div class="data totalcolumns" style="text-align:' + oCol.align + '" title="' + title + '">' + oCol.labelPrefix + data + oCol.labelSuffix + '</div>';
                if (mode == 'value') {
                    return data;
                }
                return `<div class="data totalscolumn_${colIndex}_" style="text-align:${oCol.align}" title="${title}">${oCol.labelPrefix}<span id="totalscolumndata_${_this.gridUniqueId}_${colIndex}_">${data}</span>${oCol.labelSuffix}</div>`;
                break;
        }
        return '';
    }
    this.refreshCellTotalHtml = function () {
        for (var i = 0; i < _this.config.columns.length; i++) {
            var oCol = _this.config.columns[i];
            if (oCol.visible) {
                var valTot = '';
                if (oCol.totalize) {
                    valTot = _this.getCellTotalHtml(i, 'value');
                }
                let htmlTotalsElem = _this.getContentRef(`#totalscolumndata_${_this.gridUniqueId}_${i}_`);
                $(htmlTotalsElem).text(valTot);
            }
        }
    }
    this.setData = function (data, recordTotalCount, currentPage, currentOrder) {
        _this.currentData = data;
        _this.recordTotalCount = recordTotalCount;
        _this.currentPage = currentPage;
        _this.currentOrder = currentOrder;
        if (_this.config.viewType.toLowerCase() == 'form') {
            _this.setDataForm(data, recordTotalCount, currentPage, currentOrder);
        } else {
            _this.setDataGrid(data, recordTotalCount, currentPage, currentOrder);
        }
        _this.evaluateSaveRecordsButton();
    }
    this.setDataForm = function (data, recordTotalCount, currentPage, currentOrder) {
        _this.editRecord(0);
    }
    this.setDataGrid = function (data, recordTotalCount, currentPage, currentOrder) {
        _this.getContentRef('.gridFooter .currentPage').text('');
        /*pages toolbar*/
        _this.pagesCount = Math.ceil(_this.recordTotalCount / _this.config.pageSize);

        _this.resizePagination();

        _this.getContentRef('.goPreviousPage').attr('title', this.lang.gotoPrevious.replace('%1', _this.config.pageSize));
        _this.getContentRef('.goNextPage').attr('title', this.lang.gotoNext.replace('%1', _this.config.pageSize));
        _this.getContentRef('.goFirstPage').attr('title', this.lang.gotoFirst.replace('%1', _this.config.pageSize));
        _this.getContentRef('.goLastPage').attr('title', this.lang.gotoLast.replace('%1', _this.config.pageSize));
        var indexCell = 0;
        var indexCellEditable = 0;
        var strRowStatic = '';
        var strRow = '';
        var iconDelete = '';
        if (_this.config.allowDelete)
            iconDelete = '<i class="fa fa-trash deleteIcon rowIcon" aria-hidden="true" title="' + this.lang.deleteRecord + '"></i>';
        var iconEditMyEdit = '';
        if (this.config.templateEdit)
            if (this.config.templateEdit != '')
                iconEditMyEdit = '<i class="fa fa-list-alt editIcon rowIcon" aria-hidden="true" title="' + this.lang.editRecord + '"></i>';
        var alt = '';
        var display = '';
        var cellHtml = '';

        //calculate aprox max with
        var maxWidthStatic = _this.firstColWidth;
        var maxWidth = 0;
        var hasSomeFilter = false;
        _this.getContentRef('.clearfilter_icon').hide();
        _this.config.hasTotalRow = false;
        for (var i = 0; i < _this.config.columns.length; i++) {
            var oCol = _this.config.columns[i];
            if (oCol.visible) {
                if (i < _this.config.fixedColumns) {
                    maxWidthStatic += oCol.width + 3;
                } else {
                    maxWidth += oCol.width;// + 3;
                }
                if (oCol.defaultFilter != '' || oCol.filterText != '') {
                    let headerRef = _this.getContentRef('.colIndex_' + i + '.headerCol');
                    headerRef.attr('title', 'Filtering by: ' + oCol.filterText);
                    headerRef.find('.clearfilter_icon').show();
                    headerRef.css('background-color', 'rgba(255, 0, 0, 0.1)');
                    let label = headerRef.find('label');
                    label.text(label.text() + ' (filtered)');
                    hasSomeFilter = true;
                } else {
                    let headerRef = _this.getContentRef('.colIndex_' + i + '.headerCol');
                    headerRef.attr('title', '');
                    headerRef.css('background-color', '');
                    let label = headerRef.find('label');
                    label.text(oCol.label);
                }
                if (oCol.totalize)
                    _this.config.hasTotalRow = true;
            }
        }
        if (hasSomeFilter) {
            _this.getContentRef('.cmdClearFilters').show();
            _this.hasClearFiltersButton = true;
            offsetClearFilter = $('.cmdClearFilters')[0].clientWidth;
            _this.getContentRef('.gridCustomButtons').css('margin-left', '0px');
            if (_this.hasNewRecordButton) {
                _this.getContentRef('.cmdNewRecord').css('margin-left', '0px');
            }
            if (_this.hasSaveRecordsButton) {
                _this.getContentRef('.cmdSaveRecords').css('margin-left', '0px');
                _this.getContentRef('.cmdSaveRecordsCancel').css('margin-left', '0px');
            }
        } else {
            if (_this.hasClearFiltersButton) {
                $('.cmdClearFilters').hide();

                if (_this.hasNewRecordButton) {
                    _this.getContentRef('.cmdNewRecord').css('margin-left', '100px');
                    _this.getContentRef('.gridCustomButtons').css('margin-left', '0px');
                }
                else { _this.getContentRef('.gridCustomButtons').css('margin-left', '100px') }
                _this.hasClearFiltersButton = false;
                _this.refreshOffsets();
                _this.resizeButtonsTitle();
            }
        }
        var duplicable = '';
        if (_this.config.duplicateRows)
            duplicable = '<i class="fa fa-clone duplicateIcon rowIcon" aria-hidden="true" title="' + this.lang.duplicateRecord + '"></i>';

        if (_this.currentData != null) {
            var strMultipleSelectionDefault = '';
            if (_this.config.defaultMultipleSelection == true) strMultipleSelectionDefault = ' checked ';
            for (var j = 0; j <= _this.currentData.length; j++) {
                var oRow = null;
                if (j < data.length) oRow = data[j];
                var editing = false;
                if (oRow != null)
                    if (oRow['___IsChanged__']) editing = true;
                var removed = false;
                if (oRow != null)
                    if (oRow['___IsRemovedRow__']) removed = true;
                alt = '';
                display = '';
                if (j % 2 == 0) alt = ' alternate';
                if (j == data.length) display = 'display:none;';
                if (removed) display = 'display:none;';
                strRow += '<div indexRow="' + j + '" class="gridRow ' + alt + ' indexRow_' + j + '" style="' + display + '; width: ' + (maxWidth - 3) + 'px;overflow:hidden;">';
                strRowStatic += '<div indexRow="' + j + '" class="gridRow ' + alt + ' indexRow_' + j + '" style="' + display + '; width:' + maxWidthStatic + 'px;">'
                    + '<div class="cell firstcolumn" style="width:' + _this.firstColWidth + 'px;">';
                strRowStatic += duplicable;
                strRowStatic += iconDelete;
                strRowStatic += iconEditMyEdit;
                if (_this.config.buttons) {
                    for (var i = 0; i < _this.config.buttons.length; i++) {
                        var oButton = _this.config.buttons[i];
                        if (!oButton.multiselect)
                            strRowStatic += '<i class="fa ' + oButton.icon + ' rowIcon customButton fa-1x" title="' + oButton.title + '" indexButton="' + i + '" aria-hidden="true"></i>';
                    }
                }
                if (editing) {
                    strRowStatic += '<i class="fa fa-pencil-square-o editingIcon rowIcon" style="" title="Save record" aria-hidden="true"></i>';
                } else {
                    strRowStatic += '<i class="fa fa-pencil-square-o editingIcon rowIcon" style="display:none;" title="Save record" aria-hidden="true"></i>';
                }
                strRowStatic += '<i class="fa fa-spinner fa-pulse fa-fw saving rowIcon" style="display:none;" aria-hidden="true"></i>';

                if (_this.config.allowMultipleSelection)
                    if (j < _this.currentData.length)
                        strRowStatic += '<div class="areaRowSelector"><input type="checkbox" ' + strMultipleSelectionDefault + ' class="rowSelector indexRow_' + j + '"/></div>';
                strRowStatic += '</div>';
                for (var i = 0; i < _this.config.columns.length; i++) {
                    var oCol = _this.config.columns[i];
                    if (oCol.visible) {
                        var strStyle = 'middlecolumn';
                        if (i == _this.config.columns.length - 1) strStyle = 'lastcolumn';
                        var title = '';
                        cellHtml = '<div indexCell="' + indexCell + '" colIndex="' + i + '" colId="' + oCol.id + '" class="colIndex_' + i + ' cell_' + j + '_' + i + ' cell_' + indexCell
                            + ' cell ' + strStyle + '" style="width:' + oCol.width + 'px;" title="' + title + '">' + _this.getCellHtml(i, oRow) + '</div>';
                        if (i < _this.config.fixedColumns) {
                            strRowStatic += cellHtml;
                        } else {
                            strRow += cellHtml;
                        }
                        indexCell++;
                        if (j < data.length) indexCellEditable++;
                    }
                }
                strRowStatic += '</div>';
                strRow += '</div>';
            }
        }

        if (_this.config.hasTotalRow) {
            if (j < data.length) oRow = data[j];
            var strGranTotalRow = '<div class="gridRow grandTotal" style="width: ' + maxWidth + 'px;overflow:hidden;">';
            var strGranTotalRowStatic = '<div class="gridRow grandTotal" style="width:' + maxWidthStatic + 'px;">'
                + '<div class="cell firstcolumn" style="width:' + _this.firstColWidth + 'px;"></div>';
            for (var i = 0; i < _this.config.columns.length; i++) {
                var oCol = _this.config.columns[i];
                if (oCol.visible) {
                    var strStyle = 'middlecolumn';
                    if (i == _this.config.columns.length - 1) strStyle = 'lastcolumn';
                    var valTot = '';
                    if (oCol.totalize) {
                        valTot = _this.getCellTotalHtml(i, 'html');
                    }
                    cellHtml = '<div colIndex="' + i + '" colId="' + oCol.id + '" class="colIndex_' + i + ' cell ' + strStyle + '" style="width:' + oCol.width + 'px;">' + valTot + '</div>';
                    if (i < _this.config.fixedColumns) {
                        strGranTotalRowStatic += cellHtml;
                    } else {
                        strGranTotalRow += cellHtml;
                    }
                    indexCell++;
                }
            }
            strGranTotalRowStatic += '</div>';
            strGranTotalRow += '</div>';
            _this.getContentRef('.gridHeader').append(strGranTotalRow);
            //_this.getContentRef('.gridHeaderStatic').append(strGranTotalRowStatic);
            this.adjustheight();
        }

        //add new row in static body. this fixes scroll issue in textarea edition in last row
        strRowStatic += '<div style="height:500px;">&nbsp;</div>';
        _this.getContentRef('.gridBodyStatic').html(strRowStatic);
        //reducer flash:
        _this.getContentRef(".gridBody").css('left', maxWidthStatic + 'px');
        _this.getContentRef('.gridBody').html(strRow);
        _this.maxIndexCell = indexCell;
        _this.maxIndexCellEditable = indexCellEditable;
        setTimeout(function () {
            _this.redrawWidthColumns();
            _this.resizeBody();
            if (_this.config.allowMultipleSelection) {
                if (_this.getContentRef('.rowSelector:checked').length > 0) {
                    _this.getContentRef('.multiselectButton').removeClass('btn-disabled');
                    _this.getContentRef('.multiselectButton').removeAttr('disabled');
                } else {
                    _this.getContentRef('.multiselectButton').addClass('btn-disabled');
                    _this.getContentRef('.multiselectButton').attr('disabled', 'disabled');
                }
            }
            _this.enableTopButtonAlwaysEnabled();
        }, 1);

        //Show column order.
        if (currentOrder != "") {
            var colId = currentOrder.split(' ')[0]
            var orderType = currentOrder.split(' ')[1];
            if (colId && orderType) {
                colId = colId.toUpperCase();
                orderType = orderType.toUpperCase();
                $.each($('.headerCol'), function (i, val) {
                    if (colId == $(val).attr('colId')) {
                        /*if (orderType) {
                            if (orderType == "ASC") {
                                orderType = 'DESC';
                            } else {
                                orderType = 'ASC';
                            }
                        }
                        else {
                            orderType = 'ASC';
                        }*/
                        _this.getContentRef('.headerCol').attr('orderType', ''); //reset all headers for next time
                        _this.getContentRef('.headerCol .sort_icon').hide();
                        _this.getContentRef('.headerCol .sort_icon').removeClass('fa-sort-alpha-asc');
                        _this.getContentRef('.headerCol .sort_icon').removeClass('fa-sort-alpha-desc');

                        $(val).attr('orderType', orderType);
                        $(val).find('.sort_icon').show();
                        if (orderType == 'ASC') {
                            $(val).find('.sort_icon').addClass('fa-sort-alpha-asc');
                        } else {
                            $(val).find('.sort_icon').addClass('fa-sort-alpha-desc');
                        }
                    }
                })
            }

        }

        if (_this.events.multiSelectionChange) _this.events.multiSelectionChange(_this.getRowsSelected());
    }
    this.sessionId = '';
    this.enableTopButtonAlwaysEnabled = function () {
        if (_this.config.buttons) {
            for (var i = 0; i < _this.config.buttons.length; i++) {
                var oButton = _this.config.buttons[i];
                if (oButton.multiselect) {
                    if (oButton.alwaysenabled) {
                        var btn = _this.getContentRef('.multiselectButton[indexButton=' + i + ']');
                        $(btn).removeClass('btn-disabled');
                        $(btn).removeAttr('disabled');
                    }
                }
            }
        }
    }
    this.export = function () {
        let params = {
            gridName: _this.gridName,
            sessionId: this.sessionId,
            strDataParameters: JSON.stringify(_this.dataParameters),
        }

        let paramsStr = Object.keys(params).filter(k => params[k] !== null && params[k] !== '').map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
        window.location = `/datagrid/cmdExport?${paramsStr}`;
        return false;
    }
    this.refresh = function () {
        _this.loadData(0, '', '');
    }
    this.fullScreenValues = {
        active: false,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    };
    this.fullScreenToggle = function () {
        // Get the container of this grid
        let container = this.target;

        if (_this.fullScreenValues.active === false) {
            // Save current container fixed CSS position properties
            _this.fullScreenValues.top = $(container).css('top');
            _this.fullScreenValues.right = $(container).css('right');
            _this.fullScreenValues.bottom = $(container).css('bottom');
            _this.fullScreenValues.left = $(container).css('left');
            _this.fullScreenValues.position = $(container).css('position');
            _this.fullScreenValues.height = $(container).css('height');
            _this.fullScreenValues.index = $(container).css('z-index');
            _this.fullScreenValues.windowHeight = $(window).height();
            _this.fullScreenValues.windowWidth = $(window).width();

            //console.log(_this.fullScreenValues.top, _this.fullScreenValues.right, _this.fullScreenValues.bottom, _this.fullScreenValues.left);
            // Set the new expanded positions
            $(container).css('position', 'absolute');
            $(container).css('height', '100vh');
            $(container).css('z-index', 9999);
            $(container).css('top', 0);
            $(container).css('right', 0);
            $(container).css('bottom', 0);
            $(container).css('left', 0);
            window.scrollTo(0, 0);
            document.body.style.overflowY = "hidden";
        }
        else {
            $(container).css('top', _this.fullScreenValues.top);
            $(container).css('right', _this.fullScreenValues.right);
            $(container).css('bottom', _this.fullScreenValues.bottom);
            $(container).css('left', _this.fullScreenValues.left);
            $(container).css('position', _this.fullScreenValues.position);
            $(container).css('height', _this.fullScreenValues.height);
            $(container).css('z-index', _this.fullScreenValues.index);
            document.body.style.overflowY = "visible";
        }

        _this.fullScreenValues.active = !_this.fullScreenValues.active;
        _this.refreshScreen();
    }
    this.serverCall = function (method, parameters, onSuccess, onFail, bSync, pdataParameters) {

        var additionalParameters = _this.dataParameters;
        if (pdataParameters != undefined)
            additionalParameters = pdataParameters;
        if (offLineFunction) {
            var oResponse = offLineFunction(method, parameters, additionalParameters);
            try {
                if (oResponse.success) {
                    onSuccess(oResponse.data, oResponse);
                }
                else {
                    onFail(oResponse);
                }
            } catch (ex) {
                _this.errorDisplay(-1, '[serverCall]' + ex);
            }
        } else {
            var b = true;
            if (bSync) b = false;
            if (this.sessionId == '') this.sessionId = (new Date).getTime();
            //var url = 'griddata.aspx/' + method;
            //var data = JSON.stringify({ RequestParameters: { gridName: _this.gridName, sessionId: this.sessionId, parameters: parameters, dataParameters: additionalParameters } });
            var url = '/datagrid/' + method;
            //var url = 'datagrid.aspx/execute'
            //var data = JSON.stringify({ RequestParameters: { method: method, gridName: _this.gridName, sessionId: this.sessionId, parameters: parameters, dataParameters: additionalParameters } });
            //var data = JSON.stringify({ gridName: _this.gridName, sessionId: this.sessionId, parameters: parameters, dataParameters: additionalParameters });
            var jqxhr = $.ajax({
                type: 'POST',
                async: b,
                url: url,
                //data: JSON.stringify({ RequestParameters: { gridName: _this.gridName, sessionId: this.sessionId, parameters: parameters, dataParameters: additionalParameters } }),
                data: {
                    gridName: _this.gridName, sessionId: this.sessionId,
                    strParameters: JSON.stringify(parameters),
                    strDataParameters: JSON.stringify(additionalParameters),
                    parameters: parameters,
                    dataParameters: additionalParameters
                }
                //,contentType: "application/json; charset=utf-8",
                //dataType: "json"
                /*data: {
                    gridName: _this.gridName, sessionId: this.sessionId,
                    parameters: parameters, dataParameters: additionalParameters
                }*/
            }).done(function (oPar) {
                if (_this.closing) return;  //don't do anything, the grid is closing
                //var oResponse = oPar.d;
                var oResponse = oPar;

                try {
                    if (oResponse.success) {
                        onSuccess(oResponse.data, oResponse);
                    }
                    else {
                        onFail(oResponse);
                    }
                } catch (ex) {
                    _this.errorDisplay(-1, '[serverCall]' + ex);
                }
            })
                .fail(function (strResponse) {
                    if (strResponse.statusText)
                        if (strResponse.statusText == 'abort')
                            return;
                    _this.errorDisplay(-1, 'Invalid Response: ' + strResponse);
                });
            return jqxhr;
        }
        return null;
    }
    this.errorDisplay = function (ErrNumber, ErrMessage) {
        console.trace();
        console.log(ErrMessage);
        alert('Error :' + ErrMessage);
    }
    this.loadConfig = function (gridName) {
        _this.serverCall('getConfig', {},
            function (configParam) {
                try {
                    $.extend(_this.config, configParam);

                    if (_this.events.beforeRenderGrid) _this.events.beforeRenderGrid(_this.config);

                    _this.init();
                    if (_this.autoDataLoad)
                        _this.loadData(0, '', '');
                } catch (ex) {
                    _this.errorDisplay(-1, ex);
                }
            },
            function (oResponse) {
                _this.errorDisplay(-1, oResponse.error.description);
            },
            false);
    }
    this.setDataParameters = function (dataParameters) {
        _this.dataParameters = dataParameters;
        _this.loadData(0, '', '');
    }
    this.loadData = function (indexPage, orderBy, orderType) {
        displaySpinner(true);
        _this.previousData = null;
        _this.serverCall('getData', {
            currentPage: indexPage, currentOrder: _this.currentOrder,
            pageSize: _this.config.pageSize,
            orderBy: orderBy, orderType: orderType
        },
            function (data, oResponse) {
                try {
                    _this.previousData = JSON.parse(JSON.stringify(data));
                    if ((data.length == 0) && (oResponse.currentPage > 0)) {
                        //load previous page
                        setTimeout(function () { _this.loadData(oResponse.currentPage - 1, '', ''); }, 100);
                    }
                    else {
                        _this.setData(data, oResponse.recordTotalCount, oResponse.currentPage, oResponse.orderBy);
                    }
                } catch (ex) {
                    _this.errorDisplay(-1, ex);
                }
                displaySpinner(false);
            },
            function (oResponse) {
                _this.errorDisplay(-1, oResponse.error.description);
                displaySpinner(false);
            },
            false);
    }
    function displaySpinner(display) {
        if (display) {
            _this.getContentRef('.gridFooter .currentPageLoading').show();
            var oParent = _this.getContentRef();
            var pos = $(oParent).position();
            var l = $(oParent).width() / 2;
            var t = $(oParent).height() / 2;
            $(oParent).append('<div class="coverGridArea spinnerCover"><i class="fa fa-spinner fa-pulse fa-fw loading" aria-hidden="true" style="font-size:40px;left:' + l + 'px;top:' + t + 'px;"></i></div>');
        } else {
            _this.getContentRef('.gridFooter .currentPageLoading').hide();
            _this.getContentRef('.spinnerCover').remove();
        }
    }
    var filterRequestAjax = null;
    var filterModel = null;


    this.avoidApostrophes = function (str) {
        if (str && str.replace) return str.replace(/"/g, '&quot;');
        return str;
    }
    var isInputFilterWithValue = false;
    var lastValueRequested = '';
    this.showFilterWindow = function (event) {
        var colIndex = $(event.target).parent().attr('colIndex');
        if (!colIndex) colIndex = $(event.target).parent().parent().attr('colIndex');
        var oCol = _this.config.columns[colIndex];
        var left = 0;
        //if (oCol.left) left = oCol.left;
        var oParent = null;
        //if (colIndex >= this.config.fixedColumns)
        //    left += _this.getContentRef('.gridBodyStatic').width() - _this.getContentRef(".gridHeader").scrollLeft();
        var width = oCol.width;
        if (width < 150) width = 150;
        left = event.clientX - 5 - width;
        if ($(event.target).closest('.headerCol').length > 0) {
            left = $(event.target).closest('.headerCol').offset().left - _this.getContentRef().position().left;
            //width = $(event.target).closest('.headerCol').width();
        }
        if (left + width > _this.getContentRef().outerWidth()) left = _this.getContentRef().outerWidth() - width;
        var top = _this.getContentRef(".gridTable").position().top + _this.getContentRef(".gridBody").position().top;
        var winContent = this.windowCreate({
            parent: oParent
            , id: 'filterPopUp'
            , title: 'Filter'
            , left: left
            , right: null
            , top: top
            , bottom: 10
            , width: width
            , height: null
            , dontCloseOnClickOutside: null
        });


        //oParent, 'filterPopUp', 'Filter', left, null, top, 10, width, null);
        _this.getContentRef('.coverGridArea').click(function () { _this.windowRemove('filterPopUp'); });
        /*$(winContent).append('<input class="filterText" type="text" style="position:absolute;margin:3px;width:' + (width - 20) + 'px; top:2px;;height:25px;" placeholder="Search..."/>');*/
        $(winContent).append('<input class="filterText form-control" type="text" placeholder="Search..."/>');


        /*$(winContent).append('<div class="" style="left:0px;right:0px;top:35px;bottom:35px;border-top:solid 1px #c0c0c0;border-bottom:solid 1px #c0c0c0;position:absolute;overflow-x:auto;"><ul class="list" style="margin: 0; padding: 0; width: 100%; "></ul></div>');
        $(winContent).append('<input class="applyFilter" type="button" value="'+this.lang.applyFilter+'">');*/
        $(winContent).append('<div class="filter-wrapper"><ul class="list" style="margin: 0; padding: 0; width: 100%; "></ul></div>');
        $(winContent).append('<input class="applyFilter btn btn-primary btn-block" type="button" value="' + this.lang.applyFilter + '">');
        $(winContent).find('.filterText').focus();
        $(winContent).find('.filterText').attr('previousValue', oCol.filterText);
        $(winContent).find('.filterText').val(oCol.filterText);
        $(winContent).find('.filterText').select();
        $(winContent).find('.filterText').keydown(function (event) {
            switch (event.which) {
                case 13:
                    $(winContent).find('.applyFilter').click();
                    return false;
                    break;
            }
        });
        isInputFilterWithValue = (oCol.filterText.length > 0) ? true : false;
        $(winContent).find('.filterText').on('input', function () {
            var value = $(this).val();
            if (value != $(this).attr('previousValue')) {
                isInputFilterWithValue = (value.length > 0) ? true : false;
                try {
                    if (filterRequestAjax != null) filterRequestAjax.abort();
                } catch (e) { }
                lastValueRequested = value;
                filterRequestAjax = _this.serverCall('getFilterData', { id: oCol.id, value: value },
                    function (data, oResponse) {
                        try {
                            lastValueRequested = '';
                            //fill options list
                            var oList = $(winContent).find('.list');
                            $(oList).html('');
                            var strFilter = '';
                            if (data.length > 0)
                                strFilter += '<li><input class="filterAll" type="checkbox" value="" checked/>All filtered</li>';
                            if (data) {
                                for (var i = 0; i < data.length; i++) {
                                    var oRow = data[i];
                                    var label = oCol.id;
                                    if (oCol.labelField != '') label = oCol.labelField;
                                    if (oRow['DESCRIPTION'] != undefined) label = 'DESCRIPTION';
                                    strFilter += '<li><input class="filterOption" type="checkbox" value="' + _this.avoidApostrophes(oRow[oCol.id]) + '" checked/>' + oRow[label] + '</li>';
                                }
                            }

                            $(oList).append(strFilter);
                        } catch (ex) {
                            _this.errorDisplay(-1, ex);
                        }
                        $(winContent).find('.filterOption').click(function () {
                            var bAllChecked = true;
                            $(winContent).find('.filterOption').each(function () {
                                if (!$(this)[0].checked) bAllChecked = false;
                            });
                            $(winContent).find('.filterAll')[0].checked = bAllChecked;
                        });
                        $(winContent).find('.filterAll').click(function () {
                            var bAllChecked = $(winContent).find('.filterAll')[0].checked;
                            $(winContent).find('.filterOption').each(function () {
                                $(this)[0].checked = bAllChecked;
                            });
                        });
                        $(winContent).find('.filterText').attr('previousValue', value);
                    },
                    function (oResponse) {
                        _this.errorDisplay(-1, oResponse.error.description);
                    },
                    false);
            }
        });
        lastValueRequested = oCol.filterText;
        filterRequestAjax = _this.serverCall('getFilterData', { id: oCol.id, value: oCol.filterText },
            function (data, oResponse) {
                try {
                    lastValueRequested = '';
                    //fill options list
                    var oList = $(winContent).find('.list');
                    $(oList).html('');
                    var strFilter = '<li><input class="filterAll" type="checkbox" value=""/>All filtered</li>';
                    if (data) {
                        for (var i = 0; i < data.length; i++) {
                            var oRow = data[i];
                            var label = oCol.id;
                            if (oCol.labelField != '') label = oCol.labelField;
                            if (oRow['DESCRIPTION'] != undefined) label = 'DESCRIPTION';
                            var checked = '';
                            if (oCol.defaultFilter == '') {
                                checked = 'checked';
                            }
                            else {
                                if (('|' + oCol.defaultFilter + '|').indexOf('|' + oRow[oCol.id] + '|') >= 0)
                                    checked = 'checked';
                            }
                            strFilter += '<li><input class="filterOption" type="checkbox" value="' + _this.avoidApostrophes(oRow[oCol.id]) + '" ' + checked + ' />' + oRow[label] + '</li>';
                        }
                    }

                    $(oList).append(strFilter);
                } catch (ex) {
                    _this.errorDisplay(-1, ex);
                }
                $(winContent).find('.filterOption').click(function () {
                    var bAllChecked = true;
                    $(winContent).find('.filterOption').each(function () {
                        if (!$(this)[0].checked) bAllChecked = false;
                    });
                    $(winContent).find('.filterAll')[0].checked = bAllChecked;
                });
                $(winContent).find('.filterAll').click(function () {
                    var bAllChecked = $(winContent).find('.filterAll')[0].checked;
                    $(winContent).find('.filterOption').each(function () {
                        $(this)[0].checked = bAllChecked;
                    });
                });
                var bAllChecked = true;
                $(winContent).find('.filterOption').each(function () {
                    if (!$(this)[0].checked) bAllChecked = false;
                });
                $(winContent).find('.filterAll')[0].checked = bAllChecked;
            },
            function (oResponse) {
                _this.errorDisplay(-1, oResponse.error.description);
            },
            false);

        $(winContent).find('.applyFilter').click(function () {
            var filterText = $(winContent).find('.filterText').val();
            oCol.filterText = filterText;
            var selected = '';
            var $checked = $(winContent).find(':checked');
            var cantOptions = $(winContent).find('.list').children().length;
            if (filterText == "") {
                if ($checked.length == cantOptions) {
                    _this.clearFilterImpl(oCol);
                    _this.windowRemove('filterPopUp');
                    return;
                }
            }
            $checked.each(function () {
                selected += $(this).val() + '|';
            });
            if (isInputFilterWithValue) {
                if (filterRequestAjax) filterRequestAjax.abort();
            }
            if (oCol.filterText != "" && lastValueRequested == oCol.filterText) {
                oCol.defaultFilter = '';
            } else {
                oCol.defaultFilter = selected;
            }

            _this.serverCall('applyFilter', { id: oCol.id, values: oCol.defaultFilter, filterText: oCol.filterText },
                function (data) {
                    try {
                        $('.cmdClearFilters').show();

                        _this.getContentRef('.cmdNewRecord').css('margin-left', '0px');
                        _this.getContentRef('.cmdSaveRecords').css('margin-left', '0px');
                        _this.getContentRef('.cmdSaveRecordsCancel').css('margin-left', '0px');
                        _this.getContentRef('.gridCustomButtons').css('margin-left', '0px');
                        _this.hasClearFiltersButton = true;
                        _this.refreshOffsets();
                        _this.resizeButtonsTitle();
                        _this.windowRemove('filterPopUp');
                        _this.loadData(0, '', '');
                    } catch (ex) {
                        _this.errorDisplay(-1, ex);
                    }
                },
                function (oResponse) {
                    _this.errorDisplay(-1, oResponse.error.description);
                },
                false);

        });

    }
    this.refreshData = function () { _this.loadData(0, '', ''); }
    this.clearFilter = function (event) {
        var colIndex = $(event.target).parent().attr('colIndex');
        if (!colIndex) colIndex = $(event.target).parent().parent().attr('colIndex');
        var oCol = _this.config.columns[colIndex];
        oCol.filterText = '';
        oCol.defaultFilter = '';
        _this.serverCall('applyFilter', { id: oCol.id, values: '', filterText: '' },
            function (data) {
                try {
                    _this.loadData(0, '', '');
                } catch (ex) {
                    _this.errorDisplay(-1, ex);
                }
            },
            function (oResponse) {
                _this.errorDisplay(-1, oResponse.error.description);
            },
            false);
    }

    this.clearFilterImpl = function (oCol) {
        oCol.filterText = '';
        oCol.defaultFilter = '';
        _this.serverCall('applyFilter', { id: oCol.id, values: '', filterText: '' },
            function (data) {
                try {
                    _this.loadData(0, '', '');
                } catch (ex) {
                    _this.errorDisplay(-1, ex);
                }
            },
            function (oResponse) {
                _this.errorDisplay(-1, oResponse.error.description);
            },
            false);
    }

    this.clearFilters = function () {
        for (var i = 0; i < _this.config.columns.length; i++) {
            _this.config.columns[i].filterText = '';
            _this.config.columns[i].defaultFilter = '';
        }
        _this.serverCall('clearFilters', {},
            function (data) {
                try {
                    _this.loadData(0, '', '');
                } catch (ex) {
                    _this.errorDisplay(-1, ex);
                }
            },
            function (oResponse) {
                _this.errorDisplay(-1, oResponse.error.description);
            },
            false);
    }
    this.editConfig = function () {
        var winContent = this.windowCreate({
            parent: null
            , id: 'editConfig'
            , title: _this.lang.columnSettings
            , left: null
            , right: 10
            , top: 0
            , bottom: 10
            , width: 600
            , height: null
            , dontCloseOnClickOutside: null
        });


        //null, 'editConfig', _this.lang.columnSettings, null, 10, 0, 10, 600, null);

        var htmlHidden = '<div class="dropable _Hidden sortablebox">'
            + '<ul class="sortable list Hidden">';
        var htmlStatic = '<div class="dropable _Static sortablebox">'
            + '<ul class="sortable list Static">';
        var htmlScrollable = '<div class="dropable _Scrollable sortablebox">'
            + '<ul class="sortable list Scrollable">';
        for (var i = 0; i < _this.config.columns.length; i++) {
            var oCol = _this.config.columns[i];
            if (oCol.customizable) {
                if (!oCol.visible) {
                    htmlHidden += '<li class="listItem" colIndex="' + i + '" colId="' + oCol.id + '">' + oCol.label + '</li>';
                }
                else {
                    if (i < _this.config.fixedColumns) {
                        htmlStatic += '<li class="listItem" colIndex="' + i + '" colId="' + oCol.id + '">' + oCol.label + '</li>';
                    }
                    else {
                        htmlScrollable += '<li class="listItem" colIndex="' + i + '" colId="' + oCol.id + '">' + oCol.label + '</li>';
                    }
                }
            }
        }
        htmlHidden += '</ul></div>';
        htmlStatic += '</ul></div>';
        htmlScrollable += '</ul></div>';




        var wrapperDiv = '<div class="row">';
        wrapperDiv += ('<div class="col-12 col-sm-4 mbtm"><label>' + _this.lang.hiddenColumns + htmlHidden + '<label></div>');
        wrapperDiv += ('<div class="col-12 col-sm-4"><label>' + _this.lang.visibleStaticColumns + htmlStatic + '<label></div>');
        wrapperDiv += ('<div class="col-12 col-sm-4"><label>' + _this.lang.visibleScrollableColumns + htmlScrollable + '<label></div>');
        wrapperDiv += '</div>';

        $(winContent).append($(wrapperDiv));

        $(winContent).append('<div class="row"><div class="col-12 text-right"><hr style="margin-top: 0px;" /><div class="saveButton btn btn-primary">' + _this.lang.saveChanges + '<div></div></div>');



        _this.getContentRef(".sortable").sortable();
        _this.getContentRef(".dropable").droppable({
            accept: function (d) {
                if ($(this).hasClass('_Hidden'))
                    if (d.parent().hasClass("Static") || (d.parent().hasClass("Scrollable"))) {
                        return true;
                    }
                if ($(this).hasClass('_Static'))
                    if (d.parent().hasClass("Hidden") || (d.parent().hasClass("Scrollable"))) {
                        return true;
                    }
                if ($(this).hasClass('_Scrollable'))
                    if (d.parent().hasClass("Hidden") || (d.parent().hasClass("Static"))) {
                        return true;
                    }
                return false;
            },
            drop: function (event, ui) {
                var oSrc = $(ui.draggable);
                var colIndex = $(oSrc).attr('colIndex');
                var oCol = _this.config.columns[colIndex];
                $(oSrc).remove();
                $(event.target).find('.list').append('<li colIndex="' + colIndex + '" colId="' + oCol.id + '">' + oCol.label + '</li>');
                _this.getContentRef(".sortable").sortable();
            }
        });
        _this.getContentRef('.popUpWindow.editConfig').css('min-height', '355px');
        var h = _this.getContentRef('.popUpWindow.editConfig').height();
        _this.getContentRef('.dropable.sortablebox').height(h - 120);
        $(window).resize(function () {
            var h = _this.getContentRef('.popUpWindow.editConfig').height();
            _this.getContentRef('.dropable.sortablebox').height(h - 120);
        });

        _this.getContentRef('.sortable').disableSelection();
        _this.getContentRef('.saveButton').click(function () {

            var oNewConfig = {
                columns: [],
                fixedColumns: 0
            };
            //set the new order of columns
            _this.getContentRef('.Static').children().each(function () {
                var colIndex = $(this).attr('colIndex');
                var colId = $(this).attr('colId');
                oNewConfig.columns[oNewConfig.columns.length] = colId;
                oNewConfig.fixedColumns++;
            });
            _this.getContentRef('.Scrollable').children().each(function () {
                var colIndex = $(this).attr('colIndex');
                var colId = $(this).attr('colId');
                oNewConfig.columns[oNewConfig.columns.length] = colId;
            });
            //set tthe new quantity of static columns
            _this.serverCall('saveConfig', oNewConfig,
                function (data) {
                    try {
                        setTimeout(function () {
                            _this.windowRemove('editConfig');
                            _this.loadConfig();
                        }, 1000);
                    } catch (ex) {
                        _this.errorDisplay(-1, ex);
                    }
                },
                function (oResponse) {
                    _this.errorDisplay(-1, oResponse.error.description);
                },
                false);
        });

    }

    this.pendingChanges = function () {
        if (_this.currentData != null) {
            for (var indexRow = 0; indexRow < _this.currentData.length; indexRow++) {
                var oRow = _this.currentData[indexRow];
                if ((oRow['___IsChanged__']) || (oRow['___IsRemovedRow__'])) {
                    return true;
                }
            }
        }
        return false; 
    }

    this.evaluateSaveRecordsButton = function () {
        //_this.getContentRef('.cmdSaveRecords').addClass('btn-disabled');
        _this.getContentRef('.cmdSaveRecords').hide();
        _this.getContentRef('.cmdSaveRecordsCancel').hide();
        _this.getContentRef('.headerGroupIcons').show();

        _this.getContentRef('.gridFooter').removeClass('btn-disabled');
        _this.getContentRef('.gridFooter').removeAttr('disabled');
        _this.getContentRef('.gridFooter').css({ 'opacity': '1' });

        _this.getContentRef('.gridCustomButtons').removeClass('btn-disabled');
        _this.getContentRef('.gridCustomButtons').removeAttr('disabled');
        _this.getContentRef('.gridCustomButtons').css({ 'opacity': '1' });

        _this.getContentRef('.cmdRefresh').removeClass('btn-disabled');
        _this.getContentRef('.cmdRefresh').removeAttr('disabled');
        _this.getContentRef('.cmdRefresh').css({ 'opacity': '1' });

        for (var indexRow = 0; indexRow < _this.currentData.length; indexRow++) {
            var oRow = _this.currentData[indexRow];
            if ((oRow['___IsChanged__']) || (oRow['___IsRemovedRow__'])) {
                //_this.getContentRef('.cmdSaveRecords').removeClass('btn-disabled');
                _this.getContentRef('.cmdSaveRecords').show();
                _this.getContentRef('.cmdSaveRecordsCancel').show();
                _this.getContentRef('.headerGroupIcons').hide();
                _this.getContentRef('.gridFooter').addClass('btn-disabled');
                _this.getContentRef('.gridFooter').attr('disabled', 'disabled');
                _this.getContentRef('.gridFooter').css({ 'opacity': '0.3' });

                _this.getContentRef('.gridCustomButtons').addClass('btn-disabled');
                _this.getContentRef('.gridCustomButtons').attr('disabled', 'disabled');
                _this.getContentRef('.gridCustomButtons').css({ 'opacity': '0.3' });

                _this.getContentRef('.cmdRefresh').addClass('btn-disabled');
                _this.getContentRef('.cmdRefresh').attr('disabled', 'disabled');
                _this.getContentRef('.cmdRefresh').css({ 'opacity': '0.3' });

                return;
            }
        }
    }


    _this.indexRowToSave = 0;
    this.cancelSaveMultipleRecords = function () {
        _this.currentData = JSON.parse(JSON.stringify(_this.previousData));
        _this.setData(_this.currentData, _this.recordTotalCount
            , _this.currentPage, _this.currentOrder);
        //_this.refresh();
        _this.evaluateSaveRecordsButton();
    }
    this.saveMultipleRecords = function () {
        if (_this.newDataRow)
            if (_this.newDataRow.___IsChanged__) {
                newRecordCreated = true;
                _this.saveRowToServer(_this.currentData.length, function () {
                    //_this.createNewRecord();
                });
            }
        _this.confirm("Confirm", "Do you want to Save changes?", [
            {
                label: 'Yes',
                callBack: function () {
                    _this.indexRowToSave = 0;
                    var winContent = _this.windowCreate({
                        parent: null
                        , id: 'saveMultipleStatus'
                        , title: _this.lang.savingRecords
                        , left: 10
                        , right: null
                        , top: 10
                        , bottom: null
                        , width: 600
                        , height: 170
                        , dontCloseOnClickOutside: true
                        , closeButton: false
                    });
                    $(winContent).append('<br/><div class="myProgress"><div class="myBar"></div></div>');
                    setTimeout(function () { _this.saveMuliIndexRecord(); }, 10);
                    _this.evaluateSaveRecordsButton();
                }
            },
            { label: 'No', callBack: function () { } }
        ]);
    }
    this.evaluateNextSaving = function () {
        var bExit = false;
        while (!bExit) {
            if (_this.indexRowToSave >= _this.currentData.length) {
                bExit = true;
            } else {
                var oRow = _this.currentData[_this.indexRowToSave];
                if ((oRow['___IsRemovedRow__']) || (oRow['___IsChanged__'])) {
                    bExit = true;
                }
            }
            if (!bExit) _this.indexRowToSave++;
        }
        if (_this.indexRowToSave < _this.currentData.length) {
            setTimeout(function () { _this.saveMuliIndexRecord(); }, 10);
        } else {
            //_this.getContentRef('.cmdCloseRecordsSaveStatus').show();
            //_this.getContentRef('.popupTitle').html(_this.lang.savingRecordsCompleted);
            _this.windowRemove('saveMultipleStatus');
            _this.evaluateSaveRecordsButton();
            var bRefresh = _this.config.refreshGridAfterSaveRecord;
            if (!bRefresh) {
                //if there was removed rows, we need to refresh
                for (var i = 0; i < _this.currentData.length; i++) {
                    oRow = _this.currentData[i];
                    if (oRow['___IsRemovedRow__']) {
                        bRefresh = true;
                        break;
                    }
                }
            }
            if (bRefresh) _this.refreshData();
        }
    }
    this.saveMuliIndexRecord = function () {
        var bSynch = false;
        var oRow = _this.currentData[_this.indexRowToSave];
        if (oRow['___IsRemovedRow__']) {
            _this.serverCall('deleteData', oRow,
                function (data) {
                    oRow = _this.currentData[_this.indexRowToSave];
                    _this.indexRowToSave++;
                    $('.myBar').css({ width: ((_this.indexRowToSave) * (100 / _this.currentData.length)) + '%' });
                    _this.evaluateNextSaving();
                },
                function (oResponse) {
                    _this.indexRowToSave++;
                    $('.myBar').css({ width: ((_this.indexRowToSave) * (100 / _this.currentData.length)) + '%' });
                    _this.evaluateNextSaving();
                    _this.errorDisplay(-1, oResponse.error.description);
                },
                false);
        } else {
            if (oRow['___IsChanged__']) {
                _this.getContentRef('.indexRow_' + _this.indexRowToSave).find('.firstcolumn').find('.saving').show();
                if (_this.events.beforeSaveRecord) _this.events.beforeSaveRecord(_this.indexRowToSave, oRow);
                _this.serverCall('saveData', oRow,
                    function (data) {
                        _this.getContentRef('.indexRow_' + _this.indexRowToSave).find('.firstcolumn').find('.saving').hide();
                        try {
                            if (data) {
                                oRow['___IsChanged__'] = false;
                                if (_this.config.viewType != 'form') {
                                    _this.getContentRef('.indexRow_' + _this.indexRowToSave).find('.firstcolumn').find('.editingIcon').hide();
                                    _this.newDataRow = {};
                                    _this.currentData[_this.indexRowToSave] = data[0];
                                    for (var i = 0; i < _this.config.columns.length; i++) {
                                        var oCol = _this.config.columns[i];
                                        if (oCol.visible) {
                                            _this.getContentRef('.cell_' + _this.indexRowToSave + '_' + i).html(_this.getCellHtml(i, _this.currentData[_this.indexRowToSave]));
                                        }
                                    }
                                }
                                if (_this.events.afterSaveRecord) _this.events.afterSaveRecord(_this.indexRowToSave, oRow);

                            }
                        } catch (ex) {
                            _this.errorDisplay(-1, ex);
                        }
                        _this.indexRowToSave++;
                        $('.myBar').css({ width: ((_this.indexRowToSave) * (100 / _this.currentData.length)) + '%' });
                        _this.evaluateNextSaving();
                    },
                    function (oResponse) {
                        _this.indexRowToSave++;
                        $('.myBar').css({ width: ((_this.indexRowToSave) * (100 / _this.currentData.length)) + '%' });
                        _this.evaluateNextSaving();
                        _this.getContentRef('.indexRow_' + _this.indexRowToSave).find('.firstcolumn').find('.saving').hide();
                        _this.errorDisplay(-1, oResponse.error.description);
                    },
                    bSynch);
            } else {
                _this.indexRowToSave++;
                $('.myBar').css({ width: ((_this.indexRowToSave) * (100 / _this.currentData.length)) + '%' });
                _this.evaluateNextSaving();
            }
        }
    }

    this.newRecord = function () {
        var newRecordCreated = false;
        if (_this.newDataRow)
            if (_this.newDataRow.___IsChanged__) {
                newRecordCreated = true;
                _this.saveRowToServer(_this.currentData.length, function () {
                    _this.createNewRecord();
                });
            }
        if (!newRecordCreated) _this.createNewRecord();
    }
    this.createNewRecord = function () {
        _this.newDataRow = {};
        var indexFocus = -1;
        for (var i = 0; i < _this.config.columns.length; i++) {
            var oCol = _this.config.columns[i];
            _this.newDataRow[oCol.id] = null;
            if (oCol.editable) {
                _this.getContentRef('.cell_' + _this.currentData.length + '_' + i).html(_this.getCellHtml(i, _this.newDataRow));
                if (indexFocus == -1) {
                    indexFocus = i;
                }
            }
        }
        _this.newDataRow['___IsNewRow__'] = true;
        if (indexFocus >= 0) {
            setTimeout(function () {
                var popupEdit = false;
                if (_this.config.templateEdit)
                    if (_this.config.templateEdit != '') {
                        popupEdit = true;
                        _this.editRecord(_this.currentData.length);
                    }
                if (!popupEdit) {
                    _this.getContentRef('.indexRow_' + _this.currentData.length).show();
                    var oCell = _this.getContentRef('.cell_' + _this.currentData.length + '_' + indexFocus);
                    var indexCell = $(oCell).attr('indexCell');
                    _this.selectCell(indexCell);
                    _this.cmdEdit($(oCell));
                }
            }, 10);
        }
        if (_this.events.afterCreatedNewRecord) _this.events.afterCreatedNewRecord(_this.newDataRow);
    }
    this.isNewRecordVisible = function () {
        return (this.getContentRef('.indexRow_' + this.currentData.length + ':visible').length > 0);
    }

    this.confirm = function (title, message, buttons) {
        var winContent = this.windowCreate({
            parent: null
            , id: 'confirm'
            , title: title
            , left: 10
            , right: null
            , top: 10
            , bottom: null
            , width: 600
            , height: 170
            , dontCloseOnClickOutside: true
            , closeButton: false
        });
        var content = '<br/><div class="message">' + message + '</div><br/>';
        $(winContent).append(content);
        for (var i = 0; i < buttons.length; i++) {
            content = '<span class="genericButton ml-0 mr-2 cmdButtonConfirm' + i + '">' + buttons[i].label + '</span>'

            $(winContent).append(content);
            $('.cmdButtonConfirm' + i).click({ index: i }, function (event) {
                var index = event.data.index;
                if (buttons[index].callBack) setTimeout(function (f) { f.callBack(); }, 1, buttons[index]);
                _this.windowRemove('confirm');
            });
        }
    }
    this.windowCreate = function (config)//parent, id, title, left, right, top, bottom, width, height, dontCloseOnClickOutside) 
    {
        var p = {
            parent: null,
            id: null,
            title: null,
            left: null,
            right: null,
            top: null,
            bottom: null,
            width: null,
            height: null,
            dontCloseOnClickOutside: null,
            closeButton: null
        };

        $.extend(p, config);
        if (p.dontCloseOnClickOutside == null) p.dontCloseOnClickOutside = false;
        if (p.closeButton == null) p.closeButton = true;
        var style = '';
        if (p.left != null) style += 'left:' + p.left + 'px;';
        if (p.right != null) style += 'right:' + p.right + 'px;';
        if (p.top != null) style += 'top:' + p.top + 'px;';
        if (p.bottom != null) style += 'bottom:' + p.bottom + 'px;';
        if (p.width != null) style += 'width:' + p.width + 'px;';
        if (p.height != null) style += 'height:' + p.height + 'px;';
        var oParent = _this.getContentRef();
        if (p.parent != null) oParent = p.parent;
        var sTitle = '';
        if (p.title != '') sTitle = '<span>' + p.title + '</span>';
        $(oParent).append('<div class="coverGridArea ' + p.id + '"></div><div originalLeft="' + p.left + '" tabindex="-1" role="dialog" class="popUpWindow ' + p.id + '"><div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content"><div class="modal-body">'
            + sTitle
            + (p.closeButton ? '<div class="winCloseButton"><i class="fa fa-times"></i></div>' : '')
            + '<div class="popUpContent"></div>'
            + '</div></div></div></div>');

        if (p.dontCloseOnClickOutside) {

        }
        else {
            _this.getContentRef('.winCloseButton').click(function () {
                _this.windowRemove(p.id);
            });
            _this.getContentRef('.coverGridArea.' + p.id).click(function () {
                _this.windowRemove(p.id);
            });
        }
        return (_this.getContentRef('.' + p.id).find('.popUpContent'));
    }
    this.windowRemove = function (id) {
        this.getContentRef('.' + id).remove();
        this.getContentRef('.' + id).remove();
    }
    setTimeout(function () { _this.loadConfig(); }, 10);
    this.hasClearFiltersButton = false;
};



var clsMyEdit = function (events, clsMyGrid) {
    var _this = this;
    var _clsMyGrid = clsMyGrid;
    this._winId = '';
    this.templateEdit = ''
        + '<div class="modal fade" role="dialog" id="##ID##">'
        + '     <div class="modal-dialog" style="##STYLE##">'
        + '         <div class="modal-content">'
        + '             <div class="modal-header">'
        + '                 <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
        + '                 <h4 class="modal-title"></h4>'
        + '             </div>'
        + '             <div class="modal-body">##TEMPLATEEDIT##'
        + '             </div>'
        + '             <div class="modal-footer">'
        + '                <button type="button" class="btn btn-primary pull-right saveBtn">Save</button>'
        + '                <button type="button" class="btn btn-default pull-right" data-dismiss="modal">Cancel</button>'
        + '            </div>'
        + '        </div>'
        + '     </div>';
    + '</div>';
    var objEditWin = null;
    this.config = null;
    this.myGrid = null;
    this.dataRow = null;
    this.save = null;
    this.events = {
        close: null
    };
    $.extend(_this.events, events);
    this.open = function (myGrid, row, saveFunction) {
        _this.config = myGrid.config;
        _this.myGrid = myGrid;
        _this.save = saveFunction;
        _this.dataRow = {};
        $.extend(_this.dataRow, row);
        _this.create();
    }
    this.init = function () {
    }
    this.getContentRef = function (ref) {
        if (ref)
            return $('#' + _this._winId).find(ref);
        return $('#' + _this._winId);
    }
    this.create = function () {
        if (!window._winId) {
            window._winId = 1;
        } else {
            window._winId++;
        }
        _this._winId = 'editWindow_' + window._winId;
        var strHTML = _this.config.templateEdit;
        //replace all names by Uppercase of names.
        for (var i = 0; i < _this.config.columns.length; i++) {
            var oCol = _this.config.columns[i];
            strHTML = strHTML.replaceAll('name="' + oCol.id + '"', 'name="' + oCol.id + '"');
        }

        strHTML = _this.templateEdit.replace('##ID##', _this._winId).replace('##TEMPLATEEDIT##', strHTML);
        strHTML = strHTML.replace('##STYLE##', _this.config.templateEditStyle);


        $('#formsModal').append(strHTML);
        if (_this.dataRow['___IsNewRow__'] == undefined) {
            _this.getContentRef('.modal-title').text(_this.config.title);
        } else {
            if (_this.dataRow['___IsNewRow__']) {
                _this.getContentRef('.modal-title').text(_this.config.title + ' - New Record');
            } else {
                _this.getContentRef('.modal-title').text(_this.config.title + ' - Edit Record');
            }
        }
        for (var i = 0; i < _this.config.columns.length; i++) {
            var oCol = _this.config.columns[i];
            var oCell = _this.getContentRef('[name=' + oCol.id + ']');
            if ($(oCell).length > 0)
                _this.setCellHtml(i, oCell);
        }
        _this.getContentRef('.saveBtn').click(function () {
            if (_this.save) {
                _this.save(_this.dataRow);
            }
        });
        _this.getContentRef().on('hidden.bs.modal', function () {
            _this.getContentRef().remove();
            if (_this.events.close) _this.events.close();
        })
        _this.getContentRef().modal('show');
    }
    this.close = function () {
        _this.getContentRef().modal('hide');
        setTimeout(function () {
            //_this.getContentRef().remove();
        }, 10);
    }
    this.setCellHtml = function (colIndex, oCell) {
        var sHtml = '';
        var value = '';
        var oCol = _this.config.columns[colIndex];
        var colId = oCol.id;
        if (_this.dataRow[colId] != null) value = _this.dataRow[colId];
        switch (oCol.editorType) {
            case 'listbox':
                $(oCell).html('<label for="txt' + colId + '">' + oCol.label + '</label><select id="txt' + colId + '" class="form-control" >');
                var olistCtrl = $(oCell).find('.form-control');
                var labelField = colId;
                if (oCol.labelField != '') labelField = oCol.labelField;
                var requestDataToServer = false;
                if (oCol.dataList == null) { requestDataToServer = true; }
                else { if (oCol.dataList.length == 0) { requestDataToServer = true; } }
                if (!requestDataToServer) {
                    var data = oCol.dataList;
                    var strOptions = '';
                    for (var i = 0; i < data.length; i++) {
                        var record = data[i];
                        var selected = '';
                        if (value == record[colId]) { selected = 'selected'; }
                        else { if ((value == '') && (i == 0)) selected = 'selected'; }
                        var valueLabel = record[colId];
                        if (record[labelField]) valueLabel = record[labelField];
                        strOptions += '<option ' + selected + ' value="' + record[colId] + '">' + valueLabel + '</option>';
                        if (selected == 'selected') _this.dataRow[colId] = record[colId];
                    }
                    $(olistCtrl).append(strOptions);
                }
                else {
                    var pars = {};
                    if (_this.dataRow) pars = _this.dataRow;
                    pars['__colId__'] = colId;
                    _clsMyGrid.serverCall('getColumnDataSelect', pars,
                        function (data, oResponse) {
                            try {
                                if (data) {
                                    var strOptions = '';
                                    for (var i = 0; i < data.length; i++) {
                                        var record = data[i];
                                        var selected = '';
                                        if (value == record[colId]) { selected = 'selected'; }
                                        else { if ((value == '') && (i == 0)) selected = 'selected'; }
                                        var valueLabel = record[colId];
                                        if (record[labelField]) valueLabel = record[labelField];
                                        strOptions += '<option ' + selected + ' value="' + record[colId] + '">' + valueLabel + '</option>';
                                        if (selected == 'selected') _this.dataRow[colId] = record[colId];
                                    }
                                    $(olistCtrl).append(strOptions);
                                    if (oCol.dataSelectCacheOnClient) oCol.dataList = data;
                                }
                            } catch (ex) {
                                _this.errorDisplay(-1, ex);
                            }
                        },
                        function (oResponse) {
                            _this.errorDisplay(-1, oResponse.error.description);
                        },
                        false);
                }
                $(olistCtrl).change(function () {
                    var newValue = $(this).val();
                    _this.changeDataValue(colId, newValue);
                });
                $(olistCtrl).focus();
                $(olistCtrl).select();
                if (!oCol.editable)
                    $(olistCtrl).attr("disabled", "disabled");
                break;
            case 'calendar':
                $(oCell).html('<label for="txt' + colId + '">' + oCol.label + '</label><input id="txt' + colId + '" type="text" value="' + value + '"  class="form-control"/>');
                var oTextCtrl = $(oCell).find('.form-control');
                var format = 'mm/dd/yy';
                if (oCol.format)
                    if (oCol.format != '')
                        format = oCol.format;
                format = format.replace('yyyy', 'yy').toLowerCase();
                $(oTextCtrl).datepicker({
                    dateFormat: format,
                    changeYear: true,
                    autoHide: true,
                    yearRange: "c-100:c+1",
                    onSelect: function () {
                        var newValue = $(this).val();
                        _this.changeDataValue(colId, newValue);
                    }
                });
                $(oTextCtrl).focus();
                $(oTextCtrl).select();
                if (!oCol.editable)
                    $(oTextCtrl).attr("disabled", "disabled");
                break;
            case 'textbox':
                var oTextCtrl = null;
                var sSize = '';
                if (oCol.format != '') {
                    if ($.isNumeric(value)) {
                        value = this.numberFormatter.format(value, { format: oCol.format, locale: "us" });
                    }
                }

                if (oCol.size > 0)
                    sSize = ' maxlength="' + oCol.size + '" ';
                sHtml = '<label for="txt' + colId + '">' + oCol.label + '</label><input id="txt' + colId + '" type="text" ' + sSize + ' value="' + value + '" class="form-control"/>';
                $(oCell).html(sHtml);
                oTextCtrl = $(oCell).find('.form-control');
                $(oTextCtrl).change(function () {
                    var newValue = $(this).val();
                    _this.changeDataValue(colId, newValue);
                });
                $(oTextCtrl).focus();
                $(oTextCtrl).select();
                if (!oCol.editable)
                    $(oTextCtrl).attr("disabled", "disabled");
                break;
            case 'textarea':
                var oTextCtrl = null;
                sHtml = '<label for="txt' + colId + '">' + oCol.label + '</label><textarea id="txt' + colId + '" class="form-control" rows="5">' + value + '</textarea>';
                $(oCell).html(sHtml);
                oTextCtrl = $(oCell).find('.form-control');
                $(oTextCtrl).change(function () {
                    var newValue = $(this).val();
                    _this.changeDataValue(colId, newValue);
                });
                $(oTextCtrl).focus();
                $(oTextCtrl).select();
                if (!oCol.editable)
                    $(oTextCtrl).attr("disabled", "disabled");
                break;
            case 'checkbox':
                var oCtrl = null;
                var sSize = '';
                sHtml = '<label ><input type="checkbox" class="myControl"/>&nbsp;&nbsp;' + oCol.label + '</label>';
                $(oCell).html(sHtml);
                oCtrl = $(oCell).find('.myControl');
                if (value) $(oCtrl)[0].checked = true;
                $(oCtrl).click(function () {
                    var newValue = $(this)[0].checked;
                    _this.changeDataValue(colId, newValue);
                });
                if (!oCol.editable)
                    $(oCtrl).attr("disabled", "disabled");
                break;
        }
    }
    this.changeDataValue = function (colId, newValue) {
        if (_this.dataRow) {
            if (_this.dataRow[colId] != newValue) {
                if (!((_this.dataRow[colId] == null) && (newValue == ''))) {
                    _this.dataRow[colId] = newValue;
                    _this.dataRow['___IsChanged__'] = true;
                }
            }
        }
    }
    this.errorDisplay = function (ErrNumber, ErrMessage) {
        alert('Error :' + ErrMessage);
    }





}

const ServiceTRAXBindingHandlers = {
    showModal: {
        init: function (element, valueAccessor) {
            // Apply styles to Bootstrap Selectpickers
            $(element).find('.selectpicker').selectpicker();
        },
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            if (ko.utils.unwrapObservable(value)) {
                $(element).modal('show');
                // this is to focus input field inside dialog
                $("input", element).focus();
            }
            else {
                $(element).modal('hide');
            }
        }
    },


    selectPicker: {
        init: function (element, valueAccessor, allBindingsAccessor) {
            if ($(element).is('select')) {
                if (ko.isObservable(valueAccessor())) {
                    if ($(element).prop('multiple') && $.isArray(ko.utils.unwrapObservable(valueAccessor()))) {
                        // in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
                        ko.bindingHandlers.selectedOptions.init(element, valueAccessor, allBindingsAccessor);
                    } else {
                        // regular select and observable so call the default value binding
                        ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);
                    }
                }
                $(element).addClass('selectpicker').selectpicker();
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            if ($(element).is('select')) {
                var isDisabled = ko.utils.unwrapObservable(allBindingsAccessor().disable);
                if (isDisabled) {
                    // the dropdown is disabled and we need to reset it to its first option
                    $(element).selectpicker('val', $(element).children('option:last').val());
                }
                // React to options changes
                ko.unwrap(allBindingsAccessor.get('options'));
                // React to value changes
                ko.unwrap(allBindingsAccessor.get('value'));
                // Wait a tick to refresh
                setTimeout(() => { $(element).selectpicker('refresh'); }, 0);
            }
        }
    },



    trumbowyg: {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var options = allBindings().trumbowygOptions || {};
            // Create instance of Trumbowyg WYSIWYG on div.
            if (options && options.disabled === true) {
                //var wysi = $(element).trumbowyg('disable');
                var wysi = $(element).trumbowyg({
                    disabled: true,
                    svgPath: '../lib/trumbowyg/icons.svg'
                });
            } else {
                var wysi = $(element).trumbowyg({ svgPath: '../lib/trumbowyg/icons.svg' });
            }


            // Load latest value in observable into Trumbowyg instance.
            $(element).trumbowyg('html', ko.unwrap(valueAccessor()));
        },

        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

            var updates = $(element).on('tbwchange', function () {
                if (ko.isWritableObservable(valueAccessor())) {
                    valueAccessor()($(element).trumbowyg('html'));
                };
            });
        }
    },

    yesnoCheckboxValue: {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var v = ko.unwrap(valueAccessor());
            if (v === 'Y' || v === 'y') {
                $(element)[0].checked = true;
            } else {
                $(element)[0].checked = false;
            }

            var updates = $(element).change(function () {
                if (ko.isWritableObservable(valueAccessor())) {
                    if ($(element)[0].checked) {
                        valueAccessor()('Y');
                    } else {
                        valueAccessor()('N');
                    }
                };
            });

        },

        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var v = ko.unwrap(valueAccessor());
            if (v === 'Y' || v === 'y') {
                $(element)[0].checked = true;
            } else {
                $(element)[0].checked = false;
            }
        }
    },

    //yesnoCheckboxReadOnlyValue: {
    //    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    //        var v = ko.unwrap(valueAccessor());
    //        if (v === 'Y' || v === 'y') {
    //            console.log('init yesnoCheckboxValue for Y');
    //            $(element)[0].checked = true;
    //        } else {
    //            console.log('init yesnoCheckboxValue for N');
    //            $(element)[0].checked = false;
    //        }
    //    },

    //    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    //        var updates = $(element).change(function (e) {
    //            console.log('change');
    //            e.preventDefault();
    //        });
    //    }
    //}, 

    popover: {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var options = allBindingsAccessor().popoverOptions || {};
            $(element).popover(options);
        },
        update: function (element, valueAccessor) {
        }
    },


    datepicker: {
        //
        // https://fengyuanchen.github.io/datepicker/
        //
        init: function (element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().datepickerOptions || {};


            var pickerConfiguration = {
                autoHide: true
            };

            // Trigger element to open the time picker
            if (options.trigger) {
                pickerConfiguration.trigger = options.trigger;
            }

            if (options.zIndex) {
                pickerConfiguration.zIndex = options.zIndex;
            }

            //console.log('options', options);
            if (options.format) {
                pickerConfiguration.format = options.format;
            }

            //console.log('pickerConfiguration', pickerConfiguration);
            // Create the DatePicker using the configuration made with options above
            $(element).datepicker(pickerConfiguration);

            var value = ko.unwrap(valueAccessor());
            if (value) {
                $(element).datepicker('setDate', new Date(value));
            } else if (options.ifNullSetDateTo) {
                // This sets the initial calendar value to some date but the date is not actually "picked"
                $(element).datepicker('setDate', options.ifNullSetDateTo);
                $(element).datepicker('update');
                $(element).val('');
            }

            // Sets the start date of the picker, locking any date before it
            if (options.setStartDateTo) {
                $(element).datepicker('setStartDate', options.setStartDateTo());

                // Set a subscription to listen for changes on the StartDate and update setStartDate property accordingly
                options.setStartDateTo.subscribe(function () {
                    $(element).datepicker('setStartDate', options.setStartDateTo());
                });
            }

            // Sets the max date that can be selected on the picker, locking any date after it
            if (options.setEndDateTo) {
                $(element).datepicker('setEndDate', options.setEndDateTo());

                // Set a subscription to listen for changes on the EndDate and update setEndDate property accordingly
                options.setEndDateTo.subscribe(function () {
                    $(element).datepicker('setEndDate', options.setEndDateTo());
                });
            }


            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).datepicker("destroy");
            });

        },
        update: function (element, valueAccessor) {

            var funcOnSelectdate = function () {
                var observable = valueAccessor();

                var textValue = $(element).datepicker().val();

                if (textValue && textValue !== '') {
                    observable($(element).datepicker("getDate"));
                } else {
                    observable(null);
                }
            }

            //handle the field changing
            ko.utils.registerEventHandler(element, "change", funcOnSelectdate);

            //var value = ko.utils.unwrapObservable(valueAccessor());
            //if (typeof (value) === "string") { // JSON string from server
            //    value = value.split("T")[0]; // Removes time
            //}

            //var current = $(element).datepicker("getDate");

            //if (value - current !== 0) {
            //    var parsedDate = $.datepicker.parseDate('yy-mm-dd', value);
            //    $(element).datepicker("setDate", parsedDate);
            //}
        }

        /*
        init: function (element, valueAccessor, allBindingsAccessor) {
            var options = allBindingsAccessor().datepickerOptions || {},
                $el = $(element);

            options.autoclose = true;


            //initialize datepicker with some optional options
            //$el.datepicker(options);
            $el.datepicker();//.on('changeDate', function (e) { console.log('DATE CGANGED!!!!!!!!!!!!!!!!', e); });
            $(element).on('changeDate', function (e) { console.log('DATE CGANGED!!!!!!!!!!!!!!!!', e); });
            console.log($el);

            //$el.datepicker({
            //    autoclose: true
            //});

            $el.datepicker('setDate', ko.utils.unwrapObservable(valueAccessor()) );

            //handle the field changing
            //ko.utils.registerEventHandler(element, "change", function () {
            //    var observable = valueAccessor();
            //    console.log('In change');

            //    // Clear the Datepicker and the observable when the user clears the control
            //    // Note: datepicker will keep "today" if not cleared this way
            //    var textVal = $el.datepicker().val();
            //    if (textVal && textVal !== '') {
            //        console.log('modified', textVal);
            //        //observable(textVal);
            //    } else {
            //        $el.datepicker('setDate', null);
            //        //observable(null);
            //    }
            //});

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $el.datepicker("destroy");
            });
            

        }*/
        //,
        //update: function (element, valueAccessor) {
        //    console.log('In update');
        //    var value = ko.utils.unwrapObservable(valueAccessor()),
        //        $el = $(element),
        //        current = $el.datepicker("getDate");

        //    if (value - current !== 0) {
        //        $el.datepicker("setDate", value);
        //    }
        //}
    },
    //
    //https://codethug.com/2013/02/01/knockout-binding-for-onbeforeunload/
    //
    beforeUnloadText: {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            if (window.onbeforeunload == null || true) {
                window.onbeforeunload = function () {
                    var value = valueAccessor();
                    var promptControl = ko.utils.unwrapObservable(value);
                    if (ko.utils.unwrapObservable(promptControl.shouldWarn) !== true) {
                        // Return nothing.  This will cause the prompt not to appear
                        return;
                    } else {
                        if (promptControl.message != null && typeof promptControl.message != "string") {
                            var err = "Error: beforeUnloadText binding must be against a string or string observable. Binding was done against a " + typeof promptText;
                            console.log(err, promptText);
                            // By returning the error string, it will display in the
                            // onbeforeunload dialog box to the user.  We could throw an
                            // exception here, but the page would unload and the
                            // exception would be lost.
                            return err;
                        }
                        return promptControl.message;
                    }
                };

            } else {
                var err = "onbeforeupload has already been set";
                throw new Error(err);
            }
        }
    },

    fileInputSelection: {
        init: function (element, valueAccessor) {
            $(element).change(function () {
                valueAccessor()(this.files);
            });
        },
        update: function (element, valueAccessor) {
            //if (ko.unwrap(valueAccessor()) === null) {
            //    $(element).wrap('<form>').closest('form').get(0).reset();
            //    $(element).unwrap();
            //}
        }
    },

    koScrollTo: {
        update: function (element, valueAccessor, allBindings) {
            var _value = valueAccessor();
            var _valueUnwrapped = ko.unwrap(_value);
            if (_valueUnwrapped) {
                element.scrollIntoView();
            }
        }
    },


    datepicker2: {
        init: function (element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().datepickerOptions || {};

            var pickerConfiguration = {
                autoHide: true
            };

            // Trigger element to open the time picker
            if (options.trigger) {
                pickerConfiguration.trigger = options.trigger;
            }

            if (options.zIndex) {
                pickerConfiguration.zIndex = options.zIndex;
            }

            //console.log('options', options);
            if (options.format) {
                pickerConfiguration.format = options.format;
            }

            //console.log('pickerConfiguration', pickerConfiguration);
            // Create the DatePicker using the configuration made with options above
            $(element).datepicker(pickerConfiguration);

            var value = ko.unwrap(valueAccessor());
            if (value) {
                $(element).datepicker('setDate', new Date(value));
            } else if (options.ifNullSetDateTo) {
                // This sets the initial calendar value to some date but the date is not actually "picked"
                $(element).datepicker('setDate', options.ifNullSetDateTo);
                $(element).datepicker('update');
                $(element).val('');
            }

            // Sets the start date of the picker, locking any date before it
            if (options.setStartDateTo) {
                $(element).datepicker('setStartDate', options.setStartDateTo());

                // Set a subscription to listen for changes on the StartDate and update setStartDate property accordingly
                options.setStartDateTo.subscribe(function () {
                    $(element).datepicker('setStartDate', options.setStartDateTo());
                });
            }

            var funcOnSelectdate = function (e) {

                var observable = valueAccessor();
                var textValue = $(element).datepicker().val();

                if (textValue && textValue !== '') {
                    if (observable().getTime() != $(element).datepicker("getDate").getTime()) {
                        observable($(element).datepicker("getDate"));
                    }
                } else {
                    observable(null);
                }
            }

            //handle the field changing
            ko.utils.registerEventHandler(element, "change", funcOnSelectdate);

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).datepicker("destroy");
            });

        },
        update: function (element, valueAccessor) {
            function updateObservable() {
                let value = valueAccessor()();
                if (value && (value.getTime() != $(element).datepicker("getDate").getTime())) {
                    $(element).datepicker('setDate', new Date(value));
                }
            }

            updateObservable();
        }
    }
};



//
// Dirty Flag Handling (global model change listener)
// http://www.knockmeout.net/2011/05/creating-smart-dirty-flag-in-knockoutjs.html
//
//ko.dirtyFlag = function (root) {
//    var _initialized;

//    //one-time dirty flag that gives up its dependencies on first change
//    var result = ko.computed(function () {
//        console.log('initialized: ', _initialized);
//        if (!_initialized) {
//            //just for subscriptions
//            ko.toJS(root);

//            //next time return true and avoid ko.toJS
//            _initialized = true;

//            //on initialization this flag is not dirty
//            return false;
//        }
//        console.log('%c Model Changed! ', 'background: #222; color: #bada55');
//        //on subsequent changes, flag is now dirty
//        return true;
//    });

//    result.reset = function () {
//        console.log('zzz', _initialized);
//        _initialized = false;
//    };

//    return result;
//};


ko.dirtyFlag = function (root) {
    var result = function () { },
        _initialized = ko.observable(false);

    result.isDirty = ko.computed(function () {
        // grab all subscriptions just the first time through
        if (!_initialized()) {
            ko.toJS(root);
            _initialized(true);

            console.log('%c Model Tracker - Initialized! ', 'background: #222; color: #bada55');
            return false;
        }

        console.log('%c Model Tracker - Model Changed! ', 'background: #222; color: #bada55');
        return true;
    });

    result.reset = function () {
        console.log('%c Model Tracker - Reset! ', 'background: #222; color: #bada55');
        _initialized(false);
    };

    return result;
};



useValidateDateRule = function () {
    ko.validation.rules["validateDate"] = {
        validator: function (val, validate) {
            // Ensure the date is not mindate

            //var ok = moment(val, 'MM/DD/YYYY', true).isValid()
            var ok = moment(val).isValid();
            if (validate()) {
                return ok;
            } else {
                return true;
            }
        },
        message: "Please enter a valid date"
    };
};

defineGreaterThanValidation = function () {
    ko.validation.rules['greaterThan'] = {
        validator: function (val, otherVal) {
            return val > otherVal;
        },
        message: "The field must be greater than {0}"
    };
};
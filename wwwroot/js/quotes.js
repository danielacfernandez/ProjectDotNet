const initQuotes = (quotesModel) => {

    var model = quotesModel;
    // Remove KO bindings from description texts
    if (model.header.description) {
        model.header.description = model.header.description.replaceAll('data-bind', 'data-bind1');
    }
    if (model.header.other_Conditions) {
        model.header.other_Conditions = model.header.other_Conditions.replaceAll('data-bind', 'data-bind1');
    }

    console.log(model);

    model.notificationDialog = notificationDialog;

    model.sideMenuData = {};
    // Create the url's for the side menu
    model.sideMenuData.documents = [];
    // Create comment URL for side menu
    model.sideMenuData.commentsUrl = ``;
    // Side Menu Project Files link
    model.sideMenuData.projectFilesUrl = ``;
    model.oppPlanPendingChanges = ko.observable(false);
    model.oGrid = null;

    model.callTEG = function () {

        oGrid = new clsMyGrid(gridName, document.getElementById('operationalPlanTEG'), null, {
            created: function () {
                // Hide TEG new record if the TEG is readonly
                if (model.isReadOnlyView || !model.header.isOpPlanEditable) {
                    $('.cmdNewRecord').hide();
                    $('.cmdAddMultipleRecords').hide();
                }
            },
            beforeRenderEditableCell: function () {
                // If this method returns false makes the TEG read-only
                return !model.isReadOnlyView && model.header.isOpPlanEditable;
            },

            buttonClick: function (btn) {
                if (btn.id === 'cmdAddMultipleRecords') {
                    model.addMultipleRecordsModal.showAddMultipleRecordsDialog();
                }
            }
        }, true, { ORGANIZATION_ID: model.organizationID, QUOTE_ID: model.quoteID, USERID: model.userID });
        //        model.oppPlanPendingChanges(model.oGrid.pendingChanges());


    }.bind(model);



    model.popFromQQ = function () {
        model.populatingPlan(true);
        getWrapper('api/v1/popfromqq', { 'QuoteID': model.quoteID })
            .then((r) => {
                model.populatingPlan(false);
                model.callTEG();
            });
    }.bind(model);

    //
    // Sticky SubMenu
    //
    var subMenuNav = document.getElementById("quoteSubMenuNav");
    //var subMenuTop = subMenuNav.offsetTop;

    // Calc the top taking into account if the header is sticky (position fixed) or not
    calcTop = (elem) => subMenuNav.classList.contains('sticky') ? elem.offset().top - 70 : elem.offset().top - 200;

    // Add the sticky class to the requestSubMenuNav when you reach its scroll position. Remove "sticky" when you leave the scroll position
    //window.onscroll = () => window.pageYOffset >= subMenuTop ? subMenuNav.classList.add("sticky") : subMenuNav.classList.remove("sticky");
    //
    //

    //
    // Modify user/time observables
    //
    model.header.modifiedByName = ko.observable(model.header.modifiedByName);
    model.header.modifyTime = ko.observable(model.header.modifyTime);


    model.eyeLink = ko.observable(false);
    model.sendingEmail = ko.observable(false);
    model.populatingPlan = ko.observable(false);
    model.tabs = ko.observableArray(model.tabs);
    for (var i = 0; i < model.tabs().length; i++) {
        for (var j = 0; j < model.tabs()[i].pages.length; j++) {
            for (var k = 0; k < model.tabs()[i].pages[j].sections.length; k++) {
                model.tabs()[i].pages[j].sections[k].items = ko.observableArray(model.tabs()[i].pages[j].sections[k].items);
                if (model.tabs()[i].pages[j].sections[k].items !== null) {
                    for (var l = 0; l < model.tabs()[i].pages[j].sections[k].items().length; l++) {
                        model.tabs()[i].pages[j].sections[k].items()[l].itemTime = ko.observable(model.tabs()[i].pages[j].sections[k].items()[l].itemTime);
                        model.tabs()[i].pages[j].sections[k].items()[l].itemTime.subscribe(function () {
                            var updatedItem = {
                                quoteDataID: this.quoteDataID,
                                itemName: this.itemName,
                                itemTime: parseFloat(this.itemTime()),
                                itemQuantity: parseFloat(this.itemQuantity()),
                                isActive: this.isActive()
                            };
                            fetch('api/v1/updateitem',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedItem),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.tabs()[i].pages[j].sections[k].items()[l]));
                        model.tabs()[i].pages[j].sections[k].items()[l].itemQuantity = ko.observable(model.tabs()[i].pages[j].sections[k].items()[l].itemQuantity);
                        model.tabs()[i].pages[j].sections[k].items()[l].itemQuantity.subscribe(function () {
                            var updatedItem = {
                                quoteDataID: this.quoteDataID,
                                itemName: this.itemName,
                                itemTime: parseFloat(this.itemTime()),
                                itemQuantity: parseFloat(this.itemQuantity()),
                                isActive: this.isActive()
                            };
                            fetch('api/v1/updateitem',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedItem),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.tabs()[i].pages[j].sections[k].items()[l]));
                        model.tabs()[i].pages[j].sections[k].items()[l].isActive = ko.observable(model.tabs()[i].pages[j].sections[k].items()[l].isActive);
                        model.tabs()[i].pages[j].sections[k].items()[l].isActive.subscribe(function () {
                            var updatedItem = {
                                quoteDataID: this.quoteDataID,
                                itemName: this.itemName,
                                itemTime: parseFloat(this.itemTime()),
                                itemQuantity: parseFloat(this.itemQuantity()),
                                isActive: this.isActive()
                            };
                            fetch('api/v1/updateitem',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedItem),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.tabs()[i].pages[j].sections[k].items()[l]));
                    }
                }
            }
            model.tabs()[i].pages[j].pagePCS = ko.computed(function () {
                var total = 0;
                for (var k = 0; k < this.sections.length; k++) {
                    if (this.sections[k].items !== null) {
                        for (var l = 0; l < this.sections[k].items().length; l++) {
                            if (this.sections[k].items()[l].isActive()) {
                                total += parseFloat(this.sections[k].items()[l].itemQuantity());
                            }
                        }
                    }
                }
                return total;
            }.bind(model.tabs()[i].pages[j]));

            model.tabs()[i].pages[j].pageHours = ko.computed(function () {
                var total = 0;
                for (var k = 0; k < this.sections.length; k++) {
                    if (this.sections[k].items !== null) {
                        for (var l = 0; l < this.sections[k].items().length; l++) {
                            if (this.sections[k].items()[l].isActive()) {
                                total += parseFloat(this.sections[k].items()[l].itemQuantity()) * parseFloat(this.sections[k].items()[l].itemTime());
                            }
                        }
                    }
                }
                return total;
            }.bind(model.tabs()[i].pages[j]));
        }
        model.tabs()[i].totalPCS = ko.computed(function () {
            var total = 0;
            for (var k = 0; k < this.pages.length; k++) {
                total += parseFloat(this.pages[k].pagePCS());
            }
            return total;
        }.bind(model.tabs()[i]));
        model.tabs()[i].totalHours = ko.computed(function () {
            var total = 0;
            for (var k = 0; k < this.pages.length; k++) {
                total += parseFloat(this.pages[k].pageHours());
            }
            return total;
        }.bind(model.tabs()[i]));
    };

    model.totalQuoteHours = ko.computed(function () {
        var total = 0;
        for (var i = 0; i < this.tabs().length; i++) {
            total += parseFloat(this.tabs()[i].totalHours());
        }
        return total;
    }.bind(model));

    model.header.attnContact = ko.observable(model.header.attnContact);
    model.header.attnContact.subscribe(function () {
        postWrapper('api/v1/updatecontact', ko.toJSON({ 'quoteID': model.quoteID, 'contactID': model.header.attnContact() }))
            .then((r) => model.selectCustomerBeforeTemplateError(false));

        //fetch(`api/v1/updatecontact?quoteID=${model.quoteID}&contactID=${this.attnContact()}`,
        //    {
        //        method: 'POST',
        //        headers: { 'Content-Type': 'application/json' }
        //    }).then(res => res.json())
        //    .catch(error => console.error('Error:', error))
        //    .then(function (response) {
        //    }.bind(model.header));
    });

    model.header.comments = ko.observable(model.header.comments);
    model.saveComments = function () {
        console.log(model.header.comments());
        fetch(`api/v1/updatecomments?quoteID=${model.quoteID}&comments=${model.header.comments()}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
            });
    }.bind(model);
    model.roles = ko.observableArray(model.roles);


    model.linesFee = ko.observableArray(model.linesFee);
    model.lines = ko.observableArray(model.lines);
    model.linesPMMarkup = ko.observableArray(model.linesPMMarkup);

    model.hasFuelSurcharge = ko.observable(model.linesFee().length > 0);
    model.hasAdminFee = ko.observable(model.addAdminFee);
    model.hasProjectMgmt = ko.observable(model.linesPMMarkup().length > 0);

    for (var i = 0; i < model.lines().length; i++) {

        model.lines()[i].rate = ko.observable(parseFloat(model.lines()[i].rate));

        model.lines()[i].isCrew = ko.observable(model.lines()[i].isCrew);
        model.lines()[i].realHours = ko.observable(model.lines()[i].isCrew() ? model.lines()[i].hours : 0);
        model.lines()[i].hours = ko.observable(parseFloat(model.lines()[i].hours));
        model.lines()[i].hours.subscribe(function () {

            if (this.hours() == "") this.hours("0");
            if (this.rate() == "") this.rate("0");

            var updatedLine = {
                quoteLineID: this.quoteLineID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            if (this.role_ID != null) {
                updatedLine.role_ID = this.role_ID;
            } else {
                updatedLine.role_ID = null;
            }
            this.realHours(this.isCrew() ? this.hours() : 0);

            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    //model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }.bind(model.lines()[i]));

        model.lines()[i].isCrew.subscribe(function () {
            this.realHours(this.isCrew() ? this.hours() : 0);
        }.bind(model.lines()[i]));


        model.lines()[i].isOT = ko.observable(model.lines()[i].isOT);
        model.lines()[i].isOT.subscribe(function () {
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            if (this.role_ID != null) {
                updatedLine.role_ID = this.role_ID();
                var roleid = this.role_ID();
                if (this.isOT()) {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateOT));
                } else {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateReg));
                }
            } else {
                updatedLine.role_ID = null;
            }


            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    //model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }.bind(model.lines()[i]));
        model.lines()[i].roleWriteIn = ko.observable(model.lines()[i].roleWriteIn);
        model.lines()[i].roleWriteIn.subscribe(function () {
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                role_ID: this.role_ID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                }.bind(model)
                );
        }.bind(model.lines()[i]));

        if (model.lines()[i].role_ID != null) {
            model.lines()[i].role_ID = ko.observable(model.lines()[i].role_ID);
            model.lines()[i].role_ID.subscribe(function () {
                var roleid = this.role_ID();
                if (this.isOT()) {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateOT));
                } else {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateReg));
                }
                let qli = this.quoteLineID;
                var updatedLine = {
                    quoteLineID: this.quoteLineID,
                    role_ID: this.role_ID(),
                    isOT: this.isOT(),
                    hours: parseFloat(this.hours()),
                    rate: parseFloat(this.rate()),
                    roleWriteIn: this.roleWriteIn(),
                    quoteID: model.quoteID
                };

                this.isCrew(model.roles().filter(role => { return role.role_ID === roleid })[0].isCrew);

                fetch('api/v1/updateline',
                    {
                        method: 'POST',
                        body: ko.toJSON(updatedLine),
                        headers: { 'Content-Type': 'application/json' }
                    }).then(res => res.json())
                    .catch(error => console.error('Error:', error))
                    .then(function (response) {
                    }.bind(model)
                    );
            }.bind(model.lines()[i]));
        } else {
            model.lines()[i].rate.subscribe(function () {
                if (this.hours() == "") this.hours("0");
                if (this.rate() == "") this.rate("0");
                var updatedLine = {
                    quoteLineID: this.quoteLineID,
                    role_ID: this.role_ID,
                    isOT: this.isOT(),
                    hours: parseFloat(this.hours()),
                    rate: parseFloat(this.rate()),
                    roleWriteIn: this.roleWriteIn(),
                    quoteID: model.quoteID
                };
                fetch('api/v1/updateline',
                    {
                        method: 'POST',
                        body: ko.toJSON(updatedLine),
                        headers: { 'Content-Type': 'application/json' }
                    }).then(res => res.json())
                    .catch(error => console.error('Error:', error))
                    .then(function (response) {
                    }.bind(model)
                    );
            }.bind(model.lines()[i]));
        }

    };
    console.log('LinesFee' + model.linesFee());
    for (var i = 0; i < model.linesFee().length; i++) {

        model.linesFee()[i].rate = ko.observable(parseFloat(model.linesFee()[i].rate));

        model.linesFee()[i].isCrew = ko.observable(model.linesFee()[i].isCrew);
        model.linesFee()[i].realHours = ko.observable(model.linesFee()[i].isCrew() ? model.linesFee()[i].hours : 0);
        model.linesFee()[i].hours = ko.observable(parseFloat(model.linesFee()[i].hours));
        model.linesFee()[i].rate.subscribe(function () {
            if (this.hours() == "") this.hours("0");
            if (this.rate() == "") this.rate("0");
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            if (this.role_ID != null) {
                updatedLine.role_ID = this.role_ID;
            } else {
                updatedLine.role_ID = null;
            }
            this.realHours(this.isCrew() ? this.hours() : 0);

            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    //model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }.bind(model.linesFee()[i]));

        model.linesFee()[i].isCrew.subscribe(function () {
            this.realHours(this.isCrew() ? this.hours() : 0);
        }.bind(model.linesFee()[i]));


        model.linesFee()[i].isOT = ko.observable(model.linesFee()[i].isOT);
        model.linesFee()[i].isOT.subscribe(function () {
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            if (this.role_ID != null) {
                updatedLine.role_ID = this.role_ID();
                var roleid = this.role_ID();
                if (this.isOT()) {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateOT));
                } else {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateReg));
                }
            } else {
                updatedLine.role_ID = null;
            }


            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    //model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }.bind(model.linesFee()[i]));
        model.linesFee()[i].roleWriteIn = ko.observable(model.linesFee()[i].roleWriteIn);
        model.linesFee()[i].roleWriteIn.subscribe(function () {
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                role_ID: this.role_ID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                }.bind(model)
                );
        }.bind(model.linesFee()[i]));

    };
    console.log('linesPMMarkup' + model.linesPMMarkup());
    for (var i = 0; i < model.linesPMMarkup().length; i++) {

        model.linesPMMarkup()[i].rate = ko.observable(parseFloat(model.linesPMMarkup()[i].rate));

        model.linesPMMarkup()[i].isCrew = ko.observable(model.linesPMMarkup()[i].isCrew);
        model.linesPMMarkup()[i].realHours = ko.observable(model.linesPMMarkup()[i].isCrew() ? model.linesPMMarkup()[i].hours : 0);
        model.linesPMMarkup()[i].hours = ko.observable(parseFloat(model.linesPMMarkup()[i].hours));
        model.linesPMMarkup()[i].rate.subscribe(function () {
            if (this.rate() == "") this.rate("0");
            if (this.hours() == "") this.hours("0");
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            if (this.role_ID != null) {
                updatedLine.role_ID = this.role_ID;
            } else {
                updatedLine.role_ID = null;
            }
            this.realHours(this.isCrew() ? this.hours() : 0);

            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    //model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }.bind(model.linesPMMarkup()[i]));

        model.linesPMMarkup()[i].isCrew.subscribe(function () {
            this.realHours(this.isCrew() ? this.hours() : 0);
        }.bind(model.linesPMMarkup()[i]));


        model.linesPMMarkup()[i].isOT = ko.observable(model.linesPMMarkup()[i].isOT);
        model.linesPMMarkup()[i].isOT.subscribe(function () {
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            if (this.role_ID != null) {
                updatedLine.role_ID = this.role_ID();
                var roleid = this.role_ID();
                if (this.isOT()) {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateOT));
                } else {
                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateReg));
                }
            } else {
                updatedLine.role_ID = null;
            }


            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    //model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }.bind(model.linesPMMarkup()[i]));
        model.linesPMMarkup()[i].roleWriteIn = ko.observable(model.linesPMMarkup()[i].roleWriteIn);
        model.linesPMMarkup()[i].roleWriteIn.subscribe(function () {
            var updatedLine = {
                quoteLineID: this.quoteLineID,
                role_ID: this.role_ID,
                isOT: this.isOT(),
                hours: parseFloat(this.hours()),
                rate: parseFloat(this.rate()),
                roleWriteIn: this.roleWriteIn(),
                quoteID: model.quoteID
            };
            fetch('api/v1/updateline',
                {
                    method: 'POST',
                    body: ko.toJSON(updatedLine),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                }.bind(model)
                );
        }.bind(model.linesPMMarkup()[i]));
    };

    model.totalLineOTHours = ko.computed(function () {
        //console.log('othour');
        var total = 0;
        for (var i = 0; i < this.lines().length; i++) {
            if (this.lines()[i].isOT()) {
                total += parseFloat(this.lines()[i].realHours());
            }
        }
        return total;
    }.bind(model));

    model.totalLineRegHours = ko.computed(function () {
        //console.log('hour');
        var total = 0;
        for (var i = 0; i < this.lines().length; i++) {
            if (!this.lines()[i].isOT() && this.lines()[i].role_ID) {
                total += parseFloat(this.lines()[i].realHours());
            }
        }
        return total;
    }.bind(model));

    model.totalLineHours = ko.computed(function () {
        //console.log('totalhours');
        return this.totalLineRegHours() + this.totalLineOTHours();
    }.bind(model));
    model.totalLineHours.subscribe(function () {
        var shiftValues = {
            quoteID: model.quoteID,
            hrsPerShift: parseFloat(model.shiftCrews.hrsPerShift()),
            daysOnSite: parseFloat(model.shiftCrews.daysOnSite()),
            numberOfShifts: parseFloat(model.shiftCrews.numberOfShifts),
            crewSize: parseFloat(model.shiftCrews.crewSize())
        };
        fetch('api/v1/updateshifts',
            {
                method: 'POST',
                body: ko.toJSON(shiftValues),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                //model.shiftCrews.crewSize(response.value.crewSize);
                model.updateShiftCrewsCrewSize(response.value.crewSize);
            }.bind(model)
            );
    }.bind(model));

    model.removeLine = function (quoteLineID) {
        console.log('remove');
        fetch('api/v1/removeline',
            {
                method: 'POST',
                body: ko.toJSON(quoteLineID),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                for (var i = 0; i < model.lines().length; i++) {
                    if (model.lines()[i].quoteLineID === quoteLineID) {
                        model.lines.remove(model.lines()[i]);
                    }
                }

                for (var i = 0; i < model.linesFee().length; i++) {
                    if (model.linesFee()[i].quoteLineID === quoteLineID) {
                        model.linesFee.remove(model.linesFee()[i]);
                    }
                }

                for (var i = 0; i < model.linesPMMarkup().length; i++) {
                    if (model.linesPMMarkup()[i].quoteLineID === quoteLineID) {
                        model.linesPMMarkup.remove(model.linesPMMarkup()[i]);
                    }
                }
                model.hasFuelSurcharge(model.linesFee().length > 0);
                model.hasProjectMgmt(model.linesPMMarkup().length > 0);
                model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                //model.shiftCrews.crewSize(response.value.crewSize);
                model.updateShiftCrewsCrewSize(response.value.crewSize);
            }.bind(model)
            );
    }.bind(model);

    model.finalCostEstimate = ko.computed(function () {
        //console.log('cost');
        var total = 0;
        if (this.lines !== null) {
            for (var i = 0; i < this.lines().length; i++) {
                //if (this.lines()[i].role_ID != null) {
                total += this.lines()[i].rate() * this.lines()[i].hours();
                //}
            }
        }
        return total;
    }.bind(model));

    model.totalSurcharge = ko.computed(function () {
        console.log('in totalSurcharge:' + this.linesFee());
        var total = 0;
        if (this.linesFee !== null) {
            for (var i = 0; i < this.linesFee().length; i++) {
                console.log(this.linesFee()[i].rate());
                //if (this.lines()[i].role_ID != null) {
                total += this.linesFee()[i].rate() * this.linesFee()[i].hours() / 100;
                //}
            }
        }
        return total;
    }.bind(model));

    model.shiftCrews.numberOfShifts = ko.observable(model.shiftCrews.numberOfShifts);


    model.pauseShiftCrewUpdates = ko.observable(false);

    model.shiftCrews.crewSize = ko.observable(model.shiftCrews.crewSize);
    model.shiftCrews.crewSize.subscribe(() => model.updateShiftsAPICall(model.shiftCrews.crewSize()));

    model.updateShiftCrewsCrewSize = function (value) {
        console.log('Changing Crew Size...');
        model.pauseShiftCrewUpdates(true);
        model.shiftCrews.crewSize(value);
        model.pauseShiftCrewUpdates(false);
        console.log('Changed Crew Size...');
    }


    model.shiftCrews.hrsPerShift = ko.observable(model.shiftCrews.hrsPerShift);
    model.shiftCrews.hrsPerShift.subscribe(() => model.updateShiftsAPICall(null));

    model.shiftCrews.daysOnSite = ko.observable(model.shiftCrews.daysOnSite);
    model.shiftCrews.daysOnSite.subscribe(() => model.updateShiftsAPICall(null));

    model.updateShiftsAPICall = function (crewSize) {
        if (!model.pauseShiftCrewUpdates()) {
            //console.log('On updateShiftsAPICall ', crewSize);
            model.pauseShiftCrewUpdates(true);

            // DaysOnSite is asummed to be a Int value -> round up if they enter a float value
            model.shiftCrews.daysOnSite(Math.ceil(parseFloat(model.shiftCrews.daysOnSite())));

            var shiftValues = {
                quoteID: model.quoteID,
                hrsPerShift: parseFloat(model.shiftCrews.hrsPerShift()),
                daysOnSite: model.shiftCrews.daysOnSite(),
                numberOfShifts: parseFloat(model.shiftCrews.numberOfShifts()),
                crewSize: parseFloat(crewSize)
            };

            postWrapper('api/v1/updateshifts', ko.toJSON(shiftValues))
                .then(({ value }) => {
                    model.shiftCrews.numberOfShifts(parseFloat(value.numberOfShifts));

                    // Only Update Crew Size if in the call it was null (i.e. CrewSize will be calculated by the API)
                    if (!crewSize) {
                        model.shiftCrews.crewSize(parseFloat(value.crewSize));
                    }

                    model.pauseShiftCrewUpdates(false);
                });
        } else {
            console.log('subcription paused!');
        }
    };



    model.addRoleLineRow = function () {

        fetch(`api/v1/getnewroleline?quoteID=${model.quoteID}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                if (response == undefined) {
                    alert("There was a problem adding a new line, please contact support");
                    return false;
                }
                model.lines.push({
                    quoteLineID: response.value.quoteLineID,
                    role_ID: ko.observable(response.value.role_ID),
                    isOT: ko.observable(response.value.isOT),
                    hours: ko.observable(response.value.hours),
                    rate: ko.observable(response.value.rate),
                    roleWriteIn: ko.observable(response.value.roleWriteIn),
                    isCrew: ko.observable(response.value.isCrew),
                    quoteID: model.quoteID,
                    realHours: ko.observable(response.value.isCrew ? response.value.hours : 0)
                });

                for (var i = 0; i < model.lines().length; i++) {
                    if (model.lines()[i].quoteLineID === response.value.quoteLineID) {
                        model.lines()[i].hours.subscribe(function () {
                            if (this.hours() == "") this.hours("0");
                            if (this.rate() == "") this.rate("0");
                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID(),
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };
                            console.log(this);
                            this.realHours(this.isCrew() ? parseFloat(this.hours()) : 0);

                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                    model.shiftCrews.numberOfShifts(parseFloat(response.value.numberOfShifts));
                                    //model.shiftCrews.crewSize(parseFloat(response.value.crewSize));
                                    model.updateShiftCrewsCrewSize(parseFloat(response.value.crewSize));
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));

                        model.lines()[i].isCrew.subscribe(function () {
                            this.realHours(this.isCrew() ? this.hours() : 0);
                        }.bind(model.lines()[i]));

                        model.lines()[i].rate.subscribe(function () {
                            if (this.hours() == "") this.hours("0");
                            if (this.rate() == "") this.rate("0");

                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID(),
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };
                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));
                        model.lines()[i].isOT.subscribe(function () {
                            var roleid = this.role_ID();
                            if (this.role_ID() != null) {
                                if (this.isOT()) {
                                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateOT));
                                } else {
                                    this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateReg));
                                }
                            }
                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID(),
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };
                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));
                        model.lines()[i].role_ID.subscribe(function () {
                            var roleid = this.role_ID();
                            if (this.isOT()) {
                                this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateOT));
                            } else {
                                this.rate(parseFloat(model.roles().filter(role => { return role.role_ID === roleid })[0].rateReg));
                            }
                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID(),
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };

                            this.isCrew(model.roles().filter(role => { return role.role_ID === roleid })[0].isCrew);

                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));
                    }
                }
            }.bind(model));
    }.bind(model);

    model.addWriteLineRow = function () {

        fetch(`api/v1/getnewwriteline?quoteID=${model.quoteID}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                model.lines.push({
                    quoteLineID: response.value.quoteLineID,
                    role_ID: response.value.role_ID,
                    isOT: ko.observable(response.value.isOT),
                    hours: ko.observable(response.value.hours),
                    rate: ko.observable(response.value.rate),
                    roleWriteIn: ko.observable(response.value.roleWriteIn),
                    quoteID: model.quoteID,
                    isCrew: ko.observable(true),
                    realHours: ko.observable(response.value.hours)
                });
                for (var i = 0; i < model.lines().length; i++) {
                    if (model.lines()[i].quoteLineID === response.value.quoteLineID) {
                        model.lines()[i].hours.subscribe(function () {
                            if (this.hours() == "") this.hours("0");
                            if (this.rate() == "") this.rate("0");
                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID,
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };

                            this.realHours(this.isCrew() ? this.hours() : 0);

                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                    model.shiftCrews.numberOfShifts(parseFloat(response.value.numberOfShifts));
                                    //model.shiftCrews.crewSize(parseFloat(response.value.crewSize));
                                    model.updateShiftCrewsCrewSize(parseFloat(response.value.crewSize));
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));
                        model.lines()[i].rate.subscribe(function () {
                            if (this.hours() == "") this.hours("0");
                            if (this.rate() == "") this.rate("0");
                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID,
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };
                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));
                        model.lines()[i].isOT.subscribe(function () {
                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID,
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };
                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));
                        model.lines()[i].roleWriteIn.subscribe(function () {
                            var updatedLine = {
                                quoteLineID: this.quoteLineID,
                                role_ID: this.role_ID,
                                isOT: this.isOT(),
                                hours: parseFloat(this.hours()),
                                rate: parseFloat(this.rate()),
                                roleWriteIn: this.roleWriteIn(),
                                quoteID: model.quoteID
                            };
                            fetch('api/v1/updateline',
                                {
                                    method: 'POST',
                                    body: ko.toJSON(updatedLine),
                                    headers: { 'Content-Type': 'application/json' }
                                }).then(res => res.json())
                                .catch(error => console.error('Error:', error))
                                .then(function (response) {
                                }.bind(model)
                                );
                        }.bind(model.lines()[i]));
                    }
                }
            }.bind(model));
    }.bind(model);

    model.header.description = ko.observable(model.header.description);
    model.header.other_Conditions = ko.observable(model.header.other_Conditions);

    model.saveWorkRequest = function () {
        fetch(`api/v1/updateworkrequest?quoteID=${model.quoteID}&description=${$('#Req-Twy').text()}&otherConditions=${$('#Req-Int-Twy').text()}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                alert("Scope saved");
            }.bind(model)
            );
    }.bind(model);


    model.addAdminFeeFn = function () {

        model.addAdminFee = !model.addAdminFee;


        console.log(model.hasAdminFee());// = !model.addAdminFee;
        fetch(`api/v1/addAdminFee?quoteID=${model.quoteID}&addAdminFee=${model.addAdminFee}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function () { model.hasAdminFee(model.addAdminFee); });

    }.bind(model);

    model.addProjectMgmt = function () {
        console.log('addProjectMgm:' + model.hasProjectMgmt());
        if (model.hasProjectMgmt() === true) {
            console.log('in remove:' + model.hasProjectMgmt());
            fetch('api/v1/removeline',
                {
                    method: 'POST',
                    body: ko.toJSON(model.linesPMMarkup()[0].quoteLineID),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    for (var i = 0; i < model.linesPMMarkup().length; i++) {
                        if (model.linesPMMarkup()[i].quoteLineID === model.linesPMMarkup()[0].quoteLineID) {
                            model.linesPMMarkup.remove(model.linesPMMarkup()[i]);
                        }
                    }
                    model.hasProjectMgmt(model.linesPMMarkup().length > 0);
                    //model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }
        else {
            console.log('in add:' + model.hasProjectMgmt());
            fetch(`api/v1/addProjectMgmt?quoteID=${model.quoteID}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    console.log(model.linesPMMarkup);
                    console.log(model.linesFee);
                    model.linesPMMarkup.push({
                        quoteLineID: response.value.quoteLineID,
                        role_ID: response.value.role_ID,
                        isOT: ko.observable(response.value.isOT),
                        hours: ko.observable(response.value.hours),
                        rate: ko.observable(response.value.rate),
                        roleWriteIn: ko.observable(response.value.roleWriteIn),
                        quoteID: model.quoteID,
                        isCrew: ko.observable(true),
                        realHours: ko.observable(response.value.hours)
                    });


                    console.log('model.linesPMMarkup.length: ' + model.linesPMMarkup().length);
                    model.hasProjectMgmt(model.linesPMMarkup().length > 0);
                    console.log(model.hasProjectMgmt());

                    for (var i = 0; i < model.linesPMMarkup().length; i++) {
                        if (model.linesPMMarkup()[i].quoteLineID === response.value.quoteLineID) {
                            model.linesPMMarkup()[i].rate.subscribe(function () {
                                if (this.hours() == "") this.hours("0");
                                if (this.rate() == "") this.rate("0");

                                var updatedLine = {
                                    quoteLineID: this.quoteLineID,
                                    //role_ID: this.role_ID(),
                                    isOT: this.isOT(),
                                    hours: parseFloat(this.hours()),
                                    rate: parseFloat(this.rate()),
                                    roleWriteIn: this.roleWriteIn(),
                                    quoteID: model.quoteID
                                };
                                fetch('api/v1/updateline',
                                    {
                                        method: 'POST',
                                        body: ko.toJSON(updatedLine),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(res => res.json())
                                    .catch(error => console.error('Error:', error))
                                    .then(function (response) {
                                    }.bind(model)
                                    );
                            }.bind(model.linesPMMarkup()[i]));

                            model.linesPMMarkup()[i].isOT.subscribe(function () {
                                var updatedLine = {
                                    quoteLineID: this.quoteLineID,
                                    //role_ID: this.role_ID,
                                    isOT: this.isOT(),
                                    hours: parseFloat(this.hours()),
                                    rate: parseFloat(this.rate()),
                                    roleWriteIn: this.roleWriteIn(),
                                    quoteID: model.quoteID
                                };
                                fetch('api/v1/updateline',
                                    {
                                        method: 'POST',
                                        body: ko.toJSON(updatedLine),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(res => res.json())
                                    .catch(error => console.error('Error:', error))
                                    .then(function (response) {
                                    }.bind(model)
                                    );
                            }.bind(model.linesPMMarkup()[i]));

                            model.linesPMMarkup()[i].roleWriteIn.subscribe(function () {
                                var updatedLine = {
                                    quoteLineID: this.quoteLineID,
                                    //role_ID: this.role_ID,
                                    isOT: this.isOT(),
                                    hours: parseFloat(this.hours()),
                                    rate: parseFloat(this.rate()),
                                    roleWriteIn: this.roleWriteIn(),
                                    quoteID: model.quoteID
                                };
                                fetch('api/v1/updateline',
                                    {
                                        method: 'POST',
                                        body: ko.toJSON(updatedLine),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(res => res.json())
                                    .catch(error => console.error('Error:', error))
                                    .then(function (response) {
                                    }.bind(model)
                                    );
                            }.bind(model.linesPMMarkup()[i]));
                        }
                    }

                    model.hasProjectMgmt(model.linesPMMarkup().length > 0);
                    console.log('1: ' + model.hasProjectMgmt());
                }.bind(model));
        }
    }.bind(model);



    model.addFuelSurchargeRate = function () {
        if (model.hasFuelSurcharge() === true) {

            fetch('api/v1/removeline',
                {
                    method: 'POST',
                    body: ko.toJSON(model.linesFee()[0].quoteLineID),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    for (var i = 0; i < model.linesFee().length; i++) {
                        if (model.linesFee()[i].quoteLineID === model.linesFee()[0].quoteLineID) {
                            model.linesFee.remove(model.linesFee()[i]);
                        }
                    }
                    model.hasFuelSurcharge(model.linesFee().length > 0);
                    //model.shiftCrews.numberOfShifts(response.value.numberOfShifts);
                    model.shiftCrews.crewSize(response.value.crewSize);
                    model.updateShiftCrewsCrewSize(response.value.crewSize);
                }.bind(model)
                );
        }
        else {
            fetch(`api/v1/addFuelSurchargeRate?quoteID=${model.quoteID}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {

                    model.linesFee.push({
                        quoteLineID: response.value.quoteLineID,
                        role_ID: response.value.role_ID,
                        isOT: ko.observable(response.value.isOT),
                        hours: ko.observable(response.value.hours),
                        rate: ko.observable(response.value.rate),
                        roleWriteIn: ko.observable(response.value.roleWriteIn),
                        quoteID: model.quoteID,
                        isCrew: ko.observable(true),
                        realHours: ko.observable(response.value.hours)
                    });


                    console.log('model.linesFee.length: ' + model.linesFee().length);
                    model.hasFuelSurcharge(model.linesFee().length > 0);
                    console.log(model.hasFuelSurcharge());

                    for (var i = 0; i < model.linesFee().length; i++) {
                        if (model.linesFee()[i].quoteLineID === response.value.quoteLineID) {
                            model.linesFee()[i].rate.subscribe(function () {
                                if (this.hours() == "") this.hours("0");
                                if (this.rate() == "") this.rate("0");

                                var updatedLine = {
                                    quoteLineID: this.quoteLineID,
                                    //role_ID: this.role_ID(),
                                    isOT: this.isOT(),
                                    hours: parseFloat(this.hours()),
                                    rate: parseFloat(this.rate()),
                                    roleWriteIn: this.roleWriteIn(),
                                    quoteID: model.quoteID
                                };
                                fetch('api/v1/updateline',
                                    {
                                        method: 'POST',
                                        body: ko.toJSON(updatedLine),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(res => res.json())
                                    .catch(error => console.error('Error:', error))
                                    .then(function (response) {
                                    }.bind(model)
                                    );
                            }.bind(model.linesFee()[i]));
                            model.linesFee()[i].isOT.subscribe(function () {
                                var updatedLine = {
                                    quoteLineID: this.quoteLineID,
                                    //role_ID: this.role_ID,
                                    isOT: this.isOT(),
                                    hours: parseFloat(this.hours()),
                                    rate: parseFloat(this.rate()),
                                    roleWriteIn: this.roleWriteIn(),
                                    quoteID: model.quoteID
                                };
                                fetch('api/v1/updateline',
                                    {
                                        method: 'POST',
                                        body: ko.toJSON(updatedLine),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(res => res.json())
                                    .catch(error => console.error('Error:', error))
                                    .then(function (response) {
                                    }.bind(model)
                                    );
                            }.bind(model.linesFee()[i]));
                            model.linesFee()[i].roleWriteIn.subscribe(function () {
                                var updatedLine = {
                                    quoteLineID: this.quoteLineID,
                                    //role_ID: this.role_ID,
                                    isOT: this.isOT(),
                                    hours: parseFloat(this.hours()),
                                    rate: parseFloat(this.rate()),
                                    roleWriteIn: this.roleWriteIn(),
                                    quoteID: model.quoteID
                                };
                                fetch('api/v1/updateline',
                                    {
                                        method: 'POST',
                                        body: ko.toJSON(updatedLine),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(res => res.json())
                                    .catch(error => console.error('Error:', error))
                                    .then(function (response) {
                                    }.bind(model)
                                    );
                            }.bind(model.linesFee()[i]));
                        }
                    }

                    model.hasFuelSurcharge(model.linesFee().length > 0);
                    console.log('1: ' + model.hasFuelSurcharge());
                }.bind(model));
        }
    }.bind(model);

    //Data Section

    model.changeIsActive = function (isActive) {
        isActive = !isActive;
    }.bind(model);

    model.selectedTab = ko.observable(model.tabs()[0].tabName);
    model.selectTab = function (tab) {
        model.selectedTab(tab);
    }.bind(model);

    model.viewUnchecked = ko.observable(true);
    model.toggleUnchecked = function () {
        model.viewUnchecked(!model.viewUnchecked());
    }.bind(model);

    model.selectedPage = ko.observable('v-' + model.tabs()[0].tabName.replace(regex, '') + model.tabs()[0].pages[0].pageName.replace(regex, ''));
    model.selectPage = function (page) {
        model.selectedPage(page);
    }.bind(model);

    model.selectFirstPage = function (tab) {
        model.selectedPage('v-' + model.tabs()[tab].tabName.replace(regex, '') + model.tabs()[tab].pages[0].pageName.replace(regex, ''));
    }.bind(model);

    //End Data Section


    //Typicals


    model.typicalTemplates = ko.observableArray(model.tabs()[0].pages);

    model.newTypical = {
        name: ko.observable(''),
        tabName: '',
        pageName: '',
        sections: ko.observableArray(),
        readonly: ko.observable(false),
        quoteDataTypicalID: null
    };

    model.newTypical.pageHours = ko.computed(function () {
        var total = 0;
        if (this.sections() != null) {
            for (var k = 0; k < this.sections().length; k++) {
                if (this.sections()[k].items() !== null) {
                    for (var l = 0; l < this.sections()[k].items().length; l++) {
                        total += parseFloat(this.sections()[k].items()[l].itemQuantity()) * parseFloat(this.sections()[k].items()[l].itemTime());
                    }
                }
            }
        }
        return total;
    }.bind(model.newTypical));

    model.newTypical.pagePCS = ko.computed(function () {
        var total = 0;
        for (var k = 0; k < this.sections().length; k++) {
            if (this.sections()[k].items() !== null) {
                for (var l = 0; l < this.sections()[k].items().length; l++) {
                    total += parseFloat(this.sections()[k].items()[l].itemQuantity());
                }
            }
        }
        return total;
    }.bind(model.newTypical));

    model.newTypical.reset = function () {
        this.name('');
        this.tabName = '',
            this.pageName = '';
        this.sections([]);
        this.readonly(false);
        this.quoteDataTypicalID = null;
    }.bind(model.newTypical);

    model.typicalTemplates = ko.observableArray([{
        typicalName: '',
        quoteDataTypicalID: ''
    }]);

    model.showingTypical = ko.observable(false);

    model.viewAddExistingTypical = function (quoteDataTypicalID, showingTypical, typicalName) {
        this.newTypical.name(typicalName);
        this.newTypical.quoteDataTypicalID = quoteDataTypicalID;
        this.newTypical.readonly(true);
        this.newTypical.sections([]);
        fetch(`api/v1/getquotetypicaldetail?quoteDataTypicalID=${quoteDataTypicalID}&showingTypical=${showingTypical}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                response.sections.forEach(function (section) {

                    // Check if the section has as least one item with Qty > 0 - ignore full section if all items Qty == 0
                    if (section.items.some(i => i.itemQuantity > 0)) {
                        let sectionObj = {
                            sectionName: ko.observable(section.sectionName),
                            // Include only items with Qty > 0
                            items: ko.observableArray(section.items.filter(item => item.itemQuantity > 0).map((item) => {
                                return {
                                    quoteDataTemplateID: item.quoteDataTemplateID,
                                    itemName: item.itemName,
                                    itemTime: ko.observable(item.itemTime),
                                    itemQuantity: ko.observable(item.itemQuantity),
                                    isActive: ko.observable(item.isActive)
                                }
                            }))
                        }

                        model.newTypical.sections.push(sectionObj);
                    }
                });
                this.showingTypical(showingTypical);
                this.showNewTypicalModal(false);
                this.showNewTypicalForm(true);
            }.bind(model));
    }.bind(model);

    model.addExistingTypical = function (quoteDataTypicalID) {
        var existingtypicalToSave = {
            QuoteID: model.quoteID,
            TabName: model.newTypical.tabName,
            PageName: model.newTypical.pageName,
            QuoteDataTypicalID: parseInt(quoteDataTypicalID)
        };
        fetch('api/v1/addexistingtypical',
            {
                method: 'POST',
                body: ko.toJSON(existingtypicalToSave),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                for (var i = 0; i < model.tabs().length; i++) {
                    if (model.tabs()[i].tabName === model.newTypical.tabName) {
                        for (var j = 0; j < model.tabs()[i].pages.length; j++) {
                            if (model.tabs()[i].pages[j].pageName === model.newTypical.pageName) {
                                for (var k = 0; k < model.tabs()[i].pages[j].sections.length; k++) {
                                    if (model.tabs()[i].pages[j].sections[k].sectionName === 'Typicals') {
                                        model.tabs()[i].pages[j].sections[k].items.push({
                                            quoteDataID: response.value.quoteDataID,
                                            itemName: response.value.itemName,
                                            itemTime: ko.observable(response.value.itemTime),
                                            itemQuantity: ko.observable(response.value.itemQuantity),
                                            isActive: ko.observable(response.value.isActive)
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                this.showNewTypicalForm(false);
            }.bind(model)
            );
    };

    model.showNewTypicalModal = ko.observable(null);
    model.showNewTypicalModalDialog = function (show, pageName, tabName) {
        if (show) {
            fetch(`api/v1/quoteexistingtypicalstemplates?organizationID=${model.organizationID}&pageName=${pageName}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    model.typicalTemplates([]);
                    response.value.forEach(function (typ) {
                        model.typicalTemplates.push({
                            typicalName: typ.typicalName,
                            quoteDataTypicalID: typ.quoteDataTypicalID
                        });
                    });
                    model.newTypical.reset();
                    model.newTypical.pageName = pageName;
                    model.newTypical.tabName = tabName;
                    $('#typicalTemplatesSelect').selectpicker('refresh');
                    this.showNewTypicalModal(show);
                }.bind(model));
        } else {
            this.showNewTypicalModal(null);
        }
    }.bind(model);

    model.showNewTypicalForm = ko.observable(null);
    model.showNewTypicalFormDialog = function (show) {
        if (show) {
            fetch(`api/v1/quotetypicalstemplates?organizationID=${model.organizationID}&pageName=${model.newTypical.pageName}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    response.sections.forEach(function (section, isection) {
                        model.newTypical.sections.push({
                            sectionName: ko.observable(section.sectionName),
                            items: ko.observableArray()
                        });
                        response.sections[isection].items.forEach(function (item) {
                            model.newTypical.sections()[isection].items.push({
                                quoteDataTemplateID: item.quoteDataTemplateID,
                                itemName: item.itemName,
                                itemTime: ko.observable(item.itemTime),
                                itemQuantity: ko.observable(item.itemQuantity),
                                isActive: ko.observable(item.isActive)
                            });
                        });
                    });
                    model.newTypical.readonly(false);
                }.bind(model));
            this.showNewTypicalModalDialog(false);
            this.showNewTypicalForm(show);
        } else {
            this.showNewTypicalForm(null);
        };
    }.bind(model);

    model.createNewTypical = function () {
        var typicalToSave = {
            organizationID: model.organizationID,
            quoteID: model.quoteID,
            tabName: model.newTypical.tabName,
            typicalName: model.newTypical.name(),
            pageName: model.newTypical.pageName,
            sections: []
        }

        model.newTypical.sections().forEach(function (section, i) {
            typicalToSave.sections.push({
                sectionName: section.sectionName(),
                items: []
            });
            model.newTypical.sections()[i].items().forEach(function (item) {
                typicalToSave.sections[i].items.push({
                    quoteDataTemplateID: item.quoteDataTemplateID,
                    itemName: item.itemName,
                    itemTime: parseFloat(item.itemTime()),
                    itemQuantity: parseFloat(item.itemQuantity())
                })
            })

        })

        fetch('api/v1/addtypical',
            {
                method: 'POST',
                body: ko.toJSON(typicalToSave),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                for (var i = 0; i < model.tabs().length; i++) {
                    if (model.tabs()[i].tabName === model.newTypical.tabName) {
                        for (var j = 0; j < model.tabs()[i].pages.length; j++) {
                            if (model.tabs()[i].pages[j].pageName === model.newTypical.pageName) {
                                for (var k = 0; k < model.tabs()[i].pages[j].sections.length; k++) {
                                    if (model.tabs()[i].pages[j].sections[k].sectionName === 'Typicals') {
                                        model.tabs()[i].pages[j].sections[k].items.push({
                                            quoteDataID: response.value.quoteDataID,
                                            itemName: response.value.itemName,
                                            itemTime: ko.observable(response.value.itemTime),
                                            itemQuantity: ko.observable(response.value.itemQuantity),
                                            isActive: ko.observable(response.value.isActive)
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                this.showNewTypicalFormDialog(false);
            }.bind(model));

    }.bind(model);

    model.newItem = {
        quoteID: model.quoteID,
        tabName: '',
        pageName: '',
        sectionName: '',
        itemName: '',
        quoteDataTypicalID: null,
        isActive: true
    }

    model.showNewItemModal = ko.observable(null);
    model.showNewItemModalDialog = function (show, sectionName, pageName, tabName) {
        if (show) {
            model.newItem.tabName = tabName;
            model.newItem.pageName = pageName;
            model.newItem.sectionName = sectionName;
            this.showNewItemModal(true);
        } else {
            $('#item-name').val('');
            this.showNewItemModal(null);
        }
    }.bind(model);



    model.createNewItem = function (itemName) {
        model.newItem.itemName = itemName;

        fetch(`api/v1/addnewitem`,
            {
                method: 'POST',
                body: ko.toJSON(model.newItem),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                for (var i = 0; i < model.tabs().length; i++) {
                    if (model.tabs()[i].tabName === model.newItem.tabName) {
                        for (var j = 0; j < model.tabs()[i].pages.length; j++) {
                            if (model.tabs()[i].pages[j].pageName === model.newItem.pageName) {
                                for (var k = 0; k < model.tabs()[i].pages[j].sections.length; k++) {
                                    if (model.tabs()[i].pages[j].sections[k].sectionName === model.newItem.sectionName) {

                                        model.tabs()[i].pages[j].sections[k].items.push({
                                            quoteDataID: response.value.quoteDataID,
                                            itemName: response.value.itemName,
                                            itemTime: ko.observable(response.value.itemTime),
                                            itemQuantity: ko.observable(response.value.itemQuantity),
                                            isActive: ko.observable(response.value.isActive)
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                this.showNewItemModalDialog(false);

            }.bind(model));
    }.bind(model);

    model.showNewTabModal = ko.observable(null);
    model.showNewTabModalDialog = function (show) {
        if (show) {
            this.showNewTabModal(true);
        } else {
            this.showNewTabModal(null);
        }
    }.bind(model);

    model.showConfirmModal = ko.observable(null);
    model.showConfirmModalDialog = function (show) {
        if (show) {
            this.showConfirmModal(true);
        } else {
            this.showConfirmModal(null);
            return response;
        }
    }.bind(model);

    model.removeTab = function (tabName) {
        if (confirm('Are you sure you want to remove the tab?')) {
            fetch(`api/v1/removetab?quoteid=${model.quoteID}&tabname=${tabName}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                    for (var i = 0; i < model.tabs().length; i++) {
                        if (model.tabs()[i].tabName === tabName) {
                            model.tabs.splice(i, 1);
                        }
                    }
                    model.newTypical.readonly(false);
                }.bind(model));
        }

    }.bind(model);

    model.createNewTab = function (tabName) {
        fetch(`api/v1/addnewtab?tabName=${tabName}&quoteID=${model.quoteID}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                var newTab = response.value;
                for (var j = 0; j < newTab.pages.length; j++) {
                    for (var k = 0; k < newTab.pages[j].sections.length; k++) {
                        newTab.pages[j].sections[k].items = ko.observableArray(newTab.pages[j].sections[k].items);
                        if (newTab.pages[j].sections[k].items !== null) {
                            for (var l = 0; l < newTab.pages[j].sections[k].items().length; l++) {
                                newTab.pages[j].sections[k].items()[l].itemTime = ko.observable(newTab.pages[j].sections[k].items()[l].itemTime);
                                newTab.pages[j].sections[k].items()[l].itemTime.subscribe(function () {
                                    var updatedItem = {
                                        quoteDataID: this.quoteDataID,
                                        itemName: this.itemName,
                                        itemTime: parseFloat(this.itemTime()),
                                        itemQuantity: parseFloat(this.itemQuantity()),
                                        isActive: this.isActive()
                                    };
                                    fetch('api/v1/updateitem',
                                        {
                                            method: 'POST',
                                            body: ko.toJSON(updatedItem),
                                            headers: { 'Content-Type': 'application/json' }
                                        }).then(res => res.json())
                                        .catch(error => console.error('Error:', error))
                                        .then(function (response) {
                                        }.bind(model)
                                        );
                                }.bind(newTab.pages[j].sections[k].items()[l]));
                                newTab.pages[j].sections[k].items()[l].itemQuantity = ko.observable(newTab.pages[j].sections[k].items()[l].itemQuantity);
                                newTab.pages[j].sections[k].items()[l].itemQuantity.subscribe(function () {
                                    var updatedItem = {
                                        quoteDataID: this.quoteDataID,
                                        itemName: this.itemName,
                                        itemTime: parseFloat(this.itemTime()),
                                        itemQuantity: parseFloat(this.itemQuantity()),
                                        isActive: this.isActive()
                                    };
                                    fetch('api/v1/updateitem',
                                        {
                                            method: 'POST',
                                            body: ko.toJSON(updatedItem),
                                            headers: { 'Content-Type': 'application/json' }
                                        }).then(res => res.json())
                                        .catch(error => console.error('Error:', error))
                                        .then(function (response) {
                                        }.bind(model)
                                        );
                                }.bind(newTab.pages[j].sections[k].items()[l]));
                                newTab.pages[j].sections[k].items()[l].isActive = ko.observable(newTab.pages[j].sections[k].items()[l].isActive);
                                newTab.pages[j].sections[k].items()[l].isActive.subscribe(function () {
                                    var updatedItem = {
                                        quoteDataID: this.quoteDataID,
                                        itemName: this.itemName,
                                        itemTime: parseFloat(this.itemTime()),
                                        itemQuantity: parseFloat(this.itemQuantity()),
                                        isActive: this.isActive()
                                    };
                                    fetch('api/v1/updateitem',
                                        {
                                            method: 'POST',
                                            body: ko.toJSON(updatedItem),
                                            headers: { 'Content-Type': 'application/json' }
                                        }).then(res => res.json())
                                        .catch(error => console.error('Error:', error))
                                        .then(function (response) {
                                        }.bind(model)
                                        );
                                }.bind(newTab.pages[j].sections[k].items()[l]));
                            }
                        }
                    }
                    newTab.pages[j].pagePCS = ko.computed(function () {
                        var total = 0;
                        for (var k = 0; k < this.sections.length; k++) {
                            if (this.sections[k].items !== null) {
                                for (var l = 0; l < this.sections[k].items().length; l++) {
                                    if (this.sections[k].items()[l].isActive()) {
                                        total += parseFloat(this.sections[k].items()[l].itemQuantity());
                                    }
                                }
                            }
                        }
                        return total;
                    }.bind(newTab.pages[j]));

                    newTab.pages[j].pageHours = ko.computed(function () {
                        var total = 0;
                        for (var k = 0; k < this.sections.length; k++) {
                            if (this.sections[k].items !== null) {
                                for (var l = 0; l < this.sections[k].items().length; l++) {
                                    if (this.sections[k].items()[l].isActive()) {
                                        total += parseFloat(this.sections[k].items()[l].itemQuantity()) * parseFloat(this.sections[k].items()[l].itemTime());
                                    }
                                }
                            }
                        }
                        return total;
                    }.bind(newTab.pages[j]));
                }
                newTab.totalPCS = ko.computed(function () {
                    var total = 0;
                    for (var k = 0; k < this.pages.length; k++) {
                        total += parseFloat(this.pages[k].pagePCS());
                    }
                    return total;
                }.bind(newTab));
                newTab.totalHours = ko.computed(function () {
                    var total = 0;
                    for (var k = 0; k < this.pages.length; k++) {
                        total += parseFloat(this.pages[k].pageHours());
                    }
                    return total;
                }.bind(newTab));
                model.tabs.push(newTab);
                this.showNewTabModalDialog(false);
            }.bind(model));
    }.bind(model);

    model.removeTypical = function (quoteDataID) {
        fetch(`api/v1/removetypical`,
            {
                method: 'POST',
                body: ko.toJSON(quoteDataID),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                for (var i = 0; i < model.tabs().length; i++) {
                    for (var j = 0; j < model.tabs()[i].pages.length; j++) {
                        for (var k = 0; k < model.tabs()[i].pages[j].sections.length; k++) {
                            if (model.tabs()[i].pages[j].sections[k].items !== null) {
                                for (var l = 0; l < model.tabs()[i].pages[j].sections[k].items().length; l++) {
                                    if (model.tabs()[i].pages[j].sections[k].items()[l].quoteDataID === quoteDataID) {
                                        model.tabs()[i].pages[j].sections[k].items.remove(model.tabs()[i].pages[j].sections[k].items()[l]);
                                    }
                                }
                            }
                        }
                    }
                }
            }.bind(model));
    }.bind(model);

    //End Typicals

    model.showQuoteTemplateModal = ko.observable(null);
    model.showQuoteTemplateModalDialog = function (show) {
        if (show) {
            this.showNewTabModal(true);
        } else {
            this.showNewTabModal(null);
        }
    }.bind(model);

    model.createNewQuoteVersion = function () {
        fetch(`api/v1/newquoteversion?QuoteID=${model.quoteID}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                window.location = `/quote?QuoteID=${response.value}&OrganizationID=${model.organizationID}`;
            }.bind(model));
    }
    model.template = "";
    model.to = [];
    model.cc = [];

    model.selectCustomerBeforeTemplateError = ko.observable(false);

    model.selectTemplate = function (template) {
        // Verify that the user has selected a Customer Contact
        if (!model.header.attnContact()) {
            model.selectCustomerBeforeTemplateError(true);
            return;
        }


        $('#preview-link').addClass('btn-disabled');
        model.eyeLink(false);
        this.template = template
        $('#template-title').html(template);
        var emailData = {
            quoteID: this.quoteID,
            customerContact: $("#contactSelect option:selected").html(),
            workRequest: $(`<p>${this.header.description()}</p>`).text(),
            numberOfShifts: this.shiftCrews.numberOfShifts,
            crewSize: parseFloat(this.shiftCrews.crewSize()),
            hoursPerShift: parseFloat(this.shiftCrews.hrsPerShift()),
            projectManager: this.header.projectManagerName,
            endUserName: this.header.endUserName,
            projectNo: this.header.project_No,
            requestNo: this.header.request_No,
            versionNo: this.header.version_No,
            lines: [],
            linesFee: [],
            linesPMMarkup: [],
            template: this.template,
            organizationID: this.organizationID,
            customerName: this.header.customerName,
            projectName: this.header.projectName,
            jobLocationAddress: this.header.jobLocationAddress,
            jobLocationContactName: this.header.jobLocationContactName,
            emailTestNotifyAddress: this.header.emailTestNotifyAddress,
            emailTestNotifyActive: this.header.emailTestNotifyActive,
            to: this.to,
            cc: this.cc,
            conditions: [],
            comments: this.header.comments,
            daysOnSite: parseFloat(model.shiftCrews.daysOnSite()),
            HDSQuoteNo: this.header.hdsQuoteNo
        };
        for (var i = 0; i < this.lines().length; i++) {
            let isOT = this.lines()[i].isOT();
            let hours = parseFloat(this.lines()[i].hours());
            let rate = parseFloat(this.lines()[i].rate());
            let roleName = this.lines()[i].role_ID != null ? $('#lineSelect-' + this.lines()[i].quoteLineID + ' option:selected').html() : this.lines()[i].roleWriteIn;
            roleName = isOT ? roleName + ' OT' : roleName;

            emailData.lines.push({ roleWriteIn: roleName, isOT: isOT, hours: hours, rate: rate })
        };


        for (var i = 0; i < this.linesFee().length; i++) {
            let isOT = this.linesFee()[i].isOT();
            let hours = parseFloat(this.linesFee()[i].hours());
            let rate = parseFloat(this.linesFee()[i].rate());
            let roleName = this.linesFee()[i].role_ID != null ? $('#lineSelect-' + this.linesFee()[i].quoteLineID + ' option:selected').html() : this.linesFee()[i].roleWriteIn;
            roleName = isOT ? roleName + ' OT' : roleName;

            emailData.linesFee.push({ roleWriteIn: roleName, isOT: isOT, hours: hours, rate: rate })
        };

        for (var i = 0; i < this.linesPMMarkup().length; i++) {
            let isOT = this.linesPMMarkup()[i].isOT();
            let hours = parseFloat(this.linesPMMarkup()[i].hours());
            let rate = parseFloat(this.linesPMMarkup()[i].rate());
            let roleName = this.linesPMMarkup()[i].roleWriteIn;
            roleName = isOT ? roleName + ' OT' : roleName;
            emailData.linesPMMarkup.push({ roleWriteIn: roleName, isOT: isOT, hours: hours, rate: rate });
        }
        for (var i = 0; i < this.conditions.length; i++) {
            if (this.conditions[i].checked()) {
                emailData.conditions.push(this.conditions[i].name);
            }
        }

        // Display Template Creation dialog
        model.templateCreation.displayDialog();

        postWrapper('api/v1/generatetemplate', ko.toJSON(emailData))
            .then(({ value }) => {
                if (value === true) {
                    //alert('Template generated');
                    model.templateCreation.setTemplateCreated();
                    $('#preview-link').removeClass('btn-disabled');
                    model.eyeLink(true);
                } else {
                    alert('Select template to generate it');
                }
            });

        //fetch(`api/v1/generatetemplate`,
        //    {
        //        method: 'POST',
        //        body: ,
        //        headers: { 'Content-Type': 'application/json' }
        //    }).then(res => res.json(emailData))
        //    .catch(error => console.error('Error:', error))
        //    .then(function (response) {
        //        if (response.value === true) {
        //            alert('Template generated');
        //            $('#preview-link').removeClass('btn-disabled');
        //            model.eyeLink(true);
        //        } else {
        //            alert('Select template to generate it');
        //        }
        //    }.bind(model));
    }.bind(model);

    model.sendEmail = function () {
        if (this.shiftCrews.crewSize() !== 0) {
            model.sendingEmail(true);
            console.log(model);
            var to = this.to;
            var template = this.template;
            if (model.useLSPRole) {
                to[0] = this.header.projectManagerEmail;
                template = "LSP";
            }

            var emailData = {
                quoteID: this.quoteID,
                customerContact: $("#contactSelect option:selected").html(),
                workRequest: this.header.description,
                numberOfShifts: this.shiftCrews.numberOfShifts,
                crewSize: parseFloat(this.shiftCrews.crewSize()),
                hoursPerShift: parseFloat(this.shiftCrews.hrsPerShift()),
                projectManager: this.header.projectManagerName,
                endUserName: this.header.endUserName,
                projectNo: this.header.project_No,
                requestNo: this.header.request_No,
                versionNo: this.header.version_No,
                lines: [],
                template: template,
                organizationID: this.organizationID,
                customerName: this.header.customerName,
                projectName: this.header.projectName,
                jobLocationAddress: this.header.jobLocationAddress,
                jobLocationContactName: this.header.jobLocationContactName,
                emailTestNotifyAddress: this.header.emailTestNotifyAddress,
                emailTestNotifyActive: this.header.emailTestNotifyActive,
                to: to,
                cc: this.cc,
                conditions: [],
                daysOnSite: parseFloat(model.shiftCrews.daysOnSite()),
                HDSQuoteNo: this.header.hdsQuoteNo,
                url: window.location.href
            };

            if (!model.useLSPRole) {
                if (this.to.length === 0) {
                    model.notificationDialog.displayDialog('Missing Email Recipients', 'Please include an email recipient ("To" field).');
                    model.sendingEmail(false);
                    return;
                }
                console.log(model.header.isRequestLSP);
                console.log(model.hasProjectMgmt);
                if (model.header.isRequestLSP) {
                    if (!model.hasProjectMgmt()) {
                        model.notificationDialog.displayDialog('Missing the Project Management ', 'Please include a Project Management to the Quote.');
                        model.sendingEmail(false);
                        return;
                    }

                }
            }


            postWrapper('api/v1/sendemail', ko.toJSON(emailData))
                .then(response => {
                    if (response.value === true) {
                        model.notificationDialog.displayDialog('Quote', 'Quote Email sent!', false, function () {
                            redirectToPage('/quote', { 'QuoteID': model.quoteID, 'OrganizationID': model.organizationID }, false);
                        });
                    } else {
                        model.notificationDialog.displayDialog('Missing Template', 'Select a template before sending the email.');
                    }
                    model.sendingEmail(false);
                })
                .finally(() => model.sendingEmail(false));

        } else {
            alert('"Hours Per Shift" and "Days Onsite" must have a value higher than zero.');
        }

    }.bind(model);

    model.popFromOpPlan = function () {
        fetch(`api/v1/popfromopplan?QuoteID=${model.quoteID}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                for (var i = 0; i < model.lines().length; i++) {
                    model.lines.remove(model.lines()[i]);
                }
                for (var i = 0; i < response.value.length; i++) {
                    model.lines.push({
                        quoteLineID: response.value[i].quoteLineID,
                        role_ID: ko.observable(response.value[i].role_ID),
                        isOT: ko.observable(response.value[i].isOT),
                        hours: ko.observable(response.value[i].hours),
                        rate: ko.observable(response.value[i].rate),
                        roleWriteIn: ko.observable(response.value[i].roleWriteIn),
                        realHours: ko.observable(response.value[i].isCrew ? response.value[i].hours : 0)
                    });
                    model.lines()[i].hours.subscribe(function () {
                        if (this.hours() == "") this.hours("0");
                        if (this.rate() == "") this.rate("0");
                        var updatedLine = {
                            quoteLineID: this.quoteLineID,
                            role_ID: this.role_ID,
                            isOT: this.isOT(),
                            hours: parseFloat(this.hours()),
                            rate: parseFloat(this.rate()),
                            roleWriteIn: this.roleWriteIn()
                        };
                        fetch('api/v1/updateline',
                            {
                                method: 'POST',
                                body: ko.toJSON(updatedLine),
                                headers: { 'Content-Type': 'application/json' }
                            }).then(res => res.json())
                            .catch(error => console.error('Error:', error))
                            .then(function (response) {
                                model.shiftCrews.numberOfShifts(parseFloat(response.value.numberOfShifts));
                                //model.shiftCrews.crewSize(parseFloat(response.value.crewSize));
                                model.updateShiftCrewsCrewSize(parseFloat(response.value.crewSize));
                            }.bind(model)
                            );
                    }.bind(model.lines()[i]));
                    model.lines()[i].rate.subscribe(function () {
                        if (this.hours() == "") this.hours("0");
                        if (this.rate() == "") this.rate("0");
                        var updatedLine = {
                            quoteLineID: this.quoteLineID,
                            role_ID: this.role_ID,
                            isOT: this.isOT(),
                            hours: parseFloat(this.hours()),
                            rate: parseFloat(this.rate()),
                            roleWriteIn: this.roleWriteIn()
                        };
                        fetch('api/v1/updateline',
                            {
                                method: 'POST',
                                body: ko.toJSON(updatedLine),
                                headers: { 'Content-Type': 'application/json' }
                            }).then(res => res.json())
                            .catch(error => console.error('Error:', error))
                            .then(function (response) {
                            }.bind(model)
                            );
                    }.bind(model.lines()[i]));
                    model.lines()[i].isOT.subscribe(function () {
                        var updatedLine = {
                            quoteLineID: this.quoteLineID,
                            role_ID: this.role_ID,
                            isOT: this.isOT(),
                            hours: parseFloat(this.hours()),
                            rate: parseFloat(this.rate()),
                            roleWriteIn: this.roleWriteIn()
                        };
                        fetch('api/v1/updateline',
                            {
                                method: 'POST',
                                body: ko.toJSON(updatedLine),
                                headers: { 'Content-Type': 'application/json' }
                            }).then(res => res.json())
                            .catch(error => console.error('Error:', error))
                            .then(function (response) {
                            }.bind(model)
                            );
                    }.bind(model.lines()[i]));
                    model.lines()[i].roleWriteIn.subscribe(function () {
                        var updatedLine = {
                            quoteLineID: this.quoteLineID,
                            role_ID: this.role_ID,
                            isOT: this.isOT(),
                            hours: parseFloat(this.hours()),
                            rate: parseFloat(this.rate()),
                            roleWriteIn: this.roleWriteIn()
                        };
                        fetch('api/v1/updateline',
                            {
                                method: 'POST',
                                body: ko.toJSON(updatedLine),
                                headers: { 'Content-Type': 'application/json' }
                            }).then(res => res.json())
                            .catch(error => console.error('Error:', error))
                            .then(function (response) {
                            }.bind(model)
                            );
                    }.bind(model.lines()[i]));
                    model.lines()[i].role_ID.subscribe(function () {
                        var updatedLine = {
                            quoteLineID: this.quoteLineID,
                            role_ID: this.role_ID,
                            isOT: this.isOT(),
                            hours: parseFloat(this.hours()),
                            rate: parseFloat(this.rate()),
                            roleWriteIn: this.roleWriteIn()
                        };
                        fetch('api/v1/updateline',
                            {
                                method: 'POST',
                                body: ko.toJSON(updatedLine),
                                headers: { 'Content-Type': 'application/json' }
                            }).then(res => res.json())
                            .catch(error => console.error('Error:', error))
                            .then(function (response) {
                            }.bind(model)
                            );
                    }.bind(model.lines()[i]));
                }
            }.bind(model)
            );
    }.bind(model);

    for (var i = 0; i < model.conditions.length; i++) {
        model.conditions[i].checked = ko.observable(model.conditions[i].checked);
        model.conditions[i].checked.subscribe(function () {
            fetch(`api/v1/updatecondition?quoteConditionID=${this.quoteConditionID}&checked=${this.checked()}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(error => console.error('Error:', error))
                .then(function (response) {
                }.bind(model));
        }.bind(model.conditions[i]));
    };

    model.showConditionsModal = ko.observable(null);
    model.showConditionsModalDialog = function (show) {
        if (show) {
            this.showConditionsModal(show);
        } else {
            this.showConditionsModal(null);
        }
    }.bind(model);

    //
    // Reload Quote Data (as a way to update Crew Size when passing from the OpPlan to the Quick Quote)
    //
    model.do_something = true; 

    model.validatePendingChanges = function (data,e) {
        if (oGrid != null) {
            if (oGrid.pendingChanges()) {
                e.preventDefault();
                if (model.do_something === true) {
                    e.stopPropagation();

                    model.notificationDialog.displayConfirmationDialog('Changes unsaved',
                        'There are unsaved changes in the operational plan. Do you want to continue without saving?',
                        () => {
                            model.do_something = false;
                            $(e.target).click();
                            model.do_something = true;
                        });
                }
                
            }

        }


    }
    model.reloadQuoteData = function () {
        alert('reloadQuoteData');
        model.do_something = true;
            getWrapper('/api/v1/quotedataselect', { 'QuoteID': model.quoteID })
                    .then(r => {
                        //model.shiftCrews.crewSize(r.value.crewSize);
                        model.updateShiftCrewsCrewSize(r.value.crewSize);
                        model.shiftCrews.daysOnSite(r.value.daysOnSite);
                        model.shiftCrews.hrsPerShift(r.value.hrsPerShift);
                    });
               
    };


    //
    // Template Generation Dialog
    //
    model.templateCreation = {
        isDialogDisplaying: ko.observable(false),
        templateGenerated: ko.observable(false),

        displayDialog: function () {
            this.templateGenerated(false);
            this.isDialogDisplaying(true);
        },
        setTemplateCreated: function () {
            this.templateGenerated(true);
        },
        closeDialog: function () {
            this.isDialogDisplaying(false);
        },
        openPreviewTemplatePage: function () {
            let url = `ProjectFiles/${model.header.project_No}/${model.header.request_No}/${model.header.version_No}/Quote${model.header.project_No}-${model.header.request_No}-${model.header.version_No}.html`;
            redirectToPage(url, {}, true);
            this.isDialogDisplaying(false);
        }
    }
    //
    //
    model.settingReadyToSchedule = ko.observable(false);
    model.setReadyToSchedule = function () {

        // Check that the SR LocationLookupID has been defined, if missing then inform
        // the user and prevent setting the Ready to Schedule status
        if (model.header.missingLocationInSR) {
            model.notificationDialog.displayConfirmationDialog('Cannot Set Ready to Schedule', model.header.missingLocationInSR,  function () {
                redirectToPage('/request', { 'RequestID': model.header.serviceRequestID, 'OrganizationID': model.organizationID }, false);
            }, { ok: 'Open SR', cancel: 'Close' });

            return false;
        }


        model.settingReadyToSchedule(true);

        getWrapper('api/v1/fillscheduler', { 'RequestID': model.serviceRequestID })
            .then(({ value }) => {
                if (value.code === "OK") {
                    redirectToPage('/request', { 'RequestID': model.serviceRequestID, 'OrganizationID': model.organizationID });
                } else {
                    model.settingReadyToSchedule(false);
                    model.notificationDialog.displayDialog('Scheduling Error', value.msg);
                }
            });
    }


    model.applyBootstrapStyles = function (elems) {
        $(elems).find('select').selectpicker('refresh');
    }.bind(model);

    model.numberWithCommas = function (x) {
        return Intl.NumberFormat('en-US').format(x);
    }.bind(model);

    model.buildQuoteRequestLink = ko.computed(function () {
        return `/Request?RequestID=${model.header.qrRequestId}&OrganizationID=${model.organizationID}`;
    });
    model.buildServiceRequestLink = ko.computed(function () {
        return `/Request?RequestID=${model.header.srRequestId}&OrganizationID=${model.organizationID}`;
    });

    // 
    // Day Roles Quantities handling
    //

    const addMultipleRecordsModal = {
        dayRoleAndQuantities: ko.observable([]),

        dayRoleAndQuantitiesCrew: ko.pureComputed(function () {
            return model.addMultipleRecordsModal.dayRoleAndQuantities().filter(r => r.isVehicle === false);
        }.bind(model.addMultipleRecordsModal)),

        dayRoleAndQuantitiesVehicles: ko.pureComputed(function () {
            return model.addMultipleRecordsModal.dayRoleAndQuantities().filter(r => r.isVehicle === true);
        }.bind(model.addMultipleRecordsModal)),

        quoteId: ko.observable(null),
        addMultipleRecordsDialogShown: ko.observable(null),

        mrStartDate: ko.observable(null),
        mrEndDate: ko.observable(null),
        mrOriginalStartDate: null,
        mrOriginalEndDate: null,
        mrHrsPerShift: ko.observable(null),
        mrHrsPerShiftOriginal: null,
        mrStartTime: ko.observable(null),
        mrOnSiteTime: ko.observable(null),
        mrDescription: ko.observable(null),
        mrOT: ko.observable(null),
        applyOTValue: ko.observable(false),

        savingChanges: ko.observable(false),

        showAddMultipleRecordsDialog: function () {

            getWrapper('/api/v1/quoteselectopbulkentrydefaults', { 'OrganizationID': model.organizationID, 'QuoteID': model.quoteID })
                .then(function (response) {
                    console.log(response);

                    this.mrStartDate(response.value.bulkEntry_DefaultStartDate);
                    this.mrEndDate(response.value.bulkEntry_DefaultEndDate);
                    this.mrOnSiteTime(response.value.bulkEntry_DefaultStartTime);
                    this.mrStartTime(response.value.bulkEntry_DefaultStartTime);
                    this.mrHrsPerShift(response.value.bulkEntry_DefaultHrsPerShift);

                }.bind(model.addMultipleRecordsModal));

            // Load day Role data
            getWrapper('/api/v1/quotesrolesandquantities', { 'QuoteID': model.quoteID })
                .then(function (response) {
                    console.log('Load day Role data:');
                    console.log(response);
                    // Make Quantity observable so it responds to the up/down controls 
                    response.forEach(r => r.quantity = ko.observable(r.quantity));
                    this.dayRoleAndQuantities(response);
                    // Display the modal
                    this.addMultipleRecordsDialogShown(true);
                }.bind(model.addMultipleRecordsModal));
        },

        closeDialog: function () {
            this.addMultipleRecordsDialogShown(false);
        },
        
        saveChanges: function () {
            this.savingChanges(true);
            //let quoteLineDayBulkEntry = null;
            console.log(this.applyOTValue());
            if (this.applyOTValue() === true) {
                let quoteLineDayBulkEntry = {
                    'quoteID': model.quoteID,
                    'StartDate': moment(this.mrStartDate()),
                    'EndDate': moment(this.mrEndDate()),
                    'onSiteTime': this.mrOnSiteTime(),
                    'startTime': this.mrStartTime(),
                    'description': this.mrDescription(),
                    'hoursOT': parseFloat(this.mrHrsPerShift()),
                    'organizationID': model.organizationID,
                    'rolesAndQtties': ko.toJS(this.dayRoleAndQuantities())
                };
                console.log(quoteLineDayBulkEntry);
                postWrapper('/api/v1/quotelinedaybulkinsert', ko.toJSON(quoteLineDayBulkEntry))
                    .then(response => {
                        this.addMultipleRecordsDialogShown(false);
                        oGrid.refresh();
                    }) // Hide the Modal
            }
            else {
                console.log('else');
                let quoteLineDayBulkEntry = {
                    'quoteID': model.quoteID,
                    'StartDate': moment(this.mrStartDate()),
                    'EndDate': moment(this.mrEndDate()),  
                    'onSiteTime': this.mrOnSiteTime(),
                    'startTime': this.mrStartTime(),
                    'description': this.mrDescription(),
                    'hoursReg': parseFloat(this.mrHrsPerShift()),
                    'organizationID': model.organizationID,
                    'rolesAndQtties': ko.toJS(this.dayRoleAndQuantities())
                };

                console.log(quoteLineDayBulkEntry);

                postWrapper('/api/v1/quotelinedaybulkinsert', ko.toJSON(quoteLineDayBulkEntry))
                    .then(response => {
                        this.addMultipleRecordsDialogShown(false);
                        oGrid.refresh();
                    }) // Hide the Modal
            }
        }
    }

    model.addMultipleRecordsModal = addMultipleRecordsModal;
    //
    //


    ko.bindingHandlers.showModal = ServiceTRAXBindingHandlers.showModal;
    ko.bindingHandlers.trumbowyg = ServiceTRAXBindingHandlers.trumbowyg;

    ko.applyBindings(model);
};
const customColumnPVEditor = {
    isDialogDisplaying: ko.observable(false),
    customField: ko.observable({}),
    customFieldOptions: ko.observableArray([]),
    selectedValueId: ko.observable(null),
    selectValueText: ko.observable(''),
    editionMode: ko.observable(false),
    insertMode: ko.observable(false),
    closeDialogCallback: null,
    shouldReload: false,

    displayDialog: function (customField, closeDialogCallback) {
        this.selectedValueId(null);
        this.customField(customField);
        this.customFieldOptions(customField.dropListOptions);
        this.editionMode(false);
        this.insertMode(false);
        this.shouldReload = false;
        this.closeDialogCallback = closeDialogCallback;
        // Show dialog
        this.isDialogDisplaying(true);
        // Load the options
        //this.updateListOptions();
    },
    closeDialog: function () {
        this.isDialogDisplaying(false);
        this.closeDialogCallback(this.shouldReload, this.customField().customCustColId, this.customField().customFieldID);
    },
    cleanFieldName: function (name) {
        if (name && name.length > 0) {
            return name.replace(':', '');
        }
        return '';
    },
    dropOptions: ko.pureComputed(function () {
        if (customColumnPVEditor.customFieldOptions) {
            return customColumnPVEditor.customFieldOptions().sort((a, b) => a.order - b.order);
        }
        return [];
    }),
    selectValue: function (value) {
        if (!(this.editionMode() || this.insertMode())) {
            if (value) {
                this.selectedValueId(value.id);
                this.selectValueText(value.name);
            } else {
                this.selectedValueId(null);
                this.selectValueText('');
            }
        }
    },
    openInsertMode: function () {
        this.selectValueText('');
        this.selectedValueId(null);
        this.insertMode(true);
    },
    moveUp: function () {
        if (this.selectedValueId()) {
            let values = this.dropOptions();
            let itemIndex = values.findIndex(e => e.id === this.selectedValueId());
            if (itemIndex > 0) {
                let prevOrder = values[itemIndex - 1].order;
                values[itemIndex - 1].order = values[itemIndex].order;
                values[itemIndex].order = prevOrder;
                this.customFieldOptions(values);

                this.updateOrderValues(values[itemIndex], values[itemIndex - 1]);
            }
        }
    },
    moveDown: function () {
        if (this.selectedValueId()) {
            let values = this.dropOptions();
            let itemIndex = values.findIndex(e => e.id === this.selectedValueId());
            if (itemIndex < values.length - 1) {
                let nextOrder = values[itemIndex + 1].order;
                values[itemIndex + 1].order = values[itemIndex].order;
                values[itemIndex].order = nextOrder;
                this.customFieldOptions(values);

                this.updateOrderValues(values[itemIndex], values[itemIndex + 1]);
            }
        }
    },
    updateOrderValues: function (v1, v2) {
        let values = {
            'customcollistid1': parseInt(v1.id),
            'sequence1': v1.order,
            'customcollistid2': parseInt(v2.id),
            'sequence2': v2.order
        };

        postWrapper('/api/v1/customfieldvaluewitchorder', ko.toJSON(values));
    },
    upDownEnable: function () {
        var _self = this;
        return ko.pureComputed(function () {
            return _self.selectedValueId() && !(_self.editionMode() || _self.insertMode());
        })
    },
    insertEnable: function () {
        var _self = this;
        return ko.pureComputed(function () {
            return !(_self.editionMode() || _self.insertMode());
        })
    },
    updateEnable: function () {
        var _self = this;
        return ko.pureComputed(function () {
            return _self.selectedValueId() && !(_self.editionMode() || _self.insertMode());
        })
    },
    insertValue: function () {
        console.log('Insert', this.customField(), this.selectValueText(), Math.max(...this.dropOptions().map(v => v.order)) + 10);

        let newValue = {
            'customColumnId': this.customField().customCustColId,
            'name': this.selectValueText(),
            'order': Math.max(...this.dropOptions().map(v => v.order)) + 10
        }

        postWrapper('/api/v1/customfieldvalueadd', ko.toJSON(newValue))
            .then((r) => {
                this.shouldReload = this.shouldReload | r.succeeded
            })
            .finally(() => { this.updateListOptions(); this.insertMode(false) });

    },
    updateValue: function () {
        console.log('Update', this.selectValueText(), this.selectedValueId());

        let updatedValue = {
            'customColumnId': parseInt(this.selectedValueId()),
            'name': this.selectValueText()
        }

        postWrapper('/api/v1/customfieldvalueupdate', ko.toJSON(updatedValue))
            .then((r) => {
                this.shouldReload = this.shouldReload | r.succeeded
            })
            .finally(() => { this.updateListOptions(); this.editionMode(false); });

    },
    deleteOption: function () {
        postWrapper('/api/v1/customfieldvaluedelete', parseInt(this.selectedValueId()))
            .then((r) => {
                this.shouldReload = this.shouldReload | r.succeeded
            })
            .finally(() => { this.updateListOptions(); });
    },
    updateListOptions: function () {
        getWrapper('/api/v1/customfieldvalues', { 'CustomColumnID': this.customField().customCustColId })
            .then(({ value }) => this.customFieldOptions(value));
    }
}
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, JSONModel, Fragment, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("arrows.cap.cli.clientmanager.web.clientmanagerweb.controller.Main", {
        onInit: function () {
            this._oClientDialog = null;
            this._sDialogMode = null;
            this._oEditContext = null;
        },

        onClientPress: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oContext = oItem.getBindingContext();
            const sClientId = oContext.getProperty("ID");

            this.getOwnerComponent().getRouter().navTo("RouteClientDetail", {
                clientId: sClientId
            });
        },

        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query");
            const oTable = this.byId("clientsTable");
            const oBinding = oTable.getBinding("items");

            if (!sQuery) {
                oBinding.filter([]);
                return;
            }

            const aFilters = [
                new Filter("code", FilterOperator.Contains, sQuery),
                new Filter("name", FilterOperator.Contains, sQuery),
                new Filter("description", FilterOperator.Contains, sQuery)
            ];

            oBinding.filter([
                new Filter({
                    filters: aFilters,
                    and: false
                })
            ]);
        },

        onCreateClient: function () {
            this._sDialogMode = "create";
            this._oEditContext = null;

            this._openClientDialog({
                title: "Nuevo cliente",
                code: "",
                name: "",
                description: ""
            });
        },

        onEditClient: function () {
            const oContext = this._getSelectedClientContext();

            if (!oContext) {
                MessageToast.show("Selecciona un cliente para editar.");
                return;
            }

            this._sDialogMode = "edit";
            this._oEditContext = oContext;

            this._openClientDialog({
                title: "Editar cliente",
                code: oContext.getProperty("code"),
                name: oContext.getProperty("name"),
                description: oContext.getProperty("description")
            });
        },

        onDeleteClient: function () {
            const oContext = this._getSelectedClientContext();

            if (!oContext) {
                MessageToast.show("Selecciona un cliente para eliminar.");
                return;
            }

            const sClientName = oContext.getProperty("name");

            MessageBox.confirm(`¿Deseas eliminar el cliente "${sClientName}"?`, {
                title: "Eliminar cliente",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.DELETE) {
                        return;
                    }

                    oContext.delete().then(function () {
                        MessageToast.show("Cliente eliminado correctamente.");
                    }).catch(function () {
                        MessageBox.error("No se pudo eliminar el cliente.");
                    });
                }
            });
        },

        onSaveClient: function () {
            const oDialogModel = this.getView().getModel("dialog");
            const oData = oDialogModel.getData();

            if (!oData.code || !oData.name) {
                MessageBox.warning("Código y nombre son obligatorios.");
                return;
            }

            if (this._sDialogMode === "create") {
                this._createClient(oData);
                return;
            }

            if (this._sDialogMode === "edit") {
                this._updateClient(oData);
            }
        },

        onCancelClientDialog: function () {
            if (this._oClientDialog) {
                this._oClientDialog.close();
            }
        },

        _createClient: function (oData) {
            const oModel = this.getView().getModel();
            const oListBinding = oModel.bindList("/Clients");

            const oContext = oListBinding.create({
                code: oData.code,
                name: oData.name,
                description: oData.description
            });

            oContext.created().then(function () {
                MessageToast.show("Cliente creado correctamente.");
                this._oClientDialog.close();
                this._refreshClientsTable();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo crear el cliente.");
            });
        },

        _updateClient: function (oData) {
            if (!this._oEditContext) {
                MessageBox.error("No se encontró el cliente a editar.");
                return;
            }

            this._oEditContext.setProperty("code", oData.code);
            this._oEditContext.setProperty("name", oData.name);
            this._oEditContext.setProperty("description", oData.description);

            this.getView().getModel().submitBatch("$auto").then(function () {
                MessageToast.show("Cliente actualizado correctamente.");
                this._oClientDialog.close();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo actualizar el cliente.");
            });
        },

        _openClientDialog: function (oDialogData) {
            const oDialogModel = new JSONModel(oDialogData);
            this.getView().setModel(oDialogModel, "dialog");

            if (this._oClientDialog) {
                this._oClientDialog.open();
                return;
            }

            Fragment.load({
                id: this.getView().getId(),
                name: "arrows.cap.cli.clientmanager.web.clientmanagerweb.fragment.ClientDialog",
                controller: this
            }).then(function (oDialog) {
                this._oClientDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
            }.bind(this));
        },

        _getSelectedClientContext: function () {
            const oTable = this.byId("clientsTable");
            const oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                return null;
            }

            return oSelectedItem.getBindingContext();
        },

        _refreshClientsTable: function () {
            const oTable = this.byId("clientsTable");
            const oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.refresh();
            }
        }
    });
});
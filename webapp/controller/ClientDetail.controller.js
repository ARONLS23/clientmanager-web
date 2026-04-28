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

    return Controller.extend("arrows.cap.cli.clientmanager.web.clientmanagerweb.controller.ClientDetail", {
        onInit: function () {
            this._oProjectDialog = null;
            this._sProjectDialogMode = null;
            this._oEditProjectContext = null;
            this._sClientId = null;

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteClientDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sClientId = oEvent.getParameter("arguments").clientId;
            this._sClientId = sClientId;

            this.getView().bindElement({
                path: `/Clients(${sClientId})`
            });

            this._filterProjects(sClientId);
        },

        _filterProjects: function (sClientId) {
            const oTable = this.byId("projectsTable");
            const oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            oBinding.filter([
                new Filter("client_ID", FilterOperator.EQ, sClientId)
            ]);
        },

        onCreateProject: function () {
            this._sProjectDialogMode = "create";
            this._oEditProjectContext = null;

            this._openProjectDialog({
                title: "Nuevo proyecto",
                code: "",
                name: "",
                description: "",
                startDate: "",
                endDate: "",
                status: "PLANNED"
            });
        },

        onEditProject: function () {
            const oContext = this._getSelectedProjectContext();

            if (!oContext) {
                MessageToast.show("Selecciona un proyecto para editar.");
                return;
            }

            this._sProjectDialogMode = "edit";
            this._oEditProjectContext = oContext;

            this._openProjectDialog({
                title: "Editar proyecto",
                code: oContext.getProperty("code"),
                name: oContext.getProperty("name"),
                description: oContext.getProperty("description"),
                startDate: oContext.getProperty("startDate"),
                endDate: oContext.getProperty("endDate"),
                status: oContext.getProperty("status")
            });
        },

        onDeleteProject: function () {
            const oContext = this._getSelectedProjectContext();

            if (!oContext) {
                MessageToast.show("Selecciona un proyecto para eliminar.");
                return;
            }

            const sProjectName = oContext.getProperty("name");

            MessageBox.confirm(`¿Deseas eliminar el proyecto "${sProjectName}"?`, {
                title: "Eliminar proyecto",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.DELETE) {
                        return;
                    }

                    oContext.delete().then(function () {
                        MessageToast.show("Proyecto eliminado correctamente.");
                    }).catch(function () {
                        MessageBox.error("No se pudo eliminar el proyecto.");
                    });
                }
            });
        },

        onSaveProject: function () {
            const oDialogModel = this.getView().getModel("projectDialog");
            const oData = oDialogModel.getData();

            if (!oData.code || !oData.name) {
                MessageBox.warning("Código y nombre son obligatorios.");
                return;
            }

            if (this._sProjectDialogMode === "create") {
                this._createProject(oData);
                return;
            }

            if (this._sProjectDialogMode === "edit") {
                this._updateProject(oData);
            }
        },

        onCancelProjectDialog: function () {
            if (this._oProjectDialog) {
                this._oProjectDialog.close();
            }
        },

        _createProject: function (oData) {
            const oModel = this.getView().getModel();
            const oListBinding = oModel.bindList("/Projects");

            const oContext = oListBinding.create({
                code: oData.code,
                name: oData.name,
                description: oData.description,
                startDate: oData.startDate || null,
                endDate: oData.endDate || null,
                status: oData.status,
                client_ID: this._sClientId
            });

            oContext.created().then(function () {
                MessageToast.show("Proyecto creado correctamente.");
                this._oProjectDialog.close();
                this._refreshProjectsTable();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo crear el proyecto.");
            });
        },

        _updateProject: function (oData) {
            if (!this._oEditProjectContext) {
                MessageBox.error("No se encontró el proyecto a editar.");
                return;
            }

            this._oEditProjectContext.setProperty("code", oData.code);
            this._oEditProjectContext.setProperty("name", oData.name);
            this._oEditProjectContext.setProperty("description", oData.description);
            this._oEditProjectContext.setProperty("startDate", oData.startDate || null);
            this._oEditProjectContext.setProperty("endDate", oData.endDate || null);
            this._oEditProjectContext.setProperty("status", oData.status);

            this.getView().getModel().submitBatch("$auto").then(function () {
                MessageToast.show("Proyecto actualizado correctamente.");
                this._oProjectDialog.close();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo actualizar el proyecto.");
            });
        },

        _openProjectDialog: function (oDialogData) {
            const oDialogModel = new JSONModel(oDialogData);
            this.getView().setModel(oDialogModel, "projectDialog");

            if (this._oProjectDialog) {
                this._oProjectDialog.open();
                return;
            }

            Fragment.load({
                id: this.getView().getId(),
                name: "arrows.cap.cli.clientmanager.web.clientmanagerweb.fragment.ProjectDialog",
                controller: this
            }).then(function (oDialog) {
                this._oProjectDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
            }.bind(this));
        },

        _getSelectedProjectContext: function () {
            const oTable = this.byId("projectsTable");
            const oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                return null;
            }

            return oSelectedItem.getBindingContext();
        },

        _refreshProjectsTable: function () {
            const oTable = this.byId("projectsTable");
            const oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.refresh();
            }
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        }
    });
});
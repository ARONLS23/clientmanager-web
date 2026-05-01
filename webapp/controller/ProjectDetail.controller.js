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

    return Controller.extend("arrows.cap.cli.clientmanager.web.clientmanagerweb.controller.ProjectDetail", {
        onInit: function () {
            this._sClientId = null;
            this._sProjectId = null;

            this._oMemberDialog = null;
            this._sMemberDialogMode = null;
            this._oEditMemberContext = null;

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteProjectDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments");

            this._sClientId = oArgs.clientId;
            this._sProjectId = oArgs.projectId;

            this.getView().bindElement({
                path: `/Projects(${this._sProjectId})`
            });

            this._filterProjectContent(this._sProjectId);
        },

        _filterProjectContent: function (sProjectId) {
            this._filterTableByProject("membersTable", sProjectId);
            this._filterTableByProject("tasksTable", sProjectId);
            this._filterTableByProject("documentsTable", sProjectId);
        },

        _filterTableByProject: function (sTableId, sProjectId) {
            const oTable = this.byId(sTableId);
            const oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            oBinding.filter([
                new Filter("project_ID", FilterOperator.EQ, sProjectId)
            ]);
        },

        onCreateMember: function () {
            this._sMemberDialogMode = "create";
            this._oEditMemberContext = null;

            this._openMemberDialog({
                title: "Nuevo miembro",
                fullName: "",
                email: "",
                role: ""
            });
        },

        onEditMember: function () {
            const oContext = this._getSelectedMemberContext();

            if (!oContext) {
                MessageToast.show("Selecciona un miembro para editar.");
                return;
            }

            this._sMemberDialogMode = "edit";
            this._oEditMemberContext = oContext;

            this._openMemberDialog({
                title: "Editar miembro",
                fullName: oContext.getProperty("fullName"),
                email: oContext.getProperty("email"),
                role: oContext.getProperty("role")
            });
        },

        onDeleteMember: function () {
            const oContext = this._getSelectedMemberContext();

            if (!oContext) {
                MessageToast.show("Selecciona un miembro para eliminar.");
                return;
            }

            const sMemberName = oContext.getProperty("fullName");

            MessageBox.confirm(`¿Deseas eliminar el miembro "${sMemberName}"?`, {
                title: "Eliminar miembro",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.DELETE) {
                        return;
                    }

                    oContext.delete().then(function () {
                        MessageToast.show("Miembro eliminado correctamente.");
                        this._refreshMembersTable();
                    }.bind(this)).catch(function () {
                        MessageBox.error("No se pudo eliminar el miembro.");
                    });
                }.bind(this)
            });
        },

        onSaveMember: function () {
            const oDialogModel = this.getView().getModel("memberDialog");
            const oData = oDialogModel.getData();

            if (!oData.fullName || !oData.email || !oData.role) {
                MessageBox.warning("Nombre, correo y rol son obligatorios.");
                return;
            }

            if (this._sMemberDialogMode === "create") {
                this._createMember(oData);
                return;
            }

            if (this._sMemberDialogMode === "edit") {
                this._updateMember(oData);
            }
        },

        onCancelMemberDialog: function () {
            if (this._oMemberDialog) {
                this._oMemberDialog.close();
            }
        },

        _createMember: function (oData) {
            const oModel = this.getView().getModel();
            const oListBinding = oModel.bindList("/ProjectMembers");

            const oContext = oListBinding.create({
                fullName: oData.fullName,
                email: oData.email,
                role: oData.role,
                project_ID: this._sProjectId
            });

            oContext.created().then(function () {
                MessageToast.show("Miembro creado correctamente.");
                this._oMemberDialog.close();
                this._refreshMembersTable();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo crear el miembro.");
            });
        },

        _updateMember: function (oData) {
            if (!this._oEditMemberContext) {
                MessageBox.error("No se encontró el miembro a editar.");
                return;
            }

            this._oEditMemberContext.setProperty("fullName", oData.fullName);
            this._oEditMemberContext.setProperty("email", oData.email);
            this._oEditMemberContext.setProperty("role", oData.role);

            this.getView().getModel().submitBatch("$auto").then(function () {
                MessageToast.show("Miembro actualizado correctamente.");
                this._oMemberDialog.close();
                this._refreshMembersTable();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo actualizar el miembro.");
            });
        },

        _openMemberDialog: function (oDialogData) {
            const oDialogModel = new JSONModel(oDialogData);
            this.getView().setModel(oDialogModel, "memberDialog");

            if (this._oMemberDialog) {
                this._oMemberDialog.open();
                return;
            }

            Fragment.load({
                id: this.getView().getId(),
                name: "arrows.cap.cli.clientmanager.web.clientmanagerweb.fragment.ProjectMemberDialog",
                controller: this
            }).then(function (oDialog) {
                this._oMemberDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
            }.bind(this));
        },

        _getSelectedMemberContext: function () {
            const oTable = this.byId("membersTable");
            const oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                return null;
            }

            return oSelectedItem.getBindingContext();
        },

        _refreshMembersTable: function () {
            const oTable = this.byId("membersTable");
            const oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.refresh();
            }
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteClientDetail", {
                clientId: this._sClientId
            });
        }
    });
});
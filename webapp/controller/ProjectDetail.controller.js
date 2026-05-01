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

            this._oTaskDialog = null;
            this._sTaskDialogMode = null;
            this._oEditTaskContext = null;

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

        onCreateTask: function () {
            this._sTaskDialogMode = "create";
            this._oEditTaskContext = null;

            this._openTaskDialog({
                title: "Nueva tarea",
                taskTitle: "",
                description: "",
                status: "PENDING",
                priority: "MEDIUM",
                dueDate: "",
                assignee_ID: ""
            });
        },

        onEditTask: function () {
            const oContext = this._getSelectedTaskContext();

            if (!oContext) {
                MessageToast.show("Selecciona una tarea para editar.");
                return;
            }

            this._sTaskDialogMode = "edit";
            this._oEditTaskContext = oContext;

            this._openTaskDialog({
                title: "Editar tarea",
                taskTitle: oContext.getProperty("title"),
                description: oContext.getProperty("description"),
                status: oContext.getProperty("status"),
                priority: oContext.getProperty("priority"),
                dueDate: oContext.getProperty("dueDate"),
                assignee_ID: oContext.getProperty("assignee_ID")
            });
        },

        onDeleteTask: function () {
            const oContext = this._getSelectedTaskContext();

            if (!oContext) {
                MessageToast.show("Selecciona una tarea para eliminar.");
                return;
            }

            const sTaskTitle = oContext.getProperty("title");

            MessageBox.confirm(`¿Deseas eliminar la tarea "${sTaskTitle}"?`, {
                title: "Eliminar tarea",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.DELETE) {
                        return;
                    }

                    oContext.delete().then(function () {
                        MessageToast.show("Tarea eliminada correctamente.");
                        this._refreshTasksTable();
                    }.bind(this)).catch(function () {
                        MessageBox.error("No se pudo eliminar la tarea.");
                    });
                }.bind(this)
            });
        },

        onSaveTask: function () {
            const oDialogModel = this.getView().getModel("taskDialog");
            const oData = oDialogModel.getData();

            if (!oData.taskTitle || !oData.status || !oData.priority) {
                MessageBox.warning("Título, estado y prioridad son obligatorios.");
                return;
            }

            if (this._sTaskDialogMode === "create") {
                this._createTask(oData);
                return;
            }

            if (this._sTaskDialogMode === "edit") {
                this._updateTask(oData);
            }
        },

        onCancelTaskDialog: function () {
            if (this._oTaskDialog) {
                this._oTaskDialog.close();
            }
        },

        _createTask: function (oData) {
            const oModel = this.getView().getModel();
            const oListBinding = oModel.bindList("/Tasks");

            const oContext = oListBinding.create({
                title: oData.taskTitle,
                description: oData.description,
                status: oData.status,
                priority: oData.priority,
                dueDate: oData.dueDate || null,
                project_ID: this._sProjectId
            });

            oContext.created().then(function () {
                MessageToast.show("Tarea creada correctamente.");
                this._oTaskDialog.close();
                this._refreshTasksTable();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo crear la tarea.");
            });
        },

        _updateTask: function (oData) {
            if (!this._oEditTaskContext) {
                MessageBox.error("No se encontró la tarea a editar.");
                return;
            }

            this._oEditTaskContext.setProperty("title", oData.taskTitle);
            this._oEditTaskContext.setProperty("description", oData.description);
            this._oEditTaskContext.setProperty("status", oData.status);
            this._oEditTaskContext.setProperty("priority", oData.priority);
            this._oEditTaskContext.setProperty("dueDate", oData.dueDate || null);

            this.getView().getModel().submitBatch("$auto").then(function () {
                MessageToast.show("Tarea actualizada correctamente.");
                this._oTaskDialog.close();
                this._refreshTasksTable();
            }.bind(this)).catch(function () {
                MessageBox.error("No se pudo actualizar la tarea.");
            });
        },

        _openTaskDialog: function (oDialogData) {
            const oDialogModel = new JSONModel(oDialogData);
            this.getView().setModel(oDialogModel, "taskDialog");

            if (this._oTaskDialog) {
                this._oTaskDialog.open();
                return;
            }

            Fragment.load({
                id: this.getView().getId(),
                name: "arrows.cap.cli.clientmanager.web.clientmanagerweb.fragment.ProjectTaskDialog",
                controller: this
            }).then(function (oDialog) {
                this._oTaskDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
            }.bind(this));
        },

        _getSelectedTaskContext: function () {
            const oTable = this.byId("tasksTable");
            const oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                return null;
            }

            return oSelectedItem.getBindingContext();
        },

        _refreshTasksTable: function () {
            const oTable = this.byId("tasksTable");
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
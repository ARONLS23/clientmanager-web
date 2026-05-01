sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("arrows.cap.cli.clientmanager.web.clientmanagerweb.controller.ProjectDetail", {
        onInit: function () {
            this._sClientId = null;
            this._sProjectId = null;

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

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteClientDetail", {
                clientId: this._sClientId
            });
        }
    });
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("arrows.cap.cli.clientmanager.web.clientmanagerweb.controller.ClientDetail", {
        onInit: function () {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteClientDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sClientId = oEvent.getParameter("arguments").clientId;

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

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        }
    });
});
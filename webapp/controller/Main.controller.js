sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("arrows.cap.cli.clientmanager.web.clientmanagerweb.controller.Main", {
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
        }
    });
});
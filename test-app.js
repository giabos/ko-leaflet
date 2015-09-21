ko.applyBindings({
    center: [ko.observable(50.81057), ko.observable(4.93622)],
    zoom: ko.observable(15),
    markers: ko.observableArray([{
        center: [ko.observable(50.81057), ko.observable(4.93622)],
        title: ko.observable("hello"),
        draggable: true
    }]),
    addMarker: function() {
        this.markers.push({
            center: [ko.observable(50.81), ko.observable(4.93)],
            title: ko.observable("new"),
            draggable: true,
            color: 'red'
        });
    },
    removeMarker: function() {
        this.markers.splice(0, 1);
    }
});
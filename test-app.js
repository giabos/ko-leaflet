ko.applyBindings({
    center: [ko.observable(50.81057), ko.observable(4.93622)],
    zoom: ko.observable(15),
    markers: ko.observableArray([{
        center: [ko.observable(50.81057), ko.observable(4.93622)],
        text: ko.observable("hello"),
        draggable: true,
        opacity: 0.4,
        opened: ko.observable(false)
    }]),
    addMarker: function() {
        this.markers.push({
            center: [ko.observable(50.81), ko.observable(4.93)],
            text: ko.observable("new"),
            draggable: true,
            color: 'green',
            opened: ko.observable(false)
        });
    },
    removeMarker: function(i) {
        this.markers.splice(i, 1);
    }
});

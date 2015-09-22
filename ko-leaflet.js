/* global ko, L, console */

(function (ko, L) {
    
    var each = ko.utils.arrayForEach;
    
    function Subscriptions () {
        this.list = [];    
    }
    Subscriptions.prototype.add = function (subscr) {
        this.list.push(subscr);
    };
    
    Subscriptions.prototype.dispose = function () {
        each(this.list, function (subscr) { subscr.dispose()  });
    };
    
    // 'm' contains following observables: center (array containing [lat, lng]), draggable, title.
    var Marker = function(m, map, element) {
        var self = this;
        self.subscriptions = [];
        
        self.centerM = ko.computed({
            read: function() {
                return [ko.unwrap(m.center[0]), ko.unwrap(m.center[1])];
            },
            write: function (center) {
                m.center[0](center.lat);
                m.center[1](center.lng);
            }
        }, null, { disposeWhenNodeIsRemoved: element });
        self.subscriptions.push(self.centerM);
        self.marker = L.marker(ko.unwrap(self.centerM), {
            title: ko.unwrap(m.title),
            draggable: ko.unwrap(m.draggable || false)
        });
        self.marker.addTo(map);
        self.marker.on('dragend', function() {
            self.centerM(self.marker.getLatLng());
        });
        self.subscriptions.push(self.centerM.subscribe(function() {
            self.marker.setLatLng(ko.unwrap(self.centerM));
        }));

        //marker.setIcon(L.divIcon({className: 'icon'}));        

        self.subscriptions.push(m.title.subscribe(function() {
            self.marker.title = ko.unwrap(m.title);
        }));
        this.map = map;
    };    
    
    Marker.prototype.dispose = function () {
        // TODO (remove all events & subscriptions)
        each(this.subscriptions, function (subscription) { subscription.dispose(); })
        this.map.removeLayer(this.marker);
    };
    
 
    
    ko.bindingHandlers.leafletMap = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var center = valueAccessor(),
                zoom = allBindings.get('zoom') || 10,
                markers = allBindings.get('markers');
    
            var mapCenter = ko.computed({
                read: function() {
                    return [ko.unwrap(center[0]), ko.unwrap(center[1])];
                },
                write: function (newCenter) {
                    center[0](newCenter.lat);
                    center[1](newCenter.lng);
                }
            }, null, { disposeWhenNodeIsRemoved: element });
    
            var map = L.map(element).setView(ko.unwrap(mapCenter), ko.unwrap(zoom));
            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: 'osm.org'
            }).addTo(map);
    
            mapCenter.subscribe(function() {
                map.setView(ko.unwrap(mapCenter));
            });
            map.on('dragend', function() {
                mapCenter(map.getCenter());
            });
    
    
            if (ko.isObservable(zoom)) {
                zoom.subscribe(function() {
                    map.setZoom(ko.unwrap(zoom));
                });
                map.on('zoomend', function () { zoom(map.getZoom()); });
            }
    
            var markersList = [];
            each(ko.unwrap(markers), function (m, idx) { markersList.push(new Marker(m, map, element));  });
    
            // http://stackoverflow.com/questions/14149551/subscribe-to-observable-array-for-new-or-removed-entry-only
            markers.subscribe(function(changes) {
                each(changes, function(c) {
                    if (c.status === "added") {
                        markersList[c.index] = new Marker(c.value, map, element);
                    }
                    if (c.status === "deleted") {
                        markersList[c.index].dispose();
                        markersList.splice(c.index, 1);
                    }
                });
    
            }, this, "arrayChange");
    
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                // TODO: dispose all subscriptions & events.
                each(markersList, function (m) { m.dispose();  });
            });
    
            
        }
    };
    
}) (ko, L); 



    
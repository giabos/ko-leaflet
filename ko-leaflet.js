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
    
    

    
    ko.bindingHandlers.leafletMap = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    
            var value = valueAccessor(),
                zoom = allBindings.get('zoom') || 10,
                markers = allBindings.get('markers');
    
            var center = ko.computed(function() {
                return [ko.unwrap(value[0]), ko.unwrap(value[1])];
            });
    
            this.map = L.map(element).setView(ko.unwrap(center), ko.unwrap(zoom));
            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: 'osm.org'
            }).addTo(this.map);
    
            map.on('dragend', function() {
                //value[0](map.getCenter().lat);
                //value[1](map.getCenter().lng);
    
                console.log(map.getCenter().lat, map.getCenter().lng);
            });
    
    
            center.subscribe(function() {
                map.setView(ko.unwrap(center));
            });
            if (ko.isObservable(zoom)) {
                zoom.subscribe(function() {
                    console.log("zoom");
                    map.setZoom(ko.unwrap(zoom));
                });
            }
    
            var setMarker = function(m, idx) {
                var centerM = ko.computed(function() {
                    return [ko.unwrap(m.center[0]), ko.unwrap(m.center[1])];
                });
                var marker = L.marker(ko.unwrap(centerM), {
                    title: ko.unwrap(m.title),
                    draggable: ko.unwrap(m.draggable)
                });
                marker.addTo(this.map);
    
                //marker.setIcon(L.divIcon({className: 'icon'}));        
    
    
    
                console.log("added to map");
                centerM.subscribe(function() {
                    marker.setLatLng(ko.unwrap(centerM));
                });
                m.title.subscribe(function() {
                    //map.setTitle(ko.unwrap(m.title));
                });
                this.markers[idx] = marker;
                marker.on('dragend', function() {
                    console.log(marker.getLatLng());
                });
            };
    
            this.markers = [];
            each(ko.unwrap(markers), setMarker);
    
            // http://stackoverflow.com/questions/14149551/subscribe-to-observable-array-for-new-or-removed-entry-only
            markers.subscribe(function(changes) {
                console.log(changes);
                each(changes, function(c) {
                    if (c.status === "added") {
                        setMarker(c.value, c.index);
                    }
                    if (c.status === "deleted") {
                        this.map.removeLayer(this.markers[c.index]);
                        this.markers.splice(c.index, 1);
                    }
                });
    
            }, this, "arrayChange");
    
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                // TODO
            });
    
    
        }
    };
    
    
    
}) (ko, L); 



    
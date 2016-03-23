/* global ko, L, console */

(function (ko, L) {
    //"use strict";
    
    var each = ko.utils.arrayForEach;
    
    // 'm' contains following observables: center (array containing [lat, lng]), draggable, title, text
    var Marker = function(m, map) {
        var self = this;
        
        self.eventHandlers = []; // array of objects: target, eventName, handler
        
        self.centerM = ko.computed({
            read: function() {
                return [ko.unwrap(m.center[0]), ko.unwrap(m.center[1])];
            },
            write: function (center) {
                m.center[0](center.lat);
                m.center[1](center.lng);
            }
        });
        
        var title = ko.isObservable(m.title) ? m.title : ko.observable(m.title);
        var text = ko.isObservable(m.text) ? m.text : ko.observable(m.text);
        
        // Create marker in leaflet.
        self.marker = L.marker(ko.unwrap(self.centerM), {
            title: ko.unwrap(title || '----'),
            draggable: ko.unwrap(m.draggable || false),
            opacity: m.opacity || 1.0
        });
        self.marker.addTo(map);
        self.marker.bindPopup(ko.unwrap(text));
        var popup = self.marker.getPopup()        

        if (ko.unwrap(m.draggable || false)) {
            self.marker.on('dragend', function(evt) {
                self.eventHandlers.push({target: evt.target, eventName: evt.type, handler: arguments.callee});
                self.centerM(self.marker.getLatLng());
            });
        }
        
        self.subscriptions = [
            self.centerM.subscribe(function() {
                self.marker.setLatLng(ko.unwrap(self.centerM));
            }),
            title.subscribe(function() {
                self.marker.title = ko.unwrap(title);
            }),
            text.subscribe(function () {
                popup.setContent(ko.unwrap(text));
            })
        ];
        self.subscriptions.push(self.centerM);
        
        //marker.setIcon(L.divIcon({className: 'icon'}));        

        
        this.map = map;
    };    
    
    Marker.prototype.dispose = function () {
        // remove all events & subscriptions.
        each (this.eventHandlers, function (eh) {  eh.target.removeEventListener(eh.eventName, eh.handler); });
        each(this.subscriptions, function (subscription) { subscription.dispose(); });
        this.map.removeLayer(this.marker);
    };
    
    ko.bindingHandlers.leafletMap = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var center = valueAccessor(),
                zoom = allBindings.get('zoom') || 10,
                markers = allBindings.get('markers'),
                eventHandlers = []; // array of objects: target, eventName, handler
    
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
    
            var subscriptions = [
                mapCenter.subscribe(function() {
                    map.setView(ko.unwrap(mapCenter));
                })
            ];
            map.on('dragend', function(evt) {
                eventHandlers.push({target: evt.target, eventName: evt.type, handler: arguments.callee});
                mapCenter(map.getCenter());
            });
    
    
            if (ko.isObservable(zoom)) {
                var subsc = zoom.subscribe(function() {
                    map.setZoom(ko.unwrap(zoom));
                });
                subscriptions.push(subsc);
                map.on('zoomend', function (evt) {
                    eventHandlers.push({target: evt.target, eventName: evt.type, handler: arguments.callee}); 
                    zoom(map.getZoom()); 
                });
            }
    
            var markersList = [];
            each(ko.unwrap(markers), function (m, idx) { markersList.push(new Marker(m, map));  });
    
            // http://stackoverflow.com/questions/14149551/subscribe-to-observable-array-for-new-or-removed-entry-only
            var subscr = markers.subscribe(function(changes) {
                each(changes, function(c) {
                    if (c.status === "added") {
                        markersList[c.index] = new Marker(c.value, map);
                    }
                    if (c.status === "deleted") {
                        markersList[c.index].dispose();
                    }
                });
                // delete after that all have been disposed otherwise cannot be accessed anymore via 'index'.
                each(changes.reverse(), function(c) {
                    if (c.status === "deleted") {
                        markersList.splice(c.index, 1);
                    }
                });
    
            }, this, "arrayChange");
            subscriptions.push(subscr);
    
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                // dispose all subscriptions & events.
                each (eventHandlers, function (eh) {  eh.target.removeEventListener(eh.eventName, eh.handler); });
                each(markersList, function (m) { m.dispose();  });
                each(subscriptions, function (subscription) { subscription.dispose(); });
            });
    
        }
    };
    
}) (ko, L); 



    

/**
 * Created by sschrottner on 13.09.2015.
 */
var brewBerry = brewBerry || {};
brewBerry.services = brewBerry.services || {}
brewBerry.services.temps = (function () {
    var sensors = {};
    var onSensorAddedMethods = {};
    var onTempAddedMethods = {};
    var publicMethods = {
        'onAdded': onAdded,
        "onTempAdded": listenOnTempAdded,
        'sensors': sensors,
        'load': load
    };

    function init() {
    }

    function load() {
        io.socket.on('sensors', onIOEvent);
        io.socket.get("/sensors", function (data) {
            this.sensors = {};
            console.log(data);
            if (data !== undefined) {
                for (var i = 0; i < data.length; i++) {
                    add(data[i]);
                }
            }
        });
    }

    function onAdded(name, action, recursive) {
        onSensorAddedMethods[name] = action;
        if (recursive) {
            for (var i in  sensors) {
                onSensorAddedMethods[name](sensors[i]);
            }
        }
    }

    function listenOnTempAdded(name, action, recursive) {
        onTempAddedMethods[name] = action;
        if (recursive) {
            for (var i in  sensors) {
                try {
                    onTempAddedMethods[name](sensors[i]);
                }catch(e){

                }
            }
        }
    }

    function add(data) {
        console.log(data)
        var key = data.id;
        sensors[key] = data;

        io.socket.on('temps', tempsEvent);
        io.socket.get("/temps", {sensor: key, brewTime: {">": new Date()}}, function (resData) {
            console.log(resData);
        });

        for (var meth in onSensorAddedMethods) {
            onSensorAddedMethods[meth](data);
        }
    }

    function onIOEvent(obj) {
        console.log(onIOEvent);
        if (obj.verb == 'created') {
            var data = obj.data;
            add(data);
        }
    }

    function addTemp(data) {
        for (var meth in onTempAddedMethods) {
            onTempAddedMethods[meth](data);
        }
    }

    function tempsEvent(obj) {
        if (obj.verb == 'created') {
            var data = obj.data;
            addTemp(data);
        }
    }
    $(init)
    return publicMethods;
})
();

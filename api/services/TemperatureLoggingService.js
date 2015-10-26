/**
 * Created by sschrottner on 30.11.2014.
 */

var sense = require('ds18b20');

var Promise = require('bluebird');
var oldV = {};

var TemperatureService = {

    getAllSensors: function (callback, options) {
        if (sails.config.environment === 'development' && false) {
            return Sensors.find();
        } else {
            return sense.sensors()
                    .then(function (err, ids) {
                        console.log("sensor ids");
                        console.log(ids);
                        return Sensors.findBySysname(ids)
                    });
        }
    },

    intervall: function () {
        setInterval(function () {
            Sensors.update({}, {connected: false})
                    .then(function () {
                        var sensors = Promise.promisify(sense.sensors);
                        return sensors();
                    })
                    .then(function (ids) {
                        var val = [];
                        var search = [];
                        for (var i in ids) {
                            var ele = {};
                            ele.name = ids[i];
                            ele.sysName = ids[i];
                            ele.connected = true;
                            var se = {};
                            se.sysName = ids[i];
                            val.push(ele);
                            search.push(se)
                        }
                        return Sensors.findOrCreate(search, val);
                    }).then(function (sensors) {
                        console.log("updating sensors to set connected", sensors)
                        return Sensors.update(sensors,{connected: true})
                    }).then(function (sensors) {
                        console.log("get all running", sensors);
                        return Sensors.find({running: true, connected: true})
                    })
                    .then(function (sensors) {
                        console.log("get temp", sensors);
                        for (var s in sensors) {

                            console.log("logging temp for",s);
                            if (sails.config.environment === 'development' && false) {
                                if (oldV[sensors[s].id] === undefined) {
                                    oldV[sensors[s].id] = 50;
                                }
                                var f = 1;
                                var value = Math.random() * 5;
                                if (Math.random() > 0.5) {
                                    f = -1;
                                }
                                value = oldV[sensors[s].id] + (value * f);
                                oldV[sensors[s].id] = value;
                                TemperatureService.createTemp(value, sensors[s])
                            } else {
                                sense.temperature(sensors[s].sysName, function (err, value) {
                                    TemperatureService.createTemp(value, sensors[s])
                                })
                            }
                        }
                    });
        }, sails.config.brewberry.interval);
    },

    stop: function () {
        return Sensors.find()
                .then(function (sensors) {
                    var ids = [];
                    for (var sensor in sensors) {
                        ids.push(sensors[sensor].id)
                    }
                    console.log(sensors, ids)
                    return Sensors.update(ids, {running: false})
                })
    },

    start: function () {
        return Sensors.find()
                .then(function (sensors) {
                    var ids = [];
                    for (var sensor in sensors) {
                        ids.push(sensors[sensor].id)
                    }
                    console.log(sensors, ids)
                    return Sensors.update(ids, {running: true})
                })
    },

    createTemp: function (temp, sensor) {
        Temps.create({temp: temp, brewTime: new Date(), sensor: sensor.id})
                .then(function (temp) {
                    return Temps.findOneById(temp.id).populateAll()
                })
                .then(Temps.publishCreate);
    }
};

module.exports = TemperatureService;

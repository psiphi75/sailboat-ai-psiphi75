/*********************************************************************
 *                                                                   *
 *   Copyright 2016 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

var util = require('sailboat-utils/util');

function Velocity(params) {

    // params: {
    //     minOkay: 0.5,   // (m/s) All velocities below this point are okay
    //     maxAccel: 2,    // (m/2^2) The maximum acceleration of the velocity
    //     maxIgnores: 5   // We will drop a bad velocity, but not more than maxIgnores
    // }
    var lastGPS;
    var numIgnores = 0;
    var dtMilliSec = 0;
    var lastVelocity = { speed: 0, direction: 0 };

    return function(gps, dt_ms) {
        var isReasonable = false;
        dtMilliSec += dt_ms;
        if (!lastGPS) {
            lastGPS = gps;
            isReasonable = true;
        }

        var velocity = util.getVelocityFromDeltaLatLong(lastGPS.latitude, lastGPS.longitude, gps.latitude, gps.longitude, dtMilliSec);

        var acceleration = Math.abs(velocity.speed - lastVelocity.speed) / (dtMilliSec / 1000);

        if (velocity.speed < params.minOkay) {
            isReasonable = true;
        } else if (acceleration < params.maxAccel) {
            isReasonable = true;
        } else if (numIgnores >= params.maxIgnores) {
            isReasonable = true;
        }

        if (!isReasonable) {
            numIgnores += 1;
            return null;
        }

        dtMilliSec = 0;
        numIgnores = 0;
        lastGPS = gps;
        velocity.direction = velocity.heading;
        delete velocity.heading;
        lastVelocity = velocity;
        return util.clone(velocity);

    };
}

module.exports = Velocity;

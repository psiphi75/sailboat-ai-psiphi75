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

// These two determine the best angle for the boat based on the given wind.
var SIDE_WIND_THRESH = 60;
var AFT_WIND_THRESH = 120;
var CHANGE_ANGLE_THRESH = 15; // When changing between fore/side/aft-winds, we need an extra thresh

function SailingMode() {

    var currentMode = null;

    /**
     * Calculate the next mode we are to be in.
     * @param  {WaypointManager} waypoints  The waypoints.
     * @param  {Position} myPosition
     * @param  {object} wind                Details of the actual wind.
     * @return {string}                     The mode to be in.
     */
    return {

        get: function (waypoints, myPosition, wind) {
            var headingToNextWP = myPosition.distanceHeadingTo(waypoints.getCurrent()).heading;
            var windDirection = util.wrapDegrees(wind.heading - 180);
            var diffAngle = Math.abs(util.wrapDegrees(windDirection - headingToNextWP));
            if (isNaN(diffAngle)) {
                console.error('getNextMode(): we have a NaN');
                return currentMode;
            }

            // Only change the mode if we really need to
            var newMode = calcMode(diffAngle);
            if (newMode.isCertain || currentMode === null) {
                currentMode = newMode.mode;
            }
            return currentMode;
        },

        reset: function () {
            currentMode = null;
        }
    };

    /**
     * Check if we need to change the mode.
     * @param  {number} angle The angle we want to calculate the mode for
     * @return {object}       {isCertain:boolean, mode:string}: isCertain is true if we really need to change the mode.
     */
    function calcMode(angle) {
        var isCertain = true;
        var mode;
        if (angle <= SIDE_WIND_THRESH - CHANGE_ANGLE_THRESH) {
            isCertain = true;
            mode = 'fore-wind';
        } else if (angle <= SIDE_WIND_THRESH) {
            isCertain = false;
            mode = 'fore-wind';
        } else if (angle <= SIDE_WIND_THRESH + CHANGE_ANGLE_THRESH) {
            isCertain = false;
            mode = 'side-wind';
        } else if (angle <= AFT_WIND_THRESH - CHANGE_ANGLE_THRESH) {
            isCertain = true;
            mode = 'side-wind';
        } else if (angle <= AFT_WIND_THRESH) {
            isCertain = false;
            mode = 'side-wind';
        } else if (angle <= AFT_WIND_THRESH + CHANGE_ANGLE_THRESH) {
            isCertain = false;
            mode = 'aft-wind';
        } else {
            isCertain = true;
            mode = 'aft-wind';
        }
        return {
            isCertain: isCertain,
            mode: mode
        };
    }
}

module.exports = SailingMode;

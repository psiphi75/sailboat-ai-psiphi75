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
var Position = require('sailboat-utils/Position');

function TackKeeper(optimalWindAngle, maxDistanceFromWaypointLine, mode, boundaryTracker, renderer) {

    var q;  // Determines the tack mode -1 is left, +1 is right
    var headingForLayLine = false;

    return {

        /**
         * Calculate the new rudder value based on a fore/aft wind.
         * @param  {Position} myPosition        The boat's position.
         * @param  {WaypointManager} waypoints  The waypoints.
         * @param  {object} boat                Get the boat details.
         * @return {number}                     The optimal angle to head to (relative to boat).
         */
        calcOptimalSailingAngle: function(myPosition, waypoints, boat, wind) {

            var wpCurrent = waypoints.getCurrent();
            var wpPrev = waypoints.getPrevious();
            var sideOfLine = myPosition.calcSideOfLine(wpCurrent, wpPrev);
            if (!q) {
                q = -sideOfLine;
                renderer.drawLayline(wpCurrent, wind, optimalWindAngle);
            }

            if (boundaryTracker.isNewlyOutOfBounds(myPosition)) {
                this.tack();
                renderer.drawTrail(myPosition, 'BLUE', true);
            } else if (hasReachedLayline(myPosition, wpCurrent, wind)) {
                this.tack();
                renderer.drawTrail(myPosition, 'GREEN', true);
            } else if (hasReachedMaxDistFromWaypointLine(myPosition, sideOfLine, wpCurrent, wpPrev)) {
                this.tack();
                renderer.drawTrail(myPosition, 'RED', true);
            }

            var optimalRelativeHeading = calcOptimalRelativeHeading(boat);
            return optimalRelativeHeading;
        },

        reset: function() {
            q = undefined;
            headingForLayLine = false;
        },

        tack: function() {
            q = -q;
        }

    };

    function hasReachedMaxDistFromWaypointLine(myPosition, sideOfLine, wpCurrent, wpPrev) {

        if (headingForLayLine) return false;

        var distantToWaypointLine = myPosition.distanceToLine(wpCurrent, wpPrev);
        var onExpectedSideOfLine = q === sideOfLine;
        var hasReachedMax = distantToWaypointLine >= maxDistanceFromWaypointLine;

        return onExpectedSideOfLine && hasReachedMax;
    }

    function hasReachedLayline(myPosition, wpCurrent, wind) {

        if (headingForLayLine) return false;
        if (hasReachedLL(1) || hasReachedLL(-1)) {
            headingForLayLine = true;
            return true;
        } else {
            return false;
        }

        function hasReachedLL(sign) {
            var LLHeading = wind.heading + sign * optimalWindAngle;
            var mySideOfLL = myPosition.calcSideOfLineByAngle(wpCurrent, LLHeading);
            if (mySideOfLL === 0) return true;  // 0 means on the lay line
            var heading;
            if (mode === 'aft-wind') {
                heading = wind.heading;
            } else {
                heading = util.wrapDegrees(wind.heading + 180);
            }
            var pointOnTheOtherSide = new Position(wpCurrent).gotoHeading(heading, 10);
            var theOtherSideOfLL = pointOnTheOtherSide.calcSideOfLineByAngle(wpCurrent, LLHeading);
            var reachedLL = (mySideOfLL === theOtherSideOfLL);
            return reachedLL;
        }
    }


    function calcOptimalRelativeHeading(boat) {
        var optimalRelativeHeading = -util.wrapDegrees(q * optimalWindAngle - boat.trueWind.heading);
        return optimalRelativeHeading;
    }

}

module.exports = TackKeeper;

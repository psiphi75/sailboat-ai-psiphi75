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
var LayLine = require('./LayLine');

function TackKeeper(optimalWindAngle, maxDistanceFromWaypointLine, mode, boundaryTracker, renderer) {

    var q;  // Determines the tack mode -1 is left, +1 is right
    // var sign = (mode === 'fore-wind' ? 1 : -1);
    var headingAlongLayLine = false;
    var layLine;

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

            // Create & Update the lay line
            if (!layLine) {
                var wpNext = waypoints.getNext();
                layLine = new LayLine(wpPrev, wpCurrent, wpNext, mode, optimalWindAngle);
            }
            layLine.update(myPosition, wind);

            if (!q) {
                q = getOptimalSideOfLine(waypoints);
                renderer.drawLayline(wpCurrent, wind, optimalWindAngle);
                headingAlongLayLine = layLine.hasReachedIt();
            } else if (boundaryTracker.isNewlyOutOfBounds(myPosition)) {
                q = getOptimalSideOfLine();
                renderer.drawTrail(myPosition, 'BLUE', true);
            } else if (layLine.hasJustCrossedLayLine()) {
                headingAlongLayLine = true;
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
            headingAlongLayLine = false;
            layLine = undefined;
        },

        tack: function() {
            q = -q;
        }

    };

    function hasReachedMaxDistFromWaypointLine(myPosition, sideOfLine, wpCurrent, wpPrev) {

        if (headingAlongLayLine) return false;

        var distantToWaypointLine = myPosition.distanceToLine(wpCurrent, wpPrev);
        var onTargetSideOfLine = (q === -sideOfLine);
        var hasReachedMax = distantToWaypointLine >= maxDistanceFromWaypointLine;

        return onTargetSideOfLine && hasReachedMax;
    }

    function calcOptimalRelativeHeading(boat) {
        var optimalRelativeHeading = util.wrapDegrees(boat.trueWind.heading - q * optimalWindAngle);
        return optimalRelativeHeading;
    }

    function getOptimalSideOfLine() {
        return 1;
    }

}


module.exports = TackKeeper;

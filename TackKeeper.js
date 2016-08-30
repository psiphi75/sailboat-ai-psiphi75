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

function TackKeeper(optimalWindAngle, tackParams, mode, boundaryTracker, renderer) {

    var q;  // Determines the tack mode -1 is left, +1 is right
    var sign = (mode === 'fore-wind') ? +1 : -1;
    var headingAlongLayLine = false;
    var layLine;
    var maxDistanceFromWaypointLine = tackParams.maxDistThresh[mode];
    var laylineReach = maxDistanceFromWaypointLine * tackParams.laylineReachFactor;

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
                var wpNext = waypoints.peekNext();
                layLine = new LayLine(wpPrev, wpCurrent, wpNext, mode, optimalWindAngle);
            }
            layLine.update(myPosition, wind);
            if (!q) {
                q = getOptimalSideOfLine();
                renderer.drawLayline(wpCurrent, wind, optimalWindAngle);
                renderer.drawTrail(myPosition, 'WHITE', true);
                headingAlongLayLine = layLine.hasReachedIt();

                log('!q')
            } else if (boundaryTracker.isOutOfBounds(myPosition)) {
                q = insideCourse();
                renderer.drawTrail(myPosition, 'BLUE', true);
                log('isOutOfBounds')
            } else if (layLine.hasJustCrossedLayLine()) {
                headingAlongLayLine = true;
                this.tack();
                renderer.drawTrail(myPosition, 'GREEN', true);
                log('hasJustCrossedLayLine')
            } else if (hasReachedMaxDistFromWaypointLine(myPosition, sideOfLine, wpCurrent, wpPrev, boat.attitude.heading)) { // FIXME: change to boat.velocity.heading
                this.tack();
                renderer.drawTrail(myPosition, 'RED', true);
                log('hasReachedMaxDistFromWaypointLine')
            }

            var optimalRelativeHeading = calcOptimalRelativeHeading(boat);
            console.log('optimalRelativeHeading: ', optimalRelativeHeading, boat.attitude.heading, boat.trueWind.heading)
            return optimalRelativeHeading;

            function log (name) {
                console.log('\n******************')
                console.log('name -> ', name, '\nmode -> ', mode, '\nq -> ', q, '\noptimalWindAngle -> ', optimalWindAngle,
                            '\nmaxDistanceFromWaypointLine -> ', maxDistanceFromWaypointLine, '\nwpPrev -> ', wpPrev,
                            '\nwpCurrent -> ', wpCurrent, '\nwpNext -> ', wpNext, '\nboat -> ', boat, '\nwind -> ', wind)
                console.log('******************\n')
            }
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

    function hasReachedMaxDistFromWaypointLine(myPosition, sideOfLine, wpCurrent, wpPrev, boatHeading) {

        if (headingAlongLayLine) return false;

        // Don't tack if we are close the lay line, this will require an extra tack later
        if (layLine.isNear(boatHeading, laylineReach)) return false;

        var distantToWaypointLine = myPosition.distanceToLine(wpCurrent, wpPrev);
        var onTargetSideOfLine = (q === -sideOfLine);
        var hasReachedMax = distantToWaypointLine >= maxDistanceFromWaypointLine;

        return onTargetSideOfLine && hasReachedMax;
    }

    function calcOptimalRelativeHeading(boat) {
        var optimalRelativeHeading = util.wrapDegrees(boat.trueWind.heading + sign * q * optimalWindAngle);
        return optimalRelativeHeading;
    }

    function getOptimalSideOfLine() {
        return outsideCourse();
    }

    function outsideCourse() {
        return 1;
    }

    function insideCourse() {
        return mode === 'fore-wind' ? 1 : -1;
    }

}


module.exports = TackKeeper;

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

var STRAIGHT_ANGLE_THRESH = 15;

function LayLine(wpPrev, wpCurrent, wpNext, mode, optimalWindAngle) {

    if (mode !== 'fore-wind' && mode !== 'aft-wind') {
        console.error('LayLine(): invalid mode:', mode);
        return null;
    }

    var boatPosition;
    var wind;
    var lastHasReachedIt = null;

    return {
        update: function(_boatPosition, _wind) {
            boatPosition = _boatPosition;
            wind = _wind;
        },
        hasReachedIt: function() {
            if (!boatPosition || !wind) return null;
            var hasReachedIt = hasReachedLL(1, boatPosition, wind, optimalWindAngle) || hasReachedLL(-1, boatPosition, wind, optimalWindAngle);
            return hasReachedIt;
        },
        withinLayLines: function() {
            if (!boatPosition || !wind) return null;
            return !this.hasReachedIt(boatPosition, wind, optimalWindAngle);
        },
        /**
         * Returns the preferred layline (-1 the one to the left, +1 the one to the right, 0 both about the same)
         */
        preferred: function() {
            var angle = util.angleBetweenLatLongLines([wpPrev, wpCurrent], [wpCurrent, wpNext]);
            if (angle < -STRAIGHT_ANGLE_THRESH) {
                return +1;
            } else if (angle > STRAIGHT_ANGLE_THRESH) {
                return -1;
            } else {
                return 0;
            }
        },
        hasJustCrossedLayLine: function() {
            var hasReachedIt = this.hasReachedIt();
            if (lastHasReachedIt === null) lastHasReachedIt = hasReachedIt;
            var hasJustCrossedLayLine = (lastHasReachedIt === false && hasReachedIt === true);
            lastHasReachedIt = hasReachedIt;
            return hasJustCrossedLayLine;
        },
        /**
         * Get the distance to the layline crossing point.
         * @param  {[type]} heading [description]
         * @return {[type]}         [description]
         */
        isNear: function(boatHeading, distLimit) {

            // console.log('isNear -1', isNearLL(-1))
            // console.log('isNear +1', isNearLL(+1))
            if (isNearLL(-1)) return true;
            if (isNearLL(+1)) return true;
            return false;

            function isNearLL(llSign) {
                // console.log('boatHeading, wpCurrent, LLHeading, distLimit')
                // console.log(boatHeading, wpCurrent, LLHeading, distLimit)
                var LLHeading = wind.heading + llSign * optimalWindAngle;
                return boatPosition.crossesLine(boatHeading, wpCurrent, LLHeading, distLimit);
            }
        }

    };

    function hasReachedLL(llSign) {
        var LLHeading = wind.heading + llSign * optimalWindAngle;
        var boatSideOfLL = boatPosition.calcSideOfLineByAngle(wpCurrent, LLHeading);
        if (boatSideOfLL === 0) return true;  // 0 means on the lay line
        var headingOnOthersideOfWaypoint;
        if (mode === 'aft-wind') {
            headingOnOthersideOfWaypoint = wind.heading;
        } else {
            headingOnOthersideOfWaypoint = util.wrapDegrees(wind.heading + 180);
        }
        var pointOnTheOtherSide = new Position(wpCurrent).gotoHeading(headingOnOthersideOfWaypoint, 10);
        var theOtherSideOfLL = pointOnTheOtherSide.calcSideOfLineByAngle(wpCurrent, LLHeading);
        var reachedLL = (boatSideOfLL === theOtherSideOfLL);
        return reachedLL;
    }
}

module.exports = LayLine;

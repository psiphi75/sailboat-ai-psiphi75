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

    var myPosition;
    var wind;
    var lastHasReachedIt = null;

    return {
        update: function(_myPosition, _wind) {
            myPosition = _myPosition;
            wind = _wind;
        },
        hasReachedIt: function() {
            if (!myPosition || !wind) return null;
            var hasReachedIt = hasReachedLL(1, myPosition, wind, optimalWindAngle) || hasReachedLL(-1, myPosition, wind, optimalWindAngle);
            return hasReachedIt;
        },
        withinLayLines: function() {
            if (!myPosition || !wind) return null;
            return !this.hasReachedIt(myPosition, wind, optimalWindAngle);
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
        }

    };

    function hasReachedLL(llSign) {
        var LLHeading = wind.heading + llSign * optimalWindAngle;
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

module.exports = LayLine;

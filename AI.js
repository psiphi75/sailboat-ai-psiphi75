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
var WaypointManager = require('sailboat-utils/WaypointManager');
var boatProperties = require('sailboat-utils/boatProperties');
var TrackBoundary = require('./TrackBoundary');
var TackKeeper = require('./TackKeeper');

var SIDE_WIND_THRESH = 60;
var AFT_WIND_THRESH = 120;

var self = {

    /**
     * This will be run once before the simulational initalises.
     * See this link for the contest details: https://github.com/psiphi75/SailBoatSim/blob/master/AI.md#contests
     */
    init: function(contest) {
        self.contest = contest;
        self.waypoints = new WaypointManager(contest.waypoints);
        self.renderer = new (require('./Renderer'))();

        var boundaryTracker = new TrackBoundary(contest.boundary);
        self.aftWindTacker = TackKeeper(boatProperties.findOptimalApparentAftWindAngle(), 4, 'aft-wind', boundaryTracker, self.renderer);
        self.foreWindTacker = TackKeeper(boatProperties.findOptimalApparentForeWindAngle(), 2, 'fore-wind', boundaryTracker, self.renderer);
    },

    /**
     * This function is called every step.  See the AI.md file for documentation.
     * @param  {object} state
     * @return {object} The result is the new value of the rudder.
     */
    ai: function (state, toy) {

        if (typeof toy === 'function') toy.status(state);

        var myPosition = new Position(state.boat.gps);
        var wpStatus = self.waypoints.getStatus(myPosition);

        // 1. Check if we have reached the waypoint, if yes, then load the next waypoint and do some calcs.
        if (wpStatus.achieved) {
            wpStatus = self.waypoints.next(myPosition);

            self.aftWindTacker.reset();
            self.foreWindTacker.reset();
        }


        var mode = getNextMode(self.waypoints, myPosition, state.environment.wind);

        // 2. Calculate the rudder
        var optimalRelativeHeading;
        switch (mode) {
            case 'aft-wind':
                self.renderer.drawTrail(myPosition, {red: 0.9, green: 0.7, blue: 0.2});
                optimalRelativeHeading = self.aftWindTacker.calcOptimalSailingAngle(myPosition, self.waypoints, state.boat, state.environment.wind);
                break;
            case 'side-wind':
                self.renderer.drawTrail(myPosition, {red: 0.75, green: 0.6, blue: 0.2});
                optimalRelativeHeading = calcSideWind(wpStatus, state.boat);
                break;
            case 'fore-wind':
                self.renderer.drawTrail(myPosition, {red: 0.6, green: 0.5, blue: 0.2});
                optimalRelativeHeading = self.foreWindTacker.calcOptimalSailingAngle(myPosition, self.waypoints, state.boat, state.environment.wind);
                break;
            default:
                console.log('oops, shouldn\'t get here');
        }
        var rudder = calcRudder(optimalRelativeHeading);
        var sail = calcSail(state.boat.trueWind.heading);

        return {
            action: 'move',
            servoRudder: rudder,
            servoSail: sail
        };
    },
    close: function() {
    }
};

/**
 * Calculate the next mode we are to be in.
 * @param  {WaypointManager} waypoints  The waypoints.
 * @param  {Position} myPosition
 * @param  {object} wind                Details of the actual wind.
 * @return {string}                     The mode to be in.
 */
function getNextMode(waypoints, myPosition, wind) {
    var headingToNextWP = myPosition.distanceHeadingTo(waypoints.getCurrent()).heading;
    var windDirection = util.wrapDegrees(wind.heading - 180);
    var diffAngle = Math.abs(util.wrapDegrees(windDirection - headingToNextWP));
    if (isNaN(diffAngle)) {
        console.error('getNextMode(): we have a NaN');
    }
    switch (true) {
        case diffAngle >= AFT_WIND_THRESH:
            return 'aft-wind';
        case diffAngle >= SIDE_WIND_THRESH:
            return 'side-wind';
        default:
            return 'fore-wind';
    }
}


/**
 * Calculate the new rudder value based on a side wind.
 * @param  {WaypointManager} waypoints  The waypoints.
 * @param  {object} boat                Get the boat details.
 * @return {string}                     The mode to be in.
 */
function calcSideWind(wpStatus, boat) {
    var optimalRelativeHeading = util.wrapDegrees(wpStatus.heading - boat.attitude.heading);
    return optimalRelativeHeading;
}


function calcRudder(optimalRelativeHeading) {

    optimalRelativeHeading = util.wrapDegrees(optimalRelativeHeading);

    var turnRateScalar = 2;
    var turnRateValue = turnRateScalar * optimalRelativeHeading;
    if (turnRateValue > 90) turnRateValue = 90;
    if (turnRateValue < -90) turnRateValue = -90;

    var rudder = Math.sin(util.toRadians(turnRateValue));
    return rudder;
}

/**
 * The sail angle is a function of the actual current heading.
 * @param  {number} trueWindHeading     The angle in degrees of the apparent wind (in degrees)
 * @return {[type]}                [description]
 */
function calcSail(trueWindHeading) {
    var data = boatProperties.getPolarData(trueWindHeading);
    return data.sail;
}


module.exports = self;

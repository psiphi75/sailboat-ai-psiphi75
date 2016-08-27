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

function TimeKeeper(timeLimitSec) {
    this.timeElapsedSec = 0;
    this.timeLimitSec = timeLimitSec;
    this.wpCount = 0;
}
var BUFFER_DIST = 50;
TimeKeeper.prototype.headToFinish = function(currentWP) {
    var distanceTravelled = currentWP.courseDist;
    var distanceToFinish = currentWP.distToFinish;
    var timeRemaining = this.timeLimitSec - this.timeElapsedSec;
    var averageVelocity = distanceTravelled / this.timeElapsedSec;
    var requiredVelocityToFinish = (distanceToFinish + BUFFER_DIST) / timeRemaining;
    // console.log('\ndistanceTravelled: ', distanceTravelled.toFixed(1), '\ndistanceToFinish: ', distanceToFinish.toFixed(1), '\ntimeRemaining: ', timeRemaining.toFixed(1), '\naverageVelocity: ', averageVelocity.toFixed(1), '\nrequiredVelocityToFinish: ', requiredVelocityToFinish.toFixed(1));
    // console.log('timeElapsedSec: ', this.timeElapsedSec)
    // console.log()
    this.wpCount += 1;

    return (requiredVelocityToFinish >= averageVelocity);
};
TimeKeeper.prototype.incTime = function(dt_ms) {
    var dtSec = dt_ms / 1000;
    this.timeElapsedSec += dtSec;
};

module.exports = TimeKeeper;

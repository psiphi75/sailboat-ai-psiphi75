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

var LayLine = require('../LayLine');
var Position = require('sailboat-utils/Position');
var test = require('tape');

testSuite('aft-wind');
testSuite('fore-wind');

function testSuite(mode) {

    var wpPrev = {latitude: -36.80957425316241, longitude: 174.7503846879399};
    var wpCurrent = {latitude: -36.80941173550771, longitude: 174.7506787289037};
    var wpNextRight = {latitude: -36.80931387713417, longitude: 174.7510734148992};
    var wpNextLeft = {latitude: -36.80919795404735, longitude: 174.7508714763226};
    var wpNextCenter = {latitude: -36.80927520135823, longitude: 174.75089526315907};

    var optimalWindAngle = 35;
    var llRight = new LayLine(wpPrev, wpCurrent, wpNextRight, mode, optimalWindAngle);
    var llLeft = new LayLine(wpPrev, wpCurrent, wpNextLeft, mode, optimalWindAngle);
    var llCntr = new LayLine(wpPrev, wpCurrent, wpNextCenter, mode, optimalWindAngle);

    var positions = [{latitude: -36.80935130988019, longitude: 174.7505734217721, hasReachedIt: true, hasJustCrossedLayLine: false},
                     {latitude: -36.80938210497414, longitude: 174.7505578545596, hasReachedIt: true, hasJustCrossedLayLine: false},
                     {latitude: -36.80942750895278, longitude: 174.7505981072298, hasReachedIt: false, hasJustCrossedLayLine: false},
                     {latitude: -36.80945721061715, longitude: 174.7506313040399, hasReachedIt: false, hasJustCrossedLayLine: false},
                     {latitude: -36.80948720816418, longitude: 174.7507029148523, hasReachedIt: true, hasJustCrossedLayLine: true},
                     {latitude: -36.80945659247159, longitude: 174.7507666142914, hasReachedIt: true, hasJustCrossedLayLine: false}];

    test('LayLine returns correct preferred side for ' + mode, function(t) {

        t.plan(3);

        t.equal(llRight.preferred(), -1, '... left');
        t.equal(llLeft.preferred(), 1, '... right');
        t.equal(llCntr.preferred(), 0, '... center');

        t.end();
    });

    test('Points are in the correct positions for ' + mode, function(t) {

        t.plan(18);

        var wind = {
            heading: mode === 'aft-wind' ? 62.5 : -180 + 62.5
        };

        positions.forEach(function (myPosition, i) {
            llRight.update(new Position(myPosition), wind);
            t.equal(myPosition.hasReachedIt, llRight.hasReachedIt(), 'Has reached lay line: ' + (i + 1));
            t.equal(!myPosition.hasReachedIt, llRight.withinLayLines(), 'Has within the lay lines: ' + (i + 1));
            t.equal(myPosition.hasJustCrossedLayLine, llRight.hasJustCrossedLayLine(), 'Has hasJustCrossedLayLine the lay lines: ' + (i + 1));
        });
        console.log();

        t.end();
    });

}

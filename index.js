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

var ai = require('./AI');

function AI(channel) {
    if (!channel) {
        console.error('AI(): channel not provided');
    }

    //
    // Set up the toy (a.k.a boat) be controlled by the controller (can be a mobile phone or some remote AI).
    //
    var wrc = require('web-remote-control');
    var toy = wrc.createToy({
        proxyUrl: 'localhost',
        udp4: false,
        tcp: true,
        socketio: false,
        channel: channel,
        log: function() {}
    });
    toy.on('error', console.error);

    return {
        info: channel,
        init: ai.init,
        ai: function (state) {
            return ai.ai(state, toy);
        },
        close: ai.close
    };
}

module.exports = AI;

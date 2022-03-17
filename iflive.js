/*
iflive: JavaScript client for Infinite Flight Live API
Version: 0.0.1
Author: @likeablegeek (https://likeablegeek.com/)
Distributed by: FlightSim Ninja (http://flightim.ninja)
Copyright 2023.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*****
 * Import required modules
 */

const request = require("request");
const events = require('events'); // For emitting events back to calling scripts

/****
 * Define upcloud-api object
 */

let IFL = {

  /*****
   * Module name
   */
  name: "iflive",

  /*****
   * Constants for referencing error levels in logging
   */
  INFO: 3,
  WARN: 2,
  ERROR: 1,
  MANDATORY: 0,
    
  /*****
   * Global variables
   */
  apikey: "",
  hostname: "api.infiniteflight.com",
  basepath: "/public/v2/",
  isCallback: false,
  sessions: {},

  /*****
   * Event emitter for return events to client
   */
  eventEmitter: new events.EventEmitter(),

  /*****
   * Default logging state
   */
  enableLog: false, // Control logging -- default is false
  logLevel: this.MANDATORY, // Logging message level -- default is MANDATORY 

  /*****
   * Command manifest
   */
  manifest: {
    sessions: {
      type: "GET",
      path: "sessions"
    },
    flights: {
      type: "GET",
      path: "sessions/[sessionId]/flights"
    },
    flightRoute: {
      type: "GET",
      path: "sessions/[sessionId]/flights/[flightId]/route"
    },
    flightPlan: {
      type: "GET",
      path: "sessions/[sessionId]/flights/[flightId]/flightplan"
    },
    atcFreqs: {
      type: "GET",
      path: "sessions/[sessionId]/atc"
    },
    users: {
      type: "POST",
      path: "users"
    },
    userDetails: {
      type: "GET",
      path: "users/[userId]"
    },
    airportAtis: {
      type: "GET",
      path: "sessions/[sessionId]/airport/[icao]/atis"
    },
    airportStatus: {
      type: "GET",
      path: "sessions/[sessionId]/airport/[icao]/status"
    },
    worldStatus: {
      type: "GET",
      path: "sessions/[sessionId]/world"
    },
    tracks: {
      type: "GET",
      path: "tracks"
    },
    userFlights: {
      type: "GET",
      path: "users/[userId]/flights"
    },
    userFlight: {
      type: "GET",
      path: "users/[userId]/flights/[flightId]"
    },
    userAtcSessions: {
      type: "GET",
      path: "users/[userId]/atc"
    },
    userAtcSession: {
      type: "GET",
      path: "users/[userId]/atc/[atcSessionId]"
    },
    notams: {
      type: "GET",
      path: "sessions/[sessionId]/notams"
    }
  },

  /*****
   * Cache object
   */
  cache: {
    session: {},
    flights: {},
    flightRoute: {},
    flightPlan: {},
    atcFreqs: {},
    users: {},
    userDetails: {},
    airportAtis: {},
    airportStatus: {},
    worldStatus: {},
    tracks: {},
    userFlights: {},
    userFlight: {},
    userAtcSessions: {},
    userAtcSession: {},
    notams: {}
  },

  /*****
   * Poll object
   */
   polls: {
    session: {},
    flights: {},
    flightRoute: {},
    flightPlan: {},
    atcFreqs: {},
    users: {},
    userDetails: {},
    airportAtis: {},
    airportStatus: {},
    worldStatus: {},
    tracks: {},
    userFlights: {},
    userFlight: {},
    userAtcSessions: {},
    userAtcSession: {},
    notams: {}
  },

  /*****
   * Logging function
   */
  log: (msg,level = IFL.logLevel) => { // generic logging function
    if (IFL.enableLog) {
      if (level <= IFL.logLevel) {
        console.log (IFL.name, msg);
      }
    }
  },

  /*****
   * Function to allow client to define listener for events emitted by module
   */
  on: (event, listener) => {
    IFL.log("Setting listener for: " + event);
    IFL.eventEmitter.on(event, listener);
  },

  /*****
   * Utility function for issuing API calls
   */
  call: (cmd, params = {}, data = {}, callback = () => {}) => {

    IFL.log("call: " + cmd, IFL.INFO);
    IFL.log("params: " + JSON.stringify(params), IFL.WARN);
    IFL.log("data: " + JSON.stringify(data), IFL.WARN);

    let fn = request.get; // GET is default requesst type

    switch(IFL.manifest[cmd].type) {
      case "GET":
        fn = request.get;
        break;
      case "POST":
        fn = request.post;
        break;
      case "PUT":
        fn = request.put;
        break;
      case "PATCH":
        fn = request.patch;
        break;
      case "DELETE":
        fn = request.del;
        break;
    }

    IFL.log("Request function: " + fn, IFL.WARN);

    let path = IFL.manifest[cmd].path;

    for (param in params) {
      path = path.replace("[" + param + "]", params[param]);
    }

    IFL.log("Request path: " + path, IFL.INFO);

    let options = {
      url: "https://" + IFL.hostname + IFL.basepath + path,
      headers: {
        authorization: "Bearer " + IFL.apikey
      }
    };

    if (IFL.manifest[cmd].type == "POST" || IFL.manifest[cmd].type == "PUT" || IFL.manifest[cmd].type == "PATCH") {
      options.json = true;
      options.body = data;
    }

    fn(options, (err, res, body) => {

      IFL.log("call: received data from API", IFL.INFO);
      IFL.log("Data received: " + JSON.stringify(body), IFL.WARN);

      // Convert to string, parse as JSON
      if (typeof(body) == "string" && body.length > 0) {
        resData = JSON.parse(body).result;
      } else {
        resData = body.result;
      }

      IFL.log("Data to return: " + JSON.stringify(resData), IFL.WARN);

      // Save cache data
      if (Object.entries(params).length > 0) {
        IFL.cache[cmd][params] = {
          data: resData,
          ts: Date.now()
        }
      } else if (Object.entries(data).length > 0) {
        IFL.cache[cmd][data] = {
          data: resData,
          ts: Date.now()
        }
      } else {
        IFL.cache[cmd] = {
          data: resData,
          ts: Date.now()
        };
      }

      // Callback or event to return result
      if (IFL.isCallback) { // Use a callback if one is available

        console.log("callback");

        callback(resData);

      } else { // Use an event

        console.log("event");
        
        IFL.eventEmitter.emit('IFLdata',{"command": cmd, "params": params, "data": data, "result": resData}); // Return data to calling script through an event

      }

    });

  },

  /*****
   * Fetch from cache if available otherwise fetch from cache and cache
   */
  get: (cmd, params = {}, data = {}, callback = () => {}) => {

    IFL.log("get: " + cmd, IFL.INFO);
    IFL.log("params: " + JSON.stringify(params), IFL.WARN);
    IFL.log("data: " + JSON.stringify(data), IFL.WARN);

    // Tracking variable to see if we are done returning a value
    let done = false;

    // Return cache data if available
    if (Object.entries(params).length > 0) {

      if (IFL.cache[cmd].hasOwnProperty(params) && Object.entries(IFL.cache[cmd][params]).length > 0) {

        IFL.log("Cache hit: params", IFL.WARN);

        // Callback or event to return result
        if (IFL.isCallback) { // Use a callback if one is available

          callback(IFL.cache[cmd][params]);

        } else { // Use an event

          IFL.eventEmitter.emit('IFLdata',{"command": cmd, "params": params, "data": data, "result": IFL.cache[cmd][params]}); // Return data to calling script through an event

        }

        done = true;

      }

    } else if (Object.entries(data).length > 0) {

      IFL.log("Cache hit: data", IFL.WARN);

      if (IFL.cache[cmd].hasOwnProperty(data) && Object.entries(IFL.cache[cmd][data]).length > 0) {

        // Callback or event to return result
        if (IFL.isCallback) { // Use a callback if one is available

          callback(IFL.cache[cmd][data]);

        } else { // Use an event

          IFL.eventEmitter.emit('IFLdata',{"command": cmd, "params": params, "data": data, "result": IFL.cache[cmd][data]}); // Return data to calling script through an event

        }

        done = true;

      }

    } else {

      if (Object.entries(IFL.cache[cmd]).length > 0) {

        IFL.log("Cache hit: plain", IFL.WARN);

        // Callback or event to return result
        if (IFL.isCallback) { // Use a callback if one is available

          callback(IFL.cache[cmd]);

        } else { // Use an event

          IFL.eventEmitter.emit('IFLdata',{"command": cmd, "params": params, "data": data, "result": IFL.cache[cmd]}); // Return data to calling script through an event

        }

        done = true;

      }

    }

    // We didn't return anything so let's fetch it
    if (!done) {

      IFL.log("No cache hit", IFL.WARN);

      IFL.call(cmd, params, data, (res) => {

        if (Object.entries(params).length > 0) {

          if (IFL.cache[cmd].hasOwnProperty(params) && Object.entries(IFL.cache[cmd][params]).length > 0) {

            IFL.log("Cache hit: params", IFL.WARN);

            callback(IFL.cache[cmd][params]);

          }

        } else if (Object.entries(data).length > 0) {

          if (IFL.cache[cmd].hasOwnProperty(data) && Object.entries(IFL.cache[cmd][data]).length > 0) {

            IFL.log("Cache hit: data", IFL.WARN);

            callback(IFL.cache[cmd][data]);

          }

        } else if (Object.entries(IFL.cache[cmd]).length > 0) {

          IFL.log("Cache hit: plain", IFL.WARN);

          callback(IFL.cache[cmd]);

        } else {

          IFL.log("Still no cache hit", IFL.WARN);

          callback(null);

        }

      });

    }

  },

  /*****
   * Set a polling frequency for a given command
   */
  poll: (pollCmd, pollParams = {}, pollData = {}, pollThrottle = 30000, pollCallback = () => {}) => {

    IFL.log("poll: " + pollCmd, IFL.INFO);
    IFL.log("params: " + JSON.stringify(pollParams), IFL.WARN);
    IFL.log("data: " + JSON.stringify(pollData), IFL.WARN);

    // Clear poll
    IFL.clear(pollCmd, pollParams, pollData, pollCallback);

    // Establish poll
    if (Object.entries(pollParams).length > 0) {
      IFL.call(pollCmd,pollParams,pollData,pollCallback);
      IFL.polls[pollCmd][pollParams] = {
        interval: setInterval((cmd,params,data,callback) => {
          IFL.call(cmd,params,data,callback);
        }, pollThrottle, pollCmd, pollParams, pollData, pollCallback)
      }
    } else if (Object.entries(pollData).length > 0) {
      IFL.call(pollCmd,pollParams,pollData,pollCallback);
      IFL.polls[pollCmd][pollData] = {
        interval: setInterval((cmd,params,data,callback) => {
          IFL.call(cmd,params,data,callback);
        }, pollThrottle, pollCmd, pollParams, pollData, pollCallback)
      }
    } else {
      IFL.call(pollCmd,pollParams,pollData,pollCallback);
      IFL.polls[pollCmd] = {
        interval: setInterval((cmd,params,data,callback) => {
          IFL.call(cmd,params,data,callback);
        }, pollThrottle, pollCmd, pollParams, pollData, pollCallback)
      };
    }

  },

  /*****
   * Clear polling interval
   */
  clear: (pollCmd, pollParams = {}, pollData = {}) => {

    IFL.log("clear: " + pollCmd, IFL.INFO);
    IFL.log("params: " + JSON.stringify(pollParams), IFL.WARN);
    IFL.log("data: " + JSON.stringify(pollData), IFL.WARN);

    // Establish poll
    if (Object.entries(pollParams).length > 0) {
      if (IFL.polls[pollCmd][pollParams] && IFL.polls[pollCmd][pollParams].hasOwnProperty("interval")) {
        clearInterval(IFL.polls[pollCmd][pollParams]["interval"]);
      }
    } else if (Object.entries(pollData).length > 0) {
      if (IFL.polls[pollCmd][pollData] && IFL.polls[pollCmd][pollData].hasOwnProperty("interval")) {
        clearInterval(IFL.polls[pollCmd][pollData]["interval"]);
      }
    } else {
      if (IFL.polls[pollCmd].hasOwnProperty("interval")) {
        clearInterval(IFL.polls[pollCmd]["interval"]);
      }
    }

  },

  /*****
   * Initialise API
   */
  init: (apikey, params = {}, callback = () => {}) => {

    IFL.log("init", IFL.INFO);
    IFL.log("params: " + JSON.stringify(params), IFL.WARN);

    IFL.apikey = apikey;

    if (params.enableLog) IFL.enableLog = params.enableLog; // Set Logging on/off
    if (params.logLevel) IFL.logLevel = params.logLevel; // Set logging message level
    if (params.callback) IFL.isCallback = params.callback; // Set if we are using callbacks

      // Callback or event to return result
      if (IFL.isCallback) { // Use a callback if one is available

        callback();

      } else { // Use an event

        IFL.eventEmitter.emit('IFLinit',"initialised"); // Return data to calling script through an event
            
      }

  }

};

module.exports = IFL;
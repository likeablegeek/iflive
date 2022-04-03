/*
iflive: JavaScript client for Infinite Flight Live API
Version: 0.9.0
Author: @likeablegeek (https://likeablegeek.com/)
Distributed by: FlightSim Ninja (http://flightim.ninja)
Copyright 2022.
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

const request = require("request"); // For making HTTP JSON requests
const events = require('events'); // For emitting events back to calling scripts
const csv = require("csv-parse/sync"); // For importing the aircraft and liveries CSVs
const fs = require("fs"); // For reading files
const path = require("path"); // For system-independent file path creation

/*****
 * Import aircraft CSV
 */
const aircraftCSV = fs.readFileSync(path.join(__dirname,"aircraft.csv"));
const aircraft = csv.parse(aircraftCSV,{
  input: true,
  skip_empty_lines: true,
  columns: true,
  objname: 'id'
});

/*****
 * Import aircraft CSV
 */
const liveriesCSV = fs.readFileSync(path.join(__dirname,"liveries.csv"));
const liveries = csv.parse(liveriesCSV,{
  input: true,
  skip_empty_lines: true,
  columns: true,
  objname: 'id'
});

/****
 * Define iflive object
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
  apikey: "", // IF LIve API key needed for iflive to work
  hostname: "api.infiniteflight.com", // Hostname for Live API endpoint
  basepath: "/public/v2/", // Path for current version of Live API
  isCallback: false, // By default we trigger events instead of callbacks
  sessions: {}, // On initialisation we will fetch and store the current active sessions for immediate use

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

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/sessions
    sessions: {
      type: "GET",
      path: "sessions"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/flights
    flights: {
      type: "GET",
      path: "sessions/[sessionId]/flights"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/flight-route
    flightRoute: {
      type: "GET",
      path: "sessions/[sessionId]/flights/[flightId]/route"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/flight-plan
    flightPlan: {
      type: "GET",
      path: "sessions/[sessionId]/flights/[flightId]/flightplan"
    },
    
    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/atc
    atcFreqs: {
      type: "GET",
      path: "sessions/[sessionId]/atc"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/user-stats
    users: {
      type: "POST",
      path: "users"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/user-grade
    userDetails: {
      type: "GET",
      path: "users/[userId]"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/atis
    airportAtis: {
      type: "GET",
      path: "sessions/[sessionId]/airport/[icao]/atis"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/airport-status
    airportStatus: {
      type: "GET",
      path: "sessions/[sessionId]/airport/[icao]/status"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/world-status
    worldStatus: {
      type: "GET",
      path: "sessions/[sessionId]/world"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/oceanic-tracks
    tracks: {
      type: "GET",
      path: "tracks"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/user-flights
    userFlights: {
      type: "GET",
      path: "users/[userId]/flights"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/user-flight
    userFlight: {
      type: "GET",
      path: "users/[userId]/flights/[flightId]"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/user-atc-sessions
    userAtcSessions: {
      type: "GET",
      path: "users/[userId]/atc"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/user-atc-session
    userAtcSession: {
      type: "GET",
      path: "users/[userId]/atc/[atcSessionId]"
    },

    // Infinite Flight Live API reference: https://infiniteflight.com/guide/developer-reference/live-api/notams
    notams: {
      type: "GET",
      path: "sessions/[sessionId]/notams"
    }

  },

  /*****
   * Cache object to hold cache data for all commands
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
   * Poll object to hold polling interval objects for all commands
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
        console.log(IFL.name, msg);
      }
    }
  },

  /*****
   * Utility function to get aircraft name from aircraft ID
   */
  aircraft: (id) => {
    return aircraft[id].name;
  },

  /*****
   * 
   * Utility function to get livery name from livery ID
   */
  livery: (id) => {
    return liveries[id].name;
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
   * 
   * Handles HTTP GET, POST, PUT, PATCH and DELETE; Live API currently
   * only uses GET and POST but this allows extension to cover other
   * request types.
   * 
   * This function is based on a similar function in the `upcloud-api`
   * npm module which uses the same basic architecture:
   * 
   * https://github.com/likeablegeek/upcloud-api
   */
  call: (cmd, params = {}, data = {}, callback = () => {}) => {

    IFL.log("call: " + cmd, IFL.INFO);
    IFL.log("params: " + JSON.stringify(params), IFL.WARN);
    IFL.log("data: " + JSON.stringify(data), IFL.WARN);

    // fn will rever to the appropriate method of the `request` package
    let fn = request.get; // GET is default requesst type

    // Determine the request type from the manifest and set `fn` accordingly
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

    // Determine the URL path for the API call
    let path = IFL.manifest[cmd].path;

    // Replace query parameters in the URL path, if any
    for (param in params) {
      path = path.replace("[" + param + "]", params[param]);
    }

    IFL.log("Request path: " + path, IFL.INFO);

    // Set up options for HTTP request
    let options = {
      url: "https://" + IFL.hostname + IFL.basepath + path,
      headers: {
        authorization: "Bearer " + IFL.apikey
      }
    };

    // If POST, PUT or PATCH, pass `data` as JSON in the body
    if (IFL.manifest[cmd].type == "POST" || IFL.manifest[cmd].type == "PUT" || IFL.manifest[cmd].type == "PATCH") {
      options.json = true;
      options.body = data;
    }

    // Call the API
    fn(options, (err, res, body) => {

      // Callback for API response

      IFL.log("call: received data from API", IFL.INFO);
      IFL.log("Data received: " + JSON.stringify(body), IFL.WARN);

      // Convert to string, parse as JSON
      if (typeof(body) == "string" && body.length > 0) {
        resData = JSON.parse(body).result;
      } else {
        resData = body.result;
      }

      IFL.log("Data to return: " + JSON.stringify(resData), IFL.WARN);

      // Save cache data with key as one of:
      //
      // cmd
      // cmd + params object
      // cmd + data object
      //
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

        callback(resData);

      } else { // Use an event

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

    // Return cache data if available using one of the following as cache key:
    //
    // cmd
    // cmd + params object
    // cmd + data object
    //
    if (Object.entries(params).length > 0) { // Any parameters?

      // Do we have a cache entry? If so, do we have any cache data?
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

    } else if (Object.entries(data).length > 0) { // Any post data?

      IFL.log("Cache hit: data", IFL.WARN);

      // Do we have a cache entry? If so, do we have any cache data?
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

      if (Object.entries(IFL.cache[cmd]).length > 0) { // Any cache hit for just the cmd?

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

      // Call the API to fetch data; callback provided if callbacks are being used; event will get returned directly from call functions
      IFL.call(cmd, params, data, (res) => {

        // Fire the callback using data from the cache for consistency with cases where there is a cache hit
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

          // Nothing in the cache -- return null

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

    // Establish poll storing the interval objects with a cache key:
    //
    // cmd
    // cmd + params object
    // cmd + data object
    // 
    if (Object.entries(pollParams).length > 0) {

      // Call the command initially before creating interval
      IFL.call(pollCmd,pollParams,pollData,pollCallback);

      // Create interval for polling
      IFL.polls[pollCmd][pollParams] = {
        interval: setInterval((cmd,params,data,callback) => {
          IFL.call(cmd,params,data,callback);
        }, pollThrottle, pollCmd, pollParams, pollData, pollCallback)
      }

    } else if (Object.entries(pollData).length > 0) {

      // Call the command initially before creating interval
      IFL.call(pollCmd,pollParams,pollData,pollCallback);

      // Create interval for polling
      IFL.polls[pollCmd][pollData] = {
        interval: setInterval((cmd,params,data,callback) => {
          IFL.call(cmd,params,data,callback);
        }, pollThrottle, pollCmd, pollParams, pollData, pollCallback)
      }

    } else {

      // Call the command initially before creating interval
      IFL.call(pollCmd,pollParams,pollData,pollCallback);

      // Create interval for polling
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

    // Clear poll using appropriate cache key:
    //
    // cmd
    // cmd + params object
    // cmd + data object
    // 
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

    try {

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

    } catch(e) {

      IFL.eventEmitter.emit('IFLerror',e);

    }

  }

};

module.exports = IFL;
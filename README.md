# `iflive`

A Javascript client for the Infinite Flight simulator Live API version 2

> `iflive` is currently at version 0.9.1 which is considered a release candidate for version 1.0.0. It is being released to allow for input and feedback from the Infinite Flight community and to identify major issues before the first formal release.

## Table of Contents

- [Installing `iflive`](#installing-iflive)
- [Using `iflive`](#using-iflive)
  - [Including `lflive` in your scripts/applications](#including-iflive-in-your-scriptsapplications)
  - [Initialisation](#initialisation)
  - [Calling the API](#calling-the-api)
  - [Commands](#commands)
  - [Caching](#caching)
  - [Polling](#polling)
- [Dependencies](#dependencies)
- [Applications usiing `iflive`](#applications-using-iflive)
- [Copyright and License](#copyright-and-license)

## Installing `iflive`

`iflive` is available as a Node module on [npmjs.com](https://www.npmjs.com/) and can simply be installed with:

```
npm install iflive
```

## Using `iflive`

### Including `iflive` in your scripts/applications

To use `iflive` you need to include it in your scripts:

```
let IFL = require("iflive");
```

Or, if you aren't installing with `npm` then you can simply clone this repository and directly reference `iflive.js`:

```
let IFL = require("/path/to/iflive.js");
```

### Initialisation

To initialise `iflive` and connect to an Infinite Flight device you use the `init` function. The `init` function takes the following arguments:

`init(apikey, {params}, callback)`

* `apikey` is the API key for the Infinite Flight Live API which you have received from Infinite Flight
* `params` is an optional parameter which allows you to configure and control various aspects of the module, including:
  * `callback` is a boolean value indicating if callback functions should be used to return values instead of the standard `iflive` event model; default is `false`
  * `enableLog` is a boolean value to enable/disable logging in the Module; default is `false`
  * `loggingLevel` is an integer value for logging level in the module (2: INFO, 1: WARN, 0: ERROR); default is 0 (ERROR)
* `callback` is the callback function to invoke once initialised assuming `callback` is set to `true`

Example :

```
IFL.init(
  `abcdefghijk...`,
  {
    "enableLog": true,
    "loggingLevel": 1,
    "callback": true
  },
  () => {
    console.log("iflive initialised");
  }
);
```

### Calling the API

The primary way of interacting with the Infinite Flight Live API with `iflive` is done through the `call` method of `iflive`. The syntax for the `call` method is:

```
IFL.call(COMMAND_NAME, PARAMETERS, POST_DATA, CALLBACK_FUNCTION);
```

The four arguments are:

* `COMMAND_NAME`: The name of an `iflive` command as discussed below.
* `PARAMETERS`: An object containing one or more parameters required by the command being invoked.
* `DATA`: An object containing data to be sent as JSON in a POST request to the Live API for commands which require POST requests with JSON data in the body of the request.
* `CALLBACK_FUNCTION`: A function to invoke when the Live API responds to the command if you have initialised `iflive` to use callbacks instead of events. A JSON object will be returned as an argument to the callback function.

For instance, to retrieve a list of active sessions you could use:

```
IFL.call("sessions", {}, {}, (res) => {
  console.log(res);
});
```

Or, to retrieve a session's flights:

```
IFL.call("flights", { sessionId: SESSION_ID_HERE }, {}, (res) => {
  console.log(res);
});
```

Or, to retrieve details of a list of users by their Discourse username:

```
IFL.call("users", { }, {
  discourseNames: [
    'USERNAME1',
    'USERNAME2',
    ...
  ]
}, (res) => {
  console.log(res);
});
```

### Commands

#### `sessions`

*Description*: Retrieve active sessions (servers) in Infinite Flight.

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/sessions`](https://infiniteflight.com/guide/developer-reference/live-api/sessions)

*Request Type*: GET

*Parameters*: None

#### `flights`

*Description*: Retrieve a list of all flights for a session.

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/flights`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/flights`](https://infiniteflight.com/guide/developer-reference/live-api/flights)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command

#### `flightRoute`

*Description*: Retrieve the flown route of a specific flight with position, altitude, speed and track information at different points in time. Only available for the Expert and Training servers.

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/flights/[flightId]/route`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/flight-route`](https://infiniteflight.com/guide/developer-reference/live-api/flight-route)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command
* `flightId`: IF of the flight in the session

#### `flightPlan`

*Description*: Retrieve the flight plan for a specific active flight.

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/flights/[flightId]/flightplan`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/flight-plan`](https://infiniteflight.com/guide/developer-reference/live-api/flight-plan)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command
* `flightId`: IF of the flight in the session

#### `atcFreqs`

*Description*: Retrieve active Air Traffic Control frequencies for a session

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/atc`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/atc`](https://infiniteflight.com/guide/developer-reference/live-api/atc)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command

#### `users`

*Description*: Retrieve user statistics for multiple users, including their grade, flight time and username

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/users`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/user-stats`](https://infiniteflight.com/guide/developer-reference/live-api/user-stats)

*Request Type*: POST

*Parameters*: None

*POST Data*: See the [Live API documentation](https://infiniteflight.com/guide/developer-reference/live-api/user-stats)

#### `userDetails`

*Description*: Retrieve the full grade table and detailed statistics for a user

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/users/[userId]`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/user-stats`](https://infiniteflight.com/guide/developer-reference/live-api/user-stats)

*Request Type*: GET

*Parameters*:

* `userId`: ID of the user

#### `airportAtis`

*Description*: Retrieve the ATIS for an airport on a specific server if it is active

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/airport/[icao]/atis`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/atis`](https://infiniteflight.com/guide/developer-reference/live-api/atis)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command
* `icao`: ICAO of the airport

#### `airportStatus`

*Description*: Retrieve active ATC status information for an airport, and the number of inbound and outbound aircraft

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/airport/[icao]/status`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/airport-status`](https://infiniteflight.com/guide/developer-reference/live-api/airport-status)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command
* `icao`: ICAO of the airport

#### `worldStatus`

*Description*: Retrieve active ATC status information and inbound/outbound aircraft information for all airports with activity on a specific server

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/world`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/world-status`](https://infiniteflight.com/guide/developer-reference/live-api/world-status)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command

#### `tracks`

*Description*: Retrieves a list of Oceanic Tracks active in Infinite Flight multiplayer sessions

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/tracks`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/oceanic-tracks`](https://infiniteflight.com/guide/developer-reference/live-api/oceanic-tracks)

*Request Type*: GET

*Parameters*: None

#### `userFlights`

*Description*: Retrieves the online flight logbook for a given user

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/users/[userId]/flights`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/user-flights`](https://infiniteflight.com/guide/developer-reference/live-api/user-flights)

*Request Type*: GET

*Parameters*:

* `userId`: ID of the user

#### `userFlight`

*Description*: Retrieves a flight from the logbook of a given user

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/users/[userId]/flights/[flightId]`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/user-flight`](https://infiniteflight.com/guide/developer-reference/live-api/user-flight)

*Request Type*: GET

*Parameters*:

* `userId`: ID of the user
* `flightId`: ID of the flight

#### `userAtcSessions`

*Description*: Retrieves the ATC session log for a given user

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/users/[userId]/atc`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/user-atc-sessions`](https://infiniteflight.com/guide/developer-reference/live-api/user-atc-sessions)

*Request Type*: GET

*Parameters*:

* `userId`: ID of the user

#### `userAtcSession`

*Description*: Retrieves an ATC session from the log of a given user

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/users/[userId]/atc/[atcSessionId]`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/user-atc-session`](https://infiniteflight.com/guide/developer-reference/live-api/user-atc-session)

*Request Type*: GET

*Parameters*:

* `userId`: ID of the user
* `atcSessionId`: IF of the ATC session

#### `notams`

*Description*: Retrieve a list of all NOTAMs for a session

*Live API Endpoint*: `https://api.infiniteflight.com/public/v2/sessions/[sessionId]/notams`

*Live API Documentation Reference*: [`https://infiniteflight.com/guide/developer-reference/live-api/notams`](https://infiniteflight.com/guide/developer-reference/live-api/notams)

*Request Type*: GET

*Parameters*:

* `sessionId`: ID of the session returned from the `sessions` command

### Caching

`iflive` has an in-built caching mechanism which keeps the last fetched values for commands so that they can be refetched (if needed) without sending a request back to the server. A combination of information is used to form unique keys for storing cached values:

* For GET requests, the command name plus the query parameters object (as passed to `call`) are combined to form the key for storing the cache value
* For POST requests, the command name plus the post data object (as passed to `call`) are combined to form the key for storing the cache value

Whenever you fetch a value with `call` it will be added to the cache or, if a value already exists for the cache key, the value will be updated with the new value returned by the Live API.

To fetch values from the cache, `iflive` provides the `get` function as an alternative to the `call` function. Where `call` will always invoke the Live API to fetch the value, `get` will check the cache and return a cached value if available. Where one is not available, it will invoke `call` to fetch the value. The `get` function takes the same arguments as the `call` function:

```
IFL.get(COMMAND_NAME, PARAMETERS, POST_DATA, CALLBACK_FUNCTION);
```

The four arguments are:

* `COMMAND_NAME`: The name of an `iflive` command as discussed above.
* `PARAMETERS`: An object containing one or more parameters required by the command being invoked.
* `DATA`: An object containing data to be sent as JSON in a POST request to the Live API for commands which require POST requests with JSON data in the body of the request.
* `CALLBACK_FUNCTION`: A function to invoke when the Live API responds to the command if you have initialised `iflive` to use callbacks instead of events. A JSON object will be returned as an argument to the callback function.

The cache can prove particulately useful when working with polling as described below.

### Polling

`iflive` includes a polling mechanism which you can use to set up automatic polling of a specific API command on a fixed schedule. This is useful where you need to regularly fetch updated data from the API.

As with caching, the poller is set up for a unique combination of the command name plust either query parameter objects or post data objects:

* For GET requests, the command name plus the query parameters object (as passed to `call`) are combined to form the key for creating the poller
* For POST requests, the command name plus the post data object (as passed to `call`) are combined to form the key for creating the poller

The `poll` function is used to set up polling for any command:

```
IFL.poll(COMMAND_NAME, PARAMETERS, POST_DATA, INTERVAL, CALLBACK_FUNCTION);
```

The four arguments are:

* `COMMAND_NAME`: The name of an `iflive` command as discussed above.
* `PARAMETERS`: An object containing one or more parameters required by the command being invoked.
* `DATA`: An object containing data to be sent as JSON in a POST request to the Live API for commands which require POST requests with JSON data in the body of the request.
* `INTERVAL`: An integer specifying the interval for polling the command in milliseconds.
* `CALLBACK_FUNCTION`: A function to invoke when the Live API responds to the command if you have initialised `iflive` to use callbacks instead of events. A JSON object will be returned as an argument to the callback function.

For instance, to fetch a list of active sessions every 30 seconds using callbacks you could use:

```
IFL.poll("sessions", {}, {}, 30000, (res) => {
  console.log(res);
});
```

Or, to retrieve a session's flights every five seconds:

```
IFL.poll("flights", { sessionId: SESSION_ID_HERE }, {}, 5000, (res) => {
  console.log(res);
});
```

Or, to retrieve details of a list of users by their Discourse username every minute:

```
IFL.poll("users", { }, {
  discourseNames: [
    'USERNAME1',
    'USERNAME2',
    ...
  ]
}, 60000, (res) => {
  console.log(res);
});
```

If you need to cancel polling for a specific command you use the `clear` function:

```
IFL.clear(COMMAND_NAME, PARAMETERS, POST_DATA);
```

The three arguments are:

* `COMMAND_NAME`: The name of an `iflive` command as specified when calling `poll`.
* `PARAMETERS`: An object containing one or more parameters required by the command being invoked as specified when calling `poll`.
* `DATA`: An object containing data to be sent as JSON in a POST request to the Live API for commands which require POST requests with JSON data in the body of the request as specified when calling `poll`.

For instance, to stop polling a session's flights every five seconds as defined above, we would use:

```
IFL.clear("flights", { sessionId: SESSION_ID_HERE }, {});
```

## Dependencies

`ifc2` depends on the following `npm`/Node packages:

* [`request`](https://www.npmjs.com/package/request) - Simplified HTTP client for connecting to the UpCloud endpoints
* [`events`](https://nodejs.org/api/events.html) - core Node module: For emitting events to calling scripts

## Applications using `iflive`

> If you are using `iflive` and would like to have your application listed here, submit a query through the [FlightSim Ninja support site](https://support.flightsim.ninja/) or contact the author (@likeablegeek) by a direct message in the [Infinite Flight Community](https://community.infiniteflight.com/).

## Copyright and License

This version is `iflive` Copyright 2022, @likeablegeek. Distributed by [FlightSim Ninja](https://flightsim.ninja/).

You may not use this work/module/file except in compliance with the License. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

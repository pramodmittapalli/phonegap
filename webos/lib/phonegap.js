/* PhoneGap */

/*
 * TODO:
 * We need Mojo to be loaded before phonegap so that we can override the Position class (and possibly others?)
 * But we don't want the user to have to change index.html to include mojo.js (currently they must).
 * With the attempt below, mojo.js won't be run until after phonegap.js, so it doesn't work. But I'll leave
 * it just for future reference as to what we need to do.
 */

/*
if (typeof Mojo == 'undefined') {

	var head = document.getElementsByTagName("head")[0];
	var script = document.createElement("script");
	script.setAttribute("src", "/usr/palm/frameworks/mojo/mojo.js");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("x-mojo-version", "1");
	head.insertBefore(script, head.firstChild);
	
	script = document.createElement("script");
	script.setAttribute("src", "phonegap.js");
	script.setAttribute("type", "text/javascript");
	head.insertBefore(script, head.firstChild);
}
*/

if (typeof(DeviceInfo) != 'object')
    DeviceInfo = {};

/*
 * This represents the PhoneGap API itself, and provides a global namespace for accessing
 * information about the state of PhoneGap.
 * @class
 */
PhoneGap = {
    ready: true,
	available: true,
	sceneController: null
};
/*
 * This class contains acceleration information
 * @constructor
 * @param {Number} x The force applied by the device in the x-axis.
 * @param {Number} y The force applied by the device in the y-axis.
 * @param {Number} z The force applied by the device in the z-axis.
 */
function Acceleration(x, y, z) {
	/*
	 * The force applied by the device in the x-axis.
	 */
	this.x = x;
	/*
	 * The force applied by the device in the y-axis.
	 */
	this.y = y;
	/*
	 * The force applied by the device in the z-axis.
	 */
	this.z = z;
	/*
	 * The time that the acceleration was obtained.
	 */
	this.timestamp = new Date().getTime();
};

/*
 * This class specifies the options for requesting acceleration data.
 * @constructor
 */
function AccelerationOptions() {
	/*
	 * The timeout after which if acceleration data cannot be obtained the errorCallback
	 * is called.
	 */
	this.timeout = 10000;
};

/*
 * This class provides access to device accelerometer data.
 * @constructor
 */
function Accelerometer() {
	/*
	 * The last known acceleration.
	 */
	this.lastAcceleration = null;
};

/*
 * Asynchronously aquires the current acceleration.
 * @param {Function} successCallback The function to call when the acceleration
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the acceleration data.
 * @param {AccelerationOptions} options The options for getting the accelerometer data
 * such as timeout.
 */

Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {

    var referenceTime = 0;
    if (this.lastAcceleration)
        referenceTime = this.lastAcceleration.timestamp;
    else
        this.start();
 
    var timeout = 20000;
    var interval = 500;
    if (typeof(options) == 'object' && options.interval)
        interval = options.interval;
 
    if (typeof(successCallback) != 'function')
        successCallback = function() {};
    if (typeof(errorCallback) != 'function')
        errorCallback = function() {};
 
    var dis = this;
    var delay = 0;
    var timer = setInterval(function() {
        delay += interval;
 
		//if we have a new acceleration, call success and cancel the timer
        if (typeof(dis.lastAcceleration) == 'object' && dis.lastAcceleration.timestamp > referenceTime) {
            successCallback(dis.lastAcceleration);
            clearInterval(timer);
        } else if (delay >= timeout) { //else if timeout has occured then call error and cancel the timer
            errorCallback();
            clearInterval(timer);
        }
		//else the interval gets called again
    }, interval);
};


/*
 * Asynchronously aquires the acceleration repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the acceleration
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the acceleration data.
 * @param {AccelerationOptions} options The options for getting the accelerometer data
 * such as timeout.
 */

Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options) {
	this.getCurrentAcceleration(successCallback, errorCallback, options);
	// TODO: add the interval id to a list so we can clear all watches
 	var frequency = (options != undefined)? options.frequency : 10000;
	var that = this;
	return setInterval(function() {
		that.getCurrentAcceleration(successCallback, errorCallback, options);
	}, frequency);
};

/*
 * Clears the specified accelerometer watch.
 * @param {String} watchId The ID of the watch returned from #watchAcceleration.
 */
Accelerometer.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
};

/*
 * Starts the native acceleration listener.
 */

Accelerometer.prototype.start = function() {
	var that = this;
	Mojo.Event.listen(document, "acceleration", function(event) {
		var accel = new Acceleration(event.accelX, event.accelY, event.accelZ);
		that.lastAcceleration = accel;
	});
};

if (typeof navigator.accelerometer == "undefined") navigator.accelerometer = new Accelerometer();

/*
 * This class provides access to the device audio
 * @constructor
 */

PhoneGap.overrideAudio = function() {
	
	PhoneGap.MojoAudio = Audio;
	
	Audio = function(src) {
		this.src = src;							
	};

	Audio.prototype.play = function() {
		// this.src = src;
		// The 'end' event listener doesn't seem to work, so we have to call stop before playing
		// otherwise, we'll never be able to play again
		if (this.paused && !this.stopped) {
			this.paused = false;
			this.playing = true;	
			this.audioPlayer.play();
		} else {
			if (this.audioPlayer)
				this.stop();
			if (!this.playing) {
				this.paused = false;
				this.playing = true;	
				this.stopped = false;
				this.audioPlayer = new PhoneGap.MojoAudio();
				var file = Mojo.appPath + this.src;
				if (this.audioPlayer.palm) {
					this.audioPlayer.mojo.audioClass = "media";
				}
				this.audioPlayer.src = file;
		
				//event doesn't work, see above
				this.audioPlayer.addEventListener('end', this.endHandler, false);
				this.audioPlayer.play();
			}
		}
	};

	Audio.prototype.pause = function() {
		if (this.stopped)
			return;
		this.paused = true;	
		if (this.playing) {
			this.playing = false;
			this.stopped = false;
			this.audioPlayer.pause();
		} else {
			this.playing = false;	
			this.paused = false;
			this.stopped = true;
		}
	};

	Audio.prototype.stop = function() {
		this.audioPlayer.pause();	
		this.audioPlayer.src = null;
		this.playing = false;	
		this.paused = false;
		this.stopped = true;
	};

	// End event handler not working (see comment in Audio.prototype.play)
	Audio.prototype.endHandler = function () {
		this.audioPlayer.removeEventListener('end', endHandler, false);
		this.audioPlayer.pause();	
		this.audioPlayer.src = null;
		this.paused = false;
		this.stopped = true;
	};

	/*
	 * This class contains information about any Media errors.
	 * @constructor
	 */
	MediaError = function() {
		this.code = null,
		this.message = "";
	};

	MediaError.MEDIA_ERR_ABORTED 		= 1;
	MediaError.MEDIA_ERR_NETWORK 		= 2;
	MediaError.MEDIA_ERR_DECODE 		= 3;
	MediaError.MEDIA_ERR_NONE_SUPPORTED = 4;

}

document.addEventListener("deviceready", PhoneGap.overrideAudio, false);

/*
 * This class provides access to the device camera.
 * @constructor
 */
function Camera() {
	
};

/*
 * 
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 */
Camera.prototype.getPicture = function(successCallback, errorCallback, options) {
	
	//TODO: This callback is not being called
	//currently calling handlePicture from First-assistant.js activate method
	var that = this;
	this.callback = function (event) { 
		if (event !== undefined) {
			debug.log(Object.toJSON(event));
			Mojo.Event.stopListening(PhoneGap.sceneController.sceneElement, Mojo.Event.activate, that.callback);
			
			// TODO: not receiving the proper event object as per forum article
			//successCallback(event.filename);
		}
	};
	
	Mojo.Event.listen(PhoneGap.sceneController.sceneElement, Mojo.Event.activate, this.callback);
	
	PhoneGap.sceneController.stageController.pushScene(
		{ 
			appId :'com.palm.app.camera', 
			name: 'capture' 
		}, { 
			sublaunch : true
			//filename: "/media/internal/pg_" + (new Date()).getTime() + ".jpg"
		}
	);
};

if (typeof navigator.camera == 'undefined') navigator.camera = new Camera();

/*
 * This class provides access to the device contacts.
 * @constructor
 */

function Contacts() {
	
};

function Contact() {
    this.phones = [];
    this.emails = [];
	this.name = {
		givenName: "",
		familyName: "",
		formatted: ""
	};
	this.id = "";
};

Contact.prototype.displayName = function()
{
    // TODO: can be tuned according to prefs
	return this.givenName + " " + this.familyName;
};

function ContactsFilter(name) {
	if (name)
		this.name = name;
	else
		this.name = "";
};

/*
 * @param {ContactsFilter} filter Object with filter properties. filter.name only for now.
 * @param {function} successCallback Callback function on success
 * @param {function} errorCallback Callback function on failure
 * @param {object} options Object with properties .page and .limit for paging
 */

Contacts.prototype.find = function(filter, successCallback, errorCallback, options) {
	errorCallback({ name: "ContactsError", message: "PhoneGap Palm contacts not implemented" });
};

Contacts.prototype.success_callback = function(contacts_iterator) {
};

if (typeof navigator.contacts == "undefined") navigator.contacts = new Contacts();
/*
 * This class provides access to the debugging console.
 * @constructor
 */
function DebugConsole() {
};

/*
 * Print a normal log message to the console
 * @param {Object|String} message Message or object to print to the console
 */
DebugConsole.prototype.log = function(message) {
	if (typeof message == 'object')
		message = Object.toJSON(message);
	this.error(message);
	//this isn't working on the device
	/*
    if (typeof Mojo != 'undefined')
		Mojo.Log.info(message);
	*/
};

/*
 * Print a warning message to the console
 * @param {Object|String} message Message or object to print to the console
 */
DebugConsole.prototype.warn = function(message) {
	if (typeof message == 'object')
		message = Object.toJSON(message);
	this.error(message);
	//this isn't working on the device
	/*
    if (typeof Mojo != 'undefined')
		Mojo.Log.warn(message);
	*/
};

/**
 * Print an error message to the console
 * @param {Object|String} message Message or object to print to the console
 */
DebugConsole.prototype.error = function(message) {
	if (typeof message == 'object')
		message = Object.toJSON(message);
    if (typeof Mojo != 'undefined')
		Mojo.Log.error(message);
};

if (typeof window.debug == "undefined") window.debug = new DebugConsole();
/*
 * this represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function Device() {
    this.platform = "palm";
    this.version  = null;
    this.name     = null;
    this.uuid     = null;

	if (typeof Mojo != 'undefined')
		this.setUUID();
};

Device.prototype.setUUID = function() {
	//this is the only system property webos provides (may change?)
	var that = this;
	this.service = new Mojo.Service.Request('palm://com.palm.preferences/systemProperties', {
	    method:"Get",
	    parameters:{"key": "com.palm.properties.nduid" },
	    onSuccess: function(result) {
			that.uuid = result["com.palm.properties.nduid"];
		}
    });	
};

if (typeof window.device == 'undefined') window.device = navigator.device = new Device();

/*
 * This class provides generic read and write access to the mobile device file system.
 */
function File() {
	/**
	 * The data of a file.
	 */
	this.data = "";
	/**
	 * The name of the file.
	 */
	this.name = "";
};

/*
 * Reads a file from the mobile device. This function is asyncronous.
 * @param {String} fileName The name (including the path) to the file on the mobile device. 
 * The file name will likely be device dependant.
 * @param {Function} successCallback The function to call when the file is successfully read.
 * @param {Function} errorCallback The function to call when there is an error reading the file from the device.
 */
File.prototype.read = function(fileName, successCallback, errorCallback) {
	//Mojo has no file i/o yet, so we use an xhr. very limited
	var path = fileName;	//incomplete
	Mojo.Log.error(path);
	
	if (typeof successCallback != 'function')
		successCallback = function () {};
	if (typeof errorCallback != 'function')
		errorCallback = function () {};
	
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200 && xhr.responseText != null) {
				this.data = xhr.responseText;
				this.name = path;
				successCallback(this.data);
			} else {
				errorCallback({ name: xhr.status, message: "could not read file: " + path });
			}
		}
	};
	xhr.open("GET", path, true);
	xhr.send();
};

/*
 * Writes a file to the mobile device. 
 * @param {File} file The file to write to the device.
 */
File.prototype.write = function(file) {
	//Palm does not provide file i/o
};

if (typeof navigator.file == "undefined") navigator.file = new File();


/*
 * This class provides access to device GPS data.
 * @constructor
 */
function Geolocation() {
    /**
     * The last known GPS position.
     */
    this.lastPosition = null;
    this.lastError = null;
    this.callbacks = {
        onLocationChanged: [],
        onError:           []
    };
};

/*
 * Asynchronously aquires the current position.
 * @param {Function} successCallback The function to call when the position
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the position data.
 * @param {PositionOptions} options The options for getting the position data
 * such as timeout.
 */
Geolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options) {
    /*
	var referenceTime = 0;
    if (this.lastPosition)
        referenceTime = this.lastPosition.timestamp;
    else
        this.start(options);
	*/
	
    var timeout = 20000;
	if (typeof(options) == 'object' && options.timeout)
		timeout = options.timeout;

    if (typeof(successCallback) != 'function')
        successCallback = function() {};
    if (typeof(errorCallback) != 'function')
        errorCallback = function() {};

	/*
    var dis = this;
    var delay = 0;
    var timer = setInterval(function() {
        delay += interval;
		
		//if we have a new position, call success and cancel the timer
        if (dis.lastPosition && typeof(dis.lastPosition) == 'object' && dis.lastPosition.timestamp > referenceTime) {
            successCallback(dis.lastPosition);
            clearInterval(timer);
        } else if (delay >= timeout) { //else if timeout has occured then call error and cancel the timer
            errorCallback();
            clearInterval(timer);
        }
		//else the interval gets called again
    }, interval);
	*/
	
	var responseTime;
	if (timeout <=5000)
		responseTime = 1;
	else if (5000 < timeout <= 20000)
		responseTime = 2;
	else
		responseTime = 3;
	
	var timer = setTimeout(function(){
		errorCallback({ message: "timeout" });
	}, timeout);
	
	var startTime = (new Date()).getTime();

	var alias = this;
	
	// It may be that getCurrentPosition is less reliable than startTracking ... but
	// not sure if we want to be starting and stopping the tracker if we're not watching.
	new Mojo.Service.Request('palm://com.palm.location', {
	    method:"getCurrentPosition",
	    parameters:{
			responseTime: responseTime
		},
        onSuccess: function(event) { 
			alias.lastPosition = { 
				coords: { 
					latitude: event.latitude, 
					longitude: event.longitude, 
					altitude: (event.altitude >= 0 ? event.altitude : null), 
					speed: (event.velocity >= 0 ? event.velocity : null), 
					heading: (event.heading >= 0 ? event.heading : null), 
					accuracy: (event.horizAccuracy >= 0 ? event.horizAccuracy : null),
					altitudeAccuracy: (event.vertAccuracy >= 0 ? event.vertAccuracy : null)
				},
				timestamp: new Date().getTime()
			};
			
			var responseTime = alias.lastPosition.timestamp - startTime;
			if (responseTime <= timeout)
			{
				clearTimeout(timer);
				successCallback(alias.lastPosition);
			}
		},
        onFailure: function() {
			errorCallback();
		}
	});

};

/*
 * Asynchronously aquires the position repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the position
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the position data.
 * @param {PositionOptions} options The options for getting the position data
 * such as timeout and the frequency of the watch.
 */
Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options) {
	// Invoke the appropriate callback with a new Position object every time the implementation 
	// determines that the position of the hosting device has changed. 
	
	var frequency = 10000;
    if (typeof(options) == 'object' && options.frequency)
        frequency = options.frequency;

	this.start(options, errorCallback);
	
	var referenceTime = 0;
	if (this.lastPosition)
		referenceTime = this.lastPosition.timestamp;
		
	var alias = this;
	return setInterval(function() {
		// check if we have a new position, if so call our successcallback
		if (!alias.lastPosition)
			return;
	
		if (alias.lastPosition.timestamp > referenceTime)
			successCallback(alias.lastPosition);
	}, frequency);
};


/*
 * Clears the specified position watch.
 * @param {String} watchId The ID of the watch returned from #watchPosition.
 */
Geolocation.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
	this.stop();
};

Geolocation.prototype.start = function(options, errorCallback) {
	//options.timeout;
	//options.interval;
	
	if (typeof(errorCallback) != 'function')
		errorCallback = function(){};
	
	var that = this;
	var frequency = 10000;
    if (typeof(options) == 'object' && options.frequency)
        frequency = options.frequency;

	var responseTime;
	if (frequency <=5000)
		responseTime = 1;
	else if (5000 < frequency <= 20000)
		responseTime = 2;
	else
		responseTime = 3;
	
	//location tracking does not support setting a custom interval :P
	this.trackingHandle = new Mojo.Service.Request('palm://com.palm.location', {
		method : 'startTracking',
        parameters: {
			subscribe: true
        },
        onSuccess: function(event) { 
			that.lastPosition = { 
				coords: { 
					latitude: event.latitude, 
					longitude: event.longitude, 
					altitude: (event.altitude >= 0 ? event.altitude : null), 
					speed: (event.velocity >= 0 ? event.velocity : null), 
					heading: (event.heading >= 0 ? event.heading : null), 
					accuracy: (event.horizAccuracy >= 0 ? event.horizAccuracy : null),
					altitudeAccuracy: (event.vertAccuracy >= 0 ? event.vertAccuracy : null)
				}, 
				timestamp: new Date().getTime() 
			};
		},
        onFailure: function() {
			errorCallback();
		}
    });
};

Geolocation.prototype.stop = function() {
	this.trackingHandle.cancel();
};

if (typeof navigator.geolocation == "undefined") navigator.geolocation = new Geolocation();

/*
 * This class provides access to native mapping applications on the device.
 */
function Map() {
	
};

/*
 * Shows a native map on the device with pins at the given positions.
 * @param {Array} positions
 */
Map.prototype.show = function(positions) {

	var jsonPos = {};
	var pos = null;
	if (typeof positions == 'object') {
		// If positions is an array, then get the first only, since google's query
		// can't take more than one marker (believe it or not).
		// Otherwise we assume its a single position object.
		if (positions.length) {
			pos = positions[0];
		} else {
			pos = positions;
		}
	} 
	else if (navigator.geolocation.lastPosition) {
		pos = navigator.geolocation.lastPosition;
	} else {
		// If we don't have a position, lets use nitobi!
		pos = { coords: { latitude: 49.28305, longitude: -123.10689 } };
	}

	this.service = new Mojo.Service.Request('palm://com.palm.applicationManager', {
		method: 'open',
		parameters: {
		id: 'com.palm.app.maps',
		params: {
			query: "@" + pos.coords.latitude + "," + pos.coords.longitude
			}
		}
	});

};

if (typeof navigator.map == "undefined") navigator.map = new Map();

function Network() {
    /*
     * The last known Network status.
     */
	this.lastReachability = null;
};

Network.prototype.isReachable = function(hostName, successCallback, options) {
	this.request = new Mojo.Service.Request('palm://com.palm.connectionmanager', {
	    method: 'getstatus',
	    parameters: {},
	    onSuccess: function(result) { 
			var status = NetworkStatus.NOT_REACHABLE;
			if (result.isInternetConnectionAvailable == true)
			{
				// don't know whether its via wifi or carrier ... so return the worst case
				status = NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK;
			}
			successCallback(status); 
		},
	    onFailure: function() {}
	});

};

/*
 * This class contains information about any NetworkStatus.
 * @constructor
 */
function NetworkStatus() {
	this.code = null;
	this.message = "";
};

NetworkStatus.NOT_REACHABLE = 0;
NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK = 1;
NetworkStatus.REACHABLE_VIA_WIFI_NETWORK = 2;

if (typeof navigator.network == "undefined") navigator.network = new Network();

/*
 * This class provides access to notifications on the device.
 */
function Notification() {
};
/*
 * This function vibrates the device
 * @param {number} duration The duration in ms to vibrate for.
 * @param {number} intensity The intensity of the vibration
 */
Notification.prototype.vibrate = function (duration, intensity) {
	//the intensity for palm is inverted; 0=high intensity, 100=low intensity
	//this is opposite from our api, so we invert
	if (isNaN(intensity) || intensity > 100 || intensity <= 0)
		intensity = 0;
	else
		intensity = 100 - intensity;
	
	// if the app id does not have the namespace "com.palm.", an error will be thrown here
	this.vibhandle = new Mojo.Service.Request("palm://com.palm.vibrate", { 
		method: 'vibrate', 
		parameters: { 
			'period': intensity,
			'duration': duration
		}
	}, false);
};

Notification.prototype.beep = function () {
	this.beephandle = new Mojo.Service.Request('palm://com.palm.audio/systemsounds', {
	    method: "playFeedback",
	    parameters: {
			// There isn't really a generic 'beep' in the system sounds.
			// http://developer.palm.com/index.php?option=com_content&view=article&id=1618
			name: "error_01"
		},
    	onSuccess: function (response) { },
    	onFailure: function (response) { Mojo.Log.error("failure: " + Object.toJSON(response)); }
	}, true);
};

/*
 * Open a native alert dialog, with a customizable title and button text.
 * @param {String} message Message to print in the body of the alert
 * @param {String} [title="Alert"] Title of the alert dialog (default: Alert)
 * @param {String} [buttonLabel="OK"] Label of the close button (default: OK)
 */
Notification.prototype.alert = function(message, title, buttonLabel) {
	try {
		//var controller = Mojo.Controller.getAppController().getActiveStageController().
		//debug.log(Object.toJSON(Mojo.Controller.getAppController()));
	if (typeof title == 'undefined')
		title = Mojo.appInfo.title;
	if (typeof buttonLabel == 'undefined')
		buttonLabel = "OK";
	PhoneGap.sceneController.showAlertDialog({
	    onChoose: function() {},
	    title: $L(title),
	    message: $L(message),
	    choices:[
	         {label:$L(buttonLabel), value:"true", type:'affirmative'}   
	    ]
	    });
	} catch (ex) { debug.log(ex.name + ": " + ex.message); }
};

if (typeof navigator.notification == 'undefined') { 
	navigator.notification = new Notification(); 
	alert = navigator.notification.alert;
}

/*
 * This class provides access to the device orientation.
 * @constructor
 */
function Orientation() {
	/*
	 * The current orientation, or null if the orientation hasn't changed yet.
	 */
	this.currentOrientation = null;
	this.started = false;
};

/*
 * Set the current orientation of the phone.  This is called from the device automatically.
 * 
 * When the orientation is changed, the DOMEvent \c orientationChanged is dispatched against
 * the document element.  The event has the property \c orientation which can be used to retrieve
 * the device's current orientation, in addition to the \c Orientation.currentOrientation class property.
 *
 * @param {Number} orientation The orientation to be set
 */
Orientation.prototype.setOrientation = function(orientation) {
	if (!isNaN(orientation) && this.currentOrientation != orientation) {
	    this.currentOrientation = orientation;
	    var e = document.createEvent('Events');
	    e.initEvent('orientationChanged', 'false', 'false');
	    e.orientation = orientation;
	    document.dispatchEvent(e);
	}
};

/*
 * Asynchronously aquires the current orientation.
 * @param {Function} successCallback The function to call when the orientation
 * is known.
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the orientation.
 */
Orientation.prototype.getCurrentOrientation = function(successCallback, errorCallback) {
	if (typeof successCallback != 'function')
		successCallback = function () {};
	if (typeof errorCallback != 'function')
		errorCallback = function () {};
	
	if (!this.started)
		this.start(successCallback);
	else if (!isNaN(this.currentOrientation))
		successCallback(this.currentOrientation);
	else
		errorCallback();
};

/*
 * Starts the native orientationchange event listener.
 */
Orientation.prototype.start = function (successCallback) {
	var that = this;
	// This subscribes the callback once for the successCallback function
	that.callback = function (e) {
		Mojo.Event.stopListening(document, "orientationChanged", that.callback);
		successCallback(e.orientation);
	}
	Mojo.Event.listen(document, "orientationChanged", that.callback);
	
	// This subscribes setOrientation to be constantly updating the currentOrientation property
	Mojo.Event.listen(document, "orientationchange", function(event) {
		var orient = null;
		switch (event.position) {
			case 0: orient = DisplayOrientation.FACE_UP; break;
			case 1: orient = DisplayOrientation.FACE_DOWN; break;
			case 2: orient = DisplayOrientation.PORTRAIT; break;
			case 3: orient = DisplayOrientation.REVERSE_PORTRAIT; break;
			case 4: orient = DisplayOrientation.LANDSCAPE_RIGHT_UP; break;
			case 5: orient = DisplayOrientation.LANDSCAPE_LEFT_UP; break;
			default: return; 	//orientationchange event seems to get thrown sometimes with a null event position
		}
		that.setOrientation(orient);
	});
	this.started = true;
};

/*
 * Asynchronously aquires the orientation repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the orientation
 * data is available.
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the orientation data.
 */
Orientation.prototype.watchOrientation = function(successCallback, errorCallback, options) {
	// Invoke the appropriate callback with a new Position object every time the implementation 
	// determines that the position of the hosting device has changed. 
	this.getCurrentOrientation(successCallback, errorCallback);
	var interval = 1000;
	if (options && !isNaN(options.interval))
		interval = options.interval;
	var that = this;
	return setInterval(function() {
		that.getCurrentOrientation(successCallback, errorCallback);
	}, interval);
};

/*
 * Clears the specified orientation watch.
 * @param {String} watchId The ID of the watch returned from #watchOrientation.
 */
Orientation.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
};

/*
 * This class encapsulates the possible orientation values.
 * @constructor
 */
function DisplayOrientation() {
	this.code = null;
	this.message = "";
};

DisplayOrientation.PORTRAIT = 0;
DisplayOrientation.REVERSE_PORTRAIT = 1;
DisplayOrientation.LANDSCAPE_LEFT_UP = 2;
DisplayOrientation.LANDSCAPE_RIGHT_UP = 3;
DisplayOrientation.FACE_UP = 4;
DisplayOrientation.FACE_DOWN = 5;

if (typeof navigator.orientation == "undefined") navigator.orientation = new Orientation();

function Position(coords) {
	this.coords = coords;
    this.timestamp = new Date().getTime();
};

function Coordinates(lat, lng, alt, acc, head, vel, altacc) {
	/*
	 * The latitude of the position.
	 */
	this.latitude = lat;
	/*
	 * The longitude of the position,
	 */
	this.longitude = lng;
	/*
	 * The accuracy of the position.
	 */
	this.accuracy = acc;
	/*
	 * The altitude of the position.
	 */
	this.altitude = alt;
	/*
	 * The direction the device is moving at the position.
	 */
	this.heading = head;
	/*
	 * The velocity with which the device is moving at the position.
	 */
	this.speed = vel;
	/*
	 * The altitude accuracy of the position.
	 */
	this.altitudeAccuracy = (typeof(altacc) != 'undefined') ? altacc : null;
};

/*
 * This class specifies the options for requesting position data.
 * @constructor
 */
function PositionOptions() {
	/*
	 * Specifies the desired position accuracy.
	 */
	this.enableHighAccuracy = true;
	/*
	 * The timeout after which if position data cannot be obtained the errorCallback
	 * is called.
	 */
	this.timeout = 10000;
};

/*
 * This class contains information about any GSP errors.
 * @constructor
 */
function PositionError() {
	this.code = null;
	this.message = "";
};

PositionError.UNKNOWN_ERROR = 0;
PositionError.PERMISSION_DENIED = 1;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.TIMEOUT = 3;

/*
 * This class provides access to the device SMS functionality.
 * @constructor
 */
function Sms() {

};

/*
 * Sends an SMS message.
 * @param {Integer} number The phone number to send the message to.
 * @param {String} message The contents of the SMS message to send.
 * @param {Function} successCallback The function to call when the SMS message is sent.
 * @param {Function} errorCallback The function to call when there is an error sending the SMS message.
 * @param {PositionOptions} options The options for accessing the GPS location such as timeout and accuracy.
 */
Sms.prototype.send = function(number, message, successCallback, errorCallback, options) {
	try {
		this.service = new Mojo.Service.Request('palm://com.palm.applicationManager', {
		     method:'launch',
		     parameters:{
		         id:"com.palm.app.messaging",
		         params: {
					composeAddress: number,
					messageText: message
		         }
		     }
		});
		successCallback();
	} catch (ex) {
		errorCallback({ name: "SMSerror", message: ex.name + ": " + ex.message });
	}
};

if (typeof navigator.sms == "undefined") navigator.sms = new Sms();

/*
 * TODO for Palm. Could just use below functionality, and implement simple serialization, or could map to Palm's data store APIs.
 * @author ryan
 */

function Storage() {
	this.length = null;
	this.available = true;
	this.serialized = null;
	this.items = null;
	
	if (!window.widget) {
		this.available = false;
		return;
	}
	var pref = window.widget.preferenceForKey(Storage.PREFERENCE_KEY);
	
	//storage not yet created
	if (pref == "undefined" || pref == undefined) {
		this.length = 0;
		this.serialized = "({})";
		this.items = {};
		window.widget.setPreferenceForKey(this.serialized, Storage.PREFERENCE_KEY);
	} else {
		this.serialized = pref;'({"store_test": { "key": "store_test", "data": "asdfasdfs" },})';

		this.items = eval(this.serialized);

	}
};

Storage.PREFERENCE_KEY = "phonegap_storage_pref_key";

Storage.prototype.index = function (key) {
	
};

Storage.prototype.getItem = function (key) {
	
	var err = "Storage unimplemented on Palm PhoneGap";
	debug.log(err);
	throw { name: "StorageError", message: err };
	
	try {
		return this.items[key].data;
	} catch (ex) {
		return null;
	}
};

Storage.prototype.setItem = function (key, data) {
	
	var err = "Storage unimplemented on Palm PhoneGap";
	debug.log(err);
	throw { name: "StorageError", message: err };
	
	if (!this.items[key])
		this.length++;
	this.items[key] = {
		"key": key,
		"data": data
	};
	
	this.serialize();
};

Storage.prototype.removeItem = function (key) {
	if (this.items[key]) {
		this.items[key] = undefined;
		this.length--;
	}
	this.serialize();
};

Storage.prototype.clear = function () {
	this.length = 0;
	this.serialized = "({})";
	this.items = {};
};

Storage.prototype.serialize = function() {
	var err = "Storage unimplemented on Palm PhoneGap";
	debug.log(err);
	throw { name: "StorageError", message: err };

};

if (typeof navigator.storage == "undefined" ) navigator.storage = new Storage();

/*
 * This class provides access to the telephony features of the device.
 * @constructor
 */
function Telephony() {
	this.number = "";
};

/*
 * Calls the specifed number.
 * @param {Integer} number The number to be called.
 */
Telephony.prototype.send = function(number) {
	this.number = number;
	this.service = new Mojo.Service.Request('palm://com.palm.applicationManager', {
	    method:'open',
	    parameters: {
	       target: "tel://" + number
	    }
	});
};

if (typeof navigator.telephony == "undefined") navigator.telephony = new Telephony();


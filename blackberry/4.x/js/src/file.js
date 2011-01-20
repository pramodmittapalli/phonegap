/**
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
}

if (typeof navigator.file === "undefined") { navigator.file = new File(); }

File.prototype.read = function(fileName, successCallback, errorCallback) {
	alert('File I/O not implemented in PhoneGap BlackBerry - yet.');
	/*document.cookie = 'bb_command={command:8,args:{name:"'+fileName+'"}}';
	navigator.file.successCallback = successCallback;
	navigator.file.errorCallback = errorCallback;
	navigator.file.readTimeout = window.setInterval('navigator.file.m_readReady()', 1000);*/
};

File.prototype.m_readReady = function() {
	var cookies = document.cookie.split(';'), i, cookie, obj, file;
	for (i=0; i<cookies.length; i++) {
		cookie = cookies[i].split('=');
		if (cookie[0] === 'bb_response') {
			obj = eval('('+cookie[1]+')');

			// TODO: This needs to be in ONE cookie reading loop I think so that it can find 
			// various different data coming back from the phone at any time (poll piggy-backing)
			file = obj.readfile;
			if (file !== null)
			{
				window.clearTimeout(navigator.file.readTimeout);
				if (file.length > 0)
				{
					successCallback(file);
				}
			}
		}
	}
};

File.prototype.write = function(fileName, data) {
	alert('File I/O not implemented in PhoneGap BlackBerry - yet.');
//	document.cookie = 'bb_command={command:9,args:{name:"'+fileName+'",data:"'+data+'"}}';
};


/* http://matt-harrison.com/perfect-web-audio-on-ios-devices-with-the-web-audio-api/*/
/* https://paulbakaus.com/tutorials/html5/web-audio-on-ios/*/
/* TODO: write thank you to these guys */

// this is a workaround for ios to play multiple sounds at the same time


// TODO: hide in a namespace
try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new window.AudioContext();
} catch (e) {
    console.log("No Web Audio API support");
}

/*
 * WebAudioAPISoundManager Constructor
 */
var WebAudioAPISoundManager = function (context) {
    this.context = context;
    this.bufferList = {};
    this.playingSounds = {};
};

/*
 * WebAudioAPISoundManager Prototype
 */
WebAudioAPISoundManager.prototype = {
    addSound: function (url) {
        // Load buffer asynchronously
        var request = new XMLHttpRequest();

        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var self = this;

        request.onload = function () {
            // Asynchronously decode the audio file data in request.response
            self.context.decodeAudioData(
                request.response,

                function (buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    self.bufferList[url] = buffer;
                });
        };

        request.onerror = function () {
            alert('BufferLoader: XHR error');
        };
        request.send();
    },
    stopSoundWithUrl: function(url) {
        if(this.playingSounds.hasOwnProperty(url)){
            for(var i in this.playingSounds[url]){
                if(this.playingSounds[url].hasOwnProperty(i))
                    this.playingSounds[url][i].noteOff(0);
            }
        }
    }
};

/*
 * WebAudioAPISound Constructor
 */
var WebAudioAPISound = function (url, options) {
    this.settings = {
        loop: false
    };

    for(var i in options){
        if(options.hasOwnProperty(i))
            this.settings[i] = options[i];
    }

    this.url = url;
    window.webAudioAPISoundManager = window.webAudioAPISoundManager || new WebAudioAPISoundManager(window.audioContext);
    this.manager = window.webAudioAPISoundManager;
    this.manager.addSound(this.url);
};

/*
 * WebAudioAPISound Prototype
 */
WebAudioAPISound.prototype = {
    play: function () {
        var buffer = this.manager.bufferList[this.url];
        //Only play if it's loaded yet
        if (typeof buffer !== "undefined") {
            var source = this.makeSource(buffer);
            source.loop = this.settings.loop;
            source.start(0);

            if(!this.manager.playingSounds.hasOwnProperty(this.url))
                this.manager.playingSounds[this.url] = [];
            this.manager.playingSounds[this.url].push(source);
        }
    },
    stop: function () {
        this.manager.stopSoundWithUrl(this.url);
    },
    getVolume: function () {
        return this.translateVolume(this.volume, true);
    },
    //Expect to receive in range 0-100
    setVolume: function (volume) {
        this.volume = this.translateVolume(volume);
    },
    translateVolume: function(volume, inverse){
        return inverse ? volume * 100 : volume / 100;
    },
    makeSource: function (buffer) {
        var source = this.manager.context.createBufferSource();
        var gainNode = this.manager.context.createGain();
        gainNode.gain.value = this.volume ? this.volume : 1.0;
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.manager.context.destination);
        return source;
    }
};



// TODO: hide in a namespace
var isUnlocked = false;
var myContext = window.audioContext;   // TODO: use as function param
function unlock_webaudio_in_ios() {
	if(isUnlocked) {   // TODO: or not iOS
        return;
    }
	// create empty buffer and play it
	var buffer = myContext.createBuffer(1, 1, 22050);
	var source = myContext.createBufferSource();
	source.buffer = buffer;
	source.connect(myContext.destination);
	source.start(0);
	// by checking the play state after some time, we know if we're really unlocked
	setTimeout(function() {
		if((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
			isUnlocked = true;
            window.removeEventListener('touchstart', unlock_webaudio_in_ios, false);
		}
	}, 0);
}
window.addEventListener('touchstart', unlock_webaudio_in_ios, false);



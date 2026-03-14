/* ============================================================
   Murder Inc Dice Roller — sound.js
   Procedural audio via Web Audio API. No external files needed.
   ============================================================ */

var MurderSound = (function () {

    var ctx = null;

    function getCtx() {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        // Resume if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    // Generic helper: play an oscillator burst
    function playTone(freq, type, gainVal, duration, fadeStart) {
        var c = getCtx();
        if (!c) return;

        var osc  = c.createOscillator();
        var gain = c.createGain();

        osc.connect(gain);
        gain.connect(c.destination);

        osc.type      = type || 'sine';
        osc.frequency.setValueAtTime(freq, c.currentTime);

        gain.gain.setValueAtTime(gainVal, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    }

    // Rattle: multiple short random noise bursts = dice shaking
    function playRattle() {
        var c = getCtx();
        if (!c) return;

        var steps = 10;
        for (var i = 0; i < steps; i++) {
            (function (i) {
                setTimeout(function () {
                    var bufSize = c.sampleRate * 0.04;
                    var buf     = c.createBuffer(1, bufSize, c.sampleRate);
                    var data    = buf.getChannelData(0);
                    for (var j = 0; j < bufSize; j++) {
                        data[j] = (Math.random() * 2 - 1) * 0.4;
                    }

                    var src    = c.createBufferSource();
                    var filter = c.createBiquadFilter();
                    var gain   = c.createGain();

                    src.buffer = buf;
                    filter.type            = 'bandpass';
                    filter.frequency.value = 800 + Math.random() * 1200;
                    filter.Q.value         = 0.8;

                    gain.gain.setValueAtTime(0.35, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);

                    src.connect(filter);
                    filter.connect(gain);
                    gain.connect(c.destination);
                    src.start();
                }, i * 45);
            }(i));
        }
    }

    // Impact: low thud when result hits
    function playImpact() {
        var c = getCtx();
        if (!c) return;

        // Sub thud
        var osc1  = c.createOscillator();
        var gain1 = c.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(120, c.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.25);
        gain1.gain.setValueAtTime(0.8, c.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(c.destination);
        osc1.start(c.currentTime);
        osc1.stop(c.currentTime + 0.3);

        // Click transient
        playTone(280, 'square', 0.25, 0.05);
    }

    // High roll flourish: ascending chime
    function playHighRoll() {
        var c = getCtx();
        if (!c) return;

        var freqs = [523, 659, 784, 1047];
        freqs.forEach(function (f, i) {
            setTimeout(function () {
                playTone(f, 'sine', 0.18, 0.3);
            }, i * 70);
        });
    }

    // Low roll sting: descending dissonant tones
    function playLowRoll() {
        var c = getCtx();
        if (!c) return;

        playTone(220, 'sawtooth', 0.12, 0.4);
        setTimeout(function () { playTone(196, 'sawtooth', 0.10, 0.35); }, 80);
    }

    // Click: small UI tick for counter buttons
    function playClick() {
        var c = getCtx();
        if (!c) return;
        playTone(600, 'square', 0.06, 0.04);
    }

    // Clear: soft whoosh
    function playClear() {
        var c = getCtx();
        if (!c) return;
        playTone(300, 'sine', 0.08, 0.15);
        setTimeout(function () { playTone(200, 'sine', 0.05, 0.12); }, 60);
    }

    return {
        rattle:   playRattle,
        impact:   playImpact,
        highRoll: playHighRoll,
        lowRoll:  playLowRoll,
        click:    playClick,
        clear:    playClear
    };

}());

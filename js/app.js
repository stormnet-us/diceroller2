var SIDES = [4, 6, 8, 10, 12, 20];
var counts = { 4:0, 6:0, 8:0, 10:0, 12:0, 20:0 };
var modifier = 0;
var rollHistory = [];
var rollCount = 0;
var sessionTotal = 0;
var sessionHigh = null;

function el(id) { return document.getElementById(id); }
function randomInt(max) { return Math.floor(Math.random() * max) + 1; }

/* Counter +/- buttons */
el(‘diceGrid’).addEventListener(‘click’, function (e) {
var btn = e.target.closest(’.cnt-btn’);
if (!btn) return;
var side  = parseInt(btn.getAttribute(‘data-side’), 10);
var delta = parseInt(btn.getAttribute(‘data-delta’), 10);
counts[side] = Math.max(0, counts[side] + delta);
el(‘cnt-’ + side).value = counts[side];
el(‘card-’ + side).classList.toggle(‘active’, counts[side] > 0);
el(‘error’).style.display = ‘none’;
MurderSound.click();
});

/* Modifier buttons */
el(‘modDown’).addEventListener(‘click’, function () { modifier-; updateModDisplay(); MurderSound.click(); });
el(‘modUp’).addEventListener(‘click’,   function () { modifier++; updateModDisplay(); MurderSound.click(); });

function updateModDisplay() {
var input = el(‘modifier’);
input.value = modifier >= 0 ? ‘+’ + modifier : String(modifier);
input.className = ‘mod-val’ + (modifier > 0 ? ’ positive’ : modifier < 0 ? ’ negative’ : ‘’);
}

/* Reset button */
el(‘clearDiceBtn’).addEventListener(‘click’, function () {
SIDES.forEach(function (s) {
counts[s] = 0;
el(‘cnt-’ + s).value = 0;
el(‘card-’ + s).classList.remove(‘active’);
});
modifier = 0;
updateModDisplay();
el(‘rollNote’).value = ‘’;
el(‘results’).innerHTML = ‘’;
el(‘error’).style.display = ‘none’;
MurderSound.clear();
});

/* Roll button */
el(‘rollButton’).addEventListener(‘click’, doRoll);

function doRoll() {
var anySelected = SIDES.some(function (s) { return counts[s] > 0; });
if (!anySelected) {
var errorEl = el(‘error’);
errorEl.style.display = ‘block’;
errorEl.style.animation = ‘none’;
setTimeout(function () { errorEl.style.animation = ‘’; }, 10);
return;
}
el(‘error’).style.display = ‘none’;

```
SIDES.forEach(function (s) {
    if (counts[s] > 0) {
        var card = el('card-' + s);
        card.classList.remove('shaking');
        void card.offsetWidth;
        card.classList.add('shaking');
        setTimeout(function () { card.classList.remove('shaking'); }, 500);
    }
});

var rollBtn = el('rollButton');
rollBtn.classList.remove('rolling');
void rollBtn.offsetWidth;
rollBtn.classList.add('rolling');
setTimeout(function () { rollBtn.classList.remove('rolling'); }, 600);

MurderSound.rattle();
showOverlay();
```

}

/* Rolling overlay */
function showOverlay() {
var overlay = el(‘rollOverlay’);
var diceEl  = el(‘overlayDice’);
var totalEl = el(‘overlayTotal’);

```
totalEl.classList.remove('slam');
totalEl.textContent = '';
diceEl.innerHTML = '';
overlay.classList.add('active');

var dieEls = [];
SIDES.forEach(function (s) {
    if (counts[s] > 0) {
        for (var i = 0; i < counts[s]; i++) {
            var d = document.createElement('div');
            d.className = 'overlay-die';
            d.textContent = randomInt(s);
            diceEl.appendChild(d);
            dieEls.push({ el: d, sides: s });
        }
    }
});

var scrambleInterval = setInterval(function () {
    dieEls.forEach(function (d) { d.el.textContent = randomInt(d.sides); });
}, 80);

setTimeout(function () {
    clearInterval(scrambleInterval);
    var result = compute();
    var idx = 0;

    result.breakdown.forEach(function (b) {
        b.rolls.forEach(function (r) {
            if (dieEls[idx]) {
                dieEls[idx].el.textContent = r;
                dieEls[idx].el.style.animation = 'none';
                dieEls[idx].el.style.color = r === b.sides ? '#c9a84c' : r === 1 ? '#555' : '#c0001a';
            }
            idx++;
        });
    });

    var displayTotal = result.grandTotal + modifier;
    totalEl.textContent = displayTotal;
    setTimeout(function () { totalEl.classList.add('slam'); }, 30);

    MurderSound.impact();

    var maxPossible = SIDES.reduce(function (acc, s) { return acc + counts[s] * s; }, 0);
    var ratio = result.grandTotal / maxPossible;
    if (ratio >= 0.75)      { setTimeout(function () { MurderSound.highRoll(); }, 150); }
    else if (ratio <= 0.25) { setTimeout(function () { MurderSound.lowRoll();  }, 150); }

    setTimeout(function () {
        overlay.classList.remove('active');
        totalEl.classList.remove('slam');
        renderResults(result.grandTotal, result.breakdown);
        addToLog(result.grandTotal, result.breakdown);
    }, 1000);

}, 650);
```

}

/* Compute rolls */
function compute() {
var grandTotal = 0;
var breakdown = [];
SIDES.forEach(function (s) {
var n = counts[s];
if (n > 0) {
var rolls = [];
for (var i = 0; i < n; i++) { rolls.push(randomInt(s)); }
var sub = rolls.reduce(function (a, b) { return a + b; }, 0);
grandTotal += sub;
breakdown.push({ sides: s, label: ‘d’ + s, rolls: rolls, sub: sub });
}
});
return { grandTotal: grandTotal, breakdown: breakdown };
}

/* Render results */
function renderResults(total, breakdown) {
var displayTotal = total + modifier;
var totalDice = breakdown.reduce(function (a, b) { return a + b.rolls.length; }, 0);
var diceDesc  = breakdown.map(function (b) { return b.rolls.length + b.label; }).join(’ + ’);
var note = el(‘rollNote’).value.trim();
var modText = ‘’, modClass = ‘’;
if (modifier > 0)      { modText = ‘modifier +’ + modifier + ’ = ’ + displayTotal; modClass = ‘positive’; }
else if (modifier < 0) { modText = ’modifier ’  + modifier + ’ = ’ + displayTotal; modClass = ‘negative’; }

```
var html = '<div class="result-total">'
         + '<div class="result-label">Total</div>'
         + (note ? '<div class="result-note">' + note + '</div>' : '')
         + '<div class="result-number">' + displayTotal + '</div>'
         + (modText ? '<div class="result-modifier ' + modClass + '">' + modText + '</div>' : '')
         + '<div class="result-meta">' + diceDesc + ' &mdash; ' + totalDice + (totalDice === 1 ? ' die' : ' dice') + '</div>'
         + '</div>';

breakdown.forEach(function (b) {
    var pips = b.rolls.map(function (r) {
        var cls = r === b.sides ? 'pip is-max' : r === 1 ? 'pip is-min' : 'pip';
        return '<span class="' + cls + '">' + r + '</span>';
    }).join('');
    html += '<div class="breakdown-row">'
          + '<span class="bd-die">' + b.label + '</span>'
          + '<div class="bd-pips">' + pips + '</div>'
          + '<span class="bd-sub">= ' + b.sub + '</span>'
          + '</div>';
});

el('results').innerHTML = html;
```

}

/* Add to log */
function addToLog(total, breakdown) {
rollCount++;
var displayTotal = total + modifier;
sessionTotal += displayTotal;
if (sessionHigh === null || displayTotal > sessionHigh) sessionHigh = displayTotal;

```
var timeStr  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
var diceDesc = breakdown.map(function (b) { return b.rolls.length + b.label; }).join('+');
var note     = el('rollNote').value.trim();
var modText  = '', modClass = '';
if (modifier > 0)      { modText = '+' + modifier;    modClass = 'positive'; }
else if (modifier < 0) { modText = String(modifier);  modClass = 'negative'; }

var pipStr = breakdown.map(function (b) {
    return '<span class="pl">' + b.label + ':</span> ' + b.rolls.join(', ');
}).join('  |  ');

rollHistory.unshift({
    number: rollCount, displayTotal: displayTotal, diceDesc: diceDesc,
    note: note, modText: modText, modClass: modClass, pipStr: pipStr, timeStr: timeStr
});

renderLog();
updateStats();
```

}

/* Render log */
function renderLog() {
var list  = el(‘log-list’);
var empty = el(‘log-empty’);
if (rollHistory.length === 0) { empty.style.display = ‘block’; list.innerHTML = ‘’; return; }
empty.style.display = ‘none’;
list.innerHTML = rollHistory.map(function (e) {
var noteHtml = e.note    ? ‘<div class="log-note">’ + e.note + ‘</div>’ : ‘’;
var modHtml  = e.modText ? ‘<span class="log-mod ' + e.modClass + '">(’ + e.modText + ‘)</span>’ : ‘’;
return ‘<li class="log-entry">’
+ ‘<div class="log-num">#’ + e.number + ‘</div>’
+ ‘<div class="log-body">’
+ noteHtml
+ ‘<div class="log-total-line">’
+ ‘<span class="log-score">’ + e.displayTotal + ‘</span>’
+ ‘<span class="log-desc">’  + e.diceDesc     + ‘</span>’
+ modHtml
+ ‘</div>’
+ ‘<div class="log-pips">’ + e.pipStr + ‘</div>’
+ ‘</div>’
+ ‘<div class="log-time">’ + e.timeStr + ‘</div>’
+ ‘</li>’;
}).join(’’);
}

/* Update stats */
function updateStats() {
el(‘statsBar’).style.display = ‘flex’;
el(‘statRolls’).textContent = rollCount;
el(‘statTotal’).textContent = sessionTotal;
el(‘statHigh’).textContent  = sessionHigh;
el(‘statAvg’).textContent   = (sessionTotal / rollCount).toFixed(1);
}

/* Clear log */
el(‘clearLogBtn’).addEventListener(‘click’, function () {
rollHistory.length = 0;
rollCount = 0; sessionTotal = 0; sessionHigh = null;
renderLog();
el(‘statsBar’).style.display = ‘none’;
MurderSound.clear();
});

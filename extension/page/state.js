/*
 * The "Internal State" page.
 *
 * Copyright (c) 2023-2024 Jan Malakhovski <oxij@oxij.org>
 *
 * This file is a part of pwebarc project.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

let rrfilters = {
    problematic: assignRec({}, rrfilterDefaults),
    in_limbo: assignRec({}, rrfilterDefaults),
    log: assignRec({}, rrfilterDefaults),
    queued: assignRec({}, rrfilterDefaults),
    failed: assignRec({}, rrfilterDefaults),
};

let thisSessionId;
let thisTabId;

let tabId = getMapURLParam(stateURL, "tab", document.location, toNumber, null, null);
if (tabId !== null)
    document.title = `pWebArc: tab ${tabId}: Internal State`;

function switchToDataTabId(dataTabId) {
    return browser.tabs.update(dataTabId, { active: true }).catch(logError);
}

async function showStateOfDataTabId(dataTabId) {
    let tabId = dataTabId;

    let tab = await getActiveTab();
    if (tab !== null)
        tabId = tab.id;

    showState(`?tab=${dataTabId}`, "top", tabId);
}

// caches of `switchToDataTabId` and `showStateOfDataTabId` bound to a
// given argument, for efficiency
let switchFuncMap = new Map();
let showStateFuncMap = new Map();

function appendLoggable(el, loggable) {
    let tr = document.createElement("tr");

    let sparts = [];
    let color;
    if (loggable.collected === true) {
        color = "collected";
        sparts.push("collected");
    } else if (loggable.collected === false) {
        color = "discarded";
        sparts.push("discarded");
    } else if (loggable.picked === true) {
        color = "picked";
        sparts.push("picked");
    } else if (loggable.picked === false) {
        color = "dropped";
        sparts.push("dropped");
    } else {
        color = "in-flight";
        sparts.push("in_flight");
    }
    tr.classList.add(color);

    if (loggable.net_state !== undefined)
        sparts.push(loggable.net_state);
    if (loggable.redirectUrl !== undefined)
        sparts.push("redirected");
    if (loggable.in_limbo === true)
        sparts.push("in_limbo");
    else if (loggable.was_in_limbo === true)
        sparts.push("was_in_limbo");
    if (loggable.problematic === true)
        sparts.push("problematic!");
    else if (loggable.was_problematic === true)
        sparts.push("was_problematic");

    function mn(node, inn, data) {
        let n = document.createElement(inn);
        n.innerText = data;
        node.appendChild(n);
        return n;
    }

    function mtr(data) {
        return mn(tr, "td", data);
    }

    function mbtn(node, data, func) {
        let btn = document.createElement("input");
        btn.type = "button";
        btn.value = data;
        btn.onclick = func;
        node.appendChild(btn);
        return btn;
    }

    let dataSessionId = loggable.sessionId;
    let dataTabId = loggable.tabId;
    let name = loggable.fromExtension ? "ext" : (dataTabId === -1 ? "bg" : `tab #${loggable.tabId}`);
    let td = document.createElement("td");
    let div = document.createElement("div");
    if (dataSessionId === thisSessionId)
        mbtn(div, name,
             cacheSingleton(switchFuncMap, dataTabId, () => switchToDataTabId.bind(undefined, dataTabId)));
    else
        mn(div, "span", `${name} of ${dataSessionId.toString().substr(-3)}`);
    if (tabId === null)
        mbtn(div, "IS",
             cacheSingleton(showStateFuncMap, dataTabId, () => showStateOfDataTabId.bind(undefined, dataTabId)));
    td.appendChild(div);
    tr.appendChild(td);

    mtr(loggable.status);

    mtr(sparts.join(" "));
    mtr(dateToString(loggable.requestTimeStamp));
    mtr(loggable.protocol);
    mtr(loggable.method);
    mtr(loggable.url
        + (loggable.redirectUrl !== undefined ? " -> " + loggable.redirectUrl : "")
       ).className = "long";

    mtr(dateToString(loggable.responseTimeStamp));
    mtr(loggable.reason).className = "long";

    el.appendChild(tr);

    if (loggable.errors.length > 0) {
        let etr = document.createElement("tr");
        etr.classList.add("errors");

        let etd = document.createElement("td");
        etd.setAttribute("colspan", 2);
        etr.appendChild(etd);

        etd = document.createElement("td");
        etd.classList.add(color);
        etd.setAttribute("colspan", 7);
        etd.setAttribute("title", "errors");
        etd.innerHTML = escapeHTML(loggable.errors.join("\n")).replaceAll("\n", "<br>");
        etr.appendChild(etd);

        el.appendChild(etr);
    }
}

function appendToLog(el, log_data, predicate) {
    for (let loggable of log_data)
        if ((tabId === null || loggable.tabId == tabId) &&
            (predicate === undefined || predicate(loggable)))
            appendLoggable(el, loggable);
}

function resetDataNode(id, log_data, predicate) {
    let newtbody = document.createElement("tbody");
    newtbody.id = id;
    appendToLog(newtbody, log_data, predicate);
    let tbody = document.getElementById(id);
    tbody.parentElement.replaceChild(newtbody, tbody);
}

function resetInFlight(log_data) {
    resetDataNode("data_in_flight", log_data);
}

function resetProblematic(log_data) {
    resetDataNode("data_problematic", log_data, (loggable) => isAcceptedBy(rrfilters.problematic, loggable));
}

function resetInLimbo(log_data) {
    resetDataNode("data_in_limbo", log_data, (loggable) => isAcceptedBy(rrfilters.in_limbo, loggable));
}

function resetLog(log_data) {
    resetDataNode("data_log", log_data, (loggable) => isAcceptedBy(rrfilters.log, loggable));
}

function resetQueued(log_data) {
    resetDataNode("data_queued", log_data, (loggable) => isAcceptedBy(rrfilters.queued, loggable));
}

function resetFailed(log_data) {
    resetDataNode("data_failed", log_data, (loggable) => isAcceptedBy(rrfilters.failed, loggable));
}

async function stateMain() {
    thisSessionId = await browser.runtime.sendMessage(["getSessionId"]);
    let thisTab = await getActiveTab();
    thisTabId = thisTab.id;

    // generate UI
    let body = document.body;
    makeUI(body);

    for (let el of document.getElementsByTagName("table")) {
        let thead = document.createElement("thead");
        thead.innerHTML = `
<tr>
  <th><span data-help="Source of this reqres: &quot;ext&quot; for reqres produced by extensions, &quot;bg&quot; for reqres produced by background tasks, &quot;tab #N&quot; for reqres produced by the tab with id \`N\`, optionally followed by &quot;of S&quot; where \`S\` is the last three digits of \`.sessionId\`. For tabs of the current session the label is a button which switches currently active tab to the tab in question. If the current page is not narrowed to a tab, then a button labled &quot;IS&quot; follows. That button opens this page narrowed to the tab in question.">Src</span></th>
  <th><span data-help="The \`.status\` this reqres will have in wrrarms: &quot;I&quot; or &quot;C&quot; character (for &quot;Incomplete&quot; and &quot;Complete&quot; respectively) representing the value of \`.request.complete\` flag followed by either &quot;N&quot; (for &quot;No response&quot;) or an HTTP status code (integer, e.g. &quot;200&quot;), followed by &quot;I&quot; or &quot;C&quot; representing the value of \`.response.complete\` flag.">WRR</span></th>
  <th><span data-help="The current reqres \`state\` followed by \`the final networking state\`, followed by &quot;redirected&quot; when this reqres is a redirect, followed by &quot;was_in_limbo&quot; when this reqres was ever in limbo, followed by either &quot;problematic!&quot; when this reqres is marked as problematic or &quot;was_problematic&quot; when this reqres was marked as problematic before (see the Help page for more info).">pWA</span></th>
  <th><span data-help="Timestamp of when the first byte of HTTP request headers was sent.">Request at</span></th>
  <th><span data-help="Protocol/version.">P</span></th>
  <th><span data-help="Protocol method.">M</span></th>
  <th><span data-help="Request URL, followed by &quot; -> &quot; and a redirect URL when this reqres is a redirect.">URL</span></th>
  <th><span data-help="Timestamp of when the first byte of HTTP response headers was received.">Response at</span></th>
  <th><span data-help="HTTP protocol response reason, if any. Note that the HTTP response code is displayed as a part of the &quot;WRR&quot; field.">Reason</span></th>
</tr>
`;
        el.insertBefore(thead, el.firstChild);
        let tfoot = document.createElement("tfoot");
        tfoot.innerHTML = thead.innerHTML;
        el.appendChild(tfoot);
    }

    addHelp(body);

    buttonToMessage("forgetHistory",        () => ["forgetHistory", tabId, rrfilters.log]);
    buttonToMessage("rotateOneProblematic", () => ["rotateProblematic", 1, tabId, rrfilters.problematic]);
    buttonToMessage("unmarkOneProblematic", () => ["unmarkProblematic", 1, tabId, rrfilters.problematic]);
    buttonToMessage("unmarkAllProblematic", () => ["unmarkProblematic", null, tabId, rrfilters.problematic]);
    buttonToMessage("rotateOneInLimbo",     () => ["rotateInLimbo", 1, tabId, rrfilters.in_limbo]);
    buttonToMessage("discardOneInLimbo",    () => ["popInLimbo", false, 1, tabId, rrfilters.in_limbo]);
    buttonToMessage("discardAllInLimbo",    () => ["popInLimbo", false, null, tabId, rrfilters.in_limbo]);
    buttonToMessage("collectOneInLimbo",    () => ["popInLimbo", true, 1, tabId, rrfilters.in_limbo]);
    buttonToMessage("collectAllInLimbo",    () => ["popInLimbo", true, null, tabId, rrfilters.in_limbo]);
    buttonToMessage("stopAllInFlight",      () => ["stopAllInFlight", tabId]);

    buttonToMessage("retryFailed");

    setUI(document, "rrfilters", rrfilters, (value, path) => {
        if (path.startsWith("rrfilters.problematic."))
            browser.runtime.sendMessage(["getProblematicLog"]).then(resetProblematic).catch(logError);
        else if (path.startsWith("rrfilters.in_limbo."))
            browser.runtime.sendMessage(["getInLimboLog"]).then(resetInLimbo).catch(logError);
        else if (path.startsWith("rrfilters.log."))
            browser.runtime.sendMessage(["getLog"]).then(resetLog).catch(logError);
        else if (path.startsWith("rrfilters.queued."))
            browser.runtime.sendMessage(["getQueuedLog"]).then(resetQueued).catch(logError);
        else if (path.startsWith("rrfilters.failed."))
            browser.runtime.sendMessage(["getFailedLog"]).then(resetFailed).catch(logError);
        else
            console.warn("unknown rrfilters update", path, value);
    });

    async function updateConfig(config) {
        if (config === undefined)
            config = await browser.runtime.sendMessage(["getConfig"]);
        setConditionalClass(body, config.colorblind, "colorblind");
    }

    async function processUpdate(update) {
        let [what, data] = update;
        switch(what) {
        case "updateConfig":
            await updateConfig(data);
            break;
        case "resetInFlight":
            resetInFlight(data);
            break;
        case "resetProblematicLog":
            resetProblematic(data);
            break;
        case "resetInLimboLog":
            resetInLimbo(data);
            break;
        case "resetLog":
            resetLog(data);
            break;
        case "resetQueued":
            resetQueued(data);
            break;
        case "resetFailed":
            resetFailed(data);
            break;
        // incrementally add new rows
        case "newInFlight":
            appendToLog(document.getElementById("data_in_flight"), data);
            break;
        case "newProblematic":
            appendToLog(document.getElementById("data_problematic"), data, (loggable) => isAcceptedBy(rrfilters.problematic, loggable));
            break;
        case "newLimbo":
            appendToLog(document.getElementById("data_in_limbo"), data, (loggable) => isAcceptedBy(rrfilters.in_limbo, loggable));
            break;
        case "newLog":
            appendToLog(document.getElementById("data_log"), data, (loggable) => isAcceptedBy(rrfilters.log, loggable));
            break;
        case "newQueued":
            appendToLog(document.getElementById("data_queued"), data, (loggable) => isAcceptedBy(rrfilters.queued, loggable));
            break;
        default:
            await handleDefaultUpdate(update, thisTabId);
        }
    }

    await subscribeToExtension(catchAll(processUpdate), catchAll(async (willReset) => {
        await updateConfig();
        let inFlightLog = await browser.runtime.sendMessage(["getInFlightLog"]);
        let problematicLog = await browser.runtime.sendMessage(["getProblematicLog"]);
        if (willReset()) return;
        let inLimboLog = await browser.runtime.sendMessage(["getInLimboLog"]);
        if (willReset()) return;
        let log = await browser.runtime.sendMessage(["getLog"]);
        if (willReset()) return;
        let queuedLog = await browser.runtime.sendMessage(["getQueuedLog"]);
        if (willReset()) return;
        let failedLog = await browser.runtime.sendMessage(["getFailedLog"]);
        if (willReset()) return;

        resetInFlight(inFlightLog);
        resetProblematic(problematicLog);
        resetInLimbo(inLimboLog);
        resetLog(log);
        resetQueued(queuedLog);
        resetFailed(failedLog);
    }));

    // show UI
    setPageLoaded();

    // force re-scroll
    viewHashNode();
}

document.addEventListener("DOMContentLoaded", () => stateMain().catch(setPageError), setPageError);

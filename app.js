const API_URL = 'https://visitors.jkl.hacklab.fi/api/v1/visitors?format=json-v2'
const { createApp } = Vue
const caps = [
    "org.matrix.msc2762.receive.event:fi.hacklab.venue",
    "org.matrix.msc2762.receive.event:fi.hacklab.visitors",
]

createApp({
    data() {
	return {
	    lab: { loading: true },
	    source: "REST API"
	}
    },
    created() {
	// Let's find out if we've got blue or red pill.
	const params = new URLSearchParams(document.location.search)
	this.widgetId = params.get("widgetId")
	if (this.widgetId === null) {
	    // Not used as Matrix widget, fallback to https
	    this.startLegacyFetch()
	} else {
	    // Matrix mode: receiving events via Matrix.
	    window.addEventListener("message", this.postmaster, false)
	    // The first message should be capabilities, hopefully
	    // continuing from there.
	}
    },
    methods: {
	startLegacyFetch() {
	    var that = this
	    async function updateVisitors() {
		that.lab = await (await fetch(API_URL)).json()
	    }
	    // Set up recurring timer
	    setInterval(function () {
		updateVisitors()
	    }, 60000)
	    // Do initial data fetch
	    updateVisitors()
	},
	postmaster(msg) {
	    if (msg.data.api === "fromWidget" && msg.data.response !== undefined) {
		// This is answer to us
		const handler = {
		    "org.matrix.msc2876.read_events": this.handleEvents,
		}[msg.data.action] ?? function () {
		    console.log("No handler for this response", msg)
		}
		handler(msg)
	    } else if (msg.data.api === "toWidget" && msg.data.response === undefined) {
		// We got incoming information.
		const handler = {
		    capabilities: this.askCapabilities,
		    notify_capabilities: this.checkCapabilities,
		    send_event: this.handleEventPush,
		}[msg.data.action] ?? function () {
		    console.log("No handler for this request", msg)
		}
		handler(msg)
	    } else {
		// Either echo from postMessage or something else
		console.log("Visitor widget got unsolisited event", msg)
	    }
	},
	askCapabilities(msg) {
	    // Telling we want the messages
	    msg.data.response = { capabilities: caps }
	    msg.source.postMessage(msg.data, "*")

	    // Collect references for later use.
	    this.chat = msg.source
	},
	askEvents(type, limit=1) {
	    // Ask for the most recent message of given type
	    this.chat.postMessage({
		api: "fromWidget",
		widgetId: this.widgetId,
		requestId: self.crypto.randomUUID(),
		action: "org.matrix.msc2876.read_events",
		data: {
		    "type": type,
		    "limit": limit
		}
	    }, "*")
	},
	checkCapabilities(msg) {
	    const granted = caps.every((cap) => msg.data.data.approved.includes(cap))
	    if (granted) {
		// Matrix mode activated
		this.source = "Matrix"

		// Now we're asking the initial state
		this.askEvents("fi.hacklab.venue")
		this.askEvents("fi.hacklab.visitors")
	    } else {
		this.source = "REST API (Matrix-käyttöoikeus puuttuu)"
		this.startLegacyFetch()
	    }
	    // Sending ack
	    msg.data.response = {success: true}
	    msg.source.postMessage(msg.data, "*")
	},
	handleEvents(msg) {
	    // Initial information asked. Dig the stuff and pass on.
	    for (const event of msg.data.response.events) {
		this.handleEvent(event)
	    }
	},
	handleEventPush(msg) {
	    // We got a lab state change. Pass to the actual parser.
	    this.handleEvent(msg.data.data)
	},
	handleEvent(event) {
	    console.log("Noniin.", event);
	}
    }
}).mount('#app')



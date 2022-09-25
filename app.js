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
	    // Using https to fetch information perioidically
	    var that = this
	    setInterval(function () {
		that.legacyFetchData.apply(that)
	    }, 60000)
	    // Do initial data fetch
	    this.legacyFetchData()
	} else {
	    // Matrix mode: receiving events via Matrix.
	    window.addEventListener("message", this.matrixIncoming, false)
	    // The first message should be capabilities, hopefully
	    // continuing from there.
	}
    },
    methods: {
	async legacyFetchData() {
	    this.lab = await (await fetch(API_URL)).json()
	    this.lab.loading = false
	},
	matrixIncoming(event) {
	    if (event.data.api === "fromWidget" && event.data.response !== undefined) {
		// This is answer to us
		console.log("We got response, TODO process it", event)
	    } else if (event.data.api === "toWidget" && event.data.response === undefined) {
		// We got incoming information.
		console.log("Processing incoming event", event)
		const handler = {
		    capabilities: this.askCapabilities,
		    notify_capabilities: this.checkCapabilities,
		    send_event: this.incomingEvent,
		}[event.data.action] ?? function () {
		    console.log("No handler for this action", event)
		}
		handler(event)
	    } else {
		// Either echo from postMessage or something else
		console.log("Visitor widget got unsolisited event", event)
	    }
	},
	askCapabilities(event) {
	    // Telling we want the messages
	    event.data.response = { capabilities: caps }
	    event.source.postMessage(event.data, "*")

	    // Collect references for later use.
	    this.chatWindow = event.source

	    // Temporary hack to show something
	    this.lab.loading = false
	    this.lab.present = []
	},
	checkCapabilities(event) {
	    const granted = caps.every((cap) => event.data.data.approved.includes(cap))
	    if (granted) {
		// Matrix mode activated
		this.source = "Matrix"
	    } else {
		this.source = "REST API (Matrix-käyttöoikeus puuttuu)"
	    }
	    // Sending ack
	    event.data.response = {success: true}
	    event.source.postMessage(event.data, "*")
	}
    }
}).mount('#app')


